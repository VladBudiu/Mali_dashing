# Coding Standards

All implementation must follow `DEV_RULES.md`.

## Required Principles

- SOLID
- DRY
- KISS
- YAGNI
- separation of concerns
- fail fast
- least privilege

## Naming

Use the naming rules from `DEV_RULES.md`.

Project note: this repository uses TypeScript and React ecosystem conventions. When a project rule and framework convention appear to conflict, stop and ask before changing architecture or naming globally.

## Comments

Do not add inline comments by default.

Allowed comments:

- one short file-level purpose comment
- one short function-level comment only for genuinely complex logic

Prefer explicit names over explanatory comments.

## Confidential Data

Do not hardcode credentials, endpoint secrets, privileged public API keys, webhook secrets, private repository access, or service dashboard access in source files. Use environment variables or local `.confidential/credentials.md` references only.

## Project-Specific Rules

- Zero business logic in visual components — all logic in `lib/`
- `lib/money`, `lib/fx`, `lib/permissions` are separate modules
- All financial calculations in SQL or pure functions — never delegated to AI models
- Server actions only for isolated mutations; otherwise route handlers
- Migrations are additive-only; no manual changes in production
- All inputs validated with Zod
