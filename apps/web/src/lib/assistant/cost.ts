/**
 * Pure cost maths over stored token usage. Lets the usage dashboard price each
 * turn from the model that produced it, including the prompt-cache discounts.
 */
import { rates, DEFAULT_MODEL } from "./models";
import type { TokenUsage } from "./types";

export type UsageTotals = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  costUSD: number;
};

/** USD cost of a single turn's usage, priced by its model. */
export function estimateCostUSD(usage: TokenUsage): number {
  const r = rates(usage.model ?? DEFAULT_MODEL);
  return (
    (usage.input ?? 0) * r.input +
    (usage.output ?? 0) * r.output +
    (usage.cacheRead ?? 0) * r.cacheRead +
    (usage.cacheWrite ?? 0) * r.cacheWrite
  );
}

/** Aggregate a list of per-turn usages into totals + total cost. */
export function aggregateUsage(list: TokenUsage[]): UsageTotals {
  const totals: UsageTotals = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    costUSD: 0,
  };
  for (const u of list) {
    totals.input += u.input ?? 0;
    totals.output += u.output ?? 0;
    totals.cacheRead += u.cacheRead ?? 0;
    totals.cacheWrite += u.cacheWrite ?? 0;
    totals.costUSD += estimateCostUSD(u);
  }
  return totals;
}

/** Format a small USD amount with enough precision to be meaningful. */
export function formatUSD(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
