import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TransactionRow = {
  id: string;
  organization_id: string;
  event_id: string | null;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  currency: string;
  amount_ron: number | null;
  exchange_rate: number | null;
  exchange_rate_source: string | null;
  exchange_rate_date: string | null;
  description: string;
  transaction_date: string;
  reference_no: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithRefs = TransactionRow & {
  expense_categories: { name: string; code: string } | null;
  events: { title: string } | null;
};

export type ExpenseCategoryRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

export type ExpenseClaimRow = {
  id: string;
  organization_id: string;
  event_id: string | null;
  category_id: string | null;
  submitted_by: string;
  amount: number;
  currency: string;
  amount_ron: number | null;
  exchange_rate: number | null;
  status: "pending" | "approved" | "rejected" | "paid";
  description: string;
  receipt_url: string | null;
  submitted_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CashSummary = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

export async function listTransactions(
  organizationId: string,
): Promise<TransactionWithRefs[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("financial_transactions")
    .select("*, expense_categories(name, code), events(title)")
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false })
    .limit(200)
    .returns<TransactionWithRefs[]>();

  return data ?? [];
}

export async function getCashSummary(
  organizationId: string,
): Promise<CashSummary> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { totalIncome: 0, totalExpense: 0, netBalance: 0 };

  const { data } = await supabase
    .from("financial_transactions")
    .select("type, amount, amount_ron")
    .eq("organization_id", organizationId);

  const rows = data ?? [];
  const totalIncome = rows
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + (r.amount_ron ?? r.amount), 0);
  const totalExpense = rows
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + (r.amount_ron ?? r.amount), 0);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  };
}

export async function listExpenseCategories(
  organizationId: string,
): Promise<ExpenseCategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .returns<ExpenseCategoryRow[]>();

  return data ?? [];
}

export async function listExpenseClaims(
  organizationId: string,
): Promise<ExpenseClaimRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false })
    .limit(100)
    .returns<ExpenseClaimRow[]>();

  return data ?? [];
}
