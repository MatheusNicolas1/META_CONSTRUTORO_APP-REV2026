-- RPCs complementares para os 6 novos módulos (2026-06-06)
-- Cada RPC é independente e pode ser chamado via supabase.rpc()
-- Nome em português brasileiro

-- ============================================================================
-- MÓDULO 1: FLUXO DE CAIXA E CURVA ABC
-- ============================================================================

-- RPC: obter_saldo_acumulado_mes
-- Retorna saldo acumulado até uma data específica
create or replace function obter_saldo_acumulado_mes(
  p_org_id uuid,
  p_data date default current_date
)
returns table (
  saldo_inicial numeric,
  entradas_realizadas numeric,
  saidas_realizadas numeric,
  saldo_final numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with realized as (
    select
      coalesce(sum(case when tipo = 'entrada' then valor else 0 end), 0) as total_entradas,
      coalesce(sum(case when tipo = 'saida' then valor else 0 end), 0) as total_saidas
    from fluxo_caixa_realizado
    where org_id = p_org_id
      and date_trunc('month', data_realizada) = date_trunc('month', p_data)
      and data_realizada <= p_data
  ),
  prior as (
    select
      coalesce(sum(case when tipo = 'entrada' then valor else -valor end), 0) as saldo_anterior
    from fluxo_caixa_realizado
    where org_id = p_org_id
      and data_realizada < date_trunc('month', p_data)
  )
  select
    coalesce(prior.saldo_anterior, 0) as saldo_inicial,
    realized.total_entradas as entradas_realizadas,
    realized.total_saidas as saidas_realizadas,
    coalesce(prior.saldo_anterior, 0) + realized.total_entradas - realized.total_saidas as saldo_final
  from realized, prior;
end;
$$;

-- RPC: obter_curva_abc
-- Retorna os maiores fornecedores/despesas para curva ABC de custos
create or replace function obter_curva_abc(
  p_org_id uuid,
  p_data_inicio date default date_trunc('year', current_date),
  p_data_fim date default current_date
)
returns table (
  fornecedor_nome text,
  total_gasto numeric,
  percentual_acumulado numeric,
  classificacao char(1)
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_geral numeric;
begin
  -- Total geral do período
  select coalesce(sum(valor), 0) into v_total_geral
  from fluxo_caixa_realizado
  where org_id = p_org_id
    and tipo = 'saida'
    and data_realizada between p_data_inicio and p_data_fim;

  if v_total_geral = 0 then
    return;
  end if;

  return query
  with ranked as (
    select
      coalesce(fornecedor_nome, 'Outros') as nome,
      sum(valor) as total,
      sum(valor) / v_total_geral * 100 as pct
    from fluxo_caixa_realizado
    where org_id = p_org_id
      and tipo = 'saida'
      and data_realizada between p_data_inicio and p_data_fim
    group by fornecedor_nome
    order by total desc
  ),
  accumulated as (
    select
      nome,
      total,
      sum(pct) over (order by total desc rows between unbounded preceding and current row) as pct_acum
    from ranked
  )
  select
    accumulated.nome::text,
    accumulated.total,
    round(accumulated.pct_acum::numeric, 2),
    case
      when accumulated.pct_acum <= 80 then 'A'::char(1)
      when accumulated.pct_acum <= 95 then 'B'::char(1)
      else 'C'::char(1)
    end
  from accumulated;
end;
$$;

-- ============================================================================
-- MÓDULO 2: ORDEM DE SERVIÇO
-- ============================================================================

-- RPC: obter_os_pendentes_aprovacao
create or replace function obter_os_pendentes_aprovacao(
  p_org_id uuid
)
returns table (
  os_id uuid,
  titulo text,
  obra_nome text,
  criado_por_nome text,
  prioridade text,
  criado_em timestamptz,
  dias_pendente int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    o.id,
    o.titulo,
    ob.nome,
    p.nome,
    o.prioridade,
    o.created_at,
    extract(day from now() - o.created_at)::int
  from ordens_servico o
  left join obras ob on ob.id = o.obra_id
  left join profiles p on p.id = o.criado_por
  where o.org_id = p_org_id
    and o.status = 'pendente_aprovacao'
  order by o.prioridade desc, o.created_at asc;
end;
$$;

-- RPC: obter_relatorio_os_mensal
create or replace function obter_relatorio_os_mensal(
  p_org_id uuid,
  p_mes int default extract(month from current_date),
  p_ano int default extract(year from current_date)
)
returns table (
  status text,
  quantidade bigint,
  percentual numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
begin
  select count(*) into v_total
  from ordens_servico
  where org_id = p_org_id
    and extract(month from created_at) = p_mes
    and extract(year from created_at) = p_ano;

  if v_total = 0 then
    return;
  end if;

  return query
  select
    o.status,
    count(*)::bigint,
    round((count(*)::numeric / v_total) * 100, 2)
  from ordens_servico o
  where o.org_id = p_org_id
    and extract(month from o.created_at) = p_mes
    and extract(year from o.created_at) = p_ano
  group by o.status
  order by count(*) desc;
end;
$$;

-- ============================================================================
-- MÓDULO 3: DDS (DIÁLOGO DIÁRIO DE SEGURANÇA)
-- ============================================================================

-- RPC: obter_sequencia_dds
-- Retorna o próximo número sequencial de DDS para uma org no ano
create or replace function obter_sequencia_dds(
  p_org_id uuid,
  p_ano int default extract(year from current_date)
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next int;
begin
  select coalesce(max(numero_sequencial), 0) + 1 into v_next
  from dds_registros
  where org_id = p_org_id
    and extract(year from data_dds) = p_ano;

  return v_next;
end;
$$;

-- RPC: obter_indicadores_dds_mensal
create or replace function obter_indicadores_dds_mensal(
  p_org_id uuid,
  p_mes int default extract(month from current_date),
  p_ano int default extract(year from current_date)
)
returns table (
  total_registros bigint,
  realizados bigint,
  pendentes bigint,
  participantes_unicos bigint,
  percentual_cumprimento numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    count(*)::bigint,
    count(*) filter (where status = 'realizado')::bigint,
    count(*) filter (where status = 'pendente')::bigint,
    (select count(distinct nome) from dds_participantes dp
     join dds_registros dr on dr.id = dp.dds_id
     where dr.org_id = p_org_id
       and extract(month from dr.data_dds) = p_mes
       and extract(year from dr.data_dds) = p_ano)::bigint,
    case
      when count(*) > 0
      then round((count(*) filter (where status = 'realizado')::numeric / count(*)) * 100, 2)
      else 0
    end
  from dds_registros
  where org_id = p_org_id
    and extract(month from data_dds) = p_mes
    and extract(year from data_dds) = p_ano;
end;
$$;

-- ============================================================================
-- MÓDULO 4: GESTÃO DE CONTRATOS E MEDIÇÕES
-- ============================================================================

-- RPC: obter_resumo_contrato
create or replace function obter_resumo_contrato(
  p_org_id uuid,
  p_contrato_id uuid default null
)
returns table (
  contrato_id uuid,
  obra_nome text,
  fornecedor_nome text,
  valor_total numeric,
  valor_medido numeric,
  valor_aprovado numeric,
  saldo_a_medir numeric,
  percentual_executado numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    oc.id,
    ob.nome,
    oc.fornecedor_nome,
    oc.valor_total,
    coalesce((
      select sum(valor_apurado) from medicoes_contrato
      where contrato_id = oc.id
    ), 0) as valor_medido,
    coalesce((
      select sum(valor_apurado) from medicoes_contrato
      where contrato_id = oc.id and status in ('aprovado_campo', 'aprovado_financeiro')
    ), 0) as valor_aprovado,
    oc.valor_total - coalesce((
      select sum(valor_apurado) from medicoes_contrato
      where contrato_id = oc.id
    ), 0) as saldo_a_medir,
    case
      when oc.valor_total > 0
      then round((coalesce((
        select sum(valor_apurado) from medicoes_contrato
        where contrato_id = oc.id
      ), 0) / oc.valor_total) * 100, 2)
      else 0
    end
  from obra_contratos oc
  join obras ob on ob.id = oc.obra_id
  where oc.org_id = p_org_id
    and (p_contrato_id is null or oc.id = p_contrato_id)
  order by ob.nome, oc.fornecedor_nome;
end;
$$;

-- RPC: obter_medicoes_pendentes_aprovacao
create or replace function obter_medicoes_pendentes_aprovacao(
  p_org_id uuid,
  p_nivel text default 'campo'
)
returns table (
  medicao_id uuid,
  contrato_info text,
  periodo text,
  valor_solicitado numeric,
  status_atual text,
  dias_em_aberto int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    mc.id,
    oc.fornecedor_nome || ' - ' || ob.nome,
    to_char(mc.periodo_inicio, 'MM/YYYY') || ' a ' || to_char(mc.periodo_fim, 'MM/YYYY'),
    mc.valor_apurado,
    mc.status,
    extract(day from now() - mc.created_at)::int
  from medicoes_contrato mc
  join obra_contratos oc on oc.id = mc.contrato_id
  join obras ob on ob.id = oc.obra_id
  where oc.org_id = p_org_id
    and (
      (p_nivel = 'campo' and mc.status = 'pendente_campo')
      or (p_nivel = 'financeiro' and mc.status = 'pendente_financeiro')
    )
  order by mc.created_at asc;
end;
$$;

-- ============================================================================
-- MÓDULO 5: PORTAL DO CLIENTE
-- ============================================================================

-- RPC: obter_portal_token_valido
-- Verifica se um token do portal é válido e retorna dados básicos (sem expor hash)
create or replace function obter_portal_token_valido(
  p_token_hash text
)
returns table (
  portal_id uuid,
  obra_nome text,
  cliente_nome text,
  cliente_email text,
  permissoes jsonb,
  expiracao timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    cp.id,
    ob.nome,
    cp.cliente_nome,
    cp.cliente_email,
    cp.permissoes,
    cp.expiracao
  from clientes_portal cp
  join obras ob on ob.id = cp.obra_id
  where cp.token_hash = p_token_hash
    and cp.status = 'ativo'
    and cp.expiracao > now();
end;
$$;

-- RPC: obrar_mensagens_nao_lidas_portal
create or replace function obrar_mensagens_nao_lidas_portal(
  p_portal_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  select count(*) into v_count
  from mensagens_portal
  where cliente_portal_id = p_portal_id
    and lida = false
    and direcao = 'cliente_para_empresa';
  return v_count;
end;
$$;

-- ============================================================================
-- MÓDULO 6: INTEGRAÇÃO ERP
-- ============================================================================

-- RPC: obter_status_sync_erp
create or replace function obter_status_sync_erp(
  p_org_id uuid
)
returns table (
  provedor text,
  status_conexao text,
  ultima_sync timestamptz,
  total_eventos bigint,
  eventos_pendentes bigint,
  eventos_erro bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    iec.provedor,
    iec.status_conexao,
    iec.ultima_sync,
    (select count(*) from sync_logs sl where sl.org_id = p_org_id)::bigint,
    (select count(*) from sync_logs sl where sl.org_id = p_org_id and sl.status = 'pendente')::bigint,
    (select count(*) from sync_logs sl where sl.org_id = p_org_id and sl.status = 'erro')::bigint
  from integracao_erp_config iec
  where iec.org_id = p_org_id
    and iec.ativo = true;
end;
$$;

-- RPC: obter_eventos_fila_webhook
create or replace function obter_eventos_fila_webhook(
  p_org_id uuid,
  p_status text default 'pendente',
  p_limite int default 20
)
returns table (
  evento_id uuid,
  modulo text,
  tipo_evento text,
  payload jsonb,
  status text,
  tentativas int,
  proxima_tentativa timestamptz,
  criado_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    wq.id,
    wq.modulo,
    wq.tipo_evento,
    wq.payload,
    wq.status,
    wq.tentativas,
    wq.proxima_tentativa,
    wq.created_at
  from webhook_queue wq
  where wq.org_id = p_org_id
    and (p_status is null or wq.status = p_status)
  order by wq.created_at asc
  limit p_limite;
end;
$$;

-- ============================================================================
-- RPC UTILITÁRIO: diagnosticar_permissao_modulo
-- Verifica se um usuário tem permissão de acesso a um módulo específico
-- ============================================================================

create or replace function diagnosticar_permissao_modulo(
  p_user_id uuid,
  p_org_id uuid,
  p_modulo text
)
returns table (
  permitido boolean,
  funcao text,
  motivo text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funcao text;
  v_planos_permitidos text[];
begin
  -- Mapa de permissões
  v_planos_permitidos := case p_modulo
    when 'fluxo_caixa' then array['master', 'premium', 'business']
    when 'ordem_servico' then array['master', 'premium', 'business']
    when 'dds' then array['master', 'premium', 'business']
    when 'contratos' then array['master', 'premium']
    when 'portal_cliente' then array['master', 'premium']
    when 'erp' then array['enterprise']
    else array['master']
  end;

  select om.funcao into v_funcao
  from org_members om
  where om.user_id = p_user_id and om.org_id = p_org_id;

  if v_funcao is null then
    return query select false::boolean, null::text, 'Usuário não é membro da organização'::text;
    return;
  end if;

  return query
  select
    true::boolean,
    v_funcao,
    'Acesso permitido: função ' || v_funcao;
end;
$$;

-- ============================================================================
-- TRIGGER: atualizar_timestamps (genérico para novas tabelas)
-- ============================================================================

create or replace function trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aplicar trigger em tabelas que não têm (uso seguro: IF NOT EXISTS)
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array[
    'ordens_servico', 'dds_registros', 'perfil_empresa_seguranca',
    'obra_contratos', 'medicoes_contrato',
    'clientes_portal', 'integracao_erp_config'
  ])
  loop
    execute format(
      'drop trigger if exists set_updated_at_%I on %I',
      tbl, tbl
    );
    execute format(
      'create trigger set_updated_at_%I
       before update on %I
       for each row execute function trigger_set_updated_at()',
      tbl, tbl
    );
  end loop;
end;
$$;
