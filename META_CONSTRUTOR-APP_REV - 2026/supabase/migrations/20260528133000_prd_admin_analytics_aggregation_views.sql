-- PRD_ADMIN P0/P3: consolidated admin analytics views.
-- These views keep legacy trackers readable while analytics_events becomes canonical.

create index if not exists idx_user_activity_user_date
  on public.user_activity (user_id, created_at desc);

create index if not exists idx_user_activity_event_date
  on public.user_activity (event_name, created_at desc);

create index if not exists idx_user_interactions_user_date
  on public.user_interactions (user_id, created_at desc);

create index if not exists idx_user_interactions_type_date
  on public.user_interactions (interaction_type, created_at desc);

create index if not exists idx_user_interactions_target_date
  on public.user_interactions (target_id, created_at desc);

create or replace view public.admin_analytics_events_unified_view
with (security_invoker = true)
as
select
  ae.id::text as event_id,
  ae.created_at,
  ae.event,
  ae.org_id,
  ae.user_id,
  ae.role,
  ae.source,
  ae.environment,
  ae.request_id::text as request_id,
  coalesce(ae.success, true) as success,
  ae.error,
  nullif(coalesce(ae.properties->>'path', ae.properties->>'route'), '') as route,
  ae.properties as properties,
  'analytics_events'::text as origin_table
from public.analytics_events ae

union all

select
  ua.id::text as event_id,
  ua.created_at,
  ua.event_name as event,
  null::uuid as org_id,
  ua.user_id,
  null::text as role,
  'legacy_user_activity'::text as source,
  null::text as environment,
  null::text as request_id,
  true as success,
  null::text as error,
  nullif(coalesce(ua.event_data->>'path', ua.event_data->>'route'), '') as route,
  ua.event_data as properties,
  'user_activity'::text as origin_table
from public.user_activity ua

union all

select
  ui.id::text as event_id,
  ui.created_at,
  case
    when ui.interaction_type = 'page_view' then 'app.route_viewed'
    else 'app.interaction_recorded'
  end as event,
  null::uuid as org_id,
  ui.user_id,
  null::text as role,
  'legacy_user_interactions'::text as source,
  null::text as environment,
  null::text as request_id,
  true as success,
  null::text as error,
  case
    when ui.interaction_type = 'page_view' then ui.target_id
    else null
  end as route,
  jsonb_build_object(
    'interaction_type', ui.interaction_type,
    'target_id', ui.target_id,
    'metadata', ui.metadata
  ) as properties,
  'user_interactions'::text as origin_table
from public.user_interactions ui;

create or replace view public.admin_route_metrics_view
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as event_date,
  coalesce(route, 'unknown') as route,
  count(*)::bigint as total_views,
  count(distinct user_id)::bigint as unique_users,
  min(created_at) as first_seen_at,
  max(created_at) as last_seen_at
from public.admin_analytics_events_unified_view
where route is not null
  and event in ('app.route_viewed', 'page_view', 'view_page')
group by 1, 2;

create or replace view public.admin_user_activity_summary_view
with (security_invoker = true)
as
select
  user_id,
  (min(org_id::text) filter (where org_id is not null))::uuid as org_id,
  min(created_at) as first_event_at,
  max(created_at) as last_event_at,
  count(*)::bigint as total_events,
  count(*) filter (where event = 'app.route_viewed' or route is not null)::bigint as route_views,
  count(*) filter (where event = 'app.interaction_recorded')::bigint as interactions,
  count(*) filter (where success is false)::bigint as failed_events,
  count(distinct route) filter (where route is not null)::bigint as distinct_routes
from public.admin_analytics_events_unified_view
where user_id is not null
group by user_id;

create or replace view public.admin_funnel_daily_view
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as event_date,
  count(*) filter (where event = 'app.route_viewed' or route is not null)::bigint as route_views,
  count(distinct user_id) filter (where user_id is not null)::bigint as active_users,
  count(*) filter (where event ilike '%signup%' or event ilike '%criar_conta%' or event ilike '%cadastro%')::bigint as signups,
  count(*) filter (where event ilike '%checkout%')::bigint as checkout_events,
  count(*) filter (where event ilike '%coupon%' or event ilike '%cupom%')::bigint as coupon_events,
  count(*) filter (where event ilike '%subscription%' or event ilike '%assinatura%')::bigint as subscription_events,
  count(*) filter (where event = 'app.interaction_recorded')::bigint as interactions
from public.admin_analytics_events_unified_view
where created_at is not null
group by 1;

create or replace view public.admin_user_segments_view
with (security_invoker = true)
as
select
  au.id as user_id,
  au.created_at as user_created_at,
  au.plan_type,
  au.roles,
  uas.first_event_at,
  uas.last_event_at,
  coalesce(uas.total_events, 0)::bigint as total_events,
  coalesce(uas.route_views, 0)::bigint as route_views,
  coalesce(uas.interactions, 0)::bigint as interactions,
  case
    when uas.last_event_at >= now() - interval '7 days' then 'active_7d'
    when uas.last_event_at >= now() - interval '30 days' then 'active_30d'
    when uas.last_event_at is null then 'no_activity'
    else 'inactive'
  end as activity_segment
from public.admin_users_view au
left join public.admin_user_activity_summary_view uas
  on uas.user_id = au.id;

grant select on public.admin_analytics_events_unified_view to authenticated, service_role;
grant select on public.admin_route_metrics_view to authenticated, service_role;
grant select on public.admin_user_activity_summary_view to authenticated, service_role;
grant select on public.admin_funnel_daily_view to authenticated, service_role;
grant select on public.admin_user_segments_view to authenticated, service_role;
