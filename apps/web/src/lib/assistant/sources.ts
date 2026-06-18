/**
 * Pure helpers for assembling the audit trail. Collecting and de-duplicating the
 * source rows that backed an answer is logic worth testing on its own, so it
 * lives here free of any DB access.
 */
import type { AssistantSource, ToolResult } from "./types";

/** Flatten the sources from every successful tool result into one list. */
export function collectSources(results: ToolResult[]): AssistantSource[] {
  return results
    .filter((r): r is Extract<ToolResult, { ok: true }> => r.ok)
    .flatMap((r) => r.sources);
}

/** De-duplicate by table+id, preserving first-seen order. */
export function dedupeSources(sources: AssistantSource[]): AssistantSource[] {
  const seen = new Set<string>();
  const out: AssistantSource[] = [];
  for (const s of sources) {
    const key = `${s.table}:${s.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

export function sourcesFromResults(results: ToolResult[]): AssistantSource[] {
  return dedupeSources(collectSources(results));
}
