import { describe, expect, it } from "vitest";
import { collectSources, dedupeSources, sourcesFromResults } from "./sources";
import type { ToolResult } from "./types";

describe("source collection", () => {
  it("collects sources only from successful results", () => {
    const results: ToolResult[] = [
      { ok: true, data: {}, sources: [{ table: "events", id: "1", label: "A" }] },
      { ok: false, error: "boom" },
      { ok: true, data: {}, sources: [{ table: "clients", id: "9", label: "C" }] },
    ];
    expect(collectSources(results)).toHaveLength(2);
  });

  it("dedupes by table+id, keeping first-seen order", () => {
    const deduped = dedupeSources([
      { table: "events", id: "1", label: "A" },
      { table: "events", id: "1", label: "A again" },
      { table: "events", id: "2", label: "B" },
    ]);
    expect(deduped).toEqual([
      { table: "events", id: "1", label: "A" },
      { table: "events", id: "2", label: "B" },
    ]);
  });

  it("end-to-end collect + dedupe", () => {
    const results: ToolResult[] = [
      { ok: true, data: {}, sources: [{ table: "events", id: "1", label: "A" }] },
      { ok: true, data: {}, sources: [{ table: "events", id: "1", label: "dup" }] },
    ];
    expect(sourcesFromResults(results)).toHaveLength(1);
  });
});
