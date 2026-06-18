import { describe, expect, it } from "vitest";
import { estimateCostUSD, aggregateUsage, formatUSD } from "./cost";

describe("estimateCostUSD", () => {
  it("prices a Haiku turn (input $1/M, output $5/M)", () => {
    const cost = estimateCostUSD({
      model: "claude-haiku-4-5-20251001",
      input: 1_000_000,
      output: 1_000_000,
    });
    expect(cost).toBeCloseTo(1 + 5, 6);
  });

  it("applies cache read (10%) and write (125%) discounts", () => {
    const cost = estimateCostUSD({
      model: "claude-haiku-4-5-20251001",
      cacheRead: 1_000_000, // 0.10
      cacheWrite: 1_000_000, // 1.25
    });
    expect(cost).toBeCloseTo(0.1 + 1.25, 6);
  });

  it("prices by the turn's own model (Opus dearer than Haiku)", () => {
    const haiku = estimateCostUSD({ model: "claude-haiku-4-5-20251001", output: 1_000_000 });
    const opus = estimateCostUSD({ model: "claude-opus-4-8", output: 1_000_000 });
    expect(opus).toBeGreaterThan(haiku);
    expect(opus).toBeCloseTo(25, 6);
  });

  it("defaults to the cheapest model when none recorded", () => {
    expect(estimateCostUSD({ input: 1_000_000 })).toBeCloseTo(1, 6);
  });
});

describe("aggregateUsage", () => {
  it("sums tokens and cost across turns", () => {
    const totals = aggregateUsage([
      { model: "claude-haiku-4-5-20251001", input: 2000, output: 500 },
      { model: "claude-haiku-4-5-20251001", input: 1000, output: 300, cacheRead: 5000 },
    ]);
    expect(totals.input).toBe(3000);
    expect(totals.output).toBe(800);
    expect(totals.cacheRead).toBe(5000);
    expect(totals.costUSD).toBeGreaterThan(0);
  });

  it("returns zeros for no usage", () => {
    expect(aggregateUsage([])).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, costUSD: 0 });
  });
});

describe("formatUSD", () => {
  it("uses 4 decimals for sub-cent amounts, 2 otherwise", () => {
    expect(formatUSD(0)).toBe("$0.00");
    expect(formatUSD(0.0034)).toBe("$0.0034");
    expect(formatUSD(1.5)).toBe("$1.50");
  });
});
