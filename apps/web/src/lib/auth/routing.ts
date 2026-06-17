import { DEFAULT_AUTHENTICATED_PATH, PUBLIC_PATH_PREFIXES } from "./constants";

/**
 * True when a pathname belongs to a public (unauthenticated) area: the login
 * page or any /auth/* route. Matches a prefix exactly or as a path segment so
 * that "/loginx" is not mistaken for "/login".
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Sanitizes a post-login redirect target to prevent open redirects. Only
 * accepts same-origin absolute paths. Anything protocol-relative ("//host" or
 * "/\\host", which browsers may normalize to a foreign origin) or otherwise
 * non-internal falls back to the default authenticated path.
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (
    value &&
    value.startsWith("/") &&
    value[1] !== "/" &&
    value[1] !== "\\"
  ) {
    return value;
  }
  return DEFAULT_AUTHENTICATED_PATH;
}
