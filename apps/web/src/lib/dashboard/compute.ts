/**
 * Pure dashboard aggregations. Kept free of Supabase so the headline numbers are
 * unit-tested; `stats.ts` fetches the rows and feeds them here.
 */
import { getStockStatus } from "@/lib/inventory/stock";

type TxnRow = { type: string; amount: number; amount_ron: number | null };
type EventRow = { event_date: string };
type ItemRow = { quantity: number; reserved_quantity: number; reorder_threshold: number | null };

const ron = (t: TxnRow) => t.amount_ron ?? t.amount;

/** Income − expense, in RON (amount_ron preferred, falling back to amount). */
export function cashBalanceRON(txns: TxnRow[]): number {
  return txns.reduce((sum, t) => {
    if (t.type === "income") return sum + ron(t);
    if (t.type === "expense") return sum - ron(t);
    return sum;
  }, 0);
}

/** Events on or after `todayISO` (yyyy-mm-dd or full ISO). */
export function countUpcoming(events: EventRow[], todayISO: string): number {
  return events.filter((e) => e.event_date >= todayISO).length;
}

/** Items whose available stock is low or zero. */
export function countLowStock(items: ItemRow[]): number {
  return items.filter(
    (i) =>
      getStockStatus(
        { quantity: i.quantity, reserved_quantity: i.reserved_quantity },
        i.reorder_threshold,
      ) !== "ok",
  ).length;
}
