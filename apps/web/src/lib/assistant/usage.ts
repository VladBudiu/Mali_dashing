import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aggregateUsage, type UsageTotals } from "./cost";
import type { TokenUsage } from "./types";

export type OrgUsage = {
  /** Assistant turns counted (the caller's own — RLS scopes ai_messages to owned sessions). */
  messageCount: number;
  totals: UsageTotals;
};

const EMPTY: OrgUsage = {
  messageCount: 0,
  totals: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, costUSD: 0 },
};

export async function getAssistantUsage(organizationId: string): Promise<OrgUsage> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return EMPTY;

  const { data, error } = await supabase
    .from("ai_messages")
    .select("token_usage")
    .eq("organization_id", organizationId)
    .eq("role", "assistant")
    .not("token_usage", "is", null)
    .limit(2000);

  if (error || !data) return EMPTY;

  const list = data
    .map((r) => r.token_usage as TokenUsage | null)
    .filter((u): u is TokenUsage => Boolean(u));

  return { messageCount: list.length, totals: aggregateUsage(list) };
}
