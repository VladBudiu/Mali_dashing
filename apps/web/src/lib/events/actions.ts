"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCurrentUser } from "@/lib/auth/session";

export type EventFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const EventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  event_date: z.string().min(1, "Date is required"),
  client_id: z.string().uuid().optional().or(z.literal("")),
  status: z.string().optional().default("draft"),
  venue_name: z.string().max(255).optional(),
  venue_address: z.string().max(500).optional(),
  city: z.string().max(255).optional(),
  pricing_currency: z.string().length(3).optional().default("RON"),
  notes: z.string().max(2000).optional(),
});

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const parsed = EventSchema.safeParse({
    title: formData.get("title"),
    event_date: formData.get("event_date"),
    client_id: formData.get("client_id") || undefined,
    status: formData.get("status") || "draft",
    venue_name: formData.get("venue_name") || undefined,
    venue_address: formData.get("venue_address") || undefined,
    city: formData.get("city") || undefined,
    pricing_currency: formData.get("pricing_currency") || "RON",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [currentOrg, user] = await Promise.all([resolveCurrentOrg(), getCurrentUser()]);
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  const payload = {
    ...parsed.data,
    organization_id: currentOrg.organizationId,
    created_by: user?.id ?? null,
    client_id: parsed.data.client_id || null,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "Failed to create event" };
  }

  redirect(`/events/${data.id}`);
}

export async function updateEvent(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const eventId = formData.get("event_id");
  if (!eventId || typeof eventId !== "string") {
    return { status: "error", message: "Missing event ID" };
  }

  const parsed = EventSchema.safeParse({
    title: formData.get("title"),
    event_date: formData.get("event_date"),
    client_id: formData.get("client_id") || undefined,
    status: formData.get("status") || "draft",
    venue_name: formData.get("venue_name") || undefined,
    venue_address: formData.get("venue_address") || undefined,
    city: formData.get("city") || undefined,
    pricing_currency: formData.get("pricing_currency") || "RON",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return { status: "error", message: "No active organization" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable" };

  const { error } = await supabase
    .from("events")
    .update({ ...parsed.data, client_id: parsed.data.client_id || null })
    .eq("id", eventId)
    .eq("organization_id", currentOrg.organizationId);

  if (error) {
    return { status: "error", message: "Failed to update event" };
  }

  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/events");
}
