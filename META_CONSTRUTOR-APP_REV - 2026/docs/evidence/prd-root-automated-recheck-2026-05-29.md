# PRD.md - Rechecagem automatizada de release

Data: 2026-05-29

## Objetivo

Continuar a execucao do `PRD.md` da raiz, revalidando os gates automatizaveis e mantendo abertas as pendencias manuais/controladas.

## Execucao

- `npx.cmd supabase migration list --linked`
- `npx.cmd supabase functions list --output json`
- Smoke publico via `curl.exe` para:
  - `/home`
  - `/login`
  - `/criar-conta`
  - `/preco`
  - `/checkout?plan=basic`
  - `/checkout/success`
  - `/checkout/cancel`
  - `/contato`
  - `/legal/privacidade`
  - `/legal/termos`
  - `/legal/cookies`
  - `/legal/lgpd`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

## Resultados

- Edge Functions remotas continuam listadas como `ACTIVE`, incluindo funcoes criticas de checkout, webhook Stripe, RDO, checklist, convites, feedback, contato, PDF e auditoria.
- Rotas publicas de producao testadas retornaram `200 text/html`.
- `npm.cmd run lint`: passou com `0 errors` e `34 warnings` preexistentes.
- `npm.cmd run test`: passou com `8` arquivos e `27` testes.
- `npm.cmd run build`: passou, incluindo postbuild com `15` rotas publicas pre-renderizadas.

## Supabase migrations

Na primeira leitura, `migration list --linked` mostrou tres migrations locais de `2026-05-28` sem correspondente remoto:

- `20260528120000_prd_admin_analytics_events_contract.sql`
- `20260528133000_prd_admin_analytics_aggregation_views.sql`
- `20260528222800_prd_admin_marketing_attribution.sql`

Foi executada consulta somente leitura no remoto confirmando que os objetos dessas migrations ja existiam:

- `analytics_events`
- colunas `anonymous_id` e `utm_source`
- `admin_analytics_events_unified_view`
- `admin_route_metrics_view`
- `admin_user_activity_summary_view`
- `admin_funnel_daily_view`
- `admin_user_segments_view`
- `admin_org_usage_summary_view`
- `admin_campaign_performance_view`
- `admin_checkout_funnel_view`
- `admin_churn_risk_view`

Como o schema ja estava presente, foi executado apenas:

`npx.cmd supabase migration repair --linked --status applied 20260528120000 20260528133000 20260528222800`

A rechecagem confirmou essas tres migrations reconciliadas.

## Reconciliacao adicional da Lixeira

Apos o repair, restou uma migration local sem remoto:

- `20260529034950_prd_lixeira_soft_delete_foundation.sql`

Foi feita consulta somente leitura antes da alteracao confirmando:

- as tabelas `obras`, `documentos`, `rdos`, `checklists`, `atividades` e `expenses` existem no remoto;
- as colunas usadas pela view `public.lixeira_items` existem;
- `public.audit_logs` aceita o contrato usado pela trigger de auditoria;
- `public.lixeira_items` ainda nao existia;
- as colunas de soft delete ainda nao existiam nas seis tabelas-alvo.

Antes da DDL foi criado backup remoto em:

`C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026\.release-backups\prd-root-2026-05-29-before-lixeira.sql`

Resultado:

- `npx.cmd supabase db query --linked --file supabase\migrations\20260529034950_prd_lixeira_soft_delete_foundation.sql`: passou.
- `npx.cmd supabase migration repair --linked --status applied 20260529034950`: passou.
- Rechecagem remota confirmou `deleted_at`, `deleted_by`, `delete_reason`, `delete_origin` e `purge_at` em `obras`, `documentos`, `rdos`, `checklists`, `atividades` e `expenses`.
- Rechecagem remota confirmou `public.lixeira_items` existente.
- Consulta `select count(*) as lixeira_items_count from public.lixeira_items;` respondeu sem erro, com `lixeira_items_count=0`.
- `npx.cmd supabase migration list --linked` confirmou `20260529034950` alinhada em Local/Remote.

## Pendencias manuais mantidas

- Google OAuth final com login real.
- Redefinicao por link de e-mail.
- Pagamento real controlado, troca de plano e cancelamento com assinatura ativa/trialing.
