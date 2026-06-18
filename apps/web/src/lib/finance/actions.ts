"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveAmountRon } from "./amount";

export type FinanceFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

// ISO 4217 codes are exactly three letters; reject anything else so a bad code
// can never be persisted and later crash a render.
const currencyCode = z
  .string()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code")
  .transform((c) => c.toUpperCase());

const TransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: currencyCode.default("RON"),
  description: z.string().min(1, "Description is required").max(500),
  transaction_date: z.string().min(1, "Date is required"),
  reference_no: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  amount_ron: z.coerce.number().positive().nullable().optional(),
  exchange_rate: z.coerce.number().positive().nullable().optional(),
});

export async function createTransaction(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const rawCurrency = (formData.get("currency") as string) || "RON";

  const parsed = TransactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    currency: rawCurrency,
    description: formData.get("description"),
    transaction_date: formData.get("transaction_date"),
    reference_no: formData.get("reference_no") || undefined,
    notes: formData.get("notes") || undefined,
    amount_ron: formData.get("amount_ron") || undefined,
    exchange_rate: formData.get("exchange_rate") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [currentOrg, user] = await Promise.all([
    resolveCurrentOrg(),
    getCurrentUser(),
  ]);

  if (!currentOrg) {
    return { status: "error", message: "No active organization" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Database unavailable" };
  }

  const amountRon = resolveAmountRon(
    parsed.data.currency,
    parsed.data.amount,
    parsed.data.amount_ron,
  );

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert({
      organization_id: currentOrg.organizationId,
      created_by: user?.id ?? null,
      type: parsed.data.type,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      amount_ron: amountRon,
      exchange_rate: parsed.data.exchange_rate ?? null,
      exchange_rate_source: parsed.data.exchange_rate ? "MANUAL" : null,
      description: parsed.data.description,
      transaction_date: parsed.data.transaction_date,
      reference_no: parsed.data.reference_no ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "Failed to create transaction" };
  }

  redirect("/finance");
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("financial_transactions")
    .delete()
    .eq("id", transactionId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/finance");
}

const ExpenseClaimSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: currencyCode.default("RON"),
  description: z.string().min(1, "Description is required").max(500),
  notes: z.string().max(2000).optional(),
  amount_ron: z.coerce.number().positive().nullable().optional(),
  exchange_rate: z.coerce.number().positive().nullable().optional(),
});

export async function createExpenseClaim(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const parsed = ExpenseClaimSchema.safeParse({
    amount: formData.get("amount"),
    currency: (formData.get("currency") as string) || "RON",
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    amount_ron: formData.get("amount_ron") || undefined,
    exchange_rate: formData.get("exchange_rate") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [currentOrg, user] = await Promise.all([
    resolveCurrentOrg(),
    getCurrentUser(),
  ]);

  if (!currentOrg || !user) {
    return { status: "error", message: "Authentication required" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Database unavailable" };
  }

  const amountRon = resolveAmountRon(
    parsed.data.currency,
    parsed.data.amount,
    parsed.data.amount_ron,
  );

  const { error } = await supabase.from("expense_claims").insert({
    organization_id: currentOrg.organizationId,
    submitted_by: user.id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    amount_ron: amountRon,
    exchange_rate: parsed.data.exchange_rate ?? null,
    description: parsed.data.description,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { status: "error", message: "Failed to submit expense claim" };
  }

  redirect("/finance");
}

export async function updateExpenseClaimStatus(
  claimId: string,
  newStatus: "approved" | "rejected" | "paid",
): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("expense_claims")
    .update({
      status: newStatus,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", claimId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/finance");
}
