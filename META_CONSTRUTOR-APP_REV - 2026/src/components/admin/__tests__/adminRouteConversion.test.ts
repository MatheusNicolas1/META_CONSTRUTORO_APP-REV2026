import { describe, expect, it } from "vitest";
import {
  getAdminRouteBarWidth,
  getAdminRouteShare,
  getAdminRouteViewsPerUser,
} from "../adminRouteConversionUtils";

describe("admin route conversion helpers", () => {
  it("calculates route share safely", () => {
    expect(getAdminRouteShare(25, 100)).toBe(0.25);
    expect(getAdminRouteShare(25, 0)).toBe(0);
    expect(getAdminRouteShare(0, 100)).toBe(0);
  });

  it("calculates views per user safely", () => {
    expect(getAdminRouteViewsPerUser(50, 10)).toBe(5);
    expect(getAdminRouteViewsPerUser(50, 0)).toBe(0);
  });

  it("keeps positive bars visible", () => {
    expect(getAdminRouteBarWidth(0, 100)).toBe(0);
    expect(getAdminRouteBarWidth(1, 1000)).toBe(6);
    expect(getAdminRouteBarWidth(50, 100)).toBe(50);
  });
});
