-- Fluxo de Caixa e Curva ABC (PRD_FLUXO_CAIXA_CURVA_ABC_2026-05-31)
-- Migration independente; reutiliza expenses como fonte de realizado sem duplicar dados.

create table if not exists public.fluxo_caixa_previsao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  origem text not null default 'manual',
  categoria text not null,
  fornecedor_id uuid references public.fornecedores(id),
  fornecedor_nome text,
  descricao text not null,
  data_prevista date not null,
  valor_previsto numeric(15,2) not null check (valor_previsto > 0),
  status text not null default 'planejado',
  alerta_percentual numeric(6,2),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fluxo_caixa_realizado (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  previsao_id uuid references public.fluxo_caixa_previsao(id),
  expense_id uuid references public.expenses(id),
  medicao_id uuid,
  tipo text not null check (tipo in ('entrada','saida')),
  categoria text not null,
  fornecedor_id uuid references public.fornecedores(id),
  data_realizada date not null,
  valor_realizado numeric(15,2) not null check (valor_realizado > 0),
  origem text not null default 'manual',
  external_ref text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.curva_abc_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  competencia date not null,
  base_planejada numeric(15,2) default 0,
  base_realizada numeric(15,2) default 0,
  percentual_planejado numeric(8,4) default 0,
  percentual_realizado numeric(8,4) default 0,
  desvio_percentual numeric(8,4) default 0,
  limite_alerta_percentual numeric(6,2),
  status text default 'ok',
  snapshot jsonb,
  gerado_por uuid references auth.users(id),
  generated_at timestamptz default now()
);

-- Índices
create index if not exists idx_fluxo_previsao_org_obra_data on public.fluxo_caixa_previsao (org_id, obra_id, data_prevista);
create index if not exists idx_fluxo_previsao_org_tipo_status on public.fluxo_caixa_previsao (org_id, tipo, status);
create index if not exists idx_fluxo_realizado_org_obra_data on public.fluxo_caixa_realizado (org_id, obra_id, data_realizada);
create index if not exists idx_curva_abc_org_obra_competencia on public.curva_abc_log (org_id, obra_id, competencia desc);

-- RLS
alter table public.fluxo_caixa_previsao enable row level security;
alter table public.fluxo_caixa_realizado enable row level security;
alter table public.curva_abc_log enable row level security;

-- Previsões: visualização por membros; escrita por gestores
create policy fluxo_previsao_select on public.fluxo_caixa_previsao for select
  to authenticated using (public.is_org_member(org_id));

create policy fluxo_previsao_insert on public.fluxo_caixa_previsao for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy fluxo_previsao_update on public.fluxo_caixa_previsao for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy fluxo_previsao_delete on public.fluxo_caixa_previsao for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- Realizado: visualização; escrita por gestores
create policy fluxo_realizado_select on public.fluxo_caixa_realizado for select
  to authenticated using (public.is_org_member(org_id));

create policy fluxo_realizado_insert on public.fluxo_caixa_realizado for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy fluxo_realizado_delete on public.fluxo_caixa_realizado for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- Curva ABC: visualização por membros; insert por Edge Function
create policy curva_abc_select on public.curva_abc_log for select
  to authenticated using (public.is_org_member(org_id));

create policy curva_abc_insert on public.curva_abc_log for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- Triggers updated_at
drop trigger if exists trg_fluxo_previsao_updated_at on public.fluxo_caixa_previsao;
create trigger trg_fluxo_previsao_updated_at before update on public.fluxo_caixa_previsao
  for each row execute function public.set_updated_at();
