import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY, ANTHROPIC_TOOLS, TOOL_NAMES, getToolDef } from "./registry";

describe("tool registry", () => {
  it("has unique tool names", () => {
    expect(new Set(TOOL_NAMES).size).toBe(TOOL_NAMES.length);
  });

  it("every tool has a non-empty description and an object json schema", () => {
    for (const t of TOOL_REGISTRY) {
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.jsonSchema.type).toBe("object");
      expect(t.jsonSchema).toHaveProperty("properties");
      expect(t.jsonSchema).toHaveProperty("additionalProperties", false);
    }
  });

  it("exposes exactly one mutating tool (save_note)", () => {
    const mutating = TOOL_REGISTRY.filter((t) => t.mutates).map((t) => t.name);
    expect(mutating).toEqual(["save_note"]);
  });

  it("ANTHROPIC_TOOLS mirrors the registry shape", () => {
    expect(ANTHROPIC_TOOLS).toHaveLength(TOOL_REGISTRY.length);
    for (const t of ANTHROPIC_TOOLS) {
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("description");
      expect(t).toHaveProperty("input_schema");
    }
  });

  it("validates good input and rejects unknown keys", () => {
    const fin = getToolDef("get_finance_summary")!;
    expect(fin.inputSchema.safeParse({ from: "2026-01-01" }).success).toBe(true);
    expect(fin.inputSchema.safeParse({ bogus: 1 }).success).toBe(false);
  });

  it("requires event_id for get_event_overview", () => {
    const ev = getToolDef("get_event_overview")!;
    expect(ev.inputSchema.safeParse({}).success).toBe(false);
    expect(ev.inputSchema.safeParse({ event_id: "not-a-uuid" }).success).toBe(false);
    expect(
      ev.inputSchema.safeParse({ event_id: "11111111-1111-4111-8111-111111111111" }).success,
    ).toBe(true);
  });

  it("save_note requires a note and caps length", () => {
    const note = getToolDef("save_note")!;
    expect(note.inputSchema.safeParse({}).success).toBe(false);
    expect(note.inputSchema.safeParse({ note: "remember this" }).success).toBe(true);
    expect(note.inputSchema.safeParse({ note: "x".repeat(3000) }).success).toBe(false);
  });

  it("getToolDef returns undefined for unknown tools", () => {
    expect(getToolDef("drop_tables")).toBeUndefined();
  });
});
