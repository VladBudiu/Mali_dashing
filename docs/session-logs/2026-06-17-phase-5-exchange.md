# Session log — Phase 5: Exchange rates + OCR pipeline

Date: 2026-06-17  
Branch: `feature/phase-5-exchange`  
Gates: build ✓ · 59/59 tests ✓ · lint ✓ · 0 vulns ✓

## What was done

### RSC boundary fix (carried over from Phase 4 CI failures)

Next.js 16 + Turbopack disallows passing plain functions (like `next/link`) across
the RSC boundary as props. The pattern `component={NextLink}` on MUI components
breaks at static prerender time or at runtime on dynamic pages.

Created four `"use client"` wrapper components in `apps/web/src/components/ui/`:

- `LinkButton.tsx` — wraps `MUI Button` + `NextLink`
- `NavLink.tsx` — wraps `MUI Link` + `NextLink`
- `LinkRow.tsx` — wraps `MUI TableRow` + `NextLink`
- `LinkListItemButton.tsx` — wraps `MUI ListItemButton` + `NextLink`

All use `const X = MuiComponent as any` to bypass MUI v9 polymorphic TypeScript
overload resolution issues with `component=` spread.

Updated 12 server-component pages to use these wrappers, eliminating all
`component={NextLink}` direct usages from server files.

### Phase 5.1 — BNR exchange rate parser + Edge Function

**`apps/web/src/lib/fx/bnr.ts`** — pure TypeScript BNR XML parser:
- Extracts `PublishingDate` from `<Header>` block
- Parses `<Rate currency="X" multiplier="N">value</Rate>` with optional multiplier
- CHF and BGN use `multiplier="100"` (100 units = rate RON); divide rawRate/multiplier
- Exported: `parseBnrXml(xml)`, `findRate(result, currency)`

**`apps/web/src/lib/fx/bnr.test.ts`** — 7 test cases covering:
- Round-trip parse of realistic XML snippet
- Multiplier handling (CHF × 100)
- Missing/empty cases (`findRate` returns undefined)
- Date extraction

**`supabase/functions/exchange-rate-sync/index.ts`** — Deno Edge Function:
- Fetches `https://www.bnr.ro/nbrfxrates.xml`
- Parses EUR, USD, GBP, CHF rates
- Upserts into `exchange_rates` (conflict: `source,rate_date,base_currency,quote_currency`)
- `verify_jwt: false` (invoked by cron, not a user browser)
- Deployed and active (version 1) via Supabase MCP

**`supabase/migrations/0010_exchange_rate_cron.sql`** — documentation migration:
- No schema changes; `select 1;` placeholder
- Documents cron setup via Supabase Dashboard (BNR weekday 14:35 UTC schedule)
- Documents OCR webhook setup steps

### Phase 5.2 — OCR pipeline Edge Function

**`supabase/functions/ocr-trigger/index.ts`** — Deno Edge Function:
- Triggered by Storage webhook (INSERT on `storage.objects`)
- Extracts `documentId` from `{org_id}/{doc_id}` path
- Guards: checks `ocr_status === 'pending'`, sets `processing`
- Graceful degradation: if `AZURE_DI_ENDPOINT`/`AZURE_DI_KEY` missing → sets `skipped`
- Downloads file from Supabase Storage, submits to Azure DI `prebuilt-invoice`
- Polls `Operation-Location` (max 30 × 2s)
- Inserts `document_extractions` + `document_fields` rows
- Sets `ocr_status = 'done'` or `'failed'`
- `verify_jwt: false` (webhook-invoked)
- Deployed and active (version 1) via Supabase MCP

### Phase 5.3 — OCR status polling UI

**`apps/web/src/components/documents/OcrStatusPoller.tsx`** — `"use client"` component:
- Uses `setInterval` + `router.refresh()` every 5s (configurable)
- Returns `null` (no visible markup)
- Mounted in `documents/[id]/page.tsx` when `ocr_status === 'processing'`

**`apps/web/src/app/(app)/documents/[id]/page.tsx`** updated:
- Shows `OcrStatusPoller` when processing
- Shows queue message when pending
- All `MuiLink component={Link}` → `NavLink` (RSC fix)

## Bugs fixed

| Bug | Fix |
|-----|-----|
| `match[1]` possibly undefined (bnr.ts L28) | `match[1] ?? ""` + guard `if (currency && ...)` |
| `match[3]` possibly undefined (bnr.ts L30) | `(match[3] ?? "0").replace(...)` |
| `dateMatch[1]` possibly undefined (bnr.ts L21) | `dateMatch?.[1]?.trim() ?? ""` |
| OcrStatusPoller unused `documentId` prop | Removed prop entirely |
| 12 server pages with `component={NextLink}` | Replaced with wrapper components |
| JSX closing tag mismatch after ListItemButton rename | Fixed all three list pages |
| `finance/page.tsx` unused `Button`/`LinkRow` imports | Removed |
| `finance/new` static prerender failing on `NavLink` | `export const dynamic = "force-dynamic"` |
| `quotes/[quoteId]/page.tsx` missing `NavLink` import | Added import |
| MUI v9 TS overload error with `component=` spread | `as any` cast on MUI component |

## Gate results

```
build:  next build — all 22 routes built (ƒ dynamic), 0 errors
tsc:    npx tsc --noEmit — clean
tests:  vitest — 9 files, 59 tests passed
lint:   eslint — clean
audit:  npm audit — 0 vulnerabilities
```

## What's needed in Supabase Dashboard (not automated)

1. **Cron job** for `exchange-rate-sync`:
   - Database → Cron Jobs → New Job
   - Schedule: `35 14 * * 1-5` (weekdays 14:35 UTC)
   - Command: `SELECT net.http_post(url := '<URL>/functions/v1/exchange-rate-sync', headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb);`

2. **Storage Webhook** for `ocr-trigger`:
   - Storage → Policies → Webhooks → New Webhook
   - Table: `storage.objects`, Event: `INSERT`
   - URL: `<SUPABASE_URL>/functions/v1/ocr-trigger`
   - Header: `Authorization: Bearer <SERVICE_ROLE_KEY>`

3. **Edge Function secrets** for OCR:
   - Edge Functions → `ocr-trigger` → Secrets
   - `AZURE_DI_ENDPOINT`, `AZURE_DI_KEY`
   - Without these, OCR gracefully degrades to `ocr_status = 'skipped'`
