-- M9: Analytics Events Table (Fallback)
-- stores events when PostHog is not available or for audit redundancy

create table if not exists public.analytics_events (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    event text not null,
    org_id uuid references public.orgs(id) on delete set null,
    user_id uuid references auth.users(id) on delete set null,
    source text not null check (source in ('frontend', 'backend', 'edge')),
    properties jsonb default '{}'::jsonb,
    environment text,
    request_id uuid,
    success boolean,
    error text
);

-- Indexes for querying
create index if not exists idx_analytics_org_date on public.analytics_events(org_id, created_at desc);
create index if not exists idx_analytics_event_date on public.analytics_events(event, created_at desc);
create index if not exists idx_analytics_request_id on public.analytics_events(request_id);

-- RLS: Service Role can Insert/Select. Users can Select their own org events (if needed for dashboard later).
alter table public.analytics_events enable row level security;

create policy "Service Role Full Access"
on public.analytics_events
for all
to service_role
using (true)
with check (true);

-- Optional: Allow org admins to view analytics? For now strict lock down.
-- But the requirement says "RLS: SELECT por org members".
create policy "Org Members can view their org analytics"
on public.analytics_events
for select
to authenticated
using (
    org_id in (
        select org_id from public.org_members 
        where user_id = auth.uid()
    )
);

-- Immutability (Audit style)
create or replace function public.prevent_analytics_update()
returns trigger as $$
begin
    raise exception 'Analytics events are immutable';
end;
$$ language plpgsql;

create trigger tr_analytics_immutable
before update or delete on public.analytics_events
for each row execute function public.prevent_analytics_update();
