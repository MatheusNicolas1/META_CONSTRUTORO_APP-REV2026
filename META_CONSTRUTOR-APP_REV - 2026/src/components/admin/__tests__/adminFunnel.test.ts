import { describe, expect, it } from "vitest";
import {
  getAdminFunnelConversion,
  getAdminFunnelMaxValue,
  getAdminFunnelWidth,
  type AdminFunnelStep,
} from "../adminFunnelUtils";

describe("admin funnel helpers", () => {
  it("keeps max value at least one to avoid division by zero", () => {
    const emptySteps: AdminFunnelStep[] = [
      { label: "Visitantes", value: 0 },
      { label: "Cadastros", value: 0 },
    ];

    expect(getAdminFunnelMaxValue(emptySteps)).toBe(1);
  });

  it("computes a minimum visible width for positive values", () => {
    expect(getAdminFunnelWidth(0, 100)).toBe(0);
    expect(getAdminFunnelWidth(1, 1000)).toBe(6);
    expect(getAdminFunnelWidth(50, 100)).toBe(50);
  });

  it("computes conversion and returns null without a previous base", () => {
    expect(getAdminFunnelConversion(25, 100)).toBe(0.25);
    expect(getAdminFunnelConversion(25, 0)).toBeNull();
  });
});
