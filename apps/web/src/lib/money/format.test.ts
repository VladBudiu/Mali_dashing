import { describe, expect, it } from "vitest";
import { formatMoney, roundMoney } from "./format";

describe("formatMoney", () => {
  it("should include the currency code in the output", () => {
    const result = formatMoney(100, "RON");
    expect(result).toContain("RON");
  });

  it("should include the EUR symbol or code for EUR amounts", () => {
    const result = formatMoney(100, "EUR");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/EUR|€/);
  });

  it("should format zero correctly", () => {
    const result = formatMoney(0, "RON");
    expect(result).toContain("0");
    expect(result).toContain("RON");
  });

  it("should format negative amounts", () => {
    const result = formatMoney(-50.5, "RON");
    expect(result).toContain("50");
    expect(result).toContain("RON");
    expect(result).toMatch(/-|−/);
  });

  it("should format large amounts", () => {
    const result = formatMoney(1234567.89, "RON");
    expect(result).toContain("RON");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should default to RON when no currency provided", () => {
    const result = formatMoney(250);
    expect(result).toContain("RON");
  });

  it("should not throw on an invalid currency code (renders safely)", () => {
    // These all make Intl.NumberFormat throw RangeError — formatMoney must not.
    for (const bad of ["1$2", "R0N", "EU", "EURO", "   "]) {
      expect(() => formatMoney(10, bad)).not.toThrow();
    }
  });

  it("falls back to number + raw code for an unknown but well-formed code", () => {
    const result = formatMoney(1234.5, "1$2");
    expect(result).toContain("1$2");
    expect(result).toMatch(/1[.,\s]?234/); // number still formatted
  });
});

describe("roundMoney", () => {
  it("should round to 2 decimal places", () => {
    // 1.006 * 100 = 100.6 → rounds up; 1.004 * 100 = 100.4 → rounds down
    expect(roundMoney(1.006)).toBeCloseTo(1.01, 10);
    expect(roundMoney(1.004)).toBeCloseTo(1, 1);
  });

  it("should not change already-rounded values", () => {
    expect(roundMoney(10.5)).toBe(10.5);
    expect(roundMoney(100)).toBe(100);
  });

  it("should handle zero", () => {
    expect(roundMoney(0)).toBe(0);
  });

  it("should handle negative values", () => {
    expect(roundMoney(-1.006)).toBeCloseTo(-1.01, 10);
  });
});
