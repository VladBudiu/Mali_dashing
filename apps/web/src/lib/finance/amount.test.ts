import { describe, expect, it } from "vitest";
import { resolveAmountRon } from "./amount";

describe("resolveAmountRon", () => {
  it("uses the amount directly for RON", () => {
    expect(resolveAmountRon("RON", 250, null)).toBe(250);
    expect(resolveAmountRon("RON", 250, 999)).toBe(250); // ignores any provided ron
  });

  it("uses the provided RON equivalent for foreign currency", () => {
    expect(resolveAmountRon("EUR", 100, 497)).toBe(497);
  });

  it("returns null for foreign currency with no RON equivalent", () => {
    expect(resolveAmountRon("EUR", 100, null)).toBeNull();
    expect(resolveAmountRon("EUR", 100, undefined)).toBeNull();
  });
});
