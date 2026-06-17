import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated user for the current request, or null when there
 * is no session or Supabase is not configured. Always verifies the session
 * against the auth server via getUser (never trusts the unverified cookie).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
