import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cashBalanceRON, countUpcoming, countLowStock } from "./compute";

export type NextEvent = {
  id: string;
  title: string;
  event_date: string;
  status: string;
};

export type RecentTxn = {
  id: string;
  type: string;
  amount_ron: number;
  description: string;
  transaction_date: string;
};

export type DashboardData = {
  cashBalanceRON: number;
  upcomingEvents: number;
  lowStockItems: number;
  pendingClaims: number;
  docsInReview: number;
  nextEvents: NextEvent[];
  recentTransactions: RecentTxn[];
};

const EMPTY: DashboardData = {
  cashBalanceRON: 0,
  upcomingEvents: 0,
  lowStockItems: 0,
  pendingClaims: 0,
  docsInReview: 0,
  nextEvents: [],
  recentTransactions: [],
};

export async function getDashboardData(
  organizationId: string,
  today: string,
): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return EMPTY;

  const [txns, events, items, claims, docs, nextEv, recentTx] = await Promise.all([
    supabase.from("financial_transactions").select("type, amount, amount_ron").eq("organization_id", organizationId),
    supabase.from("events").select("event_date").eq("organization_id", organizationId),
    supabase.from("inventory_items").select("quantity, reserved_quantity, reorder_threshold").eq("organization_id", organizationId),
    supabase.from("expense_claims").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "pending"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).in("ocr_status", ["pending", "processing"]),
    supabase.from("events").select("id, title, event_date, status").eq("organization_id", organizationId).gte("event_date", today).order("event_date", { ascending: true }).limit(5),
    supabase.from("financial_transactions").select("id, type, amount, amount_ron, description, transaction_date").eq("organization_id", organizationId).order("transaction_date", { ascending: false }).limit(5),
  ]);

  return {
    cashBalanceRON: cashBalanceRON(txns.data ?? []),
    upcomingEvents: countUpcoming(events.data ?? [], today),
    lowStockItems: countLowStock(items.data ?? []),
    pendingClaims: claims.count ?? 0,
    docsInReview: docs.count ?? 0,
    nextEvents: (nextEv.data ?? []) as NextEvent[],
    recentTransactions: (recentTx.data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      amount_ron: t.amount_ron ?? t.amount,
      description: t.description,
      transaction_date: t.transaction_date,
    })),
  };
}
