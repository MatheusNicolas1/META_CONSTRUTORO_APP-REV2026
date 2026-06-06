alter table public.analytics_events enable row level security;

grant insert on table public.analytics_events to anon;

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

notify pgrst, 'reload schema';

select
  has_table_privilege('anon', 'public.analytics_events', 'INSERT') as anon_can_insert,
  relrowsecurity as rls_enabled
from pg_class
where oid = 'public.analytics_events'::regclass;
