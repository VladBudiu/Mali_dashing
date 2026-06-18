import { describe, expect, it } from "vitest";
import { MODELS, DEFAULT_MODEL, getModelInfo, modelLabel, rates, resolveModel } from "./models";

describe("model registry", () => {
  it("includes the default model", () => {
    expect(getModelInfo(DEFAULT_MODEL)).toBeDefined();
  });

  it("has three ascending price tiers", () => {
    const haiku = getModelInfo("claude-haiku-4-5-20251001")!;
    const sonnet = getModelInfo("claude-sonnet-4-6")!;
    const opus = getModelInfo("claude-opus-4-8")!;
    expect(haiku.inputPerM).toBeLessThan(sonnet.inputPerM);
    expect(sonnet.inputPerM).toBeLessThan(opus.inputPerM);
    expect(MODELS).toHaveLength(3);
  });

  it("derives per-token rates with cache discounts", () => {
    const r = rates("claude-haiku-4-5-20251001"); // $1/$5 per M
    expect(r.input).toBeCloseTo(1 / 1_000_000, 12);
    expect(r.output).toBeCloseTo(5 / 1_000_000, 12);
    expect(r.cacheRead).toBeCloseTo(r.input * 0.1, 12); // 10% of input
    expect(r.cacheWrite).toBeCloseTo(r.input * 1.25, 12); // 125% of input
  });

  it("falls back to the cheapest model's rates for an unknown id", () => {
    expect(rates("made-up-model").input).toBeCloseTo(1 / 1_000_000, 12);
  });

  it("modelLabel maps id to label and tolerates unknowns", () => {
    expect(modelLabel("claude-haiku-4-5-20251001")).toBe("Haiku 4.5");
    expect(modelLabel("xyz")).toBe("xyz");
    expect(modelLabel(null)).toBe("Unknown");
  });

  it("resolveModel honours a known override, else defaults", () => {
    expect(resolveModel("claude-opus-4-8")).toBe("claude-opus-4-8");
    expect(resolveModel("")).toBe(DEFAULT_MODEL);
    expect(resolveModel(undefined)).toBe(DEFAULT_MODEL);
    // forward-compat: unknown but non-empty ids pass through
    expect(resolveModel("claude-future-9")).toBe("claude-future-9");
  });
});
