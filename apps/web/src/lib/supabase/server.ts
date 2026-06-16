import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@mali/types";
import { getSupabaseEnv } from "./env";

/**
 * Creates a request-scoped Supabase client bound to the user's session cookies.
 * Returns null when Supabase env vars are absent so callers can degrade safely.
 *
 * This client uses the anon key only and relies on Row Level Security. The
 * service-role key must never be used here (see docs/security/README.md).
 */
export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();

  if (!env.configured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
