export type AdminRouteConversionRow = {
  route: string;
  views: number;
  users: number;
  lastSeen: string | null;
};

export const getAdminRouteShare = (views: number, totalViews: number) => {
  if (views <= 0 || totalViews <= 0) return 0;
  return views / totalViews;
};

export const getAdminRouteViewsPerUser = (views: number, users: number) => {
  if (views <= 0 || users <= 0) return 0;
  return views / users;
};

export const getAdminRouteBarWidth = (views: number, maxViews: number) => {
  if (views <= 0) return 0;
  return Math.max((views / Math.max(maxViews, 1)) * 100, 6);
};
