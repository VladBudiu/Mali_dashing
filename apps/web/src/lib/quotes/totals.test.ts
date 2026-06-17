import { describe, expect, it } from "vitest";
import { calculateQuoteTotals } from "./totals";

describe("calculateQuoteTotals", () => {
  it("should return zeros for empty lines", () => {
    const totals = calculateQuoteTotals([], 0.19, 0, 0);
    expect(totals).toEqual({
      subtotalNet: 0,
      discountNet: 0,
      netAfterDiscount: 0,
      vatAmount: 0,
      totalGross: 0,
    });
  });

  it("should sum line totals correctly", () => {
    const lines = [
      { quantity: 2, unit_price_net: 100 },
      { quantity: 1, unit_price_net: 50 },
    ];
    const totals = calculateQuoteTotals(lines, 0.19, 0, 0);
    expect(totals.subtotalNet).toBe(250);
    expect(totals.discountNet).toBe(0);
    expect(totals.netAfterDiscount).toBe(250);
    expect(totals.vatAmount).toBe(47.5);
    expect(totals.totalGross).toBe(297.5);
  });

  it("should apply percentage discount before VAT", () => {
    const lines = [{ quantity: 1, unit_price_net: 1000 }];
    const totals = calculateQuoteTotals(lines, 0.19, 0.1, 0);
    expect(totals.subtotalNet).toBe(1000);
    expect(totals.discountNet).toBe(100);
    expect(totals.netAfterDiscount).toBe(900);
    expect(totals.vatAmount).toBe(171);
    expect(totals.totalGross).toBe(1071);
  });

  it("should apply fixed discount before VAT", () => {
    const lines = [{ quantity: 1, unit_price_net: 500 }];
    const totals = calculateQuoteTotals(lines, 0.19, 0, 50);
    expect(totals.subtotalNet).toBe(500);
    expect(totals.discountNet).toBe(50);
    expect(totals.netAfterDiscount).toBe(450);
    expect(totals.vatAmount).toBe(85.5);
    expect(totals.totalGross).toBe(535.5);
  });

  it("should combine percentage and fixed discounts", () => {
    const lines = [{ quantity: 1, unit_price_net: 1000 }];
    const totals = calculateQuoteTotals(lines, 0.19, 0.1, 20);
    expect(totals.discountNet).toBe(120);
    expect(totals.netAfterDiscount).toBe(880);
    expect(totals.totalGross).toBeCloseTo(880 * 1.19, 2);
  });

  it("should round monetary values to 2 decimal places", () => {
    const lines = [{ quantity: 3, unit_price_net: 33.33 }];
    const totals = calculateQuoteTotals(lines, 0.19, 0, 0);
    expect(totals.subtotalNet).toBe(99.99);
    expect(totals.vatAmount).toBe(19);
    expect(totals.totalGross).toBe(118.99);
  });

  it("should handle zero VAT rate", () => {
    const lines = [{ quantity: 1, unit_price_net: 200 }];
    const totals = calculateQuoteTotals(lines, 0, 0, 0);
    expect(totals.vatAmount).toBe(0);
    expect(totals.totalGross).toBe(200);
  });

  it("should clamp a fixed discount that exceeds the subtotal (no negative total)", () => {
    const lines = [{ quantity: 1, unit_price_net: 1000 }];
    const totals = calculateQuoteTotals(lines, 0.19, 0, 2000);
    expect(totals.discountNet).toBe(1000);
    expect(totals.netAfterDiscount).toBe(0);
    expect(totals.vatAmount).toBe(0);
    expect(totals.totalGross).toBe(0);
  });

  it("should clamp combined discounts that exceed the subtotal", () => {
    const lines = [{ quantity: 1, unit_price_net: 1000 }];
    // 50% (500) + fixed 800 = 1300 raw, capped at the 1000 subtotal
    const totals = calculateQuoteTotals(lines, 0.19, 0.5, 800);
    expect(totals.discountNet).toBe(1000);
    expect(totals.netAfterDiscount).toBe(0);
    expect(totals.totalGross).toBe(0);
  });

  it("should never produce a negative total for any single line", () => {
    const lines = [{ quantity: 2, unit_price_net: 75.5 }];
    const totals = calculateQuoteTotals(lines, 0.19, 1.5, 0);
    expect(totals.netAfterDiscount).toBeGreaterThanOrEqual(0);
    expect(totals.vatAmount).toBeGreaterThanOrEqual(0);
    expect(totals.totalGross).toBeGreaterThanOrEqual(0);
  });
});
