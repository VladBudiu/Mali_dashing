import "server-only";

import type { EventStatus } from "@mali/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EventRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  title: string;
  status: EventStatus;
  event_date: string;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  country_code: string;
  pricing_currency: string;
  notes: string | null;
  estimated_cost_total: number | null;
  estimated_revenue_total: number | null;
  final_cost_total: number | null;
  final_revenue_total: number | null;
  created_at: string;
  updated_at: string;
};

export type EventWithClient = EventRow & {
  clients: { name: string } | null;
};

export type EventAssignmentRow = {
  id: string;
  event_id: string;
  collaborator_id: string;
  role: string | null;
  fee: number | null;
  fee_currency: string;
  notes: string | null;
  collaborators: { name: string; specialty: string | null };
};

export async function listEvents(organizationId: string): Promise<EventWithClient[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*, clients(name)")
    .eq("organization_id", organizationId)
    .order("event_date", { ascending: false })
    .returns<EventWithClient[]>();

  if (error || !data) return [];
  return data;
}

export async function getEvent(
  organizationId: string,
  eventId: string,
): Promise<EventWithClient | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*, clients(name)")
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .single()
    .returns<EventWithClient>();

  if (error || !data) return null;
  return data;
}

export async function getEventAssignments(eventId: string): Promise<EventAssignmentRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("event_assignments")
    .select("*, collaborators(name, specialty)")
    .eq("event_id", eventId)
    .returns<EventAssignmentRow[]>();

  if (error || !data) return [];
  return data;
}
