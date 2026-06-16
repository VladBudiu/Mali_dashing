# Context Bootstrap

Use this file after `AGENTS.md` and `DEV_RULES.md` to load project context.

## Load Order

1. Read `AGENTS.md`.
2. Read `DEV_RULES.md`.
3. Read `PROJECT_SOURCE_OF_TRUTH.md` (relevant sections for the task).
4. Load only the route-specific files required by the task.

## Canonical Sources

- Rules: `DEV_RULES.md` and `docs/rules/`.
- Commands: `docs/commands/README.md`.
- Agent workflows: `docs/agents/`.
- Skill workflows: `docs/skills/`.
- Security boundary: `docs/security/`.
- Governance: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, and `docs/architecture/adr/README.md`.
- Product and architecture: `PROJECT_SOURCE_OF_TRUTH.md` and `docs/plan/`.
- Supabase: `docs/supabase-setup.md` (when created) and `supabase/migrations/`.
- Session history: `docs/session-logs/`.

## Use Rules

- Do not duplicate schemas, contracts, or source inventories in Markdown.
- Do not add secrets, private endpoints, or credential values to context files.
- Treat missing route targets as blockers before implementation.
- Update context files when canonical paths or validation commands change.
