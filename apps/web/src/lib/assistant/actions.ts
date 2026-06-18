"use server";

import type Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCurrentUser } from "@/lib/auth/session";
import { runAssistantTurn } from "./claude";
import {
  appendMessage,
  createSession,
  getMessages,
  touchSession,
} from "./history";
import { writeAuditLog } from "./audit";
import type { AssistantSource } from "./types";

const HISTORY_WINDOW = 12;

export type SendResult =
  | { status: "error"; message: string }
  | {
      status: "ok";
      sessionId: string;
      configured: boolean;
      answer: string;
      sources: AssistantSource[];
    };

export async function sendAssistantMessage(
  sessionId: string | null,
  question: string,
): Promise<SendResult> {
  const trimmed = question.trim();
  if (!trimmed) return { status: "error", message: "Empty message." };

  const [org, user] = await Promise.all([resolveCurrentOrg(), getCurrentUser()]);
  if (!org || !user) return { status: "error", message: "Not signed in." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable." };

  // Ensure a session exists.
  let activeSession = sessionId;
  if (!activeSession) {
    activeSession = await createSession(org.organizationId, user.id, trimmed.slice(0, 60));
    if (!activeSession) return { status: "error", message: "Could not start a chat." };
  }

  // Window prior turns (text user/assistant only) for the model.
  const prior = await getMessages(activeSession);
  const history: Anthropic.MessageParam[] = prior
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim() !== "")
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await appendMessage({
    sessionId: activeSession,
    organizationId: org.organizationId,
    role: "user",
    content: trimmed,
  });

  const today = new Date().toISOString().slice(0, 10);
  const result = await runAssistantTurn({
    ctx: { supabase, orgId: org.organizationId, userId: user.id, today },
    orgName: org.organizationName,
    history,
    question: trimmed,
  });

  if (!result.configured) {
    const notice =
      "The AI assistant isn't configured yet — an ANTHROPIC_API_KEY needs to be added on the server. Everything else (your chat history and saved notes) works.";
    await appendMessage({
      sessionId: activeSession,
      organizationId: org.organizationId,
      role: "assistant",
      content: notice,
    });
    await touchSession(activeSession);
    return { status: "ok", sessionId: activeSession, configured: false, answer: notice, sources: [] };
  }

  const messageId = await appendMessage({
    sessionId: activeSession,
    organizationId: org.organizationId,
    role: "assistant",
    content: result.answer,
    tokenUsage: result.usage,
  });
  await touchSession(activeSession);

  if (result.sources.length > 0 || result.toolsUsed.length > 0) {
    await writeAuditLog({
      organizationId: org.organizationId,
      sessionId: activeSession,
      messageId,
      userId: user.id,
      question: trimmed,
      answerSummary: result.answer.slice(0, 500),
      toolsUsed: result.toolsUsed,
      sources: result.sources,
    });
  }

  return {
    status: "ok",
    sessionId: activeSession,
    configured: true,
    answer: result.answer,
    sources: result.sources,
  };
}
