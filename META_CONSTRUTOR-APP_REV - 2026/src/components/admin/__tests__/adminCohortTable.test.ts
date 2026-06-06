import { describe, expect, it } from "vitest";
import {
  buildAdminPlanCohortRows,
  getAdminCohortRate,
  isAdminCohortRetained,
} from "../adminCohortUtils";

describe("admin cohort table helpers", () => {
  it("calculates retention windows from first and last events", () => {
    expect(isAdminCohortRetained("2026-06-01T00:00:00.000Z", "2026-06-02T00:00:00.000Z", 1)).toBe(true);
    expect(isAdminCohortRetained("2026-06-01T00:00:00.000Z", "2026-06-07T23:59:59.000Z", 7)).toBe(false);
    expect(isAdminCohortRetained("2026-06-01T00:00:00.000Z", "2026-07-01T00:00:00.000Z", 30)).toBe(true);
  });

  it("calculates retention rate with safe zero handling", () => {
    expect(getAdminCohortRate(5, 10)).toBe(0.5);
    expect(getAdminCohortRate(5, 0)).toBe(0);
    expect(getAdminCohortRate(0, 10)).toBe(0);
  });

  it("groups cohort rows by plan", () => {
    const rows = buildAdminPlanCohortRows([
      {
        plan_type: "basic",
        first_event_at: "2026-06-01T00:00:00.000Z",
        last_event_at: "2026-06-09T00:00:00.000Z",
      },
      {
        plan_type: "basic",
        first_event_at: "2026-06-01T00:00:00.000Z",
        last_event_at: "2026-06-01T12:00:00.000Z",
      },
      {
        plan_type: "enterprise",
        first_event_at: "2026-06-01T00:00:00.000Z",
        last_event_at: "2026-07-01T00:00:00.000Z",
      },
    ]);

    expect(rows[0]).toMatchObject({ key: "basic", users: 2, retainedD1: 1, retainedD7: 1, retainedD30: 0 });
    expect(rows[1]).toMatchObject({ key: "enterprise", users: 1, retainedD1: 1, retainedD7: 1, retainedD30: 1 });
  });
});
