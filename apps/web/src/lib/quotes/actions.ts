"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getQuoteLines, getQuote } from "./queries";
import { calculateQuoteTotals } from "./totals";

export type QuoteFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const QuoteLineSchema = z.object({
  description: z.string().min(1, "Description required").max(500),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit_price_net: z.coerce.number().min(0, "Price must be non-negative"),
  unit_cost_net: z.coerce.number().min(0).optional(),
  vat_rate: z.coerce.number().min(0).max(1).optional().default(0.19),
});

export async function createQuote(eventId: string, organizationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("quotes")
    .select("version_no")
    .eq("event_id", eventId)
    .order("version_no", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (existing?.version_no ?? 0) + 1;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      event_id: eventId,
      organization_id: organizationId,
      version_no: nextVersion,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) return;

  redirect(`/events/${eventId}/quotes/${data.id}`);
}

export async function addQuoteLine(
  _prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const quoteId = formData.get("quote_id");
  if (!quoteId || typeof quoteId !== "string") {
    return { status: "error", message: "Missing quote ID" };
  }

  const parsed = QuoteLineSchema.safeParse({
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unit_price_net: formData.get("unit_price_net"),
    unit_cost_net: formData.get("unit_cost_net") || undefined,
    vat_rate: formData.get("vat_rate") || 0.19,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  const existingLines = await getQuoteLines(quoteId);
  const nextOrder = existingLines.length;

  const { error: lineError } = await supabase
    .from("quote_lines")
    .insert({ ...parsed.data, quote_id: quoteId, sort_order: nextOrder });

  if (lineError) {
    return { status: "error", message: "Failed to add line" };
  }

  await recalculateQuoteTotals(quoteId);

  revalidatePath(`/events/[id]/quotes/${quoteId}`, "page");
  return { status: "idle" };
}

export async function deleteQuoteLine(quoteId: string, lineId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("quote_lines").delete().eq("id", lineId).eq("quote_id", quoteId);
  await recalculateQuoteTotals(quoteId);
  revalidatePath(`/events/[id]/quotes/${quoteId}`, "page");
}

export async function updateQuoteStatus(quoteId: string, status: string, eventId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const accepted_at = status === "accepted" ? now : undefined;
  const sent_at = status === "sent" ? now : undefined;

  await supabase
    .from("quotes")
    .update({ status, ...(accepted_at ? { accepted_at } : {}), ...(sent_at ? { sent_at } : {}) })
    .eq("id", quoteId);
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}/quotes/${quoteId}`);
}

async function recalculateQuoteTotals(quoteId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const [quote, lines] = await Promise.all([getQuote(quoteId), getQuoteLines(quoteId)]);
  if (!quote) return;

  const totals = calculateQuoteTotals(
    lines,
    quote.vat_rate,
    quote.discount_pct,
    quote.fixed_discount_net,
  );

  await supabase.from("quotes").update({
    subtotal_net: totals.subtotalNet,
    discount_net: totals.discountNet,
    net_after_discount: totals.netAfterDiscount,
    vat_amount: totals.vatAmount,
    total_gross: totals.totalGross,
  }).eq("id", quoteId);
}
