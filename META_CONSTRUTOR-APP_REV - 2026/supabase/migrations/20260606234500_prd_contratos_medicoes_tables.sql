-- Gestão de Contratos e Medições (PRD_CONTRATOS_MEDICOES_2026-06-06)
-- Usa nome "obra_contratos" para evitar conflito com tabela SFlow "contratos" (sem org_id)

create table if not exists public.obra_contratos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  fornecedor_id uuid references public.fornecedores(id),
  fornecedor_nome text,
  numero text not null,
  descricao text not null,
  valor_total numeric(15,2) not null check (valor_total > 0),
  valor_aditivo numeric(15,2) not null default 0,
  data_inicio date not null,
  data_fim date,
  status text not null default 'ativo' check (status in ('ativo','suspenso','encerrado','cancelado')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contrato_itens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  contrato_id uuid not null references public.obra_contratos(id) on delete cascade,
  descricao text not null,
  unidade text not null default 'un',
  quantidade numeric(15,4) not null check (quantidade > 0),
  valor_unitario numeric(15,2) not null check (valor_unitario > 0),
  valor_total numeric(15,2) generated always as (quantidade * valor_unitario) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.medicoes_contrato (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  contrato_id uuid not null references public.obra_contratos(id) on delete cascade,
  numero integer not null,
  data_medicao date not null,
  valor_medido numeric(15,2) not null default 0,
  percentual_executado numeric(6,2) not null default 0 check (percentual_executado >= 0 and percentual_executado <= 100),
  status text not null default 'rascunho' check (status in ('rascunho','pendente_campo','aprovado_campo','pendente_financeiro','aprovado_financeiro','rejeitado')),
  aprovado_campo_por uuid references auth.users(id),
  aprovado_campo_em timestamptz,
  aprovado_financeiro_por uuid references auth.users(id),
  aprovado_financeiro_em timestamptz,
  observacoes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicao_itens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  medicao_id uuid not null references public.medicoes_contrato(id) on delete cascade,
  contrato_item_id uuid references public.contrato_itens(id),
  descricao text not null,
  quantidade_medida numeric(15,4) not null check (quantidade_medida >= 0),
  valor_medido numeric(15,2) not null check (valor_medido >= 0),
  percentual_item numeric(6,2) default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists public.boletins_medicao (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  medicao_id uuid not null references public.medicoes_contrato(id) on delete cascade,
  titulo text not null,
  descricao text,
  data date not null default now(),
  anexo_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.aditivos_contrato (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  contrato_id uuid not null references public.obra_contratos(id) on delete cascade,
  numero integer not null,
  tipo text not null check (tipo in ('valor','prazo','escopo','reajuste','outro')),
  descricao text not null,
  valor numeric(15,2) default 0,
  data_inicio_nova date,
  data_fim_nova date,
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  aprovado_por uuid references auth.users(id),
  aprovado_em timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- Índices
-- ============================================

-- obra_contratos
create index if not exists idx_obra_contratos_org_obra_status on public.obra_contratos (org_id, obra_id, status);
create index if not exists idx_obra_contratos_org_fornecedor on public.obra_contratos (org_id, fornecedor_id);
create index if not exists idx_obra_contratos_org_numero on public.obra_contratos (org_id, numero);

-- contrato_itens
create index if not exists idx_contrato_itens_contrato on public.contrato_itens (contrato_id);

-- medicoes_contrato
create index if not exists idx_medicoes_contrato_org_status on public.medicoes_contrato (org_id, contrato_id, status);
create index if not exists idx_medicoes_contrato_data on public.medicoes_contrato (contrato_id, data_medicao desc);

-- medicao_itens
create index if not exists idx_medicao_itens_medicao on public.medicao_itens (medicao_id);

-- boletins_medicao
create index if not exists idx_boletins_medicao on public.boletins_medicao (medicao_id, data desc);

-- aditivos_contrato
create index if not exists idx_aditivos_contrato on public.aditivos_contrato (contrato_id, status);

-- ============================================
-- RLS
-- ============================================

alter table public.obra_contratos enable row level security;
alter table public.contrato_itens enable row level security;
alter table public.medicoes_contrato enable row level security;
alter table public.medicao_itens enable row level security;
alter table public.boletins_medicao enable row level security;
alter table public.aditivos_contrato enable row level security;

-- obra_contratos: select por membros; insert/update/delete por gestores
create policy obra_contratos_select on public.obra_contratos for select
  to authenticated using (public.is_org_member(org_id));

create policy obra_contratos_insert on public.obra_contratos for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy obra_contratos_update on public.obra_contratos for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy obra_contratos_delete on public.obra_contratos for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- contrato_itens: mesmo padrão
create policy contrato_itens_select on public.contrato_itens for select
  to authenticated using (public.is_org_member(org_id));

create policy contrato_itens_insert on public.contrato_itens for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy contrato_itens_update on public.contrato_itens for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy contrato_itens_delete on public.contrato_itens for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- medicoes_contrato: select membros; insert gestores/colaboradores (equipe campo cria); update por gestores
create policy medicoes_select on public.medicoes_contrato for select
  to authenticated using (public.is_org_member(org_id));

create policy medicoes_insert on public.medicoes_contrato for insert
  to authenticated with check (public.is_org_member(org_id));

create policy medicoes_update on public.medicoes_contrato for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy medicoes_delete on public.medicoes_contrato for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- medicao_itens
create policy medicao_itens_select on public.medicao_itens for select
  to authenticated using (public.is_org_member(org_id));

create policy medicao_itens_insert on public.medicao_itens for insert
  to authenticated with check (public.is_org_member(org_id));

create policy medicao_itens_update on public.medicao_itens for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy medicao_itens_delete on public.medicao_itens for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- boletins_medicao
create policy boletins_select on public.boletins_medicao for select
  to authenticated using (public.is_org_member(org_id));

create policy boletins_insert on public.boletins_medicao for insert
  to authenticated with check (public.is_org_member(org_id));

create policy boletins_delete on public.boletins_medicao for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- aditivos_contrato
create policy aditivos_select on public.aditivos_contrato for select
  to authenticated using (public.is_org_member(org_id));

create policy aditivos_insert on public.aditivos_contrato for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy aditivos_update on public.aditivos_contrato for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy aditivos_delete on public.aditivos_contrato for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- ============================================
-- Triggers updated_at
-- ============================================

drop trigger if exists trg_obra_contratos_updated_at on public.obra_contratos;
create trigger trg_obra_contratos_updated_at before update on public.obra_contratos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_medicoes_contrato_updated_at on public.medicoes_contrato;
create trigger trg_medicoes_contrato_updated_at before update on public.medicoes_contrato
  for each row execute function public.set_updated_at();
