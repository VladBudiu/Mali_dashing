"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";

export type CollaboratorFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const CollaboratorSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  specialty: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  is_active: z.boolean().optional().default(true),
});

export async function createCollaborator(
  _prevState: CollaboratorFormState,
  formData: FormData,
): Promise<CollaboratorFormState> {
  const parsed = CollaboratorSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    specialty: formData.get("specialty") || undefined,
    notes: formData.get("notes") || undefined,
    is_active: formData.get("is_active") !== "false",
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
    .from("collaborators")
    .insert({ ...parsed.data, organization_id: currentOrg.organizationId })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "Failed to create collaborator" };
  }

  redirect(`/collaborators/${data.id}`);
}

export async function updateCollaborator(
  _prevState: CollaboratorFormState,
  formData: FormData,
): Promise<CollaboratorFormState> {
  const collaboratorId = formData.get("collaborator_id");
  if (!collaboratorId || typeof collaboratorId !== "string") {
    return { status: "error", message: "Missing collaborator ID" };
  }

  const parsed = CollaboratorSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    specialty: formData.get("specialty") || undefined,
    notes: formData.get("notes") || undefined,
    is_active: formData.get("is_active") !== "false",
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
    .from("collaborators")
    .update(parsed.data)
    .eq("id", collaboratorId)
    .eq("organization_id", currentOrg.organizationId);

  if (error) {
    return { status: "error", message: "Failed to update collaborator" };
  }

  redirect(`/collaborators/${collaboratorId}`);
}

export async function deleteCollaborator(collaboratorId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("collaborators")
    .delete()
    .eq("id", collaboratorId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/collaborators");
}
