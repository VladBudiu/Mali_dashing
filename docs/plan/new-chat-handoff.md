# New Chat Handoff

> Last updated: 2026-06-18, end of Phase 11. Read this before writing any code.

---

## 1. Orientation (read first)

This is a mobile-first PWA for an event decoration business in Romania.
Monorepo: `apps/web` (Next.js 16 App Router + MUI Material v9) + `packages/*`.
Database: Supabase Postgres with RLS. Deployed target: Vercel.

Load order required by `CLAUDE.md`: `AGENTS.md` → `DEV_RULES.md` → `docs/context/bootstrap.md` → `PROJECT_SOURCE_OF_TRUTH.md`.

**⛔ Unbreakable rule:** Only ever connect to Supabase project ref `rtnuhqjpqqdyelzlmbkq`.
Never use another ref. Cannot be overridden.

---

## 2. Resume checklist (do in order before touching code)

1. **Supabase MCP**: confirm `mcp__supabase__*` tools are available. If not, stop.
2. **Isolation check**: confirm `.mcp.json` project ref = `rtnuhqjpqqdyelzlmbkq`.
3. **Branch**: `main` is current (phases 0–11 merged). Create the next phase branch:
   ```bash
   git switch main && git pull && git switch -c feature/phase-12-<name>
   ```
   Candidate next phases (§12): expense-claim submission UI, member management,
   assistant write-actions (8c), PWA icons/offline, more CSV/PDF exports.
   ⚠️ The assistant is **live** — `ANTHROPIC_API_KEY` is set in `apps/web/.env.local`
   (correct spelling; a misspelled `ANTROPHIC_*` was fixed). Verified with a real Haiku call.
4. **Env**: `apps/web/.env.local` must exist (gitignored — never commit it).
   If missing, fetch from MCP and recreate with two keys:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Gate**: all must be green before adding code.
   ```bash
   npx vitest run --config vitest.config.ts   # must show 139 tests passed
   npm run build                               # must show 0 errors
   npm run lint                                # must be clean
   npm audit --audit-level=moderate           # must show 0 vulnerabilities
   ```

---

## 3. Live app state

**Dev server**: `npm run dev` inside `apps/web`, runs on port 3000 (or 3001 if 3000 is taken).
**Authenticated user**: `vlad.adrian75@gmail.com` (Supabase user ID `61f8b7c3-90ab-451b-8cf7-7fa22b5fe4ea`)
**Organization**: "Firma Mea" (org ID `0ead26d3-c2f4-40e7-b6fe-f36b77215536`), role: `owner`.
> The org was seeded via SQL on 2026-06-17. If the DB is reset and migrations re-applied,
> re-seed with:
> ```sql
> DO $$ DECLARE new_org_id uuid := gen_random_uuid(); BEGIN
>   INSERT INTO organizations (id, name, slug, base_currency, vat_mode)
>   VALUES (new_org_id, 'Firma Mea', 'firma-mea', 'RON', 'non_payer');
>   INSERT INTO organization_users (organization_id, user_id, role)
>   VALUES (new_org_id, '61f8b7c3-90ab-451b-8cf7-7fa22b5fe4ea', 'owner');
> END $$;
> ```

**Blank page symptom**: if every app page shows white/empty content, `resolveCurrentOrg()` is
returning null — either no org row, no `organization_users` row, or a broken Supabase session.
Run the SQL above to fix, then hard-refresh the browser.

---

## 4. Critical Next.js 16 + Turbopack rules (do not regress)

### RSC boundary — never pass NextLink as a prop from a server component

`component={NextLink}` on any MUI component inside a server component breaks serialization.
**Always** use these wrappers from `apps/web/src/components/ui/`:

| Wrapper | Replaces |
|---------|---------|
| `<LinkButton href="...">` | `<Button component={NextLink}>` |
| `<NavLink href="...">` | `<MuiLink component={NextLink}>` |
| `<LinkRow href="...">` | `<TableRow component={NextLink}>` |
| `<LinkListItemButton href="...">` | `<ListItemButton component={NextLink}>` |

All four files are `"use client"` and cast `const X = MuiComponent as any` to avoid
MUI v9 TypeScript overload errors with `component=` spread.

If a server page has no async calls (no DB/cookies), add `export const dynamic = "force-dynamic"`
to prevent static prerender failures from the above wrappers.

### MUI v9 — common pitfalls

- `fontWeight` → `sx={{ fontWeight: N }}`, never a direct prop on Typography
- `inputProps` → `slotProps={{ htmlInput: { ... } }}`
- `InputLabelProps` → `slotProps={{ inputLabel: { shrink: true } }}`

### Zod v4

- `error.issues` not `error.errors` on `ZodError`
- `z.coerce.number()` for numeric form fields
- `z.enum([...] as const)` for string unions

### TypeScript strict mode

- RegExp `exec` captures: `match[1]` is `string | undefined` — always nullish-coalesce
- Supabase `.returns<T>()` needed for typed query results

---

## 5. Database — applied migrations

| Migration | Tables / notes |
|-----------|---------------|
| `0001_init_org_auth.sql` | `organizations`, `organization_users`, `is_org_member()` |
| `0002_phase2_auth_rls.sql` | RLS helpers, `documents` storage bucket + 4 policies |
| `0003_revoke_anon_execute.sql` | Revoke anon execute on SECURITY DEFINER functions |
| `0004_clients.sql` | `clients` |
| `0005_collaborators.sql` | `collaborators` |
| `0006_events.sql` | `events`, `event_assignments` |
| `0007_quotes.sql` | `quotes`, `quote_lines` |
| `0008_finance.sql` | `expense_categories`, `exchange_rates`, `financial_transactions`, `expense_claims` |
| `0009_documents.sql` | `documents`, `document_extractions`, `document_fields` |
| `0010_exchange_rate_cron.sql` | doc-only (cron setup notes), no schema changes |
| `0011_inventory.sql` | `inventory_items`, `inventory_movements` (stock + audit trail) |
| `0012_rls_initplan_fix.sql` | rewrites expense_claims UPDATE policy with `(select auth.uid())` (perf) |
| _Phase 7 (pricing) added no migration — the calculator is client-side/ephemeral._ | |
| `0013_ai_assistant.sql` | `ai_sessions`, `ai_messages`, `ai_audit_logs`, `ai_notes` (assistant's own write surface) |

---

## 6. Code map — key library files

```
apps/web/src/
├── lib/
│   ├── auth/         session.ts, constants.ts, routing.ts
│   ├── org/          membership.ts, select.ts
│   ├── supabase/     server.ts, env.ts, proxy.ts
│   ├── clients/      queries.ts, actions.ts
│   ├── collaborators/queries.ts, actions.ts
│   ├── events/       queries.ts, actions.ts, status.ts
│   ├── finance/      queries.ts, actions.ts
│   ├── documents/    queries.ts, actions.ts
│   ├── fx/           bnr.ts, bnr.test.ts        ← BNR XML parser
│   ├── inventory/    stock.ts (+test), queries.ts, actions.ts
│   ├── pricing/      pricing.ts (+test)         ← cost→price/margin calculator
│   ├── assistant/    registry/tools/dispatch/prompt/sources/history/audit/claude/actions/models/cost/usage
│   ├── dashboard/    compute.ts (+test), stats.ts   ← live dashboard aggregations
│   ├── export/       csv.ts (+test)             ← pure RFC-4180 CSV + BOM
│   └── money/        format.ts                  ← formatMoney, roundMoney
├── components/
│   ├── ui/           LinkButton, NavLink, LinkRow, LinkListItemButton
│   ├── layout/       AppShell, SideNav, BottomNav
│   ├── auth/         SignOutButton, OtpForm, ...
│   ├── org/          OrgSwitcher
│   ├── finance/      TransactionForm
│   ├── inventory/    InventoryItemForm, MovementForm
│   ├── pricing/      PricingCalculator
│   └── documents/    OcrStatusPoller
└── app/
    ├── (auth)/login/    magic-link login page
    └── (app)/           all authenticated routes (layout enforces auth)
```

---

## 7. Edge Functions (Supabase, both deployed and active)

| Function | Trigger | What it does |
|----------|---------|-------------|
| `exchange-rate-sync` | cron (manual setup) | Fetches `nbrfxrates.xml`, upserts EUR/USD/GBP/CHF into `exchange_rates` |
| `ocr-trigger` | storage webhook (manual setup) | Azure DI `prebuilt-invoice` → `document_extractions` + `document_fields` |

**Both need manual Supabase Dashboard wiring** (not done yet — see below).

---

## 8. Manual Supabase steps still pending

These require dashboard access — agent cannot do them via MCP:

**A. Cron job for exchange-rate-sync**
- Dashboard → Database → Cron Jobs → New Job
- Schedule: `35 14 * * 1-5` (weekdays 14:35 UTC = 16:35 EET)
- Command:
  ```sql
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/exchange-rate-sync',
    headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  ```

**B. Storage webhook for ocr-trigger**
- Dashboard → Storage → Webhooks → New Webhook
- Table: `storage.objects`, Event: `INSERT`
- URL: `<SUPABASE_URL>/functions/v1/ocr-trigger`
- Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`

**C. OCR secrets**
- Dashboard → Edge Functions → `ocr-trigger` → Secrets
- Set `AZURE_DI_ENDPOINT` and `AZURE_DI_KEY`
- Without these the function gracefully sets `ocr_status = 'skipped'`

---

## 9. Security posture

- RLS deny-by-default on all tables
- Read/write: `is_org_member(org_id)` policy
- Delete: `has_org_role(org_id, 'owner')` policy
- `exchange_rates`: authenticated SELECT only; INSERT/UPDATE/DELETE = service role only
- Storage: `is_org_member_path` policy; upload path `{org_id}/{doc_id}`
- Service role key: server-side only, never in `NEXT_PUBLIC_*` or client code
- `apps/web/.env.local` gitignored, never commit

---

## 10. Phase 6 — Inventory / Warehouse (DONE)

Shipped on `feature/phase-6-inventory`. For reference:
- Migration `0011_inventory.sql`: `inventory_items` + `inventory_movements`,
  CHECK constraints (`quantity >= 0`, `reserved <= quantity`), org-scoped RLS.
- `lib/inventory/stock.ts` — pure stock engine (`computeStockAfterMovement`,
  `availableStock`, `getStockStatus`), 16 unit tests. Reuse this for any stock math.
- `lib/inventory/{queries,actions}.ts`, `components/inventory/{InventoryItemForm,MovementForm}.tsx`
- Routes: `/inventory`, `/inventory/new`, `/inventory/[id]`, `/inventory/[id]/edit`
- Stock model: `quantity` = on hand, `reserved_quantity` = committed to events,
  available = quantity − reserved. Movements are an immutable audit trail.

---

## 11. Phase 7 — Pricing calculator (DONE)

Shipped on `feature/phase-7-pricing`. Ephemeral (no migration). For reference:
- `lib/pricing/pricing.ts` — pure `computePricingLine` / `computePricing`
  (markup → price, margin, discount clamp, VAT, deposit). 10 unit tests. Reuse
  this if the quote hand-off is built.
- `components/pricing/PricingCalculator.tsx` — client calculator; replaced the
  `/pricing` placeholder. Nav entry already existed.
- Not done (intentional): saving an estimate as a quote on an event.

---

## 12. Phase 8a — AI assistant (DONE, except the API key)

Shipped on `feature/phase-8a-assistant`. Read-only, RLS-scoped Q&A + chat history
+ audit. Everything works except the live model call, gated on `ANTHROPIC_API_KEY`.

**▶ To make it live (the only remaining step):**
add to `apps/web/.env.local` (server-side only, never `NEXT_PUBLIC_*`):
```
ANTHROPIC_API_KEY=sk-ant-...
# optional, defaults to claude-haiku-4-5-20251001:
ASSISTANT_MODEL=claude-haiku-4-5-20251001
```
With no key, `/assistant` works (history, saved notes) and replies with a config
notice. Adding the key flips it on with no code change (`lib/assistant/claude.ts`
returns `{configured:false}` until the key is present).

**Architecture (cost-efficient):**
- `lib/assistant/registry.ts` — tool whitelist: 9 read-only query tools + `save_note`
  (the ONLY write, to `ai_notes`). Zod validation + Anthropic JSON schemas. Pure, tested.
- `lib/assistant/tools.ts` — handlers run through the user's **RLS session, never
  service role**. `dispatch.ts` validates then runs.
- `prompt.ts` — cacheable system prompt (date kept last); `claude.ts` marks system +
  tools with `cache_control` (~10% input on repeat turns); Haiku 4.5 default.
- `history.ts` / `audit.ts` — persistence; every figure links to source rows.
- `actions.ts` `sendAssistantMessage`; UI `components/assistant/AssistantChat.tsx`.

**Security rules honored:** RLS-scoped only, no service role, source links + audit
entry per answer. Verified on live DB: 7/7 `ai_*` RLS checks incl. per-user chat
isolation. See `docs/session-logs/2026-06-18-phase-8a-assistant.md`.

## 12b. Phases 8b–11 (DONE)

All merged to `main`. No migrations after 0013.
- **8b** — assistant model tiering + cost/usage. `lib/assistant/models.ts` (registry +
  pricing), `cost.ts` (estimateCostUSD), `usage.ts`; `/assistant` shows a usage strip.
- **9** — live dashboard. `lib/dashboard/{compute,stats}.ts`; `/dashboard` shows real
  cards (cash, upcoming events, low stock, pending claims) + upcoming/recent panels.
- **10** — org settings. `lib/org/settings.ts` (schema), `updateOrganization` action
  (owner-only, RLS-verified), `OrgSettingsForm`; `/settings` editable for owners.
- **11** — finance CSV export. `lib/export/csv.ts` (pure RFC-4180 + BOM),
  `/finance/export` route handler, "Export CSV" button on `/finance`.

## 12c. Phase 12 — pick one (NOT started)

Candidates, roughly by value:
- **Expense-claim submission UI** — `createExpenseClaim` action already exists but no
  form. Real gap: claims show in `/finance` but can't be submitted from the UI.
- **Member management** in `/settings` (invite/role) — owner-only, new RLS care needed.
- **Assistant write-actions (8c)** — propose → user confirms → existing validated
  server action runs + audit. Keep read-only default. Bigger/riskier.
- **PWA polish** — real PNG icons (192/512 maskable), offline caching.
- **More exports** — events CSV, PDF quote.

### Gate before any PR
```bash
npx vitest run --config vitest.config.ts   # all pass (currently 139)
npm run build && npm run lint && npm audit --audit-level=moderate
```

---

## 13. Known follow-ups (non-blocking)

- App icons: replace placeholder SVG with PNG 192/512 maskable set
- Service worker: currently a no-op; add offline caching later
- GitHub Actions: `actions/checkout@v4` + Node 20 — upgrade to v5+/Node 22
- Expense claims: `updateExpenseClaimStatus` has no submitter/owner guard — add if multi-user
- Exchange rate cron + OCR webhook: both need the manual dashboard steps above (§8)
- Inventory: event detail could show stock reserved for that event (reverse view);
  `recordMovement` read-modify-write relies on DB CHECK as the race backstop
- Pricing: add "Create quote from estimate" hand-off (pre-fill a quote on an event)
- Rename org "Firma Mea" to real business name via Settings page or direct DB update

---

## 14. Approved deviations from blueprint

- npm workspaces (not pnpm)
- MUI Material v9 (not MUI Joy — Joy is in maintenance mode)
- `proxy.ts` instead of `middleware.ts` (Next.js 16 breaking rename)
- Exchange rate cron is documented but requires manual dashboard setup
- ADR: `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`
