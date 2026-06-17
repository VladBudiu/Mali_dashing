# Session log — Phase 7: Pricing calculator

Date: 2026-06-18
Branch: `feature/phase-7-pricing`
Gates: build ✓ · 95/95 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓

## Scope

Ephemeral (no DB) cost→price calculator, as recommended in the handoff. Reuses
the shared money util so the calculator and the quote engine round identically.
No migration. Saving an estimate as a quote on an event is deferred (documented).

## What shipped

### Pure logic (`apps/web/src/lib/pricing/pricing.ts`) — 10 tests
- `computePricingLine` — `unitPrice = unitCost × (1 + markup)`, line cost/price/profit.
  - Floors unit price at 0 for markup < −100%; clamps negative qty/cost to 0.
- `computePricing` — rolls up total cost, subtotal price, discount (clamped at
  subtotal so net/VAT/gross/margin never go negative), profit, margin %, VAT,
  gross, and deposit (clamped at 100% of gross).
- Margin = profit ÷ net price (0 when there is no revenue).

### UI
- `components/pricing/PricingCalculator.tsx` — client component: editable cost
  lines (add/remove), markup %, VAT %, discount %, deposit %. Live summary cards
  (total cost, net price, profit, margin with colour bands) + a totals panel.
- Replaced the `/pricing` placeholder with the calculator. Nav entry already existed.

## Notes / follow-ups
- "Create quote from this estimate" (pre-fill a quote on a chosen event) is the
  natural next enhancement; left out to keep Phase 7 ephemeral.
- VAT defaults to 0 (org is `non_payer`); user can set 19 for payer orgs.

## Gate results
```
typecheck: clean   lint: clean   tests: 11 files / 95 passed (+10 pricing)
build: /pricing route compiles (dynamic)   audit: 0 vulnerabilities
```
