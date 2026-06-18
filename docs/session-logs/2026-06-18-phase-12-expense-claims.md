# Session log — Phase 12: expense-claim submission UI

Date: 2026-06-18
Branch: `feature/phase-12-claims`
Gates: build ✓ · 142/142 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓

## Scope
Close the real gap: `createExpenseClaim` and the claims list existed, but there was
no form to submit a claim. No migration.

## What shipped
- `lib/finance/amount.ts` — extracted the shared `resolveAmountRon(currency, amount,
  amountRon)` rule (RON → amount; else the provided RON equivalent or null). Now used
  by both `createTransaction` and `createExpenseClaim` (was duplicated). **3 tests**.
- `components/finance/ExpenseClaimForm.tsx` — submit form (description, amount,
  currency, RON equivalent, exchange rate, notes).
- `app/(app)/finance/claims/new/page.tsx` — the submit page.
- `/finance` — "Submit claim" button in the header.

## Notes
- Insert is governed by the existing `org members can submit expense claims` RLS
  policy (is_org_member); the action validates currency + amount and stamps the
  submitter. No new RLS surface.

## Gate results
```
typecheck clean · lint clean · vitest 20 files / 142 passed (+3) · build clean · 0 vulns
```
