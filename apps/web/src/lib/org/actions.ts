"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CURRENT_ORG_COOKIE } from "@/lib/auth/constants";
import { listUserOrganizations } from "./membership";

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
