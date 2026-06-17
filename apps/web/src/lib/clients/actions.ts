"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";

export type ClientFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const ClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["individual", "company"]),
  tax_id: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const parsed = ClientSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") ?? "individual",
    tax_id: formData.get("tax_id") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) {
    return { status: "error", message: "No active organization" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Database unavailable" };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, organization_id: currentOrg.organizationId })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "Failed to create client" };
  }

  redirect(`/clients/${data.id}`);
}

export async function updateClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const clientId = formData.get("client_id");
  if (!clientId || typeof clientId !== "string") {
    return { status: "error", message: "Missing client ID" };
  }

  const parsed = ClientSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") ?? "individual",
    tax_id: formData.get("tax_id") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) {
    return { status: "error", message: "No active organization" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Database unavailable" };
  }

  const { error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId)
    .eq("organization_id", currentOrg.organizationId);

  if (error) {
    return { status: "error", message: "Failed to update client" };
  }

  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/clients");
}
