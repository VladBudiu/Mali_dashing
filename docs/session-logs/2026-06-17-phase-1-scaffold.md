# 2026-06-17 - Phase 1 Scaffold + Design System

## Changes

Established the monorepo and application scaffold per `PROJECT_SOURCE_OF_TRUTH.md`.

**Workspace / tooling**
- Root `package.json` as an npm workspace (`apps/*`, `packages/*`) with delegating scripts.
- `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`) extended by all workspaces.
- Root `vitest.config.ts` with `@`, `@mali/*`, and `server-only` aliases; node environment.
- `postcss` override (`^8.5.15`) to resolve the nested-Next advisory (matches business1).
- `.gitignore` updated for monorepo (de-anchored `node_modules/`, `.next/`, etc.).

**Shared packages**
- `@mali/config` — non-secret app constants (currencies, locale, rounding decimals).
- `@mali/types` — domain unions (UserRole, EventStatus, PricingMode, …) + Database placeholder.
- `@mali/utils` — pure helpers (`assertNever`, `isDefined`, `clamp`) with unit tests.

**apps/web (Next.js 16 App Router)**
- MUI Material + hand-rolled Emotion SSR cache registry (`useServerInsertedHTML`), `ThemeRegistry`, mobile-first theme.
- Responsive app shell: permanent `SideNav` (desktop) + fixed `BottomNav` (mobile) + top app bar.
- Routes (empty, server-safe): `/login`, `/dashboard`, `/events`, `/events/[id]`, `/clients`, `/finance`, `/documents`, `/inventory`, `/collaborators`, `/pricing`, `/assistant`, `/settings`; `/` redirects to `/dashboard`.
- Reusable UI: `PageHeader`, `EmptyState`, `StatCard`, `PlaceholderPage`.
- PWA: `app/manifest.ts`, `app/icon.svg` + `public/icon.svg`, placeholder `public/sw.js`, `ServiceWorkerRegister`.
- Supabase client layer: `lib/supabase/env.ts` (Zod, safe-when-unconfigured), `server.ts` (anon + RLS, never service role), `client.ts`.
- Smoke route `GET /api/health` with test.
- Security headers + sw.js cache headers in `next.config.ts`.

**Database**
- `supabase/migrations/0001_init_org_auth.sql` — `organizations` + `organization_users` bridge, `set_updated_at` trigger, `is_org_member()` SECURITY DEFINER helper, RLS enabled with baseline read policies. Not yet applied to the live DB (Phase 2).

**Docs**
- ADR `2026-06-17-monorepo-and-mui-material.md` documents the two deviations.
- `PROJECT_SOURCE_OF_TRUTH.md` updated: MUI Material (not Joy), npm workspaces (not pnpm), DB isolation note.

## Errors Encountered

- Error: `next build` type error — MUI v9 `Typography` rejects `fontWeight` as a direct prop.
  Cause: this MUI version's Typography typing excludes system shorthand props at top level.
  Resolution: moved all `fontWeight={n}` into `sx={{ fontWeight: n }}` across 6 components.
- Error: `npm audit` flagged moderate postcss advisory nested under `next`.
  Cause: override not applied against a stale lockfile/node_modules.
  Resolution: added root `overrides.postcss`, then clean reinstall (removed lockfile + node_modules). Now 0 vulnerabilities.

## Issues Found

- App icons are placeholder SVGs. Proper PNG icon set (192/512, maskable) is a follow-up before production PWA install.
- Service worker is a no-op placeholder; offline caching strategy is deferred.

## Feature Status

- monorepo-workspace: complete
- design-system-shell: complete (mobile-first nav, theme, base components)
- pwa-wiring: partial (manifest + SW registration done; real icons + offline caching pending)
- supabase-client-layer: complete (scaffold; no live credentials wired)
- initial-migration: partial (SQL written; not applied to live DB — Phase 2)
- ci-pipeline: complete (build, test, lint, audit all green locally)

## Validation

- `npm run test` → 13 passed (3 files)
- `npm run lint` → clean
- `npm run build` → success, 16 routes generated
- `npm audit --audit-level=moderate` → 0 vulnerabilities
- `.confidential/credentials.md` confirmed gitignored; no secrets staged
