/**
 * Pure stock arithmetic for inventory movements. Kept free of Supabase so the
 * rules (never go negative, never reserve more than is on hand) are unit-tested
 * and shared between the server action and any preview UI.
 */

export const MOVEMENT_TYPES = ["in", "out", "reserve", "release"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: "Stock in",
  out: "Stock out",
  reserve: "Reserve",
  release: "Release",
};

export type StockLevels = {
  quantity: number;
  reserved_quantity: number;
};

export type StockResult =
  | { ok: true; levels: StockLevels }
  | { ok: false; error: string };

/** Units physically on hand that are not committed to an event. */
export function availableStock(levels: StockLevels): number {
  return levels.quantity - levels.reserved_quantity;
}

/**
 * Applies a movement of `qty` units to the current stock levels, enforcing the
 * same invariants as the database CHECK constraints so the UI can reject bad
 * input with a clear message before hitting the network.
 */
export function computeStockAfterMovement(
  current: StockLevels,
  type: MovementType,
  qty: number,
): StockResult {
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, error: "Quantity must be a positive number." };
  }

  const available = availableStock(current);

  switch (type) {
    case "in":
      return {
        ok: true,
        levels: {
          quantity: current.quantity + qty,
          reserved_quantity: current.reserved_quantity,
        },
      };

    case "out":
      if (qty > available) {
        return {
          ok: false,
          error: `Cannot remove ${qty}: only ${available} unreserved unit(s) on hand.`,
        };
      }
      return {
        ok: true,
        levels: {
          quantity: current.quantity - qty,
          reserved_quantity: current.reserved_quantity,
        },
      };

    case "reserve":
      if (qty > available) {
        return {
          ok: false,
          error: `Cannot reserve ${qty}: only ${available} unit(s) available.`,
        };
      }
      return {
        ok: true,
        levels: {
          quantity: current.quantity,
          reserved_quantity: current.reserved_quantity + qty,
        },
      };

    case "release":
      if (qty > current.reserved_quantity) {
        return {
          ok: false,
          error: `Cannot release ${qty}: only ${current.reserved_quantity} unit(s) reserved.`,
        };
      }
      return {
        ok: true,
        levels: {
          quantity: current.quantity,
          reserved_quantity: current.reserved_quantity - qty,
        },
      };

    default: {
      // Exhaustiveness guard — a new MovementType must be handled above.
      const _never: never = type;
      return { ok: false, error: `Unknown movement type: ${String(_never)}` };
    }
  }
}

export type StockStatus = "out" | "low" | "ok";

/**
 * Classifies an item for list highlighting. "low" requires a configured
 * reorder threshold; without one an in-stock item is always "ok".
 */
export function getStockStatus(
  levels: StockLevels,
  reorderThreshold: number | null,
): StockStatus {
  const available = availableStock(levels);
  if (available <= 0) return "out";
  if (reorderThreshold != null && available <= reorderThreshold) return "low";
  return "ok";
}
