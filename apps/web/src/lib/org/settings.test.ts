import { describe, expect, it } from "vitest";
import { OrgSettingsSchema, vatModeLabel, VAT_MODES, ORG_CURRENCIES } from "./settings";

describe("OrgSettingsSchema", () => {
  it("accepts valid settings and trims the name", () => {
    const r = OrgSettingsSchema.safeParse({
      name: "  Firma Mea  ",
      vat_mode: "non_payer",
      base_currency: "RON",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Firma Mea");
  });

  it("rejects an empty name", () => {
    expect(
      OrgSettingsSchema.safeParse({ name: "   ", vat_mode: "payer", base_currency: "RON" }).success,
    ).toBe(false);
  });

  it("rejects an unknown vat_mode or currency", () => {
    expect(
      OrgSettingsSchema.safeParse({ name: "X", vat_mode: "maybe", base_currency: "RON" }).success,
    ).toBe(false);
    expect(
      OrgSettingsSchema.safeParse({ name: "X", vat_mode: "payer", base_currency: "GBP" }).success,
    ).toBe(false);
  });

  it("exposes consistent option lists", () => {
    expect(VAT_MODES.map((m) => m.value)).toEqual(["non_payer", "payer"]);
    expect(ORG_CURRENCIES).toContain("RON");
  });

  it("vatModeLabel maps values and tolerates unknowns", () => {
    expect(vatModeLabel("non_payer")).toBe("Neplătitor TVA");
    expect(vatModeLabel("payer")).toBe("Plătitor TVA");
    expect(vatModeLabel("weird")).toBe("weird");
  });
});
