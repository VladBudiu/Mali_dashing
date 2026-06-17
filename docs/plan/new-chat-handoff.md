# New Chat Handoff

> Last updated: 2026-06-18, end of Phase 6. Read this before writing any code.

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
3. **Branch**: `main` is current. Create `feature/phase-7-pricing` before starting work.
   ```bash
   git switch main && git pull && git switch -c feature/phase-7-pricing
   ```
   (Phase 6 `feature/phase-6-inventory` is in PR — merge it first if still open.)
4. **Env**: `apps/web/.env.local` must exist (gitignored — never commit it).
   If missing, fetch from MCP and recreate with two keys:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Gate**: all must be green before adding code.
   ```bash
   npx vitest run --config vitest.config.ts   # must show 78 tests passed
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
│   └── money/        format.ts                  ← formatMoney, roundMoney
├── components/
│   ├── ui/           LinkButton, NavLink, LinkRow, LinkListItemButton
│   ├── layout/       AppShell, SideNav, BottomNav
│   ├── auth/         SignOutButton, OtpForm, ...
│   ├── org/          OrgSwitcher
│   ├── finance/      TransactionForm
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

## 11. Phase 7 — Pricing calculator (NEXT)

Branch to create: `feature/phase-7-pricing`. Placeholder route `/pricing` already
exists (`PlaceholderPage`) and a nav entry is present. Build on the existing
quote engine — do NOT duplicate money math; reuse `lib/quotes/totals.ts`
(`calculateQuoteTotals`) and `lib/money/format.ts`.

Goal: a standalone pricing/margin calculator so the owner can build a costed
estimate (cost lines + markup → sell price, margin, deposit) before turning it
into a real quote on an event.

### 11.1 Decide: DB-backed vs. ephemeral
Two viable scopes — pick based on whether saved templates are wanted:
- **Ephemeral (smaller):** a client-side calculator page, no migration. Computes
  margin/markup/deposit live. Optional "Create quote from this" hand-off.
- **DB-backed (larger):** migration `0012_pricing_templates.sql` with
  `pricing_templates` + `pricing_template_lines` (org-scoped, same RLS pattern as
  events/quotes) so reusable price lists persist.
Recommend starting **ephemeral** unless the user asks to save templates.

### 11.2 Pure logic (`apps/web/src/lib/pricing/`)
- `pricing.ts` — `computeLine({ cost, markupPct })`, `computeMargin({ cost, price })`,
  roll-up totals, deposit (% of gross). Keep it pure and **unit-test it** (this is
  the testable core — mirror `stock.ts` / `totals.ts` style).
- Reuse `roundMoney` from `lib/money/format.ts`; never re-implement rounding.

### 11.3 UI
- Replace `/pricing` placeholder with the calculator (client component with line
  rows, markup, VAT, deposit; live totals).
- Optional: "Create quote" that pre-fills a new quote on a chosen event.

### 11.4 Gate before PR
```bash
npx vitest run --config vitest.config.ts   # all pass (currently 78)
npm run build                               # no TS errors
npm run lint                                # clean
npm audit --audit-level=moderate           # 0 vulns
```

> Phase 8 after this is the **AI assistant** (`/assistant` placeholder exists):
> permission-aware, RLS-scoped Q&A (never service key), answers with totals must
> link to source rows + audit entry. See `PROJECT_SOURCE_OF_TRUTH.md` §"AI assistant".

---

## 12. Known follow-ups (non-blocking)

- App icons: replace placeholder SVG with PNG 192/512 maskable set
- Service worker: currently a no-op; add offline caching later
- GitHub Actions: `actions/checkout@v4` + Node 20 — upgrade to v5+/Node 22
- Expense claims: `updateExpenseClaimStatus` has no submitter/owner guard — add if multi-user
- Exchange rate cron + OCR webhook: both need the manual dashboard steps above (§8)
- Inventory: event detail could show stock reserved for that event (reverse view);
  `recordMovement` read-modify-write relies on DB CHECK as the race backstop
- Rename org "Firma Mea" to real business name via Settings page or direct DB update

---

## 13. Approved deviations from blueprint

- npm workspaces (not pnpm)
- MUI Material v9 (not MUI Joy — Joy is in maintenance mode)
- `proxy.ts` instead of `middleware.ts` (Next.js 16 breaking rename)
- Exchange rate cron is documented but requires manual dashboard setup
- ADR: `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`
