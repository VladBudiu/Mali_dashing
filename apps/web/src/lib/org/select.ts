import type { OrgMembership } from "./membership";

/**
 * Chooses the active organization from a user's memberships: the preferred one
 * when the user is still a member, otherwise the first membership. Returns null
 * when there are no memberships. Pure — the source of memberships and the
 * preference are resolved by the caller.
 */
export function selectActiveOrg(
  memberships: OrgMembership[],
  preferredOrgId: string | undefined,
): OrgMembership | null {
  const [fallbackMembership] = memberships;
  if (!fallbackMembership) {
    return null;
  }

  const preferred = memberships.find(
    (membership) => membership.organizationId === preferredOrgId,
  );

  return preferred ?? fallbackMembership;
}
