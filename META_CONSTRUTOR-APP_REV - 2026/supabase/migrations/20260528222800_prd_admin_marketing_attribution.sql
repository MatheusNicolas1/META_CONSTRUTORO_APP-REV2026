alter table public.analytics_events
  add column if not exists anonymous_id text,
  add column if not exists session_id text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists ref text,
  add column if not exists referrer text;

create index if not exists idx_analytics_events_anonymous_date
  on public.analytics_events (anonymous_id, created_at desc)
  where anonymous_id is not null;

create index if not exists idx_analytics_events_session_date
  on public.analytics_events (session_id, created_at desc)
  where session_id is not null;

create index if not exists idx_analytics_events_utm_source_date
  on public.analytics_events (utm_source, created_at desc)
  where utm_source is not null;

drop policy if exists "analytics_events_anon_insert_public" on public.analytics_events;

create policy "analytics_events_anon_insert_public"
on public.analytics_events
for insert
to anon
with check (
  user_id is null
  and org_id is null
  and source = 'frontend'
  and (
    event = 'app.public_page_viewed'
    or event like 'marketing.%'
    or event like 'auth.%'
    or event like 'billing.%'
  )
);

grant insert on public.analytics_events to anon;

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
  ae.properties,
  'analytics_events'::text as origin_table,
  ae.anonymous_id,
  ae.session_id,
  ae.utm_source,
  ae.utm_medium,
  ae.utm_campaign,
  ae.ref,
  ae.referrer
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
  'user_activity'::text as origin_table,
  null::text as anonymous_id,
  null::text as session_id,
  null::text as utm_source,
  null::text as utm_medium,
  null::text as utm_campaign,
  null::text as ref,
  null::text as referrer
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
  'user_interactions'::text as origin_table,
  null::text as anonymous_id,
  null::text as session_id,
  null::text as utm_source,
  null::text as utm_medium,
  null::text as utm_campaign,
  null::text as ref,
  null::text as referrer
from public.user_interactions ui;

create or replace view public.admin_org_usage_summary_view
with (security_invoker = true)
as
select
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.created_at as org_created_at,
  count(distinct om.user_id)::bigint as total_members,
  count(distinct om.user_id) filter (where om.status = 'active')::bigint as active_members,
  coalesce(sum(uas.total_events), 0)::bigint as total_events,
  coalesce(sum(uas.route_views), 0)::bigint as route_views,
  coalesce(sum(uas.interactions), 0)::bigint as interactions,
  max(uas.last_event_at) as last_event_at
from public.orgs o
left join public.org_members om
  on om.org_id = o.id
left join public.admin_user_activity_summary_view uas
  on uas.org_id = o.id
group by o.id, o.name, o.slug, o.created_at;

create or replace view public.admin_campaign_performance_view
with (security_invoker = true)
as
select
  coalesce(utm_source, 'direct') as utm_source,
  coalesce(utm_medium, 'none') as utm_medium,
  coalesce(utm_campaign, 'none') as utm_campaign,
  coalesce(ref, 'none') as ref,
  count(*)::bigint as total_events,
  count(distinct anonymous_id) filter (where anonymous_id is not null)::bigint as anonymous_visitors,
  count(distinct user_id) filter (where user_id is not null)::bigint as identified_users,
  count(*) filter (where event = 'app.public_page_viewed')::bigint as page_views,
  count(*) filter (where event like 'auth.%')::bigint as auth_events,
  count(*) filter (where event like 'billing.%')::bigint as billing_events,
  min(created_at) as first_seen_at,
  max(created_at) as last_seen_at
from public.analytics_events
where source = 'frontend'
group by 1, 2, 3, 4;

create or replace view public.admin_checkout_funnel_view
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as event_date,
  count(*) filter (where route like '/preco%')::bigint as pricing_views,
  count(*) filter (where route like '/checkout%')::bigint as checkout_views,
  count(*) filter (where event like 'billing.%')::bigint as billing_events,
  count(distinct anonymous_id) filter (where anonymous_id is not null)::bigint as anonymous_visitors,
  count(distinct user_id) filter (where user_id is not null)::bigint as identified_users
from public.admin_analytics_events_unified_view
where created_at is not null
group by 1;

create or replace view public.admin_churn_risk_view
with (security_invoker = true)
as
select
  user_id,
  plan_type,
  roles,
  activity_segment,
  first_event_at,
  last_event_at,
  total_events,
  route_views,
  interactions,
  case
    when activity_segment = 'no_activity' then 'high'
    when activity_segment = 'inactive' then 'medium'
    else 'low'
  end as risk_level
from public.admin_user_segments_view
where activity_segment in ('inactive', 'no_activity');

grant select on public.admin_analytics_events_unified_view to authenticated, service_role;
grant select on public.admin_org_usage_summary_view to authenticated, service_role;
grant select on public.admin_campaign_performance_view to authenticated, service_role;
grant select on public.admin_checkout_funnel_view to authenticated, service_role;
grant select on public.admin_churn_risk_view to authenticated, service_role;
