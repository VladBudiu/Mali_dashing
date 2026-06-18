import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_TOOLS } from "./registry";
import { runTool } from "./dispatch";
import type { ToolContext } from "./tools";
import { buildSystemPrompt } from "./prompt";
import { sourcesFromResults } from "./sources";
import { resolveModel } from "./models";
import type { AssistantSource, ToolResult, TokenUsage } from "./types";

const MAX_TOOL_ROUNDS = 6;

export type AssistantTurnInput = {
  ctx: ToolContext;
  orgName: string;
  /** Prior turns as Anthropic message params (user/assistant), already windowed. */
  history: Anthropic.MessageParam[];
  question: string;
};

export type AssistantTurnResult =
  | { configured: false }
  | {
      configured: true;
      answer: string;
      toolsUsed: string[];
      sources: AssistantSource[];
      usage: TokenUsage;
    };

function isConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function addUsage(into: TokenUsage, u: Anthropic.Usage | undefined) {
  if (!u) return;
  into.input = (into.input ?? 0) + (u.input_tokens ?? 0);
  into.output = (into.output ?? 0) + (u.output_tokens ?? 0);
  into.cacheRead = (into.cacheRead ?? 0) + (u.cache_read_input_tokens ?? 0);
  into.cacheWrite = (into.cacheWrite ?? 0) + (u.cache_creation_input_tokens ?? 0);
}

/**
 * Runs one assistant turn: the tool-use loop against Claude. Returns
 * { configured: false } when no API key is set so callers can show a clear
 * "AI not configured" state — this is the single seam that lights up once the
 * ANTHROPIC_API_KEY is added.
 *
 * Cost design: the system prompt and tool definitions are marked with
 * cache_control so the stable prefix is billed at ~10% on repeat turns.
 */
export async function runAssistantTurn(
  input: AssistantTurnInput,
): Promise<AssistantTurnResult> {
  if (!isConfigured()) return { configured: false };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = resolveModel(process.env.ASSISTANT_MODEL);

  // Cache the stable prefix: system prompt + tool definitions.
  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt({ orgName: input.orgName, today: input.ctx.today }),
      cache_control: { type: "ephemeral" },
    },
  ];
  const tools = ANTHROPIC_TOOLS.map((t, i) =>
    i === ANTHROPIC_TOOLS.length - 1
      ? ({ ...t, cache_control: { type: "ephemeral" } } as Anthropic.Tool)
      : (t as Anthropic.Tool),
  );

  const messages: Anthropic.MessageParam[] = [
    ...input.history,
    { role: "user", content: input.question },
  ];

  const usage: TokenUsage = { model };
  const toolsUsed: string[] = [];
  const allResults: ToolResult[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system,
      tools,
      messages,
    });
    addUsage(usage, response.usage);

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return {
        configured: true,
        answer,
        toolsUsed,
        sources: sourcesFromResults(allResults),
        usage,
      };
    }

    // Execute every requested tool and feed results back.
    messages.push({ role: "assistant", content: response.content });
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      toolsUsed.push(tu.name);
      const result = await runTool(input.ctx, tu.name, tu.input);
      allResults.push(result);
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result.ok ? result.data : { error: result.error }),
        is_error: !result.ok,
      });
    }
    messages.push({ role: "user", content: toolResultBlocks });
  }

  // Hit the round cap — return what we have rather than looping forever.
  return {
    configured: true,
    answer:
      "I gathered the data but couldn't finish composing an answer in the step limit. Please narrow the question.",
    toolsUsed,
    sources: sourcesFromResults(allResults),
    usage,
  };
}
