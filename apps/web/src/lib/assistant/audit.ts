import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssistantSource } from "./types";

/**
 * Writes one audit entry recording that an answer was produced from org data:
 * the question, a short answer summary, which tools ran, and the source rows.
 * This is the compliance trail required for any AI answer touching totals.
 */
export async function writeAuditLog(args: {
  organizationId: string;
  sessionId: string | null;
  messageId: string | null;
  userId: string | null;
  question: string;
  answerSummary: string;
  toolsUsed: string[];
  sources: AssistantSource[];
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("ai_audit_logs").insert({
    organization_id: args.organizationId,
    session_id: args.sessionId,
    message_id: args.messageId,
    user_id: args.userId,
    question: args.question.slice(0, 4000),
    answer_summary: args.answerSummary.slice(0, 4000),
    tools_used: args.toolsUsed as never,
    sources: args.sources as never,
  });
}
