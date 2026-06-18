# Session log — Phase 11: finance CSV export

Date: 2026-06-18
Branch: `feature/phase-11-export`
Gates: build ✓ · 139/139 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓

## Scope
Download the org's transactions as CSV (accounting). No migration.

## What shipped
- `lib/export/csv.ts` — pure RFC-4180 serializer: `toCsv(rows, columns)` with
  correct quoting (commas, quotes, newlines, null→empty), and `toCsvFile` which
  prepends a UTF-8 BOM so Excel renders Romanian diacritics. **5 tests**.
- `app/(app)/finance/export/route.ts` — GET route handler: RLS-scoped
  `listTransactions` → CSV with `Content-Disposition: attachment`. 401 if no org.
- `/finance` — "Export CSV" button (plain `<a>`, shown when there are transactions).

## Notes
- Export goes through the user's RLS session — only their org's rows.
- The button is a real anchor (not NextLink) so the browser handles the download.

## Gate results
```
typecheck clean · lint clean · vitest 19 files / 139 passed (+5) · build clean · 0 vulns
```
