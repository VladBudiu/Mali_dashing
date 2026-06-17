import { describe, expect, it } from "vitest";
import { computePricing, computePricingLine } from "./pricing";

describe("computePricingLine", () => {
  it("applies markup over cost", () => {
    const r = computePricingLine({ description: "Centerpiece", quantity: 10, unitCost: 100, markupPct: 0.5 });
    expect(r.unitPrice).toBe(150);
    expect(r.lineCost).toBe(1000);
    expect(r.linePrice).toBe(1500);
    expect(r.lineProfit).toBe(500);
  });

  it("zero markup means price equals cost (no profit)", () => {
    const r = computePricingLine({ description: "x", quantity: 3, unitCost: 33.33, markupPct: 0 });
    expect(r.unitPrice).toBe(33.33);
    expect(r.linePrice).toBe(99.99);
    expect(r.lineProfit).toBe(0);
  });

  it("floors unit price at zero for a markup below -100%", () => {
    const r = computePricingLine({ description: "x", quantity: 2, unitCost: 50, markupPct: -1.5 });
    expect(r.unitPrice).toBe(0);
    expect(r.linePrice).toBe(0);
    expect(r.lineProfit).toBe(-100); // sold 2×50 cost for nothing
  });

  it("clamps negative quantity and cost to zero", () => {
    const r = computePricingLine({ description: "x", quantity: -5, unitCost: -10, markupPct: 0.2 });
    expect(r.lineCost).toBe(0);
    expect(r.linePrice).toBe(0);
  });
});

describe("computePricing", () => {
  it("returns zeros for no lines", () => {
    const r = computePricing({ lines: [], vatRate: 0.19, discountPct: 0, depositPct: 0 });
    expect(r).toMatchObject({
      totalCost: 0,
      subtotalPrice: 0,
      netAfterDiscount: 0,
      marginPct: 0,
      profit: 0,
      vatAmount: 0,
      totalGross: 0,
      depositDue: 0,
    });
  });

  it("rolls up cost, price, margin, VAT, gross and deposit", () => {
    const r = computePricing({
      lines: [
        { description: "A", quantity: 10, unitCost: 100, markupPct: 0.5 }, // cost 1000, price 1500
        { description: "B", quantity: 5, unitCost: 20, markupPct: 1.0 },   // cost 100,  price 200
      ],
      vatRate: 0.19,
      discountPct: 0,
      depositPct: 0.3,
    });
    expect(r.totalCost).toBe(1100);
    expect(r.subtotalPrice).toBe(1700);
    expect(r.netAfterDiscount).toBe(1700);
    expect(r.profit).toBe(600);
    expect(r.marginPct).toBeCloseTo(600 / 1700, 6);
    expect(r.vatAmount).toBe(323); // 1700 * 0.19
    expect(r.totalGross).toBe(2023);
    expect(r.depositDue).toBe(606.9); // 2023 * 0.30
  });

  it("applies a percentage discount before VAT and margin", () => {
    const r = computePricing({
      lines: [{ description: "A", quantity: 1, unitCost: 500, markupPct: 1.0 }], // price 1000
      vatRate: 0.19,
      discountPct: 0.1,
      depositPct: 0,
    });
    expect(r.subtotalPrice).toBe(1000);
    expect(r.discountAmount).toBe(100);
    expect(r.netAfterDiscount).toBe(900);
    expect(r.profit).toBe(400); // 900 - 500
    expect(r.vatAmount).toBe(171);
    expect(r.totalGross).toBe(1071);
  });

  it("clamps a discount larger than the price (never negative net/margin)", () => {
    const r = computePricing({
      lines: [{ description: "A", quantity: 1, unitCost: 100, markupPct: 0 }], // price 100
      vatRate: 0.19,
      discountPct: 2, // 200% — absurd
      depositPct: 0,
    });
    expect(r.discountAmount).toBe(100);
    expect(r.netAfterDiscount).toBe(0);
    expect(r.vatAmount).toBe(0);
    expect(r.totalGross).toBe(0);
    expect(r.marginPct).toBe(0);
    expect(r.profit).toBe(-100); // gave away a 100-cost item for free
  });

  it("caps the deposit at the gross total", () => {
    const r = computePricing({
      lines: [{ description: "A", quantity: 1, unitCost: 100, markupPct: 0 }],
      vatRate: 0,
      discountPct: 0,
      depositPct: 5, // 500% — clamped to 100%
    });
    expect(r.totalGross).toBe(100);
    expect(r.depositDue).toBe(100);
  });

  it("handles VAT-exempt (non-payer) org with vatRate 0", () => {
    const r = computePricing({
      lines: [{ description: "A", quantity: 2, unitCost: 50, markupPct: 0.2 }],
      vatRate: 0,
      discountPct: 0,
      depositPct: 0,
    });
    expect(r.netAfterDiscount).toBe(120);
    expect(r.vatAmount).toBe(0);
    expect(r.totalGross).toBe(120);
  });
});
