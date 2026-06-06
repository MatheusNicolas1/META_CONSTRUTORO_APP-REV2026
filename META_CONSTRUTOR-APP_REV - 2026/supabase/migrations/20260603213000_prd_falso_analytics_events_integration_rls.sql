-- PRD_falso: allow authenticated integration logs only for the user's active org.
-- The frontend now writes canonical analytics_events columns instead of relying
-- only on properties->>'orgId', so RLS can validate org membership directly.

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_authenticated_insert_own" on public.analytics_events;

create policy "analytics_events_authenticated_insert_own"
on public.analytics_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  and coalesce(source, 'frontend') = 'frontend'
  and (
    org_id is null
    or public.is_org_member(org_id)
  )
);

grant insert on public.analytics_events to authenticated;
