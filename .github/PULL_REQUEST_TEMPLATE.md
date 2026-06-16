# Pull Request

## Summary

- What changed:
- Why it changed:
- How to test:

## Context

- [ ] Loaded `AGENTS.md`, `DEV_RULES.md`, and relevant sections of `PROJECT_SOURCE_OF_TRUTH.md`.
- [ ] No deviation from `PROJECT_SOURCE_OF_TRUTH.md` — or deviation is approved and the file is updated.
- [ ] Did not duplicate source schemas or policy bodies in Markdown.

## Schema And Contracts

- [ ] Updated Zod contracts, Supabase types, or migrations when behavior requires it.
- [ ] Deferred migrations when contracts or RLS need review first.
- [ ] Added or updated focused tests for new validation behavior.

## Security

- [ ] No secrets, private tokens, service-role keys, or backend-capable public keys are committed.
- [ ] `.confidential/` remains ignored and untracked.
- [ ] Public/client code does not expose privileged endpoints or backend-only access.
- [ ] Sensitive behavior is server-side, audited, or explicitly blocked.
- [ ] AI assistant routes never use service role key.

## Validation

- [ ] `git fetch origin`
- [ ] `git status --short --branch`
- [ ] `git diff --check`
- [ ] Conflict-marker scan completed.
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run lint`
- [ ] `npm audit --audit-level=moderate`

## ADR

- [ ] Added or updated an ADR for architecture-significant decisions.
- [ ] Marked this PR as not architecture-significant when no ADR is needed.

## Session Log

- [ ] Added a session log entry in `docs/session-logs/`.
