import { describe, expect, it } from "vitest";
import {
  availableStock,
  computeStockAfterMovement,
  getStockStatus,
} from "./stock";

describe("availableStock", () => {
  it("subtracts reserved from on-hand", () => {
    expect(availableStock({ quantity: 10, reserved_quantity: 3 })).toBe(7);
  });
});

describe("computeStockAfterMovement", () => {
  it("rejects zero or negative quantities", () => {
    const r = computeStockAfterMovement({ quantity: 5, reserved_quantity: 0 }, "in", 0);
    expect(r.ok).toBe(false);
    const r2 = computeStockAfterMovement({ quantity: 5, reserved_quantity: 0 }, "in", -2);
    expect(r2.ok).toBe(false);
  });

  it("rejects non-finite quantities", () => {
    const r = computeStockAfterMovement({ quantity: 5, reserved_quantity: 0 }, "in", NaN);
    expect(r.ok).toBe(false);
  });

  it("adds units on stock in", () => {
    const r = computeStockAfterMovement({ quantity: 5, reserved_quantity: 1 }, "in", 10);
    expect(r).toEqual({ ok: true, levels: { quantity: 15, reserved_quantity: 1 } });
  });

  it("removes unreserved units on stock out", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 2 }, "out", 5);
    expect(r).toEqual({ ok: true, levels: { quantity: 5, reserved_quantity: 2 } });
  });

  it("prevents stock out below the reserved hold", () => {
    // 10 on hand, 8 reserved → only 2 available; removing 3 must fail
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 8 }, "out", 3);
    expect(r.ok).toBe(false);
  });

  it("allows stock out of exactly the available amount", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 8 }, "out", 2);
    expect(r).toEqual({ ok: true, levels: { quantity: 8, reserved_quantity: 8 } });
  });

  it("reserves up to the available amount", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 2 }, "reserve", 8);
    expect(r).toEqual({ ok: true, levels: { quantity: 10, reserved_quantity: 10 } });
  });

  it("prevents reserving more than is available", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 5 }, "reserve", 6);
    expect(r.ok).toBe(false);
  });

  it("releases reserved units back to available", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 6 }, "release", 4);
    expect(r).toEqual({ ok: true, levels: { quantity: 10, reserved_quantity: 2 } });
  });

  it("prevents releasing more than is reserved", () => {
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 3 }, "release", 4);
    expect(r.ok).toBe(false);
  });

  it("never lets a sequence of valid moves go negative or over-reserve", () => {
    let levels = { quantity: 0, reserved_quantity: 0 };
    const step = (type: Parameters<typeof computeStockAfterMovement>[1], qty: number) => {
      const r = computeStockAfterMovement(levels, type, qty);
      if (r.ok) levels = r.levels;
      return r.ok;
    };
    expect(step("in", 20)).toBe(true);
    expect(step("reserve", 15)).toBe(true);
    expect(step("out", 6)).toBe(false); // only 5 available
    expect(step("out", 5)).toBe(true);
    expect(step("release", 15)).toBe(true);
    expect(levels).toEqual({ quantity: 15, reserved_quantity: 0 });
  });
});

describe("computeStockAfterMovement — fractional units", () => {
  it("handles decimal quantities (e.g. metres of fabric)", () => {
    const r = computeStockAfterMovement({ quantity: 12.5, reserved_quantity: 2.5 }, "out", 3.25);
    expect(r).toEqual({ ok: true, levels: { quantity: 9.25, reserved_quantity: 2.5 } });
  });

  it("blocks a fractional out that exceeds available by a hair", () => {
    // available = 10 - 7.5 = 2.5; removing 2.51 must fail
    const r = computeStockAfterMovement({ quantity: 10, reserved_quantity: 7.5 }, "out", 2.51);
    expect(r.ok).toBe(false);
  });
});

describe("getStockStatus", () => {
  it("is 'out' when nothing is available", () => {
    expect(getStockStatus({ quantity: 5, reserved_quantity: 5 }, 2)).toBe("out");
    expect(getStockStatus({ quantity: 0, reserved_quantity: 0 }, null)).toBe("out");
  });

  it("is 'low' when available is at or below the threshold", () => {
    expect(getStockStatus({ quantity: 3, reserved_quantity: 0 }, 3)).toBe("low");
    expect(getStockStatus({ quantity: 2, reserved_quantity: 0 }, 3)).toBe("low");
  });

  it("is 'ok' when above the threshold", () => {
    expect(getStockStatus({ quantity: 10, reserved_quantity: 0 }, 3)).toBe("ok");
  });

  it("is 'ok' when in stock and no threshold is set", () => {
    expect(getStockStatus({ quantity: 1, reserved_quantity: 0 }, null)).toBe("ok");
  });
});
