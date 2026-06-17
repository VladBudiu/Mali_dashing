import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_ERROR_PATH, REDIRECT_QUERY_PARAM } from "@/lib/auth/constants";
import { safeRedirectPath } from "@/lib/auth/routing";

/**
 * Magic-link landing route: exchanges the one-time code for a session, sets the
 * auth cookies, and forwards the user to their intended destination. On failure
 * it redirects back to the login page with an error marker.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get(REDIRECT_QUERY_PARAM));

  if (!code) {
    return NextResponse.redirect(new URL(`${AUTH_ERROR_PATH}?error=auth`, origin));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL(`${AUTH_ERROR_PATH}?error=auth`, origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`${AUTH_ERROR_PATH}?error=auth`, origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
