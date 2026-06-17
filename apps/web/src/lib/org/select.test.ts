import { describe, expect, it } from "vitest";
import { selectActiveOrg } from "./select";
import type { OrgMembership } from "./membership";

const orgA: OrgMembership = {
  organizationId: "11111111-1111-1111-1111-111111111111",
  organizationName: "Org A",
  role: "owner",
};

const orgB: OrgMembership = {
  organizationId: "22222222-2222-2222-2222-222222222222",
  organizationName: "Org B",
  role: "collaborator",
};

describe("selectActiveOrg", () => {
  it("should return null when there are no memberships", () => {
    expect(selectActiveOrg([], undefined)).toBeNull();
    expect(selectActiveOrg([], orgA.organizationId)).toBeNull();
  });

  it("should return the preferred organization when the user is a member", () => {
    expect(selectActiveOrg([orgA, orgB], orgB.organizationId)).toEqual(orgB);
  });

  it("should fall back to the first membership when no preference is set", () => {
    expect(selectActiveOrg([orgA, orgB], undefined)).toEqual(orgA);
  });

  it("should fall back to the first membership when the preference is not a membership", () => {
    expect(
      selectActiveOrg([orgA, orgB], "99999999-9999-9999-9999-999999999999"),
    ).toEqual(orgA);
  });
});
