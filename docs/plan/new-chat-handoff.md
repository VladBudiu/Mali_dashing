# New Chat Handoff

> Last updated: 2026-06-17, end of Phase 2. Read this first to resume work directly.

## ▶ Resume checklist (do this first, in order)

1. **Confirm the Supabase MCP is loaded** this session: the `mcp__supabase__*` tools must be
   available (ToolSearch `supabase`). If they're not, stop — the session still can't reach the DB.
2. **Verify isolation:** confirm the MCP/`.mcp.json` project ref is `rtnuhqjpqqdyelzlmbkq`. If not, HALT.
3. **Git base:** Phase 2 is on branch `feature/phase-2-auth` (PR #2, open).
   Merge PR #2 to `main` first, then `git switch main && git pull && git switch -c feature/phase-3-business`.
4. **Env:** `apps/web/.env.local` must exist (gitignored). If it was wiped, fetch URL + anon key
   from the MCP and recreate it — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Run prechecks:** `npm run build && npm run test && npm run lint && npm audit --audit-level=moderate`.
   All currently green (27 tests, lint clean, 0 vulns). Fix any gate before adding new code.

## TL;DR

Phase 0 (governance), Phase 1 (scaffold), and Phase 2 (auth + tenant + RLS) are **complete and green**.
Phase 2 is on branch `feature/phase-2-auth`, pushed, in **PR #2**
(https://github.com/VladBudiu/Mali_dashing/pull/2).
Phase 3 (business core) is **ready to start** — no blockers.

## Repo facts

- Remote: `https://github.com/VladBudiu/Mali_dashing.git`, default branch `main`.
- Monorepo, **npm workspaces** (NOT pnpm). Node 22.14.0, npm 11.
- Apps/packages:
  - `apps/web` — Next.js 16 App Router, MUI Material v9, `@mali/web`
  - `packages/config` (`@mali/config`), `packages/types` (`@mali/types`), `packages/utils` (`@mali/utils`)
- Ground truth: `PROJECT_SOURCE_OF_TRUTH.md` (has an updated implementation note at the top).
- Rules: `AGENTS.md` → `DEV_RULES.md` → `docs/`. Follow the load order.

## ⛔ Unbreakable rule

This project uses ONLY its own Supabase: project ref **`rtnuhqjpqqdyelzlmbkq`** (`.mcp.json`).
Never connect to any other project ref.

## How to validate (all currently green)

```bash
npm install
npm run build
npm run test     # 27 passing (5 files)
npm run lint     # clean
npm audit --audit-level=moderate   # 0 vulnerabilities
```

## What exists after Phase 2

### Auth layer (`apps/web/src/`)

- `proxy.ts` — Next 16 route guard (replaces middleware.ts). Unauthenticated → `/login?redirectTo=...`. Authenticated on `/login` → `/dashboard`. Static asset matcher.
- `lib/auth/constants.ts` — Route constants: LOGIN_PATH, DEFAULT_AUTHENTICATED_PATH, AUTH_CALLBACK_PATH, etc.
- `lib/auth/routing.ts` — Pure: `isPublicPath(pathname)`, `safeRedirectPath(value)` (open-redirect protection).
- `lib/auth/session.ts` — `getCurrentUser()` (server, always `getUser()` not `getSession()`).
- `lib/auth/actions.ts` — Server actions: `signInWithEmail` (Zod OTP), `signOut`.
- `lib/supabase/proxy.ts` — `updateSession()` for cookie refresh via `@supabase/ssr`.
- `app/auth/callback/route.ts` — Magic-link landing; exchanges code, safe-redirects.
- `components/auth/LoginForm.tsx` — `useActionState`-based OTP form.
- `components/auth/SignOutButton.tsx` — Progressive-enhancement sign-out.

### Org / tenant layer

- `lib/org/select.ts` — Pure: `selectActiveOrg(memberships, preferredOrgId)`.
- `lib/org/membership.ts` — `listUserOrganizations()`, `resolveCurrentOrg()`.
- `lib/org/actions.ts` — `setCurrentOrg` (httpOnly cookie, 1yr, revalidates layout).
- `components/org/OrgSwitcher.tsx` — Single-org label or multi-org Select.

### Updated pages / layout

- `app/(app)/layout.tsx` — Auth gate: redirects to `/login` if no user. Passes `userEmail` + `orgName` to AppShell.
- `app/(app)/settings/page.tsx` — Account section (email + sign-out) + Organization section (OrgSwitcher).
- `app/(auth)/login/page.tsx` — Awaits `searchParams` (Next 16), shows error/redirectTo to LoginForm.
- `components/layout/AppShell.tsx` — Toolbar: org Chip, email, SignOutButton. Uses `Box` not `Stack` (MUI v9 TS fix).

### Database / migrations

- `supabase/migrations/0001_init_org_auth.sql` — Applied. `organizations`, `organization_users`, `is_org_member()` SECURITY DEFINER, baseline RLS.
- `supabase/migrations/0002_phase2_auth_rls.sql` — Applied. `has_org_role`, `is_org_member_path` helpers; owner policies; private `documents` storage bucket; 4 storage object policies.
- `supabase/migrations/0003_revoke_anon_execute.sql` — Applied. Explicit `anon` execute revoke on all SECURITY DEFINER functions.
- `packages/types/src/database.ts` — Full generated `Database` type from live schema.

### Tests

- `lib/auth/routing.test.ts` — `isPublicPath`, `safeRedirectPath` (open-redirect vectors).
- `lib/org/select.test.ts` — `selectActiveOrg` (empty, preferred, fallback, not-a-member).

### Security posture

- Deny-by-default on all app routes (proxy gate)
- RLS deny-by-default on `organizations`, `organization_users`, storage
- `anon` execute revoked on all SECURITY DEFINER helpers
- Open-redirect blocked (double-slash, backslash, external, no-slash)
- httpOnly org cookie; magic-link only (no password surface)
- 3 Supabase security advisor warnings accepted as intentional (authenticated callers of own-membership helpers)

## Phase 3 task breakdown — business core

Branch: `feature/phase-3-business`

### 3.1 — Clients

Migration: `0004_clients.sql`
- `clients` table: `id uuid PK`, `org_id uuid FK organizations`, `name text`, `phone text`, `email text`, `notes text`, `created_at`, `updated_at`.
- RLS: members can select/insert own org's clients; owners can delete.
- Types: regenerate `Database` type after migration.

Routes + UI:
- `/clients` — server component, list with search/filter.
- `/clients/[id]` — client detail + edit form.
- Server actions: `createClient`, `updateClient`, `archiveClient`.

### 3.2 — Collaborators

Migration: `0005_collaborators.sql`
- `collaborators` table: `id`, `org_id`, `name`, `phone`, `email`, `specialty text`, `rate_per_day numeric`, `notes`, timestamps.
- RLS: owner/partner manage; collaborator role can read own entry.

Routes + UI: `/collaborators` list + `/collaborators/[id]` detail.
Server actions: `createCollaborator`, `updateCollaborator`.

### 3.3 — Events

Migration: `0006_events.sql`
- `events` table: `id`, `org_id`, `client_id FK clients`, `name`, `event_date date`, `location text`, `status text CHECK(...)`, `notes`, timestamps.
- `event_collaborators` junction: `event_id`, `collaborator_id`, `role text`, `fee numeric`.
- RLS: org-scoped; collaborators see events they are assigned to.

Routes + UI: `/events` list (calendar or table), `/events/[id]` detail + collaborator assignment.
Server actions: `createEvent`, `updateEvent`, `assignCollaborator`.

### 3.4 — Quotes

Migration: `0007_quotes.sql`
- `quotes` table: `id`, `org_id`, `event_id FK events`, `status text`, `total_amount numeric`, `created_at`, `sent_at`, `accepted_at`.
- `quote_items`: `id`, `quote_id`, `description`, `quantity numeric`, `unit_price numeric`, `amount numeric`.
- RLS: org-scoped; client role can read quotes for their events.

Routes + UI: `/events/[id]/quotes` — quote builder; PDF preview (later phase).
Server actions: `createQuote`, `addQuoteItem`, `updateQuoteStatus`.

### Gates before Phase 3 PR

```bash
npm run build   # no TS errors
npm run test    # all pass
npm run lint    # clean
npm audit --audit-level=moderate   # 0 vulns
```

## Known follow-ups (non-blocking)

- Replace placeholder SVG app icons with a proper PNG set (192/512, maskable) before production PWA install.
- Service worker is a no-op; add offline caching strategy in a later phase.
- GitHub Actions uses `actions/checkout@v4` + `actions/setup-node@v4` (Node 20) — should upgrade to v5+ (non-blocking, noted in CI output).
- PR #2 should be reviewed/merged to `main` before Phase 3 starts.

## Deviations from blueprint (approved, recorded)

- npm workspaces instead of pnpm.
- MUI Material v9 instead of MUI Joy (SSR via hand-rolled Emotion cache registry).
- Next 16 `proxy.ts` instead of `middleware.ts` (breaking rename in Next 16).
- See `docs/architecture/adr/2026-06-17-monorepo-and-mui-material.md`.
