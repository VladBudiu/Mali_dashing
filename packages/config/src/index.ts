/**
 * Shared, non-secret application configuration constants for Mali Dash.
 * Secrets and environment-specific values never belong here — see `.env.example`.
 */

export const APP_NAME = "Mali Dash";
export const APP_DESCRIPTION =
  "Mobile-first operations dashboard for an event decoration business.";

export const BASE_REPORTING_CURRENCY = "RON" as const;

export const SUPPORTED_CURRENCIES = ["RON", "EUR"] as const;

export const EXCHANGE_RATE_SOURCE_PRIORITY = ["BNR", "ECB"] as const;

export const DEFAULT_COUNTRY_CODE = "RO" as const;

export const DEFAULT_LOCALE = "ro-RO" as const;

export const MONEY_DISPLAY_DECIMALS = 2;
export const FX_INTERNAL_DECIMALS = 6;
