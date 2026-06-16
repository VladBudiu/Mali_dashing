/**
 * Shared domain types for Mali Dash, derived from PROJECT_SOURCE_OF_TRUTH.md.
 * These are framework-agnostic and safe to import from anywhere.
 */

import type { SUPPORTED_CURRENCIES } from "@mali/config";

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export type UserRole =
  | "owner"
  | "partner"
  | "collaborator"
  | "accountant"
  | "client";

export type EventStatus =
  | "draft"
  | "inquiry"
  | "quoted"
  | "accepted"
  | "deposit_pending"
  | "scheduled"
  | "in_preparation"
  | "in_progress"
  | "completed"
  | "invoiced_final"
  | "paid"
  | "archived"
  | "cancelled"
  | "postponed"
  | "requires_review"
  | "over_budget"
  | "documents_missing";

export type PricingMode = "cost_plus" | "target_margin" | "fixed";

export type DepositType = "percent_gross" | "percent_net" | "fixed";

export type ExchangeRateSource = "BNR" | "ECB" | "MANUAL";

export type { Database } from "./database";
