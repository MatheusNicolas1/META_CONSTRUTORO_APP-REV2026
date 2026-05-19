-- Ensure billing edge functions have the columns they persist/read.
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text;

alter table public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists cancel_at_period_end boolean not null default false;

create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id);

create index if not exists idx_profiles_stripe_subscription_id
  on public.profiles(stripe_subscription_id);

create index if not exists idx_subscriptions_stripe_price_id
  on public.subscriptions(stripe_price_id);
