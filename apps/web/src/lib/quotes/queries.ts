import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type QuoteRow = {
  id: string;
  event_id: string;
  organization_id: string;
  version_no: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  currency: string;
  vat_rate: number;
  discount_pct: number;
  fixed_discount_net: number;
  subtotal_net: number;
  discount_net: number;
  net_after_discount: number;
  vat_amount: number;
  total_gross: number;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteLineRow = {
  id: string;
  quote_id: string;
  sort_order: number;
  description: string;
  quantity: number;
  unit_price_net: number;
  unit_cost_net: number | null;
  vat_rate: number;
  line_total_net: number;
  created_at: string;
  updated_at: string;
};

export async function listQuotesForEvent(eventId: string): Promise<QuoteRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("event_id", eventId)
    .order("version_no", { ascending: true })
    .returns<QuoteRow[]>();

  if (error || !data) return [];
  return data;
}

export async function getQuote(quoteId: string): Promise<QuoteRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single()
    .returns<QuoteRow>();

  if (error || !data) return null;
  return data;
}

export async function getQuoteLines(quoteId: string): Promise<QuoteLineRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quote_lines")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true })
    .returns<QuoteLineRow[]>();

  if (error || !data) return [];
  return data;
}
