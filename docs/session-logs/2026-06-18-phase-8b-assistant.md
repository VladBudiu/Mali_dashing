# Session log — Phase 8b: assistant model tiering + cost/usage tracking

Date: 2026-06-18
Branch: `feature/phase-8b-assistant`
Gates: build ✓ · 123/123 tests ✓ · lint ✓ · typecheck ✓ · 0 vulns ✓

## Scope
Observability + model configuration for the assistant. No migration (uses the
`token_usage` jsonb already stored on `ai_messages`). Write-actions and streaming
deferred to a later phase (kept the read-only safety boundary intact).

## What shipped
- `lib/assistant/models.ts` — model registry (Haiku 4.5 / Sonnet 4.6 / Opus 4.8)
  with USD-per-million pricing + cache multipliers (read 10%, write 125%).
  `resolveModel`, `modelLabel`, `rates`, `DEFAULT_MODEL`. Pure, **6 tests**.
- `lib/assistant/cost.ts` — `estimateCostUSD` (prices a turn by its own model),
  `aggregateUsage`, `formatUSD`. Pure, **7 tests**.
- `claude.ts` — now resolves the model via `models.ts` and stamps `usage.model`
  so every stored turn can be priced.
- `lib/assistant/usage.ts` — aggregates the caller's assistant `token_usage`
  (RLS scopes `ai_messages` to owned sessions → "your usage", privacy-preserving).
- `/assistant` page — compact usage strip: replies, total tokens, est. USD cost,
  and tokens served from cache.

## Notes
- Model tiering is server-controlled via `ASSISTANT_MODEL` (defaults to Haiku 4.5);
  the registry is ready for a per-chat picker UI later.
- Usage is per-user by RLS design; an owner-wide cost view would need a dedicated
  aggregate (service-role job or a view) — future.

## Deferred to a later phase (8c / future)
- Assistant write-actions **with explicit user confirmation** (propose → confirm →
  existing validated server action executes). Risky; needs its own focused pass.
- Streaming responses; per-chat model selector; auto-escalation heuristics.

## Gate results
```
typecheck clean · lint clean · vitest 16 files / 123 passed (+13) · build clean · 0 vulns
```
