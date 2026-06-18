import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssistantRole, TokenUsage } from "./types";

export type SessionRow = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  role: AssistantRole;
  content: string;
  tool_name: string | null;
  tool_payload: unknown;
  created_at: string;
};

export async function listSessions(organizationId: string): Promise<SessionRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("ai_sessions")
    .select("id, title, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .returns<SessionRow[]>();
  return data ?? [];
}

export async function getMessages(sessionId: string): Promise<MessageRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("ai_messages")
    .select("id, role, content, tool_name, tool_payload, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();
  return data ?? [];
}

export async function createSession(
  organizationId: string,
  userId: string,
  title: string | null,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ai_sessions")
    .insert({ organization_id: organizationId, user_id: userId, title })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function touchSession(sessionId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("ai_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
}

export async function appendMessage(args: {
  sessionId: string;
  organizationId: string;
  role: AssistantRole;
  content: string;
  toolName?: string | null;
  toolPayload?: unknown;
  tokenUsage?: TokenUsage | null;
}): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      session_id: args.sessionId,
      organization_id: args.organizationId,
      role: args.role,
      content: args.content,
      tool_name: args.toolName ?? null,
      tool_payload: (args.toolPayload ?? null) as never,
      token_usage: (args.tokenUsage ?? null) as never,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}
