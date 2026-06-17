import { describe, expect, it } from "vitest";
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLOR, ALL_EVENT_STATUSES } from "./status";
import type { EventStatus } from "@mali/types";

describe("EVENT_STATUS_LABELS", () => {
  it("should have a label for every status in ALL_EVENT_STATUSES", () => {
    for (const status of ALL_EVENT_STATUSES) {
      expect(EVENT_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("should return human-readable label for common statuses", () => {
    expect(EVENT_STATUS_LABELS["draft"]).toBe("Draft");
    expect(EVENT_STATUS_LABELS["in_progress"]).toBe("In progress");
    expect(EVENT_STATUS_LABELS["completed"]).toBe("Completed");
    expect(EVENT_STATUS_LABELS["cancelled"]).toBe("Cancelled");
  });
});

describe("EVENT_STATUS_COLOR", () => {
  it("should have a color for every status", () => {
    for (const status of ALL_EVENT_STATUSES) {
      expect(EVENT_STATUS_COLOR[status]).toBeTruthy();
    }
  });

  it("should map terminal positive statuses to success", () => {
    const successStatuses: EventStatus[] = ["completed", "invoiced_final", "paid"];
    for (const status of successStatuses) {
      expect(EVENT_STATUS_COLOR[status]).toBe("success");
    }
  });

  it("should map cancelled to error", () => {
    expect(EVENT_STATUS_COLOR["cancelled"]).toBe("error");
  });

  it("should map warning states correctly", () => {
    expect(EVENT_STATUS_COLOR["deposit_pending"]).toBe("warning");
    expect(EVENT_STATUS_COLOR["postponed"]).toBe("warning");
  });
});

describe("ALL_EVENT_STATUSES", () => {
  it("should contain exactly 17 statuses", () => {
    expect(ALL_EVENT_STATUSES).toHaveLength(17);
  });

  it("should include all blueprint statuses", () => {
    const required: EventStatus[] = [
      "draft", "inquiry", "quoted", "accepted", "deposit_pending",
      "scheduled", "in_preparation", "in_progress", "completed",
      "invoiced_final", "paid", "archived", "cancelled", "postponed",
      "requires_review", "over_budget", "documents_missing",
    ];
    for (const status of required) {
      expect(ALL_EVENT_STATUSES).toContain(status);
    }
  });
});
