# Architecture Decision Records

Use this folder for architecture-significant decisions. Do not use ADRs for routine implementation notes, session logs, or duplicated policy.

## Status

Allowed statuses:

- proposed
- accepted
- superseded
- rejected
- deprecated

## Required Fields

Each ADR must include:

- title
- status
- owner
- date
- context
- decision
- consequences
- validation
- supersession

## File Naming

Use:

```text
YYYY-MM-DD-short-decision-title.md
```

## Template

```md
# YYYY-MM-DD - Decision Title

## Status

proposed

## Owner

Name or GitHub handle.

## Context

What problem, constraint, or tradeoff forced a decision.

## Decision

The chosen direction and scope.

## Consequences

Expected benefits, costs, risks, and follow-up work.

## Validation

How the decision will be checked in code, docs, tests, or operations.

## Supersession

Use `None` unless this ADR replaces or is replaced by another ADR.
```

## Supersession Rules

- Do not edit accepted ADRs to change history.
- Create a new ADR when a decision changes.
- Mark the older ADR as `superseded` and link to the replacement.
- Rejected and deprecated ADRs remain in the folder for audit history.
