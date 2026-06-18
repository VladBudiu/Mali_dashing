/**
 * Shared types for the AI assistant. A "source" is a pointer back into the
 * app's source-of-truth rows so every figure the assistant reports can be
 * audited and clicked through.
 */

export type AssistantSource = {
  /** Source-of-truth table, e.g. "financial_transactions". */
  table: string;
  /** Row id (or a synthetic key for aggregates). */
  id: string;
  /** Human label shown in the UI. */
  label: string;
  /** Optional in-app link, e.g. "/events/123". */
  href?: string;
};

export type ToolResult =
  | { ok: true; data: unknown; sources: AssistantSource[] }
  | { ok: false; error: string };

export type TokenUsage = {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  /** Model that produced this turn — needed to price it. */
  model?: string;
};

export type AssistantRole = "user" | "assistant" | "tool";
