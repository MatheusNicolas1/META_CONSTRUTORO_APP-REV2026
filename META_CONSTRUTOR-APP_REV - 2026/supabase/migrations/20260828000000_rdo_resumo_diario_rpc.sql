-- RPCs de resumo diário de RDOs (PRD_AGENDAS_RDO.md).
-- Substituem as Edge Functions resumo-diario-nicho e resumo-diario-geral
-- por funções de banco, chamadas via supabase.rpc().
-- Data: 2026-08-28

-- ============================================================
-- Resumo por nicho
-- ============================================================
create or replace function public.resumo_diario_nicho(
  p_org_id uuid,
  p_data date,
  p_nicho_slug text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nicho_id uuid;
  v_nicho_nome text;
  v_total_rdos integer := 0;
  v_total_atividades integer := 0;
  v_total_equipes integer := 0;
  v_ocorrencias jsonb := '[]'::jsonb;
  v_colaboradores jsonb := '[]'::jsonb;
  v_status text := 'NORMAL';
  v_resumo_texto text;
begin
  select id, nome into v_nicho_id, v_nicho_nome
  from rdo_nichos
  where org_id = p_org_id and slug = p_nicho_slug
  limit 1;

  if v_nicho_id is not null then
    select count(*) into v_total_rdos
    from rdos
    where org_id = p_org_id and data = p_data and nicho_id = v_nicho_id
      and deleted_at is null and status in ('SUBMITTED', 'APPROVED');

    select count(*) into v_total_atividades
    from rdo_atividades a
    join rdos r on r.id = a.rdo_id
    where r.org_id = p_org_id and r.data = p_data and r.nicho_id = v_nicho_id
      and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED');

    select count(*) into v_total_equipes
    from rdo_equipes e
    join rdos r on r.id = e.rdo_id
    where r.org_id = p_org_id and r.data = p_data and r.nicho_id = v_nicho_id
      and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED');

    select coalesce(jsonb_agg(x), '[]'::jsonb) into v_ocorrencias
    from (
      select jsonb_build_object(
        'tipo', 'equipamento',
        'descricao', coalesce(nullif(eq.descricao_problema, ''), 'Equipamento com problema'),
        'gravidade', case when eq.causou_ociosidade then 'Grave' else 'Moderado' end,
        'impacto', case when eq.causou_ociosidade then 'Alto' else 'Médio' end
      ) as x
      from rdo_equipamentos eq
      join rdos r on r.id = eq.rdo_id
      where r.org_id = p_org_id and r.data = p_data and r.nicho_id = v_nicho_id
        and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED')
        and (eq.descricao_problema is not null or eq.status = 'Parado' or eq.causou_ociosidade)
    ) sub;

    select coalesce(jsonb_agg(distinct eq.nome) filter (where eq.nome is not null), '[]'::jsonb)
    into v_colaboradores
    from rdo_equipes re
    join rdos r on r.id = re.rdo_id
    join equipes eq on eq.id = re.equipe_id
    where r.org_id = p_org_id and r.data = p_data and r.nicho_id = v_nicho_id
      and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED');

    v_status := case
      when jsonb_array_length(v_ocorrencias) >= 3 then 'CRÍTICO'
      when jsonb_array_length(v_ocorrencias) = 2 then 'ALERTA'
      when jsonb_array_length(v_ocorrencias) = 1 then 'ATENÇÃO'
      else 'NORMAL'
    end;
  end if;

  v_resumo_texto := format('%s RDO(s), %s atividade(s), %s equipe(s) no nicho %s.',
    v_total_rdos, v_total_atividades, v_total_equipes, coalesce(v_nicho_nome, p_nicho_slug));

  return jsonb_build_object(
    'data', to_char(p_data, 'YYYY-MM-DD'),
    'nicho', coalesce(v_nicho_nome, p_nicho_slug),
    'slug', p_nicho_slug,
    'total_rdos', v_total_rdos,
    'total_atividades', v_total_atividades,
    'total_equipes', v_total_equipes,
    'ocorrencias', v_ocorrencias,
    'materiais_em_falta', '[]'::jsonb,
    'resumo_texto', v_resumo_texto,
    'colaboradores_envolvidos', v_colaboradores,
    'status_geral', v_status
  );
end;
$$;

-- ============================================================
-- Resumo geral
-- ============================================================
create or replace function public.resumo_diario_geral(
  p_org_id uuid,
  p_data date
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_total_rdos integer := 0;
  v_total_nichos integer := 0;
  v_nichos jsonb := '[]'::jsonb;
  v_ocorrencias_total integer := 0;
  v_status text := 'NORMAL';
begin
  select count(*) into v_total_rdos
  from rdos
  where org_id = p_org_id and data = p_data
    and deleted_at is null and status in ('SUBMITTED', 'APPROVED');

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_nichos
  from (
    with eq_por_rdo as (
      select r.nicho_id, r.id as rdo_id, count(*) as crit
      from rdos r
      join rdo_equipamentos eq on eq.rdo_id = r.id
      where r.org_id = p_org_id and r.data = p_data
        and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED')
        and (eq.descricao_problema is not null or eq.status = 'Parado' or eq.causou_ociosidade)
      group by r.nicho_id, r.id
    )
    select
      coalesce(n.nome, 'Sem nicho') as nicho,
      coalesce(n.slug, 'sem-nicho') as slug,
      count(r.id)::int as total_rdos,
      coalesce(sum(e.crit), 0)::int as ocorrencias_criticas,
      'NORMAL' as status,
      format('%s RDO(s)', count(r.id)) as resumo_curto
    from rdos r
    left join rdo_nichos n on n.id = r.nicho_id
    left join eq_por_rdo e on e.rdo_id = r.id
    where r.org_id = p_org_id and r.data = p_data
      and r.deleted_at is null and r.status in ('SUBMITTED', 'APPROVED')
    group by n.id, n.nome, n.slug
    order by count(r.id) desc
  ) x;

  select count(*) into v_total_nichos
  from (
    select distinct nicho_id
    from rdos
    where org_id = p_org_id and data = p_data
      and deleted_at is null and status in ('SUBMITTED', 'APPROVED')
  ) d;

  select coalesce(sum((y->>'ocorrencias_criticas')::int), 0) into v_ocorrencias_total
  from jsonb_array_elements(v_nichos) y;

  v_status := case
    when v_ocorrencias_total >= 3 then 'CRÍTICO'
    when v_ocorrencias_total = 2 then 'ALERTA'
    when v_ocorrencias_total = 1 then 'ATENÇÃO'
    else 'NORMAL'
  end;

  return jsonb_build_object(
    'data', to_char(p_data, 'YYYY-MM-DD'),
    'total_rdos', v_total_rdos,
    'total_nichos', v_total_nichos,
    'nichos', v_nichos,
    'status_geral', v_status,
    'resumo_geral', format('Dia com %s RDO(s) em %s nicho(s).', v_total_rdos, v_total_nichos)
  );
end;
$$;

grant execute on function public.resumo_diario_nicho(uuid, date, text) to authenticated;
grant execute on function public.resumo_diario_geral(uuid, date) to authenticated;
