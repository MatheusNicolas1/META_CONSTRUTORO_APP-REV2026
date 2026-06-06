-- Ordem de Servico (PRD_ORDEM_SERVICO_2026-05-31)
-- Migration independente; reutiliza atividades, checklists, documentos existentes.

create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  atividade_id uuid references public.atividades(id),
  numero text not null,
  titulo text not null,
  descricao text not null,
  responsavel_user_id uuid references auth.users(id),
  responsavel_nome text,
  data_limite date not null,
  prioridade text not null default 'media',
  status text not null default 'PENDENTE',
  motivo_bloqueio text,
  started_at timestamptz,
  finished_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.os_checklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  checklist_id uuid references public.checklists(id),
  titulo text not null,
  obrigatorio boolean not null default true,
  status text not null default 'pendente',
  completed_by uuid references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.os_anexos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  documento_id uuid references public.documentos(id),
  tipo text not null default 'outro',
  storage_path text,
  nome_arquivo text,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.os_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  event_type text not null,
  status_from text,
  status_to text,
  payload jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_os_org_obra_status on public.ordens_servico (org_id, obra_id, status);
create index if not exists idx_os_org_responsavel_status on public.ordens_servico (org_id, responsavel_user_id, status);
create index if not exists idx_os_logs_os_created on public.os_logs (os_id, created_at desc);
create index if not exists idx_os_anexos_os_tipo on public.os_anexos (os_id, tipo);

-- RLS
alter table public.ordens_servico enable row level security;
alter table public.os_checklists enable row level security;
alter table public.os_anexos enable row level security;
alter table public.os_logs enable row level security;

-- OS: select por membros; insert/update por gestores
create policy os_select on public.ordens_servico for select
  to authenticated using (public.is_org_member(org_id));

create policy os_insert on public.ordens_servico for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy os_update on public.ordens_servico for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy os_delete on public.ordens_servico for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- OS Checklists
create policy os_checklists_select on public.os_checklists for select
  to authenticated using (public.is_org_member(org_id));

create policy os_checklists_write on public.os_checklists for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- OS Anexos
create policy os_anexos_select on public.os_anexos for select
  to authenticated using (public.is_org_member(org_id));

create policy os_anexos_write on public.os_anexos for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- OS Logs: insert por autorizados; sem update/delete
create policy os_logs_insert on public.os_logs for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy os_logs_select on public.os_logs for select
  to authenticated using (public.is_org_member(org_id));

-- Trigger updated_at
drop trigger if exists trg_ordens_servico_updated_at on public.ordens_servico;
create trigger trg_ordens_servico_updated_at before update on public.ordens_servico
  for each row execute function public.set_updated_at();
