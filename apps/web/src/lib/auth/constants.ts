/**
 * Shared authentication and routing constants. Centralized to avoid magic
 * strings across the proxy, server actions, and route handlers.
 */

export const LOGIN_PATH = "/login";
export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const AUTH_ERROR_PATH = "/login";

export const PUBLIC_PATH_PREFIXES = [LOGIN_PATH, "/auth"] as const;

export const CURRENT_ORG_COOKIE = "mali_current_org";
export const REDIRECT_QUERY_PARAM = "redirectTo";
