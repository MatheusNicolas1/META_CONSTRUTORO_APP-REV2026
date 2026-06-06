import { describe, expect, it } from "vitest";
import {
  ADMIN_USERS_EXPORT_LIMIT,
  buildAdminUsersCsv,
  buildAdminUsersExportAuditDetails,
  safeCsvText,
  type AdminUsersExportFilters,
  type AdminUsersExportRow,
} from "../adminUsersExport";

const filters: AdminUsersExportFilters = {
  planFilter: "professional",
  roleFilter: "Administrador",
  activityFilter: "active_7d",
  riskFilter: "medium",
  statusFilter: "active",
  global: {
    period: "30d",
    plan: "professional",
    role: "Administrador",
    campaign: "meta",
    source: "ads",
    route: "/app/admin/dashboard",
    org: "meta-construtor",
  },
};

const rows: AdminUsersExportRow[] = [
  {
    id: "user-1",
    name: 'Maria "Admin"',
    email: "maria@example.com",
    company: "Construtora A",
    plan_type: "professional",
    plan_name: null,
    roles: ["Presidente", "Administrador"],
    activity_segment: "active_7d",
    risk_level: "medium",
    acquisition_source: "google",
    acquisition_campaign: "obra_digital",
    acquisition_ref: "parceiro-a",
    orgs: [{ id: "org-1", name: "Meta Org", slug: "meta-org" }],
    last_event_at: "2026-06-03T10:00:00.000Z",
  },
];

describe("admin users export helpers", () => {
  it("escapes quotes in CSV cells", () => {
    expect(safeCsvText(rows[0].name)).toBe('Maria ""Admin""');
  });

  it("builds CSV with expected columns and escaped values", () => {
    const csv = buildAdminUsersCsv(rows);

    expect(csv.split("\n")[0]).toBe("id,nome,email,empresa,plano,roles,atividade,risco,origem,campanha,referencia,orgs,ultimo_evento");
    expect(csv).toContain('"Maria ""Admin"""');
    expect(csv).toContain('"Presidente | Administrador"');
    expect(csv).toContain('"google","obra_digital","parceiro-a"');
    expect(csv).toContain('"Meta Org"');
  });

  it("builds audit details with export limit and filters", () => {
    const details = buildAdminUsersExportAuditDetails({
      exportedCount: 1,
      totalFiltered: 25,
      filters,
    });

    expect(details).toEqual({
      exported_count: 1,
      total_filtered: 25,
      limit: ADMIN_USERS_EXPORT_LIMIT,
      filters,
    });
  });
});
