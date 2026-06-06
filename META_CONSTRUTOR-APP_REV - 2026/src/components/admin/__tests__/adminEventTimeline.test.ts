import { describe, expect, it } from "vitest";
import {
  getAdminTimelineEventLabel,
  getAdminTimelineEventMeta,
  type AdminTimelineEvent,
} from "../adminTimelineEvent";

const formatDate = (value?: string | null) => value || "sem data";

describe("admin event timeline helpers", () => {
  it("uses the event name as label when available", () => {
    expect(getAdminTimelineEventLabel({ event: "app.route_viewed" })).toBe("app.route_viewed");
  });

  it("falls back to generic event label", () => {
    expect(getAdminTimelineEventLabel({ event: null })).toBe("evento");
  });

  it("builds meta from route, source and date fallback", () => {
    const withRoute: AdminTimelineEvent = {
      route: "/app/admin/dashboard",
      source: "frontend",
      created_at: "2026-06-03T12:00:00.000Z",
    };
    const withSource: AdminTimelineEvent = {
      source: "backend",
      created_at: null,
    };

    expect(getAdminTimelineEventMeta(withRoute, formatDate)).toBe("/app/admin/dashboard - 2026-06-03T12:00:00.000Z");
    expect(getAdminTimelineEventMeta(withSource, formatDate)).toBe("backend - sem data");
    expect(getAdminTimelineEventMeta({}, formatDate)).toBe("sem rota - sem data");
  });
});
