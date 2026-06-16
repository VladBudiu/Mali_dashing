<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mali Dash Required Operating Rules

This is a mobile-first PWA business operations dashboard for an event decoration company in Romania.
Tech stack: Next.js App Router + TypeScript strict + React + MUI Joy + Supabase + Postgres + Vercel + Azure Document Intelligence + OpenAI.

Before starting any work in this repository, read these files in order:

1. `DEV_RULES.md`
2. `docs/rules/README.md`
3. `docs/commands/README.md`
4. `docs/agents/README.md`
5. `docs/skills/README.md`
6. `docs/security/README.md`
7. `PROJECT_SOURCE_OF_TRUTH.md`

`DEV_RULES.md` is the authoritative project ruleset. If a task cannot satisfy its prechecks, validation requirements, credential requirements, security requirements, or safety rules, halt the work and report the blocker before generating or editing code.

`PROJECT_SOURCE_OF_TRUTH.md` is the ground truth for all product, architecture, and data model decisions. No deviation from it is permitted without explicit human approval.

Every work session must begin by fetching `origin`, checking branch status, checking for merge or rebase state, and scanning for unresolved conflict markers. Never work directly on `main`; create a task branch first. Do not push unless the required validation for the task has passed.
