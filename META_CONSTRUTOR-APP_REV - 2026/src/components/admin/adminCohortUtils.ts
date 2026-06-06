export type AdminCohortSourceUser = {
  first_event_at?: string | null;
  last_event_at?: string | null;
  plan_type?: string | null;
};

export type AdminCohortTableRow = {
  key: string;
  label: string;
  users: number;
  retainedD1: number;
  retainedD7: number;
  retainedD30: number;
};

const dayInMs = 24 * 60 * 60 * 1000;

const parseTimestamp = (value?: string | null) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const isAdminCohortRetained = (
  firstEventAt: string | null | undefined,
  lastEventAt: string | null | undefined,
  days: number
) => {
  const firstTimestamp = parseTimestamp(firstEventAt);
  const lastTimestamp = parseTimestamp(lastEventAt);

  if (firstTimestamp === null || lastTimestamp === null || days < 0) return false;
  return lastTimestamp - firstTimestamp >= days * dayInMs;
};

export const getAdminCohortRate = (retained: number, users: number) => {
  if (retained <= 0 || users <= 0) return 0;
  return retained / users;
};

export const buildAdminPlanCohortRows = (users: AdminCohortSourceUser[]) => {
  const rowsByPlan = new Map<string, AdminCohortTableRow>();

  users.forEach((user) => {
    const key = user.plan_type || "sem_plano";
    const row = rowsByPlan.get(key) || {
      key,
      label: user.plan_type || "Sem plano",
      users: 0,
      retainedD1: 0,
      retainedD7: 0,
      retainedD30: 0,
    };

    row.users += 1;
    if (isAdminCohortRetained(user.first_event_at, user.last_event_at, 1)) row.retainedD1 += 1;
    if (isAdminCohortRetained(user.first_event_at, user.last_event_at, 7)) row.retainedD7 += 1;
    if (isAdminCohortRetained(user.first_event_at, user.last_event_at, 30)) row.retainedD30 += 1;

    rowsByPlan.set(key, row);
  });

  return Array.from(rowsByPlan.values()).sort((a, b) => b.users - a.users);
};
