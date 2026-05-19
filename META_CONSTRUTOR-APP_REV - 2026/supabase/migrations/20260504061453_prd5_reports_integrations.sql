create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  service text not null check (service in ('whatsapp', 'gmail', 'drive', 'googledrive', 'google_drive', 'n8n')),
  credentials jsonb not null default '{}'::jsonb,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error', 'pending')),
  last_sync timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, service)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  empresa text,
  telefone text,
  assunto text not null default 'Contato via site',
  mensagem text not null,
  status text default 'novo',
  created_at timestamptz default now()
);

alter table public.integrations enable row level security;
alter table public.contact_messages enable row level security;

alter table public.rdos
  add column if not exists aprovado_por_id uuid references auth.users(id) on delete set null,
  add column if not exists data_aprovacao timestamptz,
  add column if not exists motivo_rejeicao text;

drop policy if exists "org members can read integrations" on public.integrations;
create policy "org members can read integrations"
  on public.integrations for select
  to authenticated
  using (public.is_org_member(org_id));

drop policy if exists "org managers can insert integrations" on public.integrations;
create policy "org managers can insert integrations"
  on public.integrations for insert
  to authenticated
  with check (public.has_org_role(org_id, array['Administrador','Gerente','Presidente']::public.app_role[]));

drop policy if exists "org managers can update integrations" on public.integrations;
create policy "org managers can update integrations"
  on public.integrations for update
  to authenticated
  using (public.has_org_role(org_id, array['Administrador','Gerente','Presidente']::public.app_role[]))
  with check (public.has_org_role(org_id, array['Administrador','Gerente','Presidente']::public.app_role[]));

drop policy if exists "org managers can delete integrations" on public.integrations;
create policy "org managers can delete integrations"
  on public.integrations for delete
  to authenticated
  using (public.has_org_role(org_id, array['Administrador','Gerente','Presidente']::public.app_role[]));

drop view if exists public.cronograma_vs_realizado;
drop view if exists public.financeiro_consolidado;

create or replace view public.financeiro_consolidado
with (security_invoker = true) as
select
  e.org_id,
  e.obra_id,
  coalesce(o.nome, 'Obra sem nome') as obra_nome,
  date_trunc('month', e.date_of_expense::date)::date as periodo,
  to_char(date_trunc('month', e.date_of_expense::date), 'YYYY-MM') as periodo_mes,
  e.cost_category as categoria,
  count(*)::integer as total_lancamentos,
  coalesce(sum(e.amount), 0)::numeric as total_despesas,
  coalesce(sum(e.amount) filter (where lower(e.approval_status) in ('approved', 'aprovado', 'aprovada')), 0)::numeric as total_aprovado,
  coalesce(sum(e.amount) filter (where lower(e.approval_status) not in ('approved', 'aprovado', 'aprovada')), 0)::numeric as total_pendente
from public.expenses e
left join public.obras o on o.id = e.obra_id
group by e.org_id, e.obra_id, o.nome, date_trunc('month', e.date_of_expense::date), e.cost_category;

create or replace view public.cronograma_vs_realizado
with (security_invoker = true) as
select
  a.org_id,
  a.obra_id,
  coalesce(o.nome, 'Obra sem nome') as obra_nome,
  a.id as atividade_id,
  a.titulo as atividade,
  a.data::date as data_planejada,
  real.data_realizada,
  a.quantidade_prevista,
  real.quantidade_realizada,
  a.unidade_medida,
  a.status as status_planejado,
  real.status_realizado,
  case
    when real.data_realizada is null then null
    else (real.data_realizada - a.data::date)::integer
  end as dias_desvio,
  case
    when real.data_realizada is null then 'Nao realizada'
    when real.data_realizada <= a.data::date then 'No prazo'
    else 'Atrasada'
  end as situacao
from public.atividades a
left join public.obras o on o.id = a.obra_id
left join lateral (
  select
    min(r.data::date) as data_realizada,
    coalesce(sum(ra.quantidade), 0)::numeric as quantidade_realizada,
    string_agg(distinct ra.status, ', ' order by ra.status) as status_realizado
  from public.rdo_atividades ra
  join public.rdos r on r.id = ra.rdo_id
  where r.org_id = a.org_id
    and r.obra_id = a.obra_id
    and lower(trim(ra.nome)) = lower(trim(a.titulo))
) real on true;

grant select on public.financeiro_consolidado to authenticated;
grant select on public.cronograma_vs_realizado to authenticated;
grant select, insert, update, delete on public.integrations to authenticated;
