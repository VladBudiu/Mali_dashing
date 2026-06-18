import { z } from "zod";

/** Shared org-settings validation + option lists (pure, used by action + form). */

export const VAT_MODES = [
  { value: "non_payer", label: "Neplătitor TVA" },
  { value: "payer", label: "Plătitor TVA" },
] as const;

export const ORG_CURRENCIES = ["RON", "EUR", "USD"] as const;

export const OrgSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  vat_mode: z.enum(["non_payer", "payer"]),
  base_currency: z.enum(ORG_CURRENCIES),
});

export type OrgSettingsInput = z.infer<typeof OrgSettingsSchema>;

export function vatModeLabel(mode: string): string {
  return VAT_MODES.find((m) => m.value === mode)?.label ?? mode;
}
