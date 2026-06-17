# Session log — Hardcore testing round (all phases)

Date: 2026-06-18
Branch: `feature/phase-6-inventory`
Scope: deep verification of everything shipped (phases 0–6), including live-DB tests.

## Headline results

| Battery | Result |
|---------|--------|
| Unit suite | **85/85 pass** (was 78; +7 hardening tests) |
| Typecheck (`tsc --noEmit`) | clean |
| Lint (eslint) | clean |
| Build (`next build`) | clean |
| `npm audit` | 0 vulnerabilities |
| **RLS tenant isolation (live DB)** | **10/10 pass** |
| **Data integrity (live DB)** | **23/23 pass** |
| **expense_claims policy re-test (live DB)** | **3/3 pass** |
| Supabase advisors | 1 WARN fixed; rest accepted/documented |

All live-DB tests created their own throwaway orgs/users and cleaned up via
`ON DELETE CASCADE` (or atomic DO-block rollback). No residue left in the
real "Firma Mea" data.

## Bugs found & fixed

### 1. `formatMoney` could crash a render on a bad currency code (real)
`Intl.NumberFormat({style:'currency'})` throws `RangeError` for any code that
isn't three ASCII letters (`"1$2"`, `"R0N"`, `"EU "`, …). The finance action's
`z.string().length(3)` accepted exactly those, and a server action can be
invoked directly (bypassing the RON/EUR dropdown) — a single bad transaction
would then crash the finance page (and any quote/inventory page) for the whole org.

Fix:
- `lib/money/format.ts` — wrapped in try/catch; falls back to number + raw code, never throws.
- `lib/finance/actions.ts` — currency now validated `^[A-Za-z]{3}$` and upper-cased
  for both transactions and expense claims (reject at the boundary too).
- Added tests asserting no-throw + safe fallback for 5 invalid codes.

### 2. `auth_rls_initplan` on expense_claims UPDATE policy (perf, advisor WARN)
Policy re-evaluated `auth.uid()` per row. Migration `0012_rls_initplan_fix.sql`
rewrites it as `(select auth.uid())` — identical behavior, evaluated once.
Re-tested the policy on the live DB (submitter ✓, non-submitter member ✗, owner ✓)
and confirmed the advisor warning cleared.

## Live-DB RLS tenant isolation (the security-critical claim)

Two orgs (A, B) + three impersonated users (owner A, owner B, collaborator A),
queries run as `role authenticated` with a forged `request.jwt.claims.sub`:

- ✅ Org A member sees only org A rows; org B rows invisible (count 0)
- ✅ Org A INSERT into org B → blocked by RLS
- ✅ Org A UPDATE / DELETE of org B rows → 0 rows affected
- ✅ Collaborator (non-owner) DELETE → blocked (owner-only policy)
- ✅ Collaborator UPDATE → allowed (member right)
- ✅ Owner B cannot see or delete org A rows
- ✅ `authenticated` cannot INSERT into `exchange_rates` (service-role only)

## Live-DB data integrity (23 checks)

- Generated columns: `exchange_rates.inverse_rate` (=1/rate), `quote_lines.line_total_net` (=round(qty×price))
- CHECK constraints rejected bad values on: events.status, clients.type,
  organization_users.role, quotes.status, financial_transactions.type,
  organizations.vat_mode, documents.doc_type, documents.ocr_status,
  inventory_movements.movement_type, inventory_items.quantity (≥0),
  inventory_items.reserved (≤ quantity)
- UNIQUE rejected dupes on: quotes(event,version), expense_categories(org,code),
  exchange_rates(source,date,base,quote), event_assignments(event,collab),
  inventory_items(org,sku) partial — while allowing multiple NULL sku
- FK CASCADE: delete event removes its quotes/lines
- FK SET NULL: delete client nulls events.client_id; delete event nulls txn.event_id
- FK RESTRICT: cannot delete a user who still has an expense_claim
- Trigger: `updated_at` maintained on UPDATE

## Hardening tests added (durable regression coverage)

- `format.test.ts` — invalid currency no-throw + fallback (2 cases)
- `stock.test.ts` — fractional unit movements + boundary block (2 cases)
- `bnr.test.ts` — non-positive rate filtering, comma decimal, malformed XML (3 cases)

## Advisors — accepted / documented (not bugs)

- **SECURITY DEFINER helpers callable by `authenticated`** (`is_org_member`,
  `has_org_role`, `is_org_member_path`): by design — they return only the
  *caller's own* membership boolean (no data leak). Revoking EXECUTE risks
  breaking RLS evaluation. Intentional.
- **Leaked-password protection off**: project uses passwordless magic-link/OTP — N/A.
- **Unindexed FKs / unused indexes** (INFO): DB is near-empty; adding indexes now
  would just be flagged "unused". Revisit with production traffic. Candidate
  covering indexes if/when needed: `documents.expense_claim_id`,
  `expense_categories.parent_id`, `*.category_id` (SET NULL on parent delete).
- **Multiple permissive policies on `organization_users` SELECT** (WARN): owners'
  ALL policy + users-read-own SELECT policy serve distinct purposes; consolidating
  would muddle the membership model. Accepted.
