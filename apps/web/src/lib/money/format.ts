export const SUPPORTED_CURRENCIES = ["RON", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function formatMoney(amount: number, currency: string = "RON"): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
