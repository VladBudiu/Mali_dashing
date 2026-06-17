export const SUPPORTED_CURRENCIES = ["RON", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function formatMoney(amount: number, currency: string = "RON"): string {
  try {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Intl.NumberFormat throws RangeError on an invalid currency code (anything
    // that is not three ASCII letters). A bad code must never crash a render —
    // fall back to a plain number with the raw code appended.
    const formatted = new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted} ${currency}`.trim();
  }
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
