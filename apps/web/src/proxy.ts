import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import {
  DEFAULT_AUTHENTICATED_PATH,
  LOGIN_PATH,
  REDIRECT_QUERY_PARAM,
} from "@/lib/auth/constants";
import { isPublicPath } from "@/lib/auth/routing";

function redirectPreservingCookies(
  url: URL,
  source: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

/**
 * Runs on every matched request: refreshes the Supabase session and enforces
 * route protection. Unauthenticated users are sent to the login page with a
 * return path; authenticated users are kept out of the auth routes.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = userId !== null;
  const onPublicPath = isPublicPath(pathname);

  if (!isAuthenticated && !onPublicPath) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set(REDIRECT_QUERY_PARAM, `${pathname}${search}`);
    return redirectPreservingCookies(loginUrl, response);
  }

  if (isAuthenticated && pathname === LOGIN_PATH) {
    const homeUrl = new URL(DEFAULT_AUTHENTICATED_PATH, request.url);
    return redirectPreservingCookies(homeUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
