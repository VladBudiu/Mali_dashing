# New Chat Handoff

> Last updated: 2026-06-17, end of Phase 4. Read this first to resume work directly.

## ▶ Resume checklist (do this first, in order)

1. **Confirm the Supabase MCP is loaded** this session: the `mcp__supabase__*` tools must be
   available (ToolSearch `supabase`). If they're not, stop.
2. **Verify isolation:** confirm the MCP/`.mcp.json` project ref is `rtnuhqjpqqdyelzlmbkq`. If not, HALT.
3. **Git base:** Phase 4 is on branch `feature/phase-4-finance` (PR #4, open).
   Merge PR #4 to `main` first, then `git switch main && git pull && git switch -c feature/phase-5-exchange`.
4. **Env:** `apps/web/.env.local` must exist (gitignored). If wiped, fetch URL + anon key from MCP and recreate:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Run prechecks:** `npm run build && npm run test && npm run lint && npm audit --audit-level=moderate`.
   All currently green (52 tests, lint clean, 0 vulns). Fix any gate before adding new code.

## TL;DR

Phases 0–4 are **complete and green**. Phase 4 (Finance + Documents) is on branch
`feature/phase-4-finance`, pushed, in **PR #4** (to be opened).
Phase 5 (Exchange rates cron + OCR pipeline) is **ready to start**.

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
npm install
npm run build
npm run test     # 52 passing (8 files)
npm run lint     # clean
npm audit --audit-level=moderate   # 0 vulnerabilities
```

## What exists after Phase 4

### Key MUI v9 rules (learned from build failures — do not regress)

- `fontWeight` must be in `sx={{ fontWeight: N }}`, not as a direct prop on Typography
- `inputProps` is removed — use `slotProps={{ htmlInput: { maxLength, min, step } }}`
- `InputLabelProps` is removed — use `slotProps={{ inputLabel: { shrink: true } }}`
- Import next/link as `NextLink`, MUI Link as `MuiLink`; use `component={NextLink}` on MUI components
- `Box sx={{ display: "flex" }}` instead of `Stack` where TS inference causes issues

### Key Zod v4 rules

- `.issues` not `.errors` on `ZodError`
- `z.coerce.number()` for form numeric fields
- `z.enum([...] as const)` for string unions

### Finance layer (`apps/web/src/lib/finance/`)

- `queries.ts` — `listTransactions` (with `expense_categories` + `events` join), `getCashSummary`, `listExpenseCategories`, `listExpenseClaims`. `server-only` guard.
- `actions.ts` — `createTransaction`, `deleteTransaction`, `createExpenseClaim`, `updateExpenseClaimStatus`.

### Documents layer (`apps/web/src/lib/documents/`)

- `queries.ts` — `listDocuments`, `getDocument`, `getDocumentExtractions`, `getDocumentFields`. `server-only` guard.
- `actions.ts` — `uploadDocument` (crypto.randomUUID pre-gen, storage upload, DB insert, cleanup on fail), `deleteDocument`, `updateDocumentType`.

### Money utils (`apps/web/src/lib/money/format.ts`)

- `formatMoney(amount, currency?)` — Romanian locale (`ro-RO`), defaults to RON
- `roundMoney(value)` — `Math.round(value * 100) / 100`

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
- `exchange_rates`: authenticated SELECT only — INSERT/UPDATE/DELETE reserved for service role
- `expense_claims.submitted_by` ON DELETE RESTRICT (no orphaned claims)
- Storage: `is_org_member_path` policy; upload path `{org_id}/{doc_id}`
- Service role key: server-side only, never in NEXT_PUBLIC_* or client code
- `apps/web/.env.local` gitignored, must never be committed

## Phase 5 task breakdown — Exchange rates + OCR pipeline

Branch: `feature/phase-5-exchange`

### 5.1 — Exchange rate cron (Supabase Edge Function)

- Edge Function `exchange-rate-sync`: calls BNR RSS (`https://www.bnr.ro/nbrfxrates.xml`) or ECB API
- Parses XML, upserts `exchange_rates` with service role key
- Schedule via `pg_cron` or Supabase Dashboard cron job — daily at ~09:00 EET
- Update `financial_transactions` to auto-compute `amount_ron` when exchange rate is available
- Test: mock fetch, verify upsert logic

### 5.2 — OCR pipeline (Azure Document Intelligence)

- Edge Function `ocr-trigger`: triggered by storage insert event on `documents` bucket
- Updates `documents.ocr_status = 'processing'`
- Calls Azure Document Intelligence prebuilt-read or prebuilt-invoice model
- Inserts `document_extractions` + `document_fields` rows
- Updates `documents.ocr_status = 'done'` (or `'failed'` on error)
- Environment secrets: `AZURE_DI_ENDPOINT`, `AZURE_DI_KEY`

### 5.3 — OCR status polling UI

- `/documents/[id]` already shows extraction fields — add auto-refresh when `ocr_status === 'processing'`
- Use React `useEffect` + polling (or Supabase realtime subscription) to refresh every 5s until done/failed
- Show extraction confidence scores from `document_fields.confidence`

### Gates before Phase 5 PR

```bash
npm run build   # no TS errors
npm run test    # all pass
npm run lint    # clean
npm audit --audit-level=moderate   # 0 vulns
```

## Known follow-ups (non-blocking)

- Replace placeholder SVG app icons with proper PNG set (192/512, maskable) before production PWA install
- Service worker is a no-op; add offline caching in a later phase
- GitHub Actions uses `actions/checkout@v4` + Node 20 — upgrade to v5+/Node 22 (non-blocking)
- Expense claim `updateExpenseClaimStatus` currently doesn't enforce that only the submitter or owner can update — add that check if multi-user orgs become a priority
- `exchange_rates` INSERT/UPDATE/DELETE currently blocked for all non-service-role callers — Phase 5 cron will handle population

## Deviations from blueprint (approved, recorded)

- npm workspaces instead of pnpm
- MUI Material v9 instead of MUI Joy (SSR via hand-rolled Emotion cache registry)
- Next 16 `proxy.ts` instead of `middleware.ts` (breaking rename in Next 16)
- Exchange rate fetch deferred to Phase 5 (Phase 4 has manual rate input on transaction form)
- See `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`
