import { describe, expect, it } from "vitest";
import { assertNever, clamp, isDefined } from "./index";

describe("isDefined", () => {
  it("should return false when value is null", () => {
    expect(isDefined(null)).toBe(false);
  });

  it("should return false when value is undefined", () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it("should return true when value is a falsy-but-defined value", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("")).toBe(true);
    expect(isDefined(false)).toBe(true);
  });
});

describe("clamp", () => {
  it("should return the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("should clamp to the minimum when below range", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("should clamp to the maximum when above range", () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("should throw RangeError when min exceeds max", () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe("assertNever", () => {
  it("should throw with the provided message", () => {
    expect(() => assertNever("x" as never, "boom")).toThrow("boom");
  });
});
