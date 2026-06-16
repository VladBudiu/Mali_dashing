# Prechecks

Before editing code or documentation, run the prechecks defined in `DEV_RULES.md`.

## Required Checks

- Fetch latest remote state from `origin`.
- Confirm the working branch is up to date or explicitly account for divergence.
- Confirm there is no active merge or rebase.
- Confirm there are no unresolved conflict markers.
- Confirm required credentials and environment variables exist for the requested task.
- Confirm confidential material belongs only in `.confidential/credentials.md` or a real secrets manager.

## Halt Conditions

Halt before code generation or file edits when:

- the branch is stale and cannot be safely synced
- a merge or rebase is in progress
- conflict markers exist
- required credentials are missing
- required environment variables are missing
- confidential material is found outside the approved storage location
- the task conflicts with `PROJECT_SOURCE_OF_TRUTH.md` or safety rules

For docs-only layout tasks, runtime service credentials are not required unless the task explicitly needs an external service.
