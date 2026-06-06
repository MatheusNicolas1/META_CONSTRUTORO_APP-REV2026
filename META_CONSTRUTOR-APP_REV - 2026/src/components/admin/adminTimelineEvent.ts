export type AdminTimelineEvent = {
  event?: string | null;
  route?: string | null;
  source?: string | null;
  created_at?: string | null;
};

export const getAdminTimelineEventLabel = (event: AdminTimelineEvent) => event.event || "evento";

export const getAdminTimelineEventMeta = (
  event: AdminTimelineEvent,
  formatDate: (value?: string | null) => string,
) => `${event.route || event.source || "sem rota"} - ${formatDate(event.created_at)}`;
