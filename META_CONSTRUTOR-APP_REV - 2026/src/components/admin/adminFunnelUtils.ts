export type AdminFunnelStep = {
  label: string;
  value: number;
  source?: string;
};

export const getAdminFunnelMaxValue = (steps: AdminFunnelStep[]) =>
  Math.max(...steps.map((step) => Number(step.value || 0)), 1);

export const getAdminFunnelWidth = (value: number, maxValue: number) => {
  if (value <= 0) return 0;
  return Math.max((value / Math.max(maxValue, 1)) * 100, 6);
};

export const getAdminFunnelConversion = (current: number, previous: number) => {
  if (previous <= 0) return null;
  return current / previous;
};
