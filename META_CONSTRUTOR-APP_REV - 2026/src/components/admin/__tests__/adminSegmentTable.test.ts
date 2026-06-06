import { describe, expect, it } from "vitest";
import {
  getAdminSegmentAverage,
  getAdminSegmentBarWidth,
  getAdminSegmentShare,
} from "../adminSegmentUtils";

describe("admin segment table helpers", () => {
  it("calculates segment share with safe zero handling", () => {
    expect(getAdminSegmentShare(25, 100)).toBe(0.25);
    expect(getAdminSegmentShare(25, 0)).toBe(0);
    expect(getAdminSegmentShare(0, 100)).toBe(0);
  });

  it("calculates per-user averages with safe zero handling", () => {
    expect(getAdminSegmentAverage(50, 10)).toBe(5);
    expect(getAdminSegmentAverage(50, 0)).toBe(0);
    expect(getAdminSegmentAverage(0, 10)).toBe(0);
  });

  it("keeps a minimum visible bar for non-empty segments", () => {
    expect(getAdminSegmentBarWidth(0, 100)).toBe(0);
    expect(getAdminSegmentBarWidth(1, 1000)).toBe(6);
    expect(getAdminSegmentBarWidth(50, 100)).toBe(50);
  });
});
