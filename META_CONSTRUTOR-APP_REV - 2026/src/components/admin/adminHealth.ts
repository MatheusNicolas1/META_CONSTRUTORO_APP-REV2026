export type AdminHealthCheck = {
  label: string;
  ok: boolean;
  message: string;
};

export type AdminHealthSection = {
  title: string;
  description: string;
  checks: AdminHealthCheck[];
};

export type IngestionAgeAlert = {
  label: string;
  minutes: number;
  message: string;
} | null;

export const isHealthSectionOk = (section: AdminHealthSection) =>
  section.checks.length > 0 && section.checks.every((check) => check.ok);

export const buildHealthSummary = (sections: AdminHealthSection[]) => {
  const totalChecks = sections.reduce((total, section) => total + section.checks.length, 0);
  const failedChecks = sections.reduce(
    (total, section) => total + section.checks.filter((check) => !check.ok).length,
    0,
  );

  return {
    totalChecks,
    failedChecks,
    status: failedChecks === 0 ? "operational" : "attention",
  };
};
