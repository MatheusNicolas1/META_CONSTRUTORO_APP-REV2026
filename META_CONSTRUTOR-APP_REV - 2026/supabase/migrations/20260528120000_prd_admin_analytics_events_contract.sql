-- PRD_ADMIN P0: expand analytics_events to the canonical admin/marketing contract.
-- Idempotent because the linked project has historical drift and may already
-- contain a reduced analytics_events table from release reconciliation.

create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event text,
  properties jsonb,
  created_at timestamptz default now()
);

alter table public.analytics_events
  add column if not exists org_id uuid,
  add column if not exists user_id uuid,
  add column if not exists role text,
  add column if not exists source text,
  add column if not exists environment text,
  add column if not exists request_id uuid,
  add column if not exists success boolean,
  add column if not exists error text;

alter table public.analytics_events
  alter column properties set default '{}'::jsonb,
  alter column created_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_org_id_fkey'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_org_id_fkey
      foreign key (org_id) references public.orgs(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_user_id_fkey'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'analytics_events_source_check'
      and conrelid = 'public.analytics_events'::regclass
  ) then
    alter table public.analytics_events
      add constraint analytics_events_source_check
      check (source is null or source in ('frontend', 'backend', 'edge', 'db'));
  end if;
end $$;

create index if not exists idx_analytics_events_org_date
  on public.analytics_events(org_id, created_at desc);

create index if not exists idx_analytics_events_user_date
  on public.analytics_events(user_id, created_at desc);

create index if not exists idx_analytics_events_event_date
  on public.analytics_events(event, created_at desc);

create index if not exists idx_analytics_events_request_id
  on public.analytics_events(request_id);

alter table public.analytics_events enable row level security;

drop policy if exists "Enable read for authenticated" on public.analytics_events;
drop policy if exists "Enable insert for authenticated" on public.analytics_events;
drop policy if exists "Service Role Full Access" on public.analytics_events;
drop policy if exists "Org Members can view their org analytics" on public.analytics_events;
drop policy if exists "Anyone can insert" on public.analytics_events;

drop policy if exists "analytics_events_service_role_all" on public.analytics_events;
create policy "analytics_events_service_role_all"
on public.analytics_events
for all
to service_role
using (true)
with check (true);

drop policy if exists "analytics_events_org_members_select" on public.analytics_events;
create policy "analytics_events_org_members_select"
on public.analytics_events
for select
to authenticated
using (
  org_id is not null
  and exists (
    select 1
    from public.org_members om
    where om.org_id = analytics_events.org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

drop policy if exists "analytics_events_authenticated_insert_own" on public.analytics_events;
create policy "analytics_events_authenticated_insert_own"
on public.analytics_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  and coalesce(source, 'frontend') = 'frontend'
);

grant select, insert on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
