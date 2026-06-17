import type { EventStatus } from "@mali/types";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  inquiry: "Inquiry",
  quoted: "Quoted",
  accepted: "Accepted",
  deposit_pending: "Deposit pending",
  scheduled: "Scheduled",
  in_preparation: "In preparation",
  in_progress: "In progress",
  completed: "Completed",
  invoiced_final: "Invoiced",
  paid: "Paid",
  archived: "Archived",
  cancelled: "Cancelled",
  postponed: "Postponed",
  requires_review: "Requires review",
  over_budget: "Over budget",
  documents_missing: "Documents missing",
};

export const EVENT_STATUS_COLOR: Record<EventStatus, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  draft: "default",
  inquiry: "info",
  quoted: "info",
  accepted: "primary",
  deposit_pending: "warning",
  scheduled: "primary",
  in_preparation: "primary",
  in_progress: "primary",
  completed: "success",
  invoiced_final: "success",
  paid: "success",
  archived: "default",
  cancelled: "error",
  postponed: "warning",
  requires_review: "warning",
  over_budget: "error",
  documents_missing: "warning",
};

export const ALL_EVENT_STATUSES: EventStatus[] = [
  "draft", "inquiry", "quoted", "accepted", "deposit_pending",
  "scheduled", "in_preparation", "in_progress", "completed",
  "invoiced_final", "paid", "archived", "cancelled", "postponed",
  "requires_review", "over_budget", "documents_missing",
];
