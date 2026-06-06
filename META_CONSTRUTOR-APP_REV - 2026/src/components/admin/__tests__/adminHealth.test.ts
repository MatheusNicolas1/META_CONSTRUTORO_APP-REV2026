import { describe, expect, it } from "vitest";
import { buildHealthSummary, isHealthSectionOk, type AdminHealthSection } from "../adminHealth";

const healthySection: AdminHealthSection = {
  title: "Tracking",
  description: "Eventos",
  checks: [
    { label: "analytics_events", ok: true, message: "Leitura concluida" },
    { label: "user_interactions", ok: true, message: "Leitura concluida" },
  ],
};

const degradedSection: AdminHealthSection = {
  title: "Operacao",
  description: "Edge Functions",
  checks: [
    { label: "health-check", ok: true, message: "status ok" },
    { label: "admin_audit_logs", ok: false, message: "permission denied" },
  ],
};

describe("admin health helpers", () => {
  it("marks a section as healthy only when every check is ok", () => {
    expect(isHealthSectionOk(healthySection)).toBe(true);
    expect(isHealthSectionOk(degradedSection)).toBe(false);
  });

  it("builds an operational summary when all checks pass", () => {
    expect(buildHealthSummary([healthySection])).toEqual({
      totalChecks: 2,
      failedChecks: 0,
      status: "operational",
    });
  });

  it("builds an attention summary when any check fails", () => {
    expect(buildHealthSummary([healthySection, degradedSection])).toEqual({
      totalChecks: 4,
      failedChecks: 1,
      status: "attention",
    });
  });
});
