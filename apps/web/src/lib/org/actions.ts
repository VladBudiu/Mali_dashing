"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CURRENT_ORG_COOKIE } from "@/lib/auth/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserOrganizations, resolveCurrentOrg } from "./membership";
import { OrgSettingsSchema } from "./settings";

const setCurrentOrgSchema = z.object({ organizationId: z.string().uuid() });

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type SetCurrentOrgResult =
  | { status: "ok" }
  | { status: "error"; message: string };

/**
 * Switches the active organization. Verifies the user is a member of the target
 * org before persisting the choice in the current-org cookie, so the cookie can
 * never point at an organization the user cannot access.
 */
export async function setCurrentOrg(
  _prevState: SetCurrentOrgResult,
  formData: FormData,
): Promise<SetCurrentOrgResult> {
  const parsed = setCurrentOrgSchema.safeParse({
    organizationId: formData.get("organizationId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid organization." };
  }

  const memberships = await listUserOrganizations();
  const isMember = memberships.some(
    (membership) => membership.organizationId === parsed.data.organizationId,
  );

  if (!isMember) {
    return { status: "error", message: "You are not a member of that organization." };
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_ORG_COOKIE, parsed.data.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  revalidatePath("/", "layout");
  return { status: "ok" };
}

export type OrgSettingsState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

/**
 * Updates the active organization's name, VAT mode and base currency.
 * Owner-only — enforced here for a clean message and again by RLS
 * (`owners update their organization`).
 */
export async function updateOrganization(
  _prevState: OrgSettingsState,
  formData: FormData,
): Promise<OrgSettingsState> {
  const parsed = OrgSettingsSchema.safeParse({
    name: formData.get("name"),
    vat_mode: formData.get("vat_mode"),
    base_currency: formData.get("base_currency"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return { status: "error", message: "No active organization." };
  if (currentOrg.role !== "owner") {
    return { status: "error", message: "Only an owner can change organization settings." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Database unavailable." };

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      vat_mode: parsed.data.vat_mode,
      base_currency: parsed.data.base_currency,
    })
    .eq("id", currentOrg.organizationId);

  if (error) return { status: "error", message: "Could not save settings." };

  revalidatePath("/", "layout");
  return { status: "success" };
}
