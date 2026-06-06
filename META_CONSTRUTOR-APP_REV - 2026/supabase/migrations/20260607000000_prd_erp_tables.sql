-- Integração com ERP (PRD_ERP_2026-06-06)
-- Migration independente; tabelas dedicadas pois o check constraint de public.integrations não aceita 'erp'.

-- 1. Configuração da integração ERP
create table if not exists public.integracao_erp_config (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  provider text not null check (provider in ('sienge', 'totvs', 'protheus', 'sap', 'megasoft', 'sieng', 'personalizado')),
  nome text not null,
  base_url text not null,
  api_key text,
  api_secret text,
  tenant_id text,
  auth_type text not null default 'api_key' check (auth_type in ('api_key', 'oauth2', 'basic', 'token')),
  auth_payload jsonb,
  endpoints jsonb not null default '{}'::jsonb,
  field_mapping jsonb not null default '{}'::jsonb,
  sync_interval_minutes integer not null default 60 check (sync_interval_minutes >= 15),
  entidades_sincronizar jsonb not null default '["obras","clientes","fornecedores","medicoes","financeiro"]'::jsonb,
  status text not null default 'desconectado' check (status in ('conectado', 'desconectado', 'erro', 'pendente', 'sincronizando')),
  ultima_sincronizacao timestamptz,
  ativo boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Logs de sincronização
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  config_id uuid not null references public.integracao_erp_config(id) on delete cascade,
  entidade text not null,
  acao text not null check (acao in ('import', 'export', 'sync', 'test', 'error')),
  status text not null default 'pendente' check (status in ('sucesso', 'falha', 'pendente', 'parcial', 'em_andamento')),
  registros_processados integer default 0,
  registros_erro integer default 0,
  mensagem text,
  detalhes jsonb,
  duracao_ms integer,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  triggered_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 3. Fila de webhooks com retry
create table if not exists public.webhook_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  config_id uuid not null references public.integracao_erp_config(id) on delete cascade,
  evento text not null,
  payload jsonb not null,
  tentativas integer not null default 0,
  max_tentativas integer not null default 3,
  status text not null default 'pendente' check (status in ('pendente', 'processando', 'sucesso', 'falha', 'cancelado')),
  ultima_tentativa timestamptz,
  proxima_tentativa timestamptz not null default now(),
  erro_ultima_tentativa text,
  prioridade integer not null default 5 check (prioridade between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_erp_config_org_provider on public.integracao_erp_config (org_id, provider);
create index if not exists idx_erp_config_org_status on public.integracao_erp_config (org_id, status);
create index if not exists idx_sync_logs_config_entidade on public.sync_logs (config_id, entidade, created_at desc);
create index if not exists idx_sync_logs_org_created on public.sync_logs (org_id, created_at desc);
create index if not exists idx_sync_logs_org_status on public.sync_logs (org_id, status, created_at desc);
create index if not exists idx_webhook_queue_pendentes on public.webhook_queue (status, proxima_tentativa) where status = 'pendente';
create index if not exists idx_webhook_queue_config_evento on public.webhook_queue (config_id, evento, created_at desc);
create index if not exists idx_webhook_queue_org_status on public.webhook_queue (org_id, status);

-- RLS
alter table public.integracao_erp_config enable row level security;
alter table public.sync_logs enable row level security;
alter table public.webhook_queue enable row level security;

-- ERP Config: select por membros; insert/update/delete por gestores
create policy erp_config_select on public.integracao_erp_config for select
  to authenticated using (public.is_org_member(org_id));

create policy erp_config_insert on public.integracao_erp_config for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy erp_config_update on public.integracao_erp_config for update
  to authenticated using (public.is_org_member(org_id))
  with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy erp_config_delete on public.integracao_erp_config for delete
  to authenticated using (public.has_org_role(org_id, array['Presidente','Administrador']::public.app_role[]));

-- Sync Logs: select por membros; insert por gestores e edge functions
create policy sync_logs_select on public.sync_logs for select
  to authenticated using (public.is_org_member(org_id));

create policy sync_logs_insert on public.sync_logs for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

-- Sync Logs: sem update/delete (append-only)

-- Webhook Queue: select por membros; insert por edge functions
create policy webhook_queue_select on public.webhook_queue for select
  to authenticated using (public.is_org_member(org_id));

create policy webhook_queue_insert on public.webhook_queue for insert
  to authenticated with check (public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[]));

create policy webhook_queue_update on public.webhook_queue for update
  to authenticated using (public.is_org_member(org_id));

-- Triggers updated_at
drop trigger if exists trg_erp_config_updated_at on public.integracao_erp_config;
create trigger trg_erp_config_updated_at before update on public.integracao_erp_config
  for each row execute function public.set_updated_at();

drop trigger if exists trg_webhook_queue_updated_at on public.webhook_queue;
create trigger trg_webhook_queue_updated_at before update on public.webhook_queue
  for each row execute function public.set_updated_at();
