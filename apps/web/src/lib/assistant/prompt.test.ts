import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "./prompt";

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt({ orgName: "Firma Mea", today: "2026-06-18" });

  it("names the organization", () => {
    expect(prompt).toContain("Firma Mea");
  });

  it("states the read-only rule and the single write exception", () => {
    expect(prompt.toLowerCase()).toContain("only read");
    expect(prompt).toContain("save_note");
  });

  it("requires citing sources for figures", () => {
    expect(prompt.toLowerCase()).toMatch(/source|verif/);
  });

  it("ends with today's date (kept last so the cached prefix stays stable)", () => {
    expect(prompt.trimEnd().endsWith("2026-06-18.")).toBe(true);
  });
});
