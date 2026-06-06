export type AdminSegmentTableRow = {
  key: string;
  label: string;
  description: string;
  users: number;
  totalEvents: number;
  routeViews: number;
  interactions: number;
};

export const getAdminSegmentShare = (users: number, totalUsers: number) => {
  if (users <= 0 || totalUsers <= 0) return 0;
  return users / totalUsers;
};

export const getAdminSegmentAverage = (value: number, users: number) => {
  if (value <= 0 || users <= 0) return 0;
  return value / users;
};

export const getAdminSegmentBarWidth = (users: number, maxUsers: number) => {
  if (users <= 0 || maxUsers <= 0) return 0;
  return Math.max((users / maxUsers) * 100, 6);
};
