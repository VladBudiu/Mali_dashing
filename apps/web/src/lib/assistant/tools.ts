import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mali/types";
import { availableStock, getStockStatus } from "@/lib/inventory/stock";
import type { AssistantSource, ToolResult } from "./types";

export type ToolContext = {
  supabase: SupabaseClient<Database>;
  orgId: string;
  userId: string | null;
  /** ISO yyyy-mm-dd — injected so handlers don't call Date() directly. */
  today: string;
};

type Handler = (ctx: ToolContext, input: Record<string, unknown>) => Promise<ToolResult>;

const ok = (data: unknown, sources: AssistantSource[] = []): ToolResult => ({
  ok: true,
  data,
  sources,
});
const fail = (error: string): ToolResult => ({ ok: false, error });

const ronOf = (t: { amount: number; amount_ron: number | null }) => t.amount_ron ?? t.amount;

const get_dashboard_stats: Handler = async (ctx) => {
  const { supabase, orgId, today } = ctx;
  const [txns, events, items, claims] = await Promise.all([
    supabase.from("financial_transactions").select("type, amount, amount_ron").eq("organization_id", orgId),
    supabase.from("events").select("id").eq("organization_id", orgId).gte("event_date", today),
    supabase.from("inventory_items").select("quantity, reserved_quantity, reorder_threshold").eq("organization_id", orgId),
    supabase.from("expense_claims").select("id").eq("organization_id", orgId).eq("status", "pending"),
  ]);

  const rows = txns.data ?? [];
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + ronOf(r), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + ronOf(r), 0);
  const lowStock = (items.data ?? []).filter(
    (i) =>
      getStockStatus(
        { quantity: i.quantity, reserved_quantity: i.reserved_quantity },
        i.reorder_threshold,
      ) !== "ok",
  ).length;

  return ok(
    {
      currency: "RON",
      total_income: income,
      total_expense: expense,
      net_balance: income - expense,
      upcoming_events: events.data?.length ?? 0,
      low_or_out_of_stock_items: lowStock,
      pending_expense_claims: claims.data?.length ?? 0,
    },
    [{ table: "dashboard", id: "summary", label: "Dashboard", href: "/dashboard" }],
  );
};

const get_finance_summary: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  let q = supabase
    .from("financial_transactions")
    .select("type, amount, amount_ron, transaction_date")
    .eq("organization_id", orgId);
  if (typeof input.from === "string") q = q.gte("transaction_date", input.from);
  if (typeof input.to === "string") q = q.lte("transaction_date", input.to);

  const { data, error } = await q;
  if (error) return fail("Could not read transactions.");
  const rows = data ?? [];
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + ronOf(r), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + ronOf(r), 0);

  return ok(
    {
      currency: "RON",
      from: input.from ?? null,
      to: input.to ?? null,
      transaction_count: rows.length,
      total_income: income,
      total_expense: expense,
      net_balance: income - expense,
    },
    [{ table: "financial_transactions", id: "summary", label: "Finance", href: "/finance" }],
  );
};

const list_transactions: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  const limit = typeof input.limit === "number" ? input.limit : 20;
  let q = supabase
    .from("financial_transactions")
    .select("id, type, amount, amount_ron, currency, description, transaction_date, event_id")
    .eq("organization_id", orgId)
    .order("transaction_date", { ascending: false })
    .limit(limit);
  if (input.type === "income" || input.type === "expense") q = q.eq("type", input.type);
  if (typeof input.from === "string") q = q.gte("transaction_date", input.from);
  if (typeof input.to === "string") q = q.lte("transaction_date", input.to);

  const { data, error } = await q;
  if (error) return fail("Could not read transactions.");
  const rows = data ?? [];
  return ok(
    rows.map((r) => ({
      id: r.id,
      date: r.transaction_date,
      type: r.type,
      amount_ron: ronOf(r),
      original: r.currency !== "RON" ? { amount: r.amount, currency: r.currency } : undefined,
      description: r.description,
    })),
    rows.map((r) => ({
      table: "financial_transactions",
      id: r.id,
      label: r.description,
      href: "/finance",
    })),
  );
};

const search_events: Handler = async (ctx, input) => {
  const { supabase, orgId, today } = ctx;
  const limit = typeof input.limit === "number" ? input.limit : 20;
  let q = supabase
    .from("events")
    .select("id, title, status, event_date, city, venue_name, clients(name)")
    .eq("organization_id", orgId)
    .order("event_date", { ascending: false })
    .limit(limit);
  if (typeof input.query === "string" && input.query.trim()) {
    const term = `%${input.query.trim()}%`;
    q = q.or(`title.ilike.${term},city.ilike.${term},venue_name.ilike.${term}`);
  }
  if (typeof input.status === "string") q = q.eq("status", input.status);
  if (input.upcoming === true) q = q.gte("event_date", today);

  const { data, error } = await q;
  if (error) return fail("Could not search events.");
  const rows = (data ?? []) as Array<{
    id: string; title: string; status: string; event_date: string;
    city: string | null; venue_name: string | null; clients: { name: string } | null;
  }>;
  return ok(
    rows.map((e) => ({
      id: e.id, title: e.title, status: e.status, date: e.event_date,
      city: e.city, venue: e.venue_name, client: e.clients?.name ?? null,
    })),
    rows.map((e) => ({ table: "events", id: e.id, label: e.title, href: `/events/${e.id}` })),
  );
};

const get_event_overview: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  const eventId = String(input.event_id);
  const { data: event, error } = await supabase
    .from("events")
    .select("*, clients(name)")
    .eq("organization_id", orgId)
    .eq("id", eventId)
    .single();
  if (error || !event) return fail("Event not found.");

  const [quotes, assignments, txns] = await Promise.all([
    supabase.from("quotes").select("id, version_no, status, total_gross, currency").eq("event_id", eventId),
    supabase.from("event_assignments").select("role, fee, fee_currency, collaborators(name, specialty)").eq("event_id", eventId),
    supabase.from("financial_transactions").select("id, type, amount, amount_ron, description").eq("event_id", eventId),
  ]);

  const ev = event as unknown as { id: string; title: string; status: string; event_date: string; clients: { name: string } | null };
  const sources: AssistantSource[] = [{ table: "events", id: ev.id, label: ev.title, href: `/events/${ev.id}` }];

  return ok(
    {
      event: { id: ev.id, title: ev.title, status: ev.status, date: ev.event_date, client: ev.clients?.name ?? null },
      quotes: quotes.data ?? [],
      assignments: (assignments.data ?? []).map((a) => {
        const c = a as unknown as { role: string | null; fee: number | null; collaborators: { name: string } | null };
        return { role: c.role, fee: c.fee, collaborator: c.collaborators?.name ?? null };
      }),
      transactions: (txns.data ?? []).map((t) => ({ id: t.id, type: t.type, amount_ron: ronOf(t), description: t.description })),
    },
    sources,
  );
};

const get_inventory_status: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, name, unit, quantity, reserved_quantity, reorder_threshold")
    .eq("organization_id", orgId)
    .order("name");
  if (error) return fail("Could not read inventory.");
  let rows = (data ?? []).map((i) => {
    const levels = { quantity: i.quantity, reserved_quantity: i.reserved_quantity };
    return {
      id: i.id, name: i.name, unit: i.unit, on_hand: i.quantity, reserved: i.reserved_quantity,
      available: availableStock(levels), status: getStockStatus(levels, i.reorder_threshold),
    };
  });
  if (input.low_stock_only === true) rows = rows.filter((r) => r.status !== "ok");

  return ok(
    rows,
    rows.map((r) => ({ table: "inventory_items", id: r.id, label: r.name, href: `/inventory/${r.id}` })),
  );
};

const search_clients: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  const limit = typeof input.limit === "number" ? input.limit : 20;
  let q = supabase
    .from("clients")
    .select("id, name, type, email, phone")
    .eq("organization_id", orgId)
    .order("name")
    .limit(limit);
  if (typeof input.query === "string" && input.query.trim()) {
    const term = `%${input.query.trim()}%`;
    q = q.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) return fail("Could not search clients.");
  const rows = data ?? [];
  return ok(
    rows,
    rows.map((c) => ({ table: "clients", id: c.id, label: c.name, href: `/clients/${c.id}` })),
  );
};

const list_collaborators: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  let q = supabase
    .from("collaborators")
    .select("id, name, specialty, is_active")
    .eq("organization_id", orgId)
    .order("name");
  if (typeof input.query === "string" && input.query.trim()) {
    const term = `%${input.query.trim()}%`;
    q = q.or(`name.ilike.${term},specialty.ilike.${term}`);
  }
  const { data, error } = await q;
  if (error) return fail("Could not read collaborators.");
  const rows = data ?? [];
  return ok(
    rows,
    rows.map((c) => ({ table: "collaborators", id: c.id, label: c.name, href: `/collaborators/${c.id}` })),
  );
};

const list_notes: Handler = async (ctx, input) => {
  const { supabase, orgId } = ctx;
  let q = supabase
    .from("ai_notes")
    .select("id, note, entity_type, entity_id, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (typeof input.entity_type === "string") q = q.eq("entity_type", input.entity_type);
  if (typeof input.entity_id === "string") q = q.eq("entity_id", input.entity_id);
  const { data, error } = await q;
  if (error) return fail("Could not read notes.");
  const rows = data ?? [];
  return ok(rows, rows.map((n) => ({ table: "ai_notes", id: n.id, label: n.note.slice(0, 60) })));
};

const save_note: Handler = async (ctx, input) => {
  const { supabase, orgId, userId } = ctx;
  const { data, error } = await supabase
    .from("ai_notes")
    .insert({
      organization_id: orgId,
      note: String(input.note),
      entity_type: typeof input.entity_type === "string" ? input.entity_type : null,
      entity_id: typeof input.entity_id === "string" ? input.entity_id : null,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail("Could not save the note.");
  return ok({ saved: true, id: data.id }, [{ table: "ai_notes", id: data.id, label: "Saved note" }]);
};

export const TOOL_HANDLERS: Record<string, Handler> = {
  get_dashboard_stats,
  get_finance_summary,
  list_transactions,
  search_events,
  get_event_overview,
  get_inventory_status,
  search_clients,
  list_collaborators,
  list_notes,
  save_note,
};
