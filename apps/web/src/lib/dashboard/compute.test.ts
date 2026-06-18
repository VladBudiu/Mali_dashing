import { describe, expect, it } from "vitest";
import { cashBalanceRON, countUpcoming, countLowStock } from "./compute";

describe("cashBalanceRON", () => {
  it("nets income against expense, preferring amount_ron", () => {
    const txns = [
      { type: "income", amount: 100, amount_ron: 500 }, // 500
      { type: "expense", amount: 200, amount_ron: null }, // -200
      { type: "income", amount: 50, amount_ron: null }, // +50
    ];
    expect(cashBalanceRON(txns)).toBe(350);
  });

  it("is 0 for no transactions", () => {
    expect(cashBalanceRON([])).toBe(0);
  });

  it("ignores unknown types", () => {
    expect(cashBalanceRON([{ type: "weird", amount: 9, amount_ron: 9 }])).toBe(0);
  });
});

describe("countUpcoming", () => {
  const events = [
    { event_date: "2026-06-10" },
    { event_date: "2026-06-18" },
    { event_date: "2026-07-01" },
  ];
  it("counts events on or after today", () => {
    expect(countUpcoming(events, "2026-06-18")).toBe(2);
  });
  it("counts all when today is in the past", () => {
    expect(countUpcoming(events, "2026-01-01")).toBe(3);
  });
});

describe("countLowStock", () => {
  it("counts low and out-of-stock items", () => {
    const items = [
      { quantity: 10, reserved_quantity: 0, reorder_threshold: 3 }, // ok
      { quantity: 2, reserved_quantity: 0, reorder_threshold: 3 }, // low
      { quantity: 5, reserved_quantity: 5, reorder_threshold: null }, // out (available 0)
    ];
    expect(countLowStock(items)).toBe(2);
  });
});
