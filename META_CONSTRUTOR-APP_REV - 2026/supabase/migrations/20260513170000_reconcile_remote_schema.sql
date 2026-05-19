-- P0.1 controlled reconciliation for the linked remote schema.
-- Do not use db push --include-all for this release path.

create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event text,
  properties jsonb,
  created_at timestamptz default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists "Enable read for authenticated" on public.analytics_events;
create policy "Enable read for authenticated"
on public.analytics_events
for select
using (auth.role() = 'authenticated');

drop policy if exists "Enable insert for authenticated" on public.analytics_events;
create policy "Enable insert for authenticated"
on public.analytics_events
for insert
with check (auth.role() = 'authenticated');

alter table if exists public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

alter table if exists public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists cancel_at_period_end boolean not null default false;

create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id);

create index if not exists idx_profiles_stripe_subscription_id
  on public.profiles(stripe_subscription_id);

create index if not exists idx_subscriptions_stripe_price_id
  on public.subscriptions(stripe_price_id);

revoke all on all tables in schema public from anon;

revoke all on public.analytics_events from authenticated;
grant select, insert on public.analytics_events to authenticated;

do $$
begin
  if to_regclass('public.financeiro_consolidado') is not null then
    revoke all on public.financeiro_consolidado from authenticated;
    grant select on public.financeiro_consolidado to authenticated;
  end if;

  if to_regclass('public.cronograma_vs_realizado') is not null then
    revoke all on public.cronograma_vs_realizado from authenticated;
    grant select on public.cronograma_vs_realizado to authenticated;
  end if;

  if to_regclass('public.feedbacks') is not null then
    revoke all on public.feedbacks from authenticated;
    grant select, insert on public.feedbacks to authenticated;
  end if;

  if to_regclass('public.integrations') is not null then
    revoke all on public.integrations from authenticated;
    grant select, insert, update, delete on public.integrations to authenticated;
  end if;
end $$;
