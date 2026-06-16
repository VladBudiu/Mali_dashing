# Agents Layout

This folder defines how AI agents should operate in this repository.

## Agent Load Order

Every agent must read:

1. `AGENTS.md`
2. `DEV_RULES.md`
3. `PROJECT_SOURCE_OF_TRUTH.md` (relevant sections for the task)
4. the relevant file in `docs/agents/`
5. the relevant files in `docs/rules/`
6. the command registry in `docs/commands/README.md`

## Branching Rule

Agents must not work directly on `main`. Create a task branch, validate changes, then push the branch for review.

## Financial Logic Rule

Agents must not delegate financial calculations to AI models. All totals, margins, VAT, FX conversions, and profit figures must be computed in SQL or pure TypeScript functions in `lib/money` or `lib/fx`.

## AI Assistant Rule

The AI assistant feature uses only RLS-scoped read access. It never receives the service role key. Any answer containing financial totals must include a link to the source rows and an audit entry.
