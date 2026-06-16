# Rules Layout

`DEV_RULES.md` is the source of truth for all project rules.

This folder organizes rule references and future expansions. Do not create a rule here that conflicts with `DEV_RULES.md`. If a rule changes, update `DEV_RULES.md` first, then update the matching file in this folder.

## Required Rule Files

- `prechecks.md`: required checks before any implementation begins.
- `coding-standards.md`: clean-code, SOLID, naming, comments, security, and dependency expectations.
- `validation.md`: required build, lint, test, review, documentation, and push gates.
- `ground-truth.md`: plan-file and approved-deviation workflow.

## Load Order

1. Read `DEV_RULES.md`.
2. Read the specific rule file relevant to the task.
3. If a task touches code, read `validation.md` before editing.
4. If a task may deviate from the plan, read `ground-truth.md` and halt until approval.
