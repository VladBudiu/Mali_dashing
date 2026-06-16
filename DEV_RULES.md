# Development Rules & Standards
> This document is the authoritative ruleset for all development work.
> Every rule applies to every task, every file, every session — no exceptions.

---

## Table of Contents
1. [Pre-Checks Protocol](#1-pre-checks-protocol)
2. [SOLID Principles](#2-solid-principles)
3. [Core Design Principles](#3-core-design-principles)
4. [Naming Conventions](#4-naming-conventions)
5. [Code Quality Rules](#5-code-quality-rules)
6. [Error Handling](#6-error-handling)
7. [Security Standards](#7-security-standards)
8. [Version Control & Git](#8-version-control--git)
9. [Testing Standards](#9-testing-standards)
10. [Logging Standards](#10-logging-standards)
11. [Dependency Management](#11-dependency-management)
12. [Environment & Configuration](#12-environment--configuration)
13. [Post-Code Checklist](#13-post-code-checklist)
14. [Documentation Standards](#14-documentation-standards)
15. [Ground Truth Protocol](#15-ground-truth-protocol)

---

## 1. Pre-Checks Protocol

**Run ALL checks before writing or modifying ANY code. If ANY check fails: STOP. Report the failure. Do NOT generate code.**

| # | Check | Pass Condition | On Fail |
|---|-------|---------------|---------|
| 1 | Code is up to date | All files reflect the latest codebase state; no stale versions present | HALT |
| 2 | No conflicts or merge errors | No unresolved merge conflicts; no markers (`<<<<<<<`, `=======`, `>>>>>>>`) in any file | HALT |
| 3 | Required credentials available | All API keys, tokens, secrets, and env vars needed for the task exist and are reachable | HALT — report exactly what is missing |

---

## 2. SOLID Principles

Apply all five to every class, module, and function. No exceptions.

### S — Single Responsibility Principle (SRP)
Each class or module must have exactly one reason to change.
One unit of code = one responsibility.
```
// WRONG: UserService handles auth, profile updates AND email sending
// RIGHT: AuthService, UserProfileService, EmailService — each does one thing
```

### O — Open/Closed Principle (OCP)
Software entities must be open for extension, closed for modification.
Add behavior by extending, not by editing existing code.
```
// WRONG: adding an if/else branch to an existing function for each new case
// RIGHT: use interfaces, strategy pattern, or inheritance to extend behavior
```

### L — Liskov Substitution Principle (LSP)
Any subclass must be safely replaceable with its parent class without breaking the program.
Subclasses must honor the contract of their base type.
```
// WRONG: override a method and throw "not implemented" or change its return contract
// RIGHT: subclass fully implements the parent contract with compatible behavior
```

### I — Interface Segregation Principle (ISP)
No class should be forced to implement methods it does not use.
Prefer many small, focused interfaces over one large general-purpose one.
```
// WRONG: one IAnimal interface with fly(), swim(), run() forced on all animals
// RIGHT: IFlyable, ISwimmable, IRunnable — implement only what applies
```

### D — Dependency Inversion Principle (DIP)
High-level modules must not depend on low-level modules.
Both must depend on abstractions. Abstractions must not depend on details.
```
// WRONG: OrderService directly instantiates MySQLRepository
// RIGHT: OrderService depends on IRepository interface; inject the implementation
```

---

## 3. Core Design Principles

### DRY — Don't Repeat Yourself
Every piece of knowledge must have a single, unambiguous, authoritative representation in the codebase.
If you write the same logic twice, extract it into a shared function, constant, or module.
Duplication is not just copy-paste — it includes duplicated logic, conditionals, and data transformations.

### KISS — Keep It Simple
Prefer the simplest solution that correctly solves the problem.
Complexity must be justified. If a simpler approach exists, use it.
Never add abstraction layers, patterns, or indirection unless there is a clear, present need.

### YAGNI — You Aren't Gonna Need It
Do not implement functionality until it is actually required.
Do not add parameters, flags, or hooks "for future use."
Code that does not serve a current requirement does not belong in the codebase.

### Separation of Concerns (SoC)
Different concerns must live in different parts of the system.
Business logic, data access, presentation, and infrastructure must not be mixed.
A change in one concern must not require changes in another.

### Fail Fast
Validate all inputs and preconditions at the earliest possible point.
Use guard clauses at the top of functions. Return or throw immediately on invalid state.
Do not let invalid data propagate deeper into the system.
```
// WRONG: check validity at the end after doing a lot of work
// RIGHT: validate first, return/throw early, proceed only with valid state
```

---

## 4. Naming Conventions

### Variables — camelCase, noun
- Format: `camelCase`, starts with a lowercase letter, always a noun.
- Must describe what it holds, not how it is used.
- ✅ `userCount`, `invoiceTotal`, `activeSessionId`, `maxRetryLimit`
- ❌ `getData`, `temp`, `x`, `my_var`, `val`

### Functions — camelCase, explicit verb phrase
- Names must be explicit verb phrases that describe the full action performed.
- A reader must understand what the function does from its name alone without reading its body.
- Longer, explicit names are preferred over short, ambiguous ones.
- ✅ `calculateMonthlyInvoiceTotal()`, `sendPasswordResetEmailToUser()`, `validateUserInputBeforeSave()`
- ❌ `process()`, `handle()`, `doStuff()`, `update()`

### Classes & Types — PascalCase, noun
- Format: `PascalCase`, always a noun or noun phrase.
- ✅ `UserProfileService`, `InvoiceRepository`, `PaymentGatewayAdapter`
- ❌ `userprofileservice`, `invoice_repo`, `processPayment`

### Booleans — camelCase, yes/no question form
- Must be phrased as a question whose answer is `true` or `false`.
- Always prefix with `is`, `has`, `can`, `should`, `was`, `did`, etc.
- ✅ `isReady`, `hasValidToken`, `isFeatureXActivated`, `canUserEdit`, `shouldRetry`
- ❌ `ready`, `valid`, `featureFlag`, `editAllowed`, `retry`

### Constants — UPPER_SNAKE_CASE
- All constants (magic values, configuration limits, fixed strings) use `UPPER_SNAKE_CASE`.
- ✅ `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS`, `API_BASE_URL`
- ❌ `maxRetry`, `timeout`, `apiUrl`

### Files & Directories
- Source files: `kebab-case` for Next.js App Router conventions.
- Test files: mirror the source file name with a `.test` or `.spec` suffix.
- UI components: `PascalCase`.
- DB tables: `snake_case`. Endpoints: `/api/<domain>/<action>`.
- ✅ `user-profile-service.ts`, `UserProfileCard.tsx`, `user-profile-service.test.ts`

---

## 5. Code Quality Rules

### No Magic Numbers or Strings
Never use raw numeric or string literals in logic. Extract them into named constants.
```
// WRONG: if (retries > 3)
// RIGHT: if (retries > MAX_RETRY_COUNT)
```

### Function Size
Functions must be small and focused. Target under 20 lines. Hard limit: 40 lines.
If a function grows beyond this, split it into smaller, well-named sub-functions.

### Maximum Function Parameters
Functions must accept no more than 3 parameters.
If more data is needed, group related parameters into a single object or DTO.
```
// WRONG: createUser(firstName, lastName, email, role, isActive, departmentId)
// RIGHT: createUser(userDto: CreateUserDto)
```

### Cyclomatic Complexity
Keep cyclomatic complexity per function at or below 10.
High complexity = hard to test, hard to read. Refactor into smaller functions.

### Avoid Deep Nesting
Maximum nesting depth: 3 levels.
Use guard clauses, early returns, and extracted functions to flatten nested logic.
```
// WRONG: if { if { if { if { ... } } } }
// RIGHT: validate early, return early, extract inner blocks into functions
```

### Prefer Immutability
Prefer immutable data structures and `const` / `readonly` where possible.
Do not mutate function arguments. Return new values instead of modifying inputs.

### Comments Policy
Default: write NO inline comments. Code must be self-documented through naming.
**Allowed locations only:**
- Top of a file: one brief description of the file's purpose.
- Top of a complex function: one-line explanation if the logic is genuinely non-obvious.

Never scatter comments throughout function bodies.
If a comment is needed to explain a line, rename the variable or function instead.

### Zero Business Logic in Visual Components
All business logic lives in `lib/`. Components only render and handle user events.
`lib/money`, `lib/fx`, `lib/permissions` are separate modules.

---

## 6. Error Handling

### Never Swallow Exceptions
Empty `catch` blocks are forbidden. Every caught exception must be handled or re-thrown.
```
// WRONG: catch (e) {}
// RIGHT: catch (e) { log the error, handle it, or rethrow with context }
```

### Use Typed / Custom Exceptions
Define specific exception types for different failure modes.
Never throw or catch generic `Exception` / `Error` when a more specific type is appropriate.

### Always Include Context in Errors
Error messages must include enough information to diagnose the problem without a debugger.
Include: what operation failed, what input caused it, and what was expected.

### Propagate Errors Appropriately
Do not silently convert errors into null, empty values, or default states.
If a function cannot fulfill its contract, it must signal failure explicitly.

---

## 7. Security Standards

### Never Hardcode Credentials
API keys, passwords, tokens, secrets, and connection strings must never appear in source code.
All secrets must be loaded from environment variables or a secrets manager.
Local private notes belong only in `.confidential/credentials.md` (gitignored).

### Validate and Sanitize All Inputs
Treat all external input (user input, API responses, file contents, query params) as untrusted.
Validate with Zod at all system boundaries. Reject invalid input early.
Sanitize before using in queries, commands, or rendering.

### Never Log Sensitive Data
Passwords, tokens, API keys, full credit card numbers, and PII must never appear in logs.
Mask or omit sensitive fields before logging.

### Principle of Least Privilege
Services, users, and modules must only have the permissions they absolutely need.
Supabase service role key is server-side only — never exposed to the client.
RLS must be enabled on all public tables. AI assistant never uses the service key.

### Keep Dependencies Audited
Run `npm audit` regularly. Address HIGH and CRITICAL vulnerabilities immediately.

---

## 8. Version Control & Git

### Commit Messages
Format: imperative mood, present tense. Describe what the commit does, not what you did.
- ✅ `Add user authentication endpoint`
- ✅ `Fix null pointer in invoice calculation`
- ❌ `added auth`, `fixed bug`, `WIP`, `misc changes`

Structure for non-trivial commits:
```
Short summary (50 chars max)

Optional body explaining WHY this change was made,
not what — the diff shows what.
```

### One Logical Change Per Commit
Each commit must represent a single, coherent change.
Do not mix unrelated fixes, features, or refactors in one commit.

### Branch Naming Convention
```
feature/<short-description>
fix/<short-description>
hotfix/<short-description>
refactor/<short-description>
chore/<short-description>
```

### Never Commit Directly to Main
All changes must go through a branch and a pull request.
Direct pushes to `main` are forbidden after the initial scaffold.

### Pull Request Requirements
- PR description must explain: what changed, why, and how to test it.
- All CI checks (build, tests, lint) must pass before merge.

### .gitignore
Secrets files (`.env`, `*.key`, `*.pem`), build artifacts, and dependency folders must always be in `.gitignore`.

---

## 9. Testing Standards

### Coverage Minimum
Minimum test coverage: **80%** for all new code.
Critical paths (auth, financial calculations, RLS policies, OCR pipeline) must target **95%+**.

### Test Independence
Tests must be fully independent. No shared mutable state between tests.
Each test must set up its own data and clean up after itself.

### AAA Pattern — Arrange, Act, Assert
Every test must follow this structure:
```
// Arrange: set up the inputs and context
// Act: call the function or behavior under test
// Assert: verify the output or side effect
```

### Test Naming
Test names must describe the scenario, not just the function name.
- ✅ `should return 404 when user does not exist`
- ✅ `should throw ValidationError when email is malformed`
- ❌ `testGetUser`, `test1`, `checkMethod`

### Mock External Dependencies
All external dependencies (databases, APIs, OCR engines, LLMs, clocks) must be mocked in unit tests.
Tests must not make real network calls or write to real databases.

### Test Types Required
- **Unit tests**: test individual functions/classes in isolation (money formulas, FX conversion, pricing logic).
- **Integration tests**: test how modules work together (CRUD events/quotes/docs).
- **RLS tests**: per role, per tenant — verify unauthorized access is denied.
- **Edge case tests**: boundary values, empty inputs, null values, currency edge cases.
- **Regression tests**: add a test for every bug fixed so it cannot reappear.

---

## 10. Logging Standards

### Use Structured Logging
Log entries must be machine-readable (JSON format in production).
Include consistent fields: timestamp, log level, service name, correlation ID, message.

### Log Levels — Use Appropriately
| Level | When to use |
|-------|-------------|
| `DEBUG` | Detailed diagnostic info, only in development |
| `INFO` | Normal application events (startup, requests, key operations) |
| `WARN` | Unexpected but recoverable situations |
| `ERROR` | Failures that require attention but do not crash the service |
| `FATAL` | Unrecoverable errors that crash the service |

### Logs Must Be Actionable
Every log entry must include enough context to act on it.
```
// WRONG: logger.error("Failed")
// RIGHT: logger.error("Failed to process OCR", { documentId, engine, errorCode })
```

### Never Log Sensitive Data
Passwords, tokens, secrets, and PII must never appear in logs.

---

## 11. Dependency Management

### Pin Dependency Versions
All dependency versions must be pinned in production. Use lock files.

### Minimize Dependencies
Before adding a new dependency, ask: can this be done simply without it?

### Audit Regularly
Run `npm audit` regularly. Address HIGH and CRITICAL vulnerabilities immediately.

### No Abandoned Packages
Do not depend on packages that are unmaintained (no commits in 2+ years).

---

## 12. Environment & Configuration

### Strict Environment Separation
Three environments minimum: `development`, `staging`, `production`.
Configuration, credentials, and data must never be shared across environments.

### All Config via Environment Variables
No configuration values hardcoded in source. Follow the 12-Factor App methodology.
See `.env.example` for required variables.

---

## 13. Post-Code Checklist

**Execute in this exact order. Do not skip steps. Do not push unless all steps pass.**

| Step | Action | Pass Condition |
|------|--------|---------------|
| 1 | **Build** | Run the full build. Zero errors. Zero warnings. |
| 2 | **Review** | Verify logical correctness AND visual/UX correctness if applicable. |
| 3 | **Write tests** | Cover all new and modified code: unit, integration, edge cases. |
| 4 | **Run all tests** | 100% of tests must pass. One failure = stop, fix, re-run. |
| 5 | **Lint** | Run the linter. Zero lint errors. |
| 6 | **Update docs** | Document changes, errors encountered, and feature state in `/docs`. |
| 7 | **Push** | Only after steps 1–6 are fully complete and verified. |

---

## 14. Documentation Standards

### Mandatory Documentation After Every Session
Stored in the `docs/session-logs/` folder. Never inline docs inside code files.

Every session must document:
- **Changes made**: what changed, why it changed, which files were affected.
- **Errors encountered**: description of the problem, root cause, and resolution.
- **Issues found**: bugs, conflicts, or tech debt discovered (even if not resolved yet).
- **Feature state**: current status of each feature — `complete`, `partial`, or `blocked`.

### Documentation Format
```
## [Date] — [Brief title of session/change]

### Changes
- Description of change 1 (files affected)
- Description of change 2 (files affected)

### Errors Encountered
- Error: [description]
  Cause: [root cause]
  Resolution: [how it was fixed]

### Feature Status
- featureName: complete / partial / blocked
  Notes: [any relevant context]
```

### Code-Level Documentation
Public APIs, interfaces, and non-obvious functions must have doc comments explaining:
- What the function does.
- What each parameter expects (type, constraints).
- What it returns.
- What exceptions it can throw.

---

## 15. Ground Truth Protocol

### PROJECT_SOURCE_OF_TRUTH.md is the Single Source of Truth
`PROJECT_SOURCE_OF_TRUTH.md` is the most important file in this project.
Before starting any task, read it and fully understand the relevant sections.
All code, architecture decisions, and feature implementations must conform to it.

### Deviations Require Explicit Approval
No deviation from the plan is permitted without explicit human approval.
If a situation arises that seems to require a deviation:
1. STOP code generation.
2. Describe the conflict or reason for potential deviation.
3. Wait for explicit approval or rejection.
4. If approved: update `PROJECT_SOURCE_OF_TRUTH.md` to reflect the change, then proceed.
5. If rejected: find a solution that stays within the plan.

### The Plan File Must Stay Current
`PROJECT_SOURCE_OF_TRUTH.md` must always reflect the actual state and direction of the project.
After any approved deviation, update it immediately before continuing.

---

*Last updated: auto — this document must be updated whenever rules change.*
