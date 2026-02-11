-- M9 Hardening: Hardening Analytics Events Table
-- Ensures RLS, Immutability, and Correct Privileges

-- 1. Ensure RLS is enabled
alter table public.analytics_events enable row level security;

-- 2. Drop insecure policies if any (re-create strict ones)
drop policy if exists "Service Role Full Access" on public.analytics_events;
drop policy if exists "Org Members can view their org analytics" on public.analytics_events;
drop policy if exists "Anyone can insert" on public.analytics_events; 

-- 3. Service Role: Full Access (Insert/Select) - Required for backend fallback
create policy "Service Role Full Access"
on public.analytics_events
for all
to service_role
using (true)
with check (true);

-- 4. Authenticated Users: SELECT ONLY (Own Org)
-- They CANNOT INSERT directly (must go through edge function or frontend wrapper using public/service endpoint if implemented, 
-- but frontend currently sends to PostHog. The fallback DB is strictly for BACKEND events or wrapped proxy).
-- Wait, if Frontend fails PostHog, can it insert into DB? 
-- The user request says: "INSERT apenas service_role". 
-- So Frontend CANNOT insert into this table directly via supabase-js client (anon/auth).
-- This implies standard frontend analytics fallback to DB is NOT possible without an edge function proxy.
-- This is acceptable as per requirement "INSERT apenas service_role".
create policy "Org Members can view their org analytics"
on public.analytics_events
for select
to authenticated
using (
    org_id is not null and
    org_id in (
        select org_id from public.org_members 
        where user_id = auth.uid()
    )
);

-- 5. Immutability Triggers (Ensure they exist)
create or replace function public.prevent_analytics_update()
returns trigger as $$
begin
    raise exception 'Analytics events are immutable';
end;
$$ language plpgsql;

drop trigger if exists tr_analytics_immutable on public.analytics_events;
create trigger tr_analytics_immutable
before update or delete on public.analytics_events
for each row execute function public.prevent_analytics_update();

-- 6. Indexes (Ensure compliance)
create index if not exists idx_analytics_org_date on public.analytics_events(org_id, created_at desc);
create index if not exists idx_analytics_event_date on public.analytics_events(event, created_at desc);
create index if not exists idx_analytics_request_id on public.analytics_events(request_id);

-- 7. Add columns if missing (hardening)
alter table public.analytics_events 
add column if not exists request_id uuid,
add column if not exists success boolean,
add column if not exists error text;
