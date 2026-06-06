# PRD_ADMIN - P3 indices e plano de query

Data: 2026-06-03

## Escopo executado

- Criada migration `supabase/migrations/20260603193116_prd_admin_query_indexes.sql`.
- A migration adiciona indices idempotentes para os caminhos mais usados pelos dashboards admin:
  - `analytics_events.created_at`;
  - rota derivada de `properties->>'path'` / `properties->>'route'`;
  - `utm_campaign`;
  - `utm_medium`;
  - `ref`;
  - `source + event + created_at`;
  - eventos de funil de checkout/cupom/assinatura;
  - rota legada em `user_activity.event_data`;
  - page views em `user_interactions.target_id`.

## Queries de validacao de plano

Executar em ambiente com dados reais ou staging populado:

```sql
explain (analyze, buffers)
select *
from public.admin_campaign_performance_view
where utm_campaign <> 'none'
order by last_seen_at desc
limit 20;

explain (analyze, buffers)
select *
from public.admin_route_metrics_view
where route <> 'unknown'
order by event_date desc, total_views desc
limit 50;

explain (analyze, buffers)
select *
from public.admin_funnel_daily_view
where event_date >= current_date - interval '30 days'
order by event_date desc;

explain (analyze, buffers)
select *
from public.admin_user_activity_summary_view
where last_event_at >= now() - interval '30 days'
order by total_events desc
limit 50;
```

## Criterio de aceite operacional

- Plano deve usar os indices novos ou uma estrategia equivalente do planner para recortes por periodo/campanha/rota.
- Em base real, registrar tempo total, linhas lidas e buffers antes de liberar dashboards pesados para todos os admins.
- Se a base estiver vazia/local, aceitar apenas validacao sintatica e manter o item `Validar plano de query` aberto ate haver base populada.

## Validacao local

- `supabase --version`: `2.20.12`.
- Migration criada com `supabase migration new prd_admin_query_indexes`.
- `supabase migration list --local` ficou bloqueado por `Invalid db.major_version: 17`, compatibilidade ja conhecida da CLI local antiga com a config atual.
- `npx.cmd tsc --noEmit --pretty false` passou.
- `npm.cmd run build` passou. Warnings remanescentes: CSS `color-adjust` deprecated e aviso Vite sobre import dinamico/estatico do cliente Supabase.

## Status PRD

- Item `Criar indices por created_at, user_id, org_id, event, route, session_id` marcado como concluido.
- Item `Validar plano de query antes de liberar dashboards pesados` permanece aberto ate execucao dos `EXPLAIN (ANALYZE, BUFFERS)` em staging/base real populada.
