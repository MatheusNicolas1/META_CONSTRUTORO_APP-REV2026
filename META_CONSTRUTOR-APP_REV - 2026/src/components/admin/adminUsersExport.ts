import type { AdminFiltersState } from "./AdminFilters";

export const ADMIN_USERS_EXPORT_LIMIT = 500;

export type AdminUsersExportRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  plan_type: string | null;
  plan_name: string | null;
  roles: string[];
  activity_segment: string;
  risk_level: string;
  orgs: Array<{ id: string; name: string | null; slug: string | null }>;
  last_event_at: string | null;
  acquisition_source?: string | null;
  acquisition_campaign?: string | null;
  acquisition_ref?: string | null;
};

export type AdminUsersExportFilters = {
  planFilter: string;
  roleFilter: string;
  activityFilter: string;
  riskFilter: string;
  statusFilter: string;
  global: AdminFiltersState;
};

export const safeCsvText = (value: unknown) =>
  String(value || "")
    .replace(/"/g, '""')
    .trim();

export const buildAdminUsersCsv = (rows: AdminUsersExportRow[]) => {
  const headers = ["id", "nome", "email", "empresa", "plano", "roles", "atividade", "risco", "origem", "campanha", "referencia", "orgs", "ultimo_evento"];
  return [
    headers.join(","),
    ...rows.map((user) =>
      [
        user.id,
        `"${safeCsvText(user.name)}"`,
        `"${safeCsvText(user.email)}"`,
        `"${safeCsvText(user.company)}"`,
        `"${safeCsvText(user.plan_type || user.plan_name)}"`,
        `"${safeCsvText(user.roles.join(" | "))}"`,
        user.activity_segment,
        user.risk_level,
        `"${safeCsvText(user.acquisition_source)}"`,
        `"${safeCsvText(user.acquisition_campaign)}"`,
        `"${safeCsvText(user.acquisition_ref)}"`,
        `"${safeCsvText(user.orgs.map((org) => org.name || org.slug || org.id).join(" | "))}"`,
        user.last_event_at || "",
      ].join(","),
    ),
  ].join("\n");
};

export const buildAdminUsersExportAuditDetails = ({
  exportedCount,
  totalFiltered,
  filters,
}: {
  exportedCount: number;
  totalFiltered: number;
  filters: AdminUsersExportFilters;
}) => ({
  exported_count: exportedCount,
  total_filtered: totalFiltered,
  limit: ADMIN_USERS_EXPORT_LIMIT,
  filters,
});
