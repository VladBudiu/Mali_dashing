# Session log — Phase 6: Inventory / Warehouse + quality pass

Date: 2026-06-18
Branch: `feature/phase-6-inventory`
Gates: build ✓ · 78/78 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓ · DB constraints verified ✓

## Part 1 — Quality pass on existing code

### Real bug found and fixed: negative quote totals

`calculateQuoteTotals` (`lib/quotes/totals.ts`) applied discounts without an
upper bound. A fixed or combined discount larger than the line subtotal produced
a **negative net, VAT, and gross** — a quoting system must never do this.

Fix: cap the discount at the subtotal (`Math.min(discount, subtotal)`) so totals
floor at zero. Also:
- Removed a duplicated private `roundMoney` — now imports the shared
  `@/lib/money/format` version (DRY).
- Wrapped the subtotal accumulation in `roundMoney` for float-accumulation safety.

Added 3 regression tests (over-discount fixed, over-discount combined, never-negative).

## Part 2 — Phase 6 build

### Migration `0011_inventory.sql`

- `inventory_items`: org-scoped, `quantity` (on hand), `reserved_quantity`
  (committed to events), `reorder_threshold`, `unit_cost_ron`, `sku` (unique per
  org when present via partial index).
  - CHECK `quantity >= 0`
  - CHECK `reserved_quantity >= 0 and reserved_quantity <= quantity`
  - RLS: members read/write, owners delete; `set_updated_at` trigger
- `inventory_movements`: immutable audit trail (`in`/`out`/`reserve`/`release`),
  `quantity > 0`, optional `event_id`. RLS: members read/insert only (no
  update/delete policies = deny-by-default).

Applied to live DB via MCP. Verified CHECK constraints reject negative stock and
over-reservation with a transactional SQL test (test row cleaned up).

### Pure stock engine (`lib/inventory/stock.ts`) — 16 tests

- `computeStockAfterMovement(levels, type, qty)` → discriminated `StockResult`.
  Enforces the same invariants as the DB so the UI rejects bad moves pre-network:
  - `in`: quantity += qty
  - `out`: blocked if qty > available (quantity − reserved)
  - `reserve`: blocked if qty > available
  - `release`: blocked if qty > reserved
- `availableStock(levels)` and `getStockStatus(levels, threshold)` → `out`/`low`/`ok`

### Lib + UI

- `lib/inventory/queries.ts` — `listInventoryItems`, `getInventoryItem`, `listItemMovements`
- `lib/inventory/actions.ts` — `createInventoryItem`, `updateInventoryItem`,
  `deleteInventoryItem`, `recordMovement` (read levels → compute → update →
  insert movement; DB constraints are the final guard against races; 23505 SKU
  conflict surfaced cleanly)
- `components/inventory/InventoryItemForm.tsx`, `MovementForm.tsx`
- Pages: `/inventory` (list with low/out highlights), `/inventory/new`,
  `/inventory/[id]` (stock summary cards + movement form + history),
  `/inventory/[id]/edit`
- Replaced the `/inventory` placeholder. Nav entry already existed.

### Types

Regenerated `packages/types/src/database.ts` to include `inventory_items` and
`inventory_movements`.

## Gate results

```
typecheck: npx tsc --noEmit — clean
tests:     vitest — 10 files, 78 tests passed (was 59; +3 quote, +16 inventory)
lint:      eslint — clean
build:     next build — 4 new inventory routes (all ƒ dynamic), 0 errors
audit:     0 vulnerabilities
db:        CHECK constraints verified against live DB
```

## Follow-ups (non-blocking)

- Event detail page could show inventory reserved for that event (reverse view)
- `recordMovement` read-modify-write has a tiny race window; DB CHECK is the
  backstop, but a SECURITY DEFINER function doing the delta atomically would be
  more robust if concurrency grows
- Bulk stock import (CSV) not yet supported
