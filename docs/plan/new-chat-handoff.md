# New Chat Handoff

> Last updated: 2026-06-17, end of Phase 1. Read this first to resume work directly.

## TL;DR

Phase 0 (governance) and Phase 1 (scaffold + design system) are **complete and green**.
Phase 1 is on branch `feature/phase-1-scaffold`, pushed, in **PR #1**
(https://github.com/VladBudiu/Mali_dashing/pull/1). Phase 2 (auth + tenant + RLS) is
**blocked on credentials** — see "What Phase 2 needs" below.

## Repo facts

- Remote: `https://github.com/VladBudiu/Mali_dashing.git`, default branch `main`.
- Monorepo, **npm workspaces** (NOT pnpm). Node 22.14.0, npm 11.
- Apps/packages:
  - `apps/web` — Next.js 16 App Router, MUI Material, `@mali/web`
  - `packages/config` (`@mali/config`), `packages/types` (`@mali/types`), `packages/utils` (`@mali/utils`)
- Ground truth: `PROJECT_SOURCE_OF_TRUTH.md` (has an updated implementation note at the top).
- Rules: `AGENTS.md` → `DEV_RULES.md` → `docs/`. Follow the load order.

## ⛔ Unbreakable rule

This project uses ONLY its own Supabase: project ref **`rtnuhqjpqqdyelzlmbkq`** (`.mcp.json`).
Never connect to business1's DB or any other project ref.

## How to validate (all currently green)

```bash
npm install
npm run build    # 16 routes
npm run test     # 13 passing
npm run lint     # clean
npm audit --audit-level=moderate   # 0 vulnerabilities
npm run dev      # then open http://localhost:3000 -> redirects to /dashboard
```

## What exists after Phase 1

- App shell: `apps/web/src/components/layout/` (AppShell, SideNav desktop, BottomNav mobile).
- Routes (all server-safe placeholders): `/login`, `/dashboard`, `/events`, `/events/[id]`,
  `/clients`, `/finance`, `/documents`, `/inventory`, `/collaborators`, `/pricing`,
  `/assistant`, `/settings`. `/` redirects to `/dashboard`.
- Theme + Emotion SSR registry: `apps/web/src/theme/`.
- Supabase client layer: `apps/web/src/lib/supabase/` — `env.ts` (Zod, safe when unconfigured),
  `server.ts` (anon + RLS, NEVER service role), `client.ts`.
- PWA: `app/manifest.ts`, `app/icon.svg`, `public/icon.svg`, placeholder `public/sw.js`,
  `ServiceWorkerRegister`.
- Smoke API: `GET /api/health` (+ test).
- DB migration (written, NOT yet applied): `supabase/migrations/0001_init_org_auth.sql`
  — `organizations`, `organization_users`, `set_updated_at` trigger, `is_org_member()`
  SECURITY DEFINER helper, RLS enabled + baseline read policies.

## What Phase 2 needs (the blocker)

Phase 2 = auth + tenant model + RLS. It cannot be done or verified without:

1. **Supabase env vars** in `apps/web/.env.local` (and Vercel later):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only jobs; never client)
   These live in the Supabase dashboard for project `rtnuhqjpqqdyelzlmbkq`.
   Put real values only in `.env.local` (gitignored) or `.confidential/credentials.md`.
2. **Live DB access to apply migrations + run RLS integration tests.** Either:
   - the Supabase MCP tools (`mcp__supabase__*`) actually connected in the session
     (they were configured in `.mcp.json` but were NOT loaded in the Phase 1 session), or
   - a direct `SUPABASE_DB_URL` connection string, or
   - Docker Desktop + Supabase CLI for a local stack (`npx supabase db reset --local`).

Until one of those is available, Phase 2 auth/RLS work can be written but not verified, so it should not be merged.

## Phase 2 task breakdown (once unblocked)

1. Apply `0001_init_org_auth.sql` to the live DB; verify project ref first.
2. Auth flow (Supabase Auth, magic link/OTP per blueprint):
   - sign-in server action + `/login` form (client) + `/auth/callback` route handler
   - `proxy.ts`/middleware for session refresh + route protection (redirect unauthenticated to `/login`)
   - sign-out action
3. Tenant model: current-org resolution from `organization_users`, org switcher in Settings.
4. RLS migration `0002`: write policies per role (owner/partner/collaborator/accountant/client),
   Storage bucket + deny-by-default policies.
5. Tests: RLS per role/tenant (needs live or local DB), unauthorized-access denied,
   storage deny-by-default. Auth route unit tests with mocked Supabase.
6. Generate `Database` type (`supabase gen types typescript`) and replace the placeholder in
   `packages/types/src/database.ts`.
7. Session log + ADR if architecture-significant; open PR from a `feature/phase-2-auth` branch.

## Known follow-ups (non-blocking)

- Replace placeholder SVG app icons with a proper PNG set (192/512, maskable) before production PWA install.
- Service worker is a no-op; add offline caching strategy in a later phase.
- PR #1 should be reviewed/merged to `main` before or alongside Phase 2 (CI runs build/test/lint/audit).

## Deviations from blueprint (approved, recorded)

- npm workspaces instead of pnpm.
- MUI Material instead of MUI Joy (SSR via hand-rolled Emotion cache registry).
- See `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`.
