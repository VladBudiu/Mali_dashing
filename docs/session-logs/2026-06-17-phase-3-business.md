# Session Log: Phase 3 — Business Core

**Date:** 2026-06-17  
**Branch:** `feature/phase-3-business`  
**Phase:** 3 of N

---

## What Was Done

### Database Migrations (applied to live Supabase)

- **`0004_clients.sql`** — `clients` table (individual/company, tax_id, contact fields), `client_contacts` junction, `set_updated_at` trigger, full RLS (select/insert/update for members, delete for owners).
- **`0005_collaborators.sql`** — `collaborators` table (specialty, is_active), `collaborator_rates` (per_day/per_hour/fixed, valid_from/until, currency), full RLS.
- **`0006_events.sql`** — `events` table with full 17-status CHECK constraint from blueprint, FK to clients and auth.users (created_by), `event_assignments` junction (collaborator + role + fee), all RLS.
- **`0007_quotes.sql`** — `quotes` table (version_no, status, currency, vat_rate, totals snapshot), `quote_lines` with `line_total_net` generated column (`qty × unit_price`), full RLS.

### Generated TypeScript Types

- **`packages/types/src/database.ts`** — Regenerated with all 10 tables: `clients`, `client_contacts`, `collaborators`, `collaborator_rates`, `events`, `event_assignments`, `quotes`, `quote_lines`, `organizations`, `organization_users`.

### Clients Module

- **`lib/clients/queries.ts`** — `listClients(orgId)`, `getClient(orgId, clientId)`.
- **`lib/clients/actions.ts`** — `createClient`, `updateClient` (Zod-validated, redirect on success), `deleteClient` (server action with redirect).
- **`components/clients/ClientForm.tsx`** — `useActionState`-based create/edit form.
- **`app/(app)/clients/page.tsx`** — List with client type chip.
- **`app/(app)/clients/new/page.tsx`** — New client form.
- **`app/(app)/clients/[id]/page.tsx`** — Detail view with delete (owner only).
- **`app/(app)/clients/[id]/edit/page.tsx`** — Edit form.

### Collaborators Module

- **`lib/collaborators/queries.ts`** — `listCollaborators`, `getCollaborator`, `getCollaboratorRates`.
- **`lib/collaborators/actions.ts`** — `createCollaborator`, `updateCollaborator`, `deleteCollaborator`.
- **`components/collaborators/CollaboratorForm.tsx`** — Form with active/inactive Switch.
- **`app/(app)/collaborators/page.tsx`** — List with inactive chip.
- **`app/(app)/collaborators/new/page.tsx`**, **`[id]/page.tsx`** (with rates table), **`[id]/edit/page.tsx`**.

### Events Module

- **`lib/events/queries.ts`** — `listEvents` (with client join), `getEvent`, `getEventAssignments` (with collaborator join).
- **`lib/events/status.ts`** — `EVENT_STATUS_LABELS`, `EVENT_STATUS_COLOR` (MUI chip color mapping), `ALL_EVENT_STATUSES` (all 17 from blueprint).
- **`lib/events/actions.ts`** — `createEvent` (sets `created_by`), `updateEvent`, `deleteEvent`.
- **`components/events/EventForm.tsx`** — Date/time picker, status select, client select, currency select.
- **`app/(app)/events/page.tsx`** — List with status chips, date, client.
- **`app/(app)/events/new/page.tsx`**, **`[id]/page.tsx`** (with team + quotes sections), **`[id]/edit/page.tsx`**.

### Quotes Module

- **`lib/quotes/queries.ts`** — `listQuotesForEvent`, `getQuote`, `getQuoteLines`.
- **`lib/quotes/totals.ts`** — Pure `calculateQuoteTotals(lines, vatRate, discountPct, fixedDiscountNet)` implementing blueprint formulas: subtotal → discount → net after discount → VAT → total gross. Rounds to 2 decimal places.
- **`lib/quotes/actions.ts`** — `createQuote` (auto-increments version_no), `addQuoteLine`, `deleteQuoteLine`, `updateQuoteStatus` (sets `sent_at`/`accepted_at` timestamps). Auto-recalculates totals after line changes.
- **`components/quotes/AddLineForm.tsx`** — `useActionState`-based inline line entry (description, qty, price, cost).
- **`app/(app)/events/[id]/quotes/new/page.tsx`** — Creates quote and redirects to it.
- **`app/(app)/events/[id]/quotes/[quoteId]/page.tsx`** — Full quote view: line table, totals breakdown, add-line form (draft only), status transition buttons.

### Tests

- **`lib/quotes/totals.test.ts`** — 7 cases: empty lines, multi-line sum, % discount, fixed discount, combined discount, rounding, zero VAT.
- **`lib/events/status.test.ts`** — 8 cases: all statuses have labels/colors, correct color mapping for success/error/warning, all 17 statuses present.

**Result:** 42 tests pass (7 files), lint clean, build clean (28 routes), 0 audit vulns.

---

## Key Decisions

| Decision | Reason |
|---|---|
| `calculateQuoteTotals` pure function in `totals.ts` | Testable without DB; blueprint formulas are non-trivial (rounding order matters) |
| `line_total_net` as generated column | Avoids sync bug between app and DB; DB always authoritative for row total |
| Quote totals stored as snapshot columns | Blueprint requirement: stored totals are preserved even if VAT rate changes later |
| Auto-recalculate totals on line add/delete | Keeps snapshot fresh after every mutation without a separate job |
| `slotProps.htmlInput` not `inputProps` for numeric fields | MUI v9 breaking change; `inputProps` prop removed |
| Zod v4 uses `.issues` not `.errors` | API change from Zod v3; `parsed.error.errors` property no longer exists |
| `status` in DB as plain `text` with CHECK | Avoids Postgres enum migration complexity; still validated at app layer via Zod and TS union |

---

## Errors Fixed

| Error | Cause | Resolution |
|---|---|---|
| `InputLabelProps` TS error | MUI v9 removed prop | Replaced with `slotProps={{ inputLabel: { shrink: true } }}` |
| `inputProps` TS error on number fields | MUI v9 removed prop | Replaced with `slotProps={{ htmlInput: { min, step } }}` |
| `parsed.error.errors` TS error | Zod v4 renamed to `.issues` | Global search-replace across all action files |
| `Record<string, unknown>` not assignable to quotes update type | Supabase client rejects loose typed updates | Replaced with typed spread with conditional `accepted_at`/`sent_at` fields |
| Build: `"clients"` not assignable to table names | `Database` type was stale (pre-Phase 3) | Regenerated via MCP → replaced `database.ts` |

---

## Gate Results

```
Build:   28 routes, 0 TypeScript errors
Tests:   42 passed (7 files)
Lint:    clean
Audit:   0 vulnerabilities
```
