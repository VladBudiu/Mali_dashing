import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@mali/types";

export type SessionRefreshResult = {
  response: NextResponse;
  userId: string | null;
};

/**
 * Refreshes the Supabase auth session for an incoming request and returns a
 * response carrying any rotated auth cookies, plus the resolved user id.
 *
 * Uses the public anon key only (browser-safe, RLS-enforced). When Supabase
 * env vars are absent the session is treated as anonymous so the app still
 * serves. Reads the public env directly to stay decoupled from the
 * server-only config module, matching the browser client.
 */
export async function updateSession(
  request: NextRequest,
): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { response, userId: null };
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
