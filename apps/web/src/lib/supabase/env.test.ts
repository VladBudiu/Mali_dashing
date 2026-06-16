import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("getSupabaseEnv", () => {
  it("should report unconfigured when both vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabaseEnv } = await import("./env");

    expect(getSupabaseEnv()).toEqual({ configured: false });
  });

  it("should report unconfigured when only the URL is present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabaseEnv } = await import("./env");

    expect(getSupabaseEnv()).toEqual({ configured: false });
  });

  it("should report configured when both vars are present and valid", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-value";
    const { getSupabaseEnv } = await import("./env");

    expect(getSupabaseEnv()).toEqual({
      configured: true,
      url: "https://example.supabase.co",
      anonKey: "anon-key-value",
    });
  });

  it("should throw when the URL is present but malformed", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-value";
    const { getSupabaseEnv } = await import("./env");

    expect(() => getSupabaseEnv()).toThrow();
  });
});
