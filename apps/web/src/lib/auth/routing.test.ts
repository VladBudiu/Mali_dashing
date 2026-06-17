import { describe, expect, it } from "vitest";
import { isPublicPath, safeRedirectPath } from "./routing";
import { DEFAULT_AUTHENTICATED_PATH } from "./constants";

describe("isPublicPath", () => {
  it("should treat the login path as public", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it("should treat auth callback routes as public", () => {
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("should treat protected app routes as not public", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/settings")).toBe(false);
  });

  it("should not match a prefix that is only a substring of a segment", () => {
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isPublicPath("/authentication")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("should accept a same-origin absolute path", () => {
    expect(safeRedirectPath("/events/123")).toBe("/events/123");
  });

  it("should fall back to the default for null or undefined", () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_AUTHENTICATED_PATH);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_AUTHENTICATED_PATH);
  });

  it("should reject protocol-relative URLs (//host)", () => {
    expect(safeRedirectPath("//evil.com")).toBe(DEFAULT_AUTHENTICATED_PATH);
  });

  it("should reject backslash protocol-relative URLs (/\\host)", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe(DEFAULT_AUTHENTICATED_PATH);
  });

  it("should reject absolute external URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe(
      DEFAULT_AUTHENTICATED_PATH,
    );
  });

  it("should reject values that do not start with a slash", () => {
    expect(safeRedirectPath("dashboard")).toBe(DEFAULT_AUTHENTICATED_PATH);
    expect(safeRedirectPath("")).toBe(DEFAULT_AUTHENTICATED_PATH);
  });
});
