import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CollaboratorRow = {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  specialty: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CollaboratorRateRow = {
  id: string;
  collaborator_id: string;
  pricing_mode: "per_day" | "per_hour" | "fixed";
  rate: number;
  currency: string;
  valid_from: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
};

export async function listCollaborators(organizationId: string): Promise<CollaboratorRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("collaborators")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .returns<CollaboratorRow[]>();

  if (error || !data) return [];
  return data;
}

export async function getCollaborator(
  organizationId: string,
  collaboratorId: string,
): Promise<CollaboratorRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("collaborators")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", collaboratorId)
    .single()
    .returns<CollaboratorRow>();

  if (error || !data) return null;
  return data;
}

export async function getCollaboratorRates(collaboratorId: string): Promise<CollaboratorRateRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("collaborator_rates")
    .select("*")
    .eq("collaborator_id", collaboratorId)
    .order("valid_from", { ascending: false })
    .returns<CollaboratorRateRow[]>();

  if (error || !data) return [];
  return data;
}
