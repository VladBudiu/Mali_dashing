# Session log — Phase 8a: read-only AI assistant (up to the API key)

Date: 2026-06-18
Branch: `feature/phase-8a-assistant`
Gates: build ✓ · 110/110 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓ · live-DB RLS ✓

## Goal
Read-only, permission-aware Q&A over the org's own data, with chat history and an
audit trail that links every answer back to source rows. Built **everything except
the live model call**, which is gated on `ANTHROPIC_API_KEY`.

## Cost-efficient architecture (researched)
Pricing (Jun 2026): Haiku 4.5 $1/$5, Sonnet $3/$15, Opus $5/$25 per M tokens.
- **Tool whitelist** — the model calls a fixed set of scoped read-only functions;
  only needed rows enter context (cheaper + enforces read-only + tenant isolation).
- **Prompt caching** — system prompt + tool defs marked `cache_control` → ~10% of
  input price on repeat turns; volatile date kept last to preserve the stable prefix.
- **Haiku 4.5 default** (`ASSISTANT_MODEL` overrides).

## Files
- Migration `0013_ai_assistant.sql`: `ai_sessions`, `ai_messages`, `ai_audit_logs`,
  `ai_notes` — org-scoped RLS; sessions/messages **per-user**, notes shared in org,
  audit visible to author + owners.
- `lib/assistant/`:
  - `registry.ts` — 10 tools (9 read + `save_note`); Zod + JSON schemas. Pure, tested.
  - `tools.ts` — handlers via the user's RLS client (never service role).
  - `dispatch.ts` — validate-then-run, structured errors.
  - `prompt.ts` — cacheable system prompt (pure, tested).
  - `sources.ts` — collect/dedupe audit sources (pure, tested).
  - `history.ts` / `audit.ts` — persistence.
  - `claude.ts` — Anthropic tool-use loop; `{configured:false}` with no key.
  - `actions.ts` — `sendAssistantMessage` server action (history window → model →
    persist user/assistant messages → write audit).
- `components/assistant/AssistantChat.tsx` + `/assistant` page (replaces placeholder):
  suggestions, source-link chips, session list. Works without a key (shows config notice).
- `@anthropic-ai/sdk` added to `apps/web`.

## Verified on live DB (throwaway orgs, cleaned up)
7/7 AI-table RLS checks: author sees own session; **same-org other user cannot see a
private chat**; cross-org sees nothing; notes shared within org but not cross-org;
audit visible to author, not to non-owner non-author. Security advisor: no new issues.

## Tools the assistant can call
get_dashboard_stats, get_finance_summary, list_transactions, search_events,
get_event_overview, get_inventory_status, search_clients, list_collaborators,
list_notes, save_note (the only write — to ai_notes).

## To finish 8a (the one remaining step)
Add `ANTHROPIC_API_KEY` (and optionally `ASSISTANT_MODEL`) to `apps/web/.env.local`,
server-side only — never `NEXT_PUBLIC_*`. The assistant then goes live with no code change.

## 8b (future)
Escalation/model tiering, write-actions with confirmation, richer source rendering,
streaming, per-org cost dashboard from stored `token_usage`.
