# New Chat Handoff

> Last updated: 2026-06-17, end of Phase 5. Read this first to resume work directly.

## ▶ Resume checklist (do this first, in order)

1. **Confirm the Supabase MCP is loaded** this session: the `mcp__supabase__*` tools must be
   available (ToolSearch `supabase`). If they're not, stop.
2. **Verify isolation:** confirm the MCP/`.mcp.json` project ref is `rtnuhqjpqqdyelzlmbkq`. If not, HALT.
3. **Git base:** Phase 5 is on branch `feature/phase-5-exchange` (PR #5, to be opened this session).
   After PR #5 merges: `git switch main && git pull && git switch -c feature/phase-6-inventory`.
4. **Env:** `apps/web/.env.local` must exist (gitignored). If wiped, fetch URL + anon key from MCP and recreate:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Run prechecks:** `npx vitest run --config vitest.config.ts && npm run build && npm run lint && npm audit --audit-level=moderate`.
   All currently green (59 tests, lint clean, 0 vulns). Fix any gate before adding new code.

## TL;DR

Phases 0–5 are **complete and green**. Phase 5 (Exchange rates cron + OCR pipeline) is on branch
`feature/phase-5-exchange`, pushed, PR #5 open.
Phase 6 (Inventory/Warehouse management) is **ready to start**.

## Repo facts

- Remote: `https://github.com/VladBudiu/Mali_dashing.git`, default branch `main`.
- Monorepo, **npm workspaces** (NOT pnpm). Node 22.14.0, npm 11.
- Apps/packages:
  - `apps/web` — Next.js 16 App Router, MUI Material v9, `@mali/web`
  - `packages/config` (`@mali/config`), `packages/types` (`@mali/types`), `packages/utils` (`@mali/utils`)
- Ground truth: `PROJECT_SOURCE_OF_TRUTH.md`.
- Rules: `AGENTS.md` → `DEV_RULES.md` → `docs/`. Follow the load order.

## ⛔ Unbreakable rule

This project uses ONLY its own Supabase: project ref **`rtnuhqjpqqdyelzlmbkq`** (`.mcp.json`).
Never connect to any other project ref.

## How to validate (all currently green)

```bash
npx vitest run --config vitest.config.ts   # 9 files, 59 tests
npm run build                               # clean, 22 routes
npm run lint                                # clean
npm audit --audit-level=moderate           # 0 vulnerabilities
```

## What exists after Phase 5

### Key RSC boundary rules (critical — do not regress)

Next.js 16 + Turbopack forbids passing plain client functions as props from server components.
**Never write `component={NextLink}` in a server component.** Always use these wrappers from `@/components/ui/`:

- `LinkButton` — MUI Button + NextLink
- `NavLink` — MUI Link + NextLink
- `LinkRow` — MUI TableRow + NextLink
- `LinkListItemButton` — MUI ListItemButton + NextLink

All cast their MUI base with `as any` to avoid TypeScript v9 overload errors.

Pages that are sync (no async DB calls) and still use these wrappers need:
```ts
export const dynamic = "force-dynamic";
```
to prevent static prerender failures.

### Key MUI v9 rules (learned from build failures — do not regress)

- `fontWeight` must be in `sx={{ fontWeight: N }}`, not as a direct prop on Typography
- `inputProps` is removed — use `slotProps={{ htmlInput: { maxLength, min, step } }}`
- `InputLabelProps` is removed — use `slotProps={{ inputLabel: { shrink: true } }}`
- Import next/link as `NextLink` in wrapper components only; never use `component=` in server files
- `Box sx={{ display: "flex" }}` instead of `Stack` where TS inference causes issues

### Key Zod v4 rules

- `.issues` not `.errors` on `ZodError`
- `z.coerce.number()` for form numeric fields
- `z.enum([...] as const)` for string unions

### Exchange rate layer (`apps/web/src/lib/fx/`)

- `bnr.ts` — `parseBnrXml(xml)`, `findRate(result, currency)`. Pure, unit-tested.
- `ParsedRate` type: `{ currency, rate, rateDate, multiplier }`.
- BNR multiplier: `CHF multiplier="100"` means 100 CHF = rawRate RON → `rate = rawRate / 100`.

### Edge Functions (deployed, active)

- `exchange-rate-sync` — fetches BNR XML, upserts EUR/USD/GBP/CHF into `exchange_rates`. `verify_jwt: false`.
- `ocr-trigger` — storage webhook handler. Azure DI `prebuilt-invoice`. Graceful `skipped` if no secrets. `verify_jwt: false`.

### Manual Supabase Dashboard steps still needed (owner action)

1. **Cron job** for `exchange-rate-sync`:
   - Database → Cron Jobs → Schedule: `35 14 * * 1-5`
   - Command: `SELECT net.http_post(url := '<URL>/functions/v1/exchange-rate-sync', headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);`
2. **Storage Webhook** for `ocr-trigger`:
   - Storage → Webhooks → INSERT on `storage.objects` → `<URL>/functions/v1/ocr-trigger`
   - Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`
3. **Secrets** for OCR: `AZURE_DI_ENDPOINT`, `AZURE_DI_KEY` → Edge Functions → `ocr-trigger` → Secrets

### Finance layer (`apps/web/src/lib/finance/`)

- `queries.ts` — `listTransactions`, `getCashSummary`, `listExpenseCategories`, `listExpenseClaims`.
- `actions.ts` — `createTransaction`, `deleteTransaction`, `createExpenseClaim`, `updateExpenseClaimStatus`.

### Documents layer (`apps/web/src/lib/documents/`)

- `queries.ts` — `listDocuments`, `getDocument`, `getDocumentExtractions`, `getDocumentFields`.
- `actions.ts` — `uploadDocument`, `deleteDocument`, `updateDocumentType`.

### Database migrations applied

| File | Tables |
|------|--------|
| `0001_init_org_auth.sql` | `organizations`, `organization_users`, `is_org_member()` |
| `0002_phase2_auth_rls.sql` | RLS helpers, storage bucket `documents` + 4 policies |
| `0003_revoke_anon_execute.sql` | Revoke anon execute on SECURITY DEFINER functions |
| `0004_clients.sql` | `clients` |
| `0005_collaborators.sql` | `collaborators` |
| `0006_events.sql` | `events`, `event_assignments` |
| `0007_quotes.sql` | `quotes`, `quote_lines` |
| `0008_finance.sql` | `expense_categories`, `exchange_rates`, `financial_transactions`, `expense_claims` |
| `0009_documents.sql` | `documents`, `document_extractions`, `document_fields` |
| `0010_exchange_rate_cron.sql` | doc-only (cron setup instructions), `select 1;` |

### Routes live

```
/clients          /clients/[id]
/collaborators    /collaborators/[id]
/events           /events/[id]
/finance          /finance/new
/documents        /documents/upload    /documents/[id]
/dashboard        /settings
```

### Security posture

- Deny-by-default RLS on all tables; `is_org_member` for read/write, `has_org_role('owner')` for delete
- `exchange_rates`: authenticated SELECT only — INSERT/UPDATE/DELETE service role only
- Storage: `is_org_member_path` policy; upload path `{org_id}/{doc_id}`
- Service role key: server-side only, never in NEXT_PUBLIC_* or client code
- `apps/web/.env.local` gitignored, must never be committed

## Phase 6 task breakdown — Inventory / Warehouse

Branch: `feature/phase-6-inventory`

### 6.1 — Migration: `inventory_items` + `inventory_movements`

```sql
-- inventory_items: track decoration stock (name, sku, category, unit, qty_available, qty_reserved, reorder_threshold, cost_per_unit)
-- inventory_movements: track stock in/out per event (item_id, event_id?, movement_type: 'in'|'out'|'reserve'|'release', qty, note)
-- RLS: is_org_member for read/write; has_org_role('owner') for delete
-- Constraint: qty_available >= 0 (CHECK or trigger to prevent negative stock)
```

### 6.2 — Inventory library (`apps/web/src/lib/inventory/`)

- `queries.ts` — `listInventoryItems`, `getInventoryItem`, `listMovements(itemId)`, `getStockSummary`
- `actions.ts` — `createInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`, `recordMovement`
- `server-only` guard on all query/action files

### 6.3 — Pages

```
/inventory               — list with low-stock highlights
/inventory/new           — create item form
/inventory/[id]          — detail: metadata + movement history
/inventory/[id]/edit     — edit item
```

### 6.4 — Event integration (optional, if time allows)

- On `events/[id]` page: show reserved inventory items for that event
- `reserve` / `release` actions on event detail page

### Gates before Phase 6 PR

```bash
npx vitest run --config vitest.config.ts   # all pass
npm run build                               # no TS errors
npm run lint                                # clean
npm audit --audit-level=moderate           # 0 vulns
```

## Known follow-ups (non-blocking)

- Replace placeholder SVG app icons with proper PNG set (192/512, maskable) before production PWA install
- Service worker is a no-op; add offline caching in a later phase
- GitHub Actions uses `actions/checkout@v4` + Node 20 — upgrade to v5+/Node 22 (non-blocking)
- Expense claim `updateExpenseClaimStatus` doesn't enforce submitter/owner gating — add if multi-user priority
- Exchange rate cron + OCR webhook both require manual Supabase Dashboard setup (see above)

## Deviations from blueprint (approved, recorded)

- npm workspaces instead of pnpm
- MUI Material v9 instead of MUI Joy (SSR via hand-rolled Emotion cache registry)
- Next 16 `proxy.ts` instead of `middleware.ts` (breaking rename in Next 16)
- Exchange rate cron documented but not auto-provisioned (Dashboard step required)
- See `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`
