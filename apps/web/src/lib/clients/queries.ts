import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClientRow = {
  id: string;
  organization_id: string;
  name: string;
  type: "individual" | "company";
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listClients(organizationId: string): Promise<ClientRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .returns<ClientRow[]>();

  if (error || !data) return [];
  return data;
}

export async function getClient(
  organizationId: string,
  clientId: string,
): Promise<ClientRow | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .single()
    .returns<ClientRow>();

  if (error || !data) return null;
  return data;
}
