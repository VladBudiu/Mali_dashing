"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@mali/types";

/**
 * Creates a browser Supabase client from public env vars. Returns null when the
 * env vars are absent so client components can render without credentials.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
