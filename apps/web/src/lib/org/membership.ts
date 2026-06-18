import "server-only";

import { cookies } from "next/headers";
import type { UserRole } from "@mali/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CURRENT_ORG_COOKIE } from "@/lib/auth/constants";
import { selectActiveOrg } from "./select";

export type OrgMembership = {
  organizationId: string;
  organizationName: string;
  role: UserRole;
};

type MembershipRow = {
  organization_id: string;
  role: UserRole;
  organizations: { name: string } | null;
};

/**
 * Lists the organizations the current user belongs to, with their role in each.
 * RLS scopes the rows to the caller, so no explicit user filter is required.
 */
export async function listUserOrganizations(): Promise<OrgMembership[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("organization_users")
    .select("organization_id, role, organizations(name)")
    .order("created_at", { ascending: true })
    .returns<MembershipRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Untitled organization",
    role: row.role,
  }));
}

export type OrganizationSettings = {
  name: string;
  vat_mode: string;
  base_currency: string;
};

/** Fetches the editable settings for one organization (RLS-scoped to members). */
export async function getOrganization(
  organizationId: string,
): Promise<OrganizationSettings | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("organizations")
    .select("name, vat_mode, base_currency")
    .eq("id", organizationId)
    .single<OrganizationSettings>();

  if (error || !data) return null;
  return data;
}

/**
 * Resolves the active organization for the request: the one named by the
 * current-org cookie when the user is still a member, otherwise their first
 * membership. Returns null when the user belongs to no organization.
 */
export async function resolveCurrentOrg(): Promise<OrgMembership | null> {
  const memberships = await listUserOrganizations();
  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value;

  return selectActiveOrg(memberships, preferredOrgId);
}
