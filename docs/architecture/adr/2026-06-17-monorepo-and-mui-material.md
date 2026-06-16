# 2026-06-17 - Monorepo layout and MUI Material UI library

## Status

accepted

## Owner

VladBudiu

## Context

`PROJECT_SOURCE_OF_TRUTH.md` specifies a monorepo (`apps/web` + `packages/`) and
recommends MUI Joy as the component library. Two points needed resolution before
scaffolding:

1. The sibling project `business1` (used as the conventions reference) is a flat
   single-app repo using npm and `@mui/material`, not a monorepo with pnpm and Joy.
2. pnpm is not installed on the development machine; MUI Joy is in upstream
   maintenance mode.

## Decision

- **Structure:** Adopt the blueprint's monorepo layout using **npm workspaces**
  (`apps/*`, `packages/*`) rather than pnpm, since npm is already the project
  toolchain and Node 22.14.0 ships npm 11. Workspace packages: `@mali/config`,
  `@mali/types`, `@mali/utils`. Cross-package imports resolve via tsconfig path
  aliases plus `transpilePackages`.
- **UI library:** Use **`@mui/material`** instead of MUI Joy. Material is actively
  developed, integrates cleanly with MUI X (needed for tables/charts later), and
  matches the `business1` reference. SSR is handled by a hand-rolled Emotion cache
  registry (`useServerInsertedHTML`) to stay independent of any specific
  `@mui/material-nextjs` adapter version.

## Consequences

- Slight monorepo overhead now (workspace wiring, path aliases) in exchange for a
  clean home for a future client portal or shared packages.
- Diverges from the blueprint's Joy recommendation; `PROJECT_SOURCE_OF_TRUTH.md`
  has been updated to reflect MUI Material as the chosen library.
- pnpm-specific commands in the blueprint are superseded by npm equivalents.

## Validation

- `npm run build`, `npm run lint`, and `npm run test` pass at the repo root.
- The app shell renders across breakpoints (side nav on desktop, bottom nav on mobile).

## Supersession

None.
