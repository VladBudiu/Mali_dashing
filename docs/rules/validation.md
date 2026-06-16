# Validation

Do not push unless validation is complete for the task.

## Code Validation Layout

For code changes, run:

- build
- lint
- tests
- security audit
- browser/UI verification when frontend behavior changes
- documentation update

## Current Project Commands

The command registry lives in `docs/commands/README.md`.

## Test Requirement

New or modified code must include tests that validate the behavior added or changed. If the project lacks the needed test framework, add a dedicated task to introduce it before larger implementation work.

## Documentation Requirement

Each session must document:

- changes made
- errors encountered
- issues found
- feature state

Session logs belong in `docs/session-logs/`.
