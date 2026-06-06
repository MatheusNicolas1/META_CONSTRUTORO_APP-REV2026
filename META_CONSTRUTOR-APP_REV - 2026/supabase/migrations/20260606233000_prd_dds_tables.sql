-- DDS (Diálogo Diário de Segurança)
-- Módulo de gestão de segurança do trabalho com diálogos diários
-- Migration independente

-- Perfil de segurança da empresa (um por org)
create table if not exists public.perfil_empresa_seguranca (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.orgs(id) on delete cascade,
  segmento text not null,
  principais_riscos text[] not null default '{}',
  nrs_aplicaveis text[] not null default '{}',
  meta_dds_mensal integer not null default 4 check (meta_dds_mensal > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registros de DDS executados
create table if not exists public.dds_registros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete set null,
  tema text not null,
  conteudo text not null,
  data date not null,
  horario time,
  duracao_minutos integer,
  status text not null default 'realizado' check (status in ('realizado','pendente','cancelado')),
  observacoes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Participantes de cada DDS
create table if not exists public.dds_participantes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  dds_id uuid not null references public.dds_registros(id) on delete cascade,
  user_id uuid references auth.users(id),
  nome text not null,
  cargo text,
  presente boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sugestões de temas para DDS
create table if not exists public.sugestoes_temas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  tema text not null,
  segmento text,
  nrs_relacionadas text[] not null default '{}',
  frequencia integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_dds_registros_org_obra_data on public.dds_registros (org_id, obra_id, data desc);
create index if not exists idx_dds_registros_org_status on public.dds_registros (org_id, status);
create index if not exists idx_dds_participantes_dds on public.dds_participantes (dds_id);
create index if not exists idx_sugestoes_temas_org_segmento on public.sugestoes_temas (org_id, segmento);

-- RLS
alter table public.perfil_empresa_seguranca enable row level security;
alter table public.dds_registros enable row level security;
alter table public.dds_participantes enable row level security;
alter table public.sugestoes_temas enable row level security;

-- Perfil de segurança: select por membros; insert/update por gestores
create policy perfil_seguranca_select on public.perfil_empresa_seguranca for select
  to authenticated using (public.is_org_member(org_id));

create policy perfil_seguranca_insert on public.perfil_empresa_seguranca for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy perfil_seguranca_update on public.perfil_empresa_seguranca for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- DDS Registros: select por membros; insert/update/delete por gestores
create policy dds_registros_select on public.dds_registros for select
  to authenticated using (public.is_org_member(org_id));

create policy dds_registros_insert on public.dds_registros for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy dds_registros_update on public.dds_registros for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy dds_registros_delete on public.dds_registros for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- DDS Participantes: select por membros; insert/delete por gestores
create policy dds_participantes_select on public.dds_participantes for select
  to authenticated using (public.is_org_member(org_id));

create policy dds_participantes_insert on public.dds_participantes for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy dds_participantes_delete on public.dds_participantes for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- Sugestões de Temas: select por membros; insert/update por gestores
create policy sugestoes_temas_select on public.sugestoes_temas for select
  to authenticated using (public.is_org_member(org_id));

create policy sugestoes_temas_insert on public.sugestoes_temas for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy sugestoes_temas_update on public.sugestoes_temas for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- Trigger updated_at
drop trigger if exists trg_perfil_empresa_seguranca_updated_at on public.perfil_empresa_seguranca;
create trigger trg_perfil_empresa_seguranca_updated_at before update on public.perfil_empresa_seguranca
  for each row execute function public.set_updated_at();

drop trigger if exists trg_dds_registros_updated_at on public.dds_registros;
create trigger trg_dds_registros_updated_at before update on public.dds_registros
  for each row execute function public.set_updated_at();
