-- MVP v1.0.0: feedback table for first-user feedback loop.
-- Compatible with the current UI fields and the MVP minimum contract:
-- user_id, rating, comment, created_at.

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  org_id uuid references public.orgs(id) on delete set null,
  rating integer,
  comment text,
  titulo text,
  tipo text not null default 'outro',
  mensagem text not null default '',
  nota_satisfacao integer,
  status text not null default 'Recebido',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feedbacks
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists org_id uuid references public.orgs(id) on delete set null,
  add column if not exists rating integer,
  add column if not exists comment text,
  add column if not exists titulo text,
  add column if not exists tipo text not null default 'outro',
  add column if not exists mensagem text not null default '',
  add column if not exists nota_satisfacao integer,
  add column if not exists status text not null default 'Recebido',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feedbacks_rating_range'
  ) then
    alter table public.feedbacks
      add constraint feedbacks_rating_range
      check (rating is null or rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'feedbacks_nota_satisfacao_range'
  ) then
    alter table public.feedbacks
      add constraint feedbacks_nota_satisfacao_range
      check (nota_satisfacao is null or nota_satisfacao between 1 and 5);
  end if;
end $$;

create index if not exists idx_feedbacks_user_created_at
  on public.feedbacks(user_id, created_at desc);

create index if not exists idx_feedbacks_org_created_at
  on public.feedbacks(org_id, created_at desc);

create index if not exists idx_feedbacks_status_created_at
  on public.feedbacks(status, created_at desc);

create or replace function public.set_feedbacks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_feedbacks_updated_at on public.feedbacks;
create trigger tr_feedbacks_updated_at
before update on public.feedbacks
for each row
execute function public.set_feedbacks_updated_at();

alter table public.feedbacks enable row level security;

drop policy if exists "Service role can manage feedbacks" on public.feedbacks;
drop policy if exists "Users can insert own feedbacks" on public.feedbacks;
drop policy if exists "Users can view own feedbacks" on public.feedbacks;
drop policy if exists "Org managers can view feedbacks" on public.feedbacks;
drop policy if exists "Org managers can update feedback status" on public.feedbacks;

create policy "Service role can manage feedbacks"
on public.feedbacks
for all
to service_role
using (true)
with check (true);

create policy "Users can insert own feedbacks"
on public.feedbacks
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can view own feedbacks"
on public.feedbacks
for select
to authenticated
using (user_id = auth.uid());

create policy "Org managers can view feedbacks"
on public.feedbacks
for select
to authenticated
using (
  org_id is not null
  and public.has_org_role(
    org_id,
    array['Administrador','Gerente','Presidente']::public.app_role[]
  )
);

create policy "Org managers can update feedback status"
on public.feedbacks
for update
to authenticated
using (
  org_id is not null
  and public.has_org_role(
    org_id,
    array['Administrador','Gerente','Presidente']::public.app_role[]
  )
)
with check (
  org_id is not null
  and public.has_org_role(
    org_id,
    array['Administrador','Gerente','Presidente']::public.app_role[]
  )
);
