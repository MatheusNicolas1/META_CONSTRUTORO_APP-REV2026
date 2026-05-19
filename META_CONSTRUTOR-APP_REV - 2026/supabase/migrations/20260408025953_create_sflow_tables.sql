
-- S-Flow — Tabelas do Sistema (PRD v3.0)

-- CLIENTES
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text check(tipo in ('PF','PJ')) not null,
  cpf_cnpj text unique,
  email text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  criado_em timestamptz default now()
);

-- PROJETOS
create table if not exists projetos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  nome text not null,
  tipo_estrutura text,
  area_total numeric,
  descricao_empreendimento text,
  endereco_obra text,
  status text default 'lead',
  valor_contratado numeric default 0,
  data_inicio date,
  prazo_entrega date,
  data_conclusao date,
  criado_em timestamptz default now()
);

-- PAGAMENTOS
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id),
  parcela_num integer,
  descricao text,
  valor numeric not null,
  vencimento date not null,
  recebido_em date,
  forma_pagamento text,
  status text default 'pendente',
  numero_nf text
);

-- PROPOSTAS (expandida)
create table if not exists propostas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id),
  numero text,
  versao integer default 1,
  valor_total numeric,
  validade_dias integer default 15,
  prazo_entrega_dias integer default 45,
  escopo_projeto_estrutural boolean default true,
  escopo_art boolean default true,
  escopo_acompanhamento boolean default true,
  escopo_fabricacao boolean default true,
  escopo_modelagem_3d boolean default true,
  escopo_quantitativo boolean default true,
  condicao_pagamento_1_pct numeric default 30,
  condicao_pagamento_2_pct numeric default 70,
  status text default 'rascunho',
  arquivo_pdf_path text,
  enviada_em timestamptz,
  aprovada_em timestamptz,
  criado_em timestamptz default now()
);

-- CONTRATOS
create table if not exists contratos (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid references propostas(id),
  projeto_id uuid not null references projetos(id),
  numero text,
  valor_total numeric,
  status text default 'gerado',
  link_assinatura text,
  assinado_em timestamptz,
  arquivo_pdf_path text,
  criado_em timestamptz default now()
);

-- CONTATOS (historico CRM)
create table if not exists contatos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  tipo text,
  descricao text,
  data timestamptz default now()
);

-- PRANCHAS
create table if not exists pranchas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id),
  numero text,
  titulo text,
  revisao text default 'A',
  status text default 'em_elaboracao',
  arquivo_path text,
  emitido_em date
);

-- HISTORICO DE E-MAILS
create table if not exists historico_emails (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id),
  cliente_id uuid references clientes(id),
  tipo text not null,
  destinatario text not null,
  assunto text,
  gmail_message_id text,
  anexos text[],
  enviado_em timestamptz default now(),
  status text default 'enviado'
);

-- METAS FINANCEIRAS
create table if not exists metas_financeiras (
  id uuid primary key default gen_random_uuid(),
  mes integer,
  ano integer,
  meta_valor numeric,
  unique(mes, ano)
);

-- RLS
alter table clientes enable row level security;
alter table projetos enable row level security;
alter table pagamentos enable row level security;
alter table propostas enable row level security;
alter table contratos enable row level security;
alter table contatos enable row level security;
alter table pranchas enable row level security;
alter table historico_emails enable row level security;
alter table metas_financeiras enable row level security;

-- Politicas de acesso (uso pessoal)
create policy "sflow_all_clientes" on clientes for all to anon using (true) with check (true);
create policy "sflow_all_projetos" on projetos for all to anon using (true) with check (true);
create policy "sflow_all_pagamentos" on pagamentos for all to anon using (true) with check (true);
create policy "sflow_all_propostas" on propostas for all to anon using (true) with check (true);
create policy "sflow_all_contratos" on contratos for all to anon using (true) with check (true);
create policy "sflow_all_contatos" on contatos for all to anon using (true) with check (true);
create policy "sflow_all_pranchas" on pranchas for all to anon using (true) with check (true);
create policy "sflow_all_historico_emails" on historico_emails for all to anon using (true) with check (true);
create policy "sflow_all_metas_financeiras" on metas_financeiras for all to anon using (true) with check (true);
;
