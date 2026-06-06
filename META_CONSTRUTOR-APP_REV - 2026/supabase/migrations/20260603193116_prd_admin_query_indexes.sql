-- PRD_ADMIN P3/P5: indexes for admin route, campaign and funnel dashboards.
--
-- These indexes support the admin views that aggregate analytics_events by
-- period, route, campaign/ref and funnel-like event names. They are
-- intentionally idempotent because remote projects may already have part of
-- the PRD_ADMIN index set from earlier reconciliation runs.

create index if not exists idx_analytics_events_created_at_desc
  on public.analytics_events (created_at desc)
  where created_at is not null;

create index if not exists idx_analytics_events_route_created_at
  on public.analytics_events ((nullif(coalesce(properties->>'path', properties->>'route'), '')), created_at desc)
  where created_at is not null
    and nullif(coalesce(properties->>'path', properties->>'route'), '') is not null;

create index if not exists idx_analytics_events_campaign_date
  on public.analytics_events (utm_campaign, created_at desc)
  where utm_campaign is not null
    and created_at is not null;

create index if not exists idx_analytics_events_medium_date
  on public.analytics_events (utm_medium, created_at desc)
  where utm_medium is not null
    and created_at is not null;

create index if not exists idx_analytics_events_ref_date
  on public.analytics_events (ref, created_at desc)
  where ref is not null
    and created_at is not null;

create index if not exists idx_analytics_events_source_event_date
  on public.analytics_events (source, event, created_at desc)
  where source is not null
    and event is not null
    and created_at is not null;

create index if not exists idx_user_activity_event_data_route_date
  on public.user_activity ((nullif(coalesce(event_data->>'path', event_data->>'route'), '')), created_at desc)
  where created_at is not null
    and nullif(coalesce(event_data->>'path', event_data->>'route'), '') is not null;

create index if not exists idx_user_interactions_page_target_date
  on public.user_interactions (target_id, created_at desc)
  where interaction_type = 'page_view'
    and target_id is not null
    and created_at is not null;
