import "server-only";

import { getToolDef } from "./registry";
import { TOOL_HANDLERS, type ToolContext } from "./tools";
import type { ToolResult } from "./types";

/**
 * Runs one tool the model asked for: confirm it is whitelisted, validate its
 * input with the registry's Zod schema, then call the handler. A model that
 * requests an unknown tool or malformed input gets a structured error back
 * (which it can recover from) rather than throwing.
 */
export async function runTool(
  ctx: ToolContext,
  name: string,
  rawInput: unknown,
): Promise<ToolResult> {
  const def = getToolDef(name);
  const handler = TOOL_HANDLERS[name];
  if (!def || !handler) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }

  const parsed = def.inputSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: `Invalid input for ${name}: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
    };
  }

  try {
    return await handler(ctx, parsed.data as Record<string, unknown>);
  } catch {
    return { ok: false, error: `Tool ${name} failed to run.` };
  }
}
