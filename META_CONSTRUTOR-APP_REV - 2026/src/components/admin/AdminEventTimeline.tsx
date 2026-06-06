import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  getAdminTimelineEventLabel,
  getAdminTimelineEventMeta,
  type AdminTimelineEvent,
} from "./adminTimelineEvent";

type AdminEventTimelineProps = {
  events: AdminTimelineEvent[];
  isLoading?: boolean;
  emptyLabel?: string;
  formatDate: (value?: string | null) => string;
};

const AdminEventTimeline = ({
  events,
  isLoading = false,
  emptyLabel = "Sem eventos recentes.",
  formatDate,
}: AdminEventTimelineProps) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={`${event.event || "evento"}-${event.created_at || "sem-data"}-${event.route || event.source || "sem-origem"}`} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{getAdminTimelineEventLabel(event)}</p>
          <p className="text-muted-foreground">{getAdminTimelineEventMeta(event, formatDate)}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminEventTimeline;
