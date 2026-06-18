/**
 * Resolves the RON value to store for a money entry. RON entries use the amount
 * directly; foreign-currency entries use the user-provided RON equivalent (or
 * null when not supplied). Shared by transactions and expense claims, and unit-
 * tested so the rule stays consistent.
 */
export function resolveAmountRon(
  currency: string,
  amount: number,
  amountRon: number | null | undefined,
): number | null {
  if (currency === "RON") return amount;
  return amountRon ?? null;
}
