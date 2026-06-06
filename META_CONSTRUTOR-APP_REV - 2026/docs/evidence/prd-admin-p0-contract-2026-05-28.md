# PRD_ADMIN P0 - contrato local/remoto de Admin e analytics

Data: 2026-05-28
Escopo: primeira execucao do P0 do `PRD_ADMIN.md`.

## Comandos executados

```powershell
rg -n "admin_audit_logs|analytics_events|coupons|org_members|orgs|plans|profiles|referrals|subscriptions|user_activity|user_interactions|admin_users_view|menu_engagement_metrics|view_analytics_top" src\integrations\supabase\types.ts
rg -n "CREATE TABLE IF NOT EXISTS public\.(user_activity|referrals|coupons|admin_audit_logs)|analytics_events|admin_users_view|user_interactions|view_analytics_top|menu_engagement_metrics" supabase\migrations
npx.cmd supabase db dump --linked --schema public --file C:\tmp\prd-admin-remote-public-schema.sql
Select-String -Path C:\tmp\prd-admin-remote-public-schema.sql -Pattern "CREATE TABLE IF NOT EXISTS `"public`".`"profiles`"","CREATE TABLE IF NOT EXISTS `"public`".`"orgs`"","CREATE TABLE IF NOT EXISTS `"public`".`"org_members`"","CREATE TABLE IF NOT EXISTS `"public`".`"user_roles`"","CREATE TABLE IF NOT EXISTS `"public`".`"analytics_events`"","CREATE TABLE IF NOT EXISTS `"public`".`"user_activity`"","CREATE TABLE IF NOT EXISTS `"public`".`"user_interactions`"","CREATE OR REPLACE VIEW `"public`".`"admin_users_view`"","CREATE OR REPLACE VIEW `"public`".`"view_analytics_top_buttons`""
```

## Resultado remoto

Dump remoto gerado em:

- `C:\tmp\prd-admin-remote-public-schema.sql`

Objetos P0 confirmados no remoto:

- `public.profiles`
- `public.orgs`
- `public.org_members`
- `public.user_roles`
- `public.subscriptions`
- `public.plans`
- `public.coupons`
- `public.referrals`
- `public.user_activity`
- `public.user_interactions`
- `public.analytics_events`
- `public.admin_audit_logs`
- `public.admin_users_view`
- `public.menu_engagement_metrics`
- `public.view_analytics_top_buttons`
- `public.view_analytics_top_items`
- `public.view_analytics_top_pages`

Linhas relevantes no dump remoto:

- `admin_audit_logs`: linha 1164
- `profiles`: linha 1177
- `user_roles`: linha 1234
- `admin_users_view`: linha 1246
- `analytics_events`: linha 1264
- `coupons`: linha 1448
- `user_activity`: linha 1845
- `menu_engagement_metrics`: linha 1857
- `org_members`: linha 1913
- `orgs`: linha 1950
- `plans`: linha 1994
- `referrals`: linha 2243
- `subscriptions`: linha 2314
- `user_interactions`: linha 2362
- `view_analytics_top_buttons`: linha 2447
- `view_analytics_top_items`: linha 2460
- `view_analytics_top_pages`: linha 2473

## Achados

### A1 - `analytics_events` remoto esta mais pobre que o catalogo

O catalogo `docs/ANALYTICS_CATALOG.md` descreve `analytics_events` com:

- `id`
- `created_at`
- `event`
- `org_id`
- `user_id`
- `role`
- `source`
- `properties`
- `environment`
- `request_id`
- `success`
- `error`

O dump remoto atual mostra apenas:

- `id`
- `event`
- `properties`
- `created_at`

Impacto:

- O Admin nao deve depender de `analytics_events` como fonte canonica antes de reconciliar a tabela.
- A decisao de fonte canonica continua valida como direcao, mas exige migration/ajuste remoto.

### A2 - `analytics_events` existe em migrations e no remoto, mas nao aparece nos tipos gerados

`src/integrations/supabase/types.ts` lista `user_activity`, `user_interactions`, `admin_users_view` e as views de heatmap, mas a busca por `analytics_events` no arquivo de tipos nao retornou entradas.

Impacto:

- O frontend tendera a usar casts `as any` ou ficara sem typing se passar a consultar `analytics_events`.
- Depois de reconciliar schema, gerar tipos deve entrar no P0/P1.

### A3 - Existem duas trilhas de tracking em paralelo

Confirmado no codigo:

- `src/utils/activityTracker.ts` grava em `user_activity`.
- `src/hooks/useUserInteraction.ts` grava page views em `user_interactions`.
- `src/integrations/analytics.ts` envia para PostHog, mas nao persiste fallback em `analytics_events` no frontend.

Impacto:

- Numeros de engajamento, heatmap e produto podem divergir.
- O P0 precisa definir uma fonte canonica e manter views legadas apenas como compatibilidade.

### A4 - Tracking de RDO usa rota incorreta

`src/components/OptimizedLayout.tsx` mapeia `/app/rdos` para `view_rdos`, mas a rota real em `src/components/PerformanceOptimizedApp.tsx` e `/app/rdo`.

Impacto:

- A visualizacao da pagina de RDO pode nao ser gravada em `user_activity`.

### A5 - Permissao administrativa global ainda esta ambigua

Confirmado no codigo:

- A rota `/app/admin/dashboard` usa `ProtectedPage roles={["Presidente"]}`.
- `AdminDashboard` valida `hasRole("Administrador")`.
- `AdminManagers` e a aba correspondente usam e-mail fixo `matheusnicolas.org@gmail.com`.

Impacto:

- O Admin global precisa de contrato de permissao explicito antes de expandir metricas e operacoes sensiveis.

## Proxima acao recomendada

1. Atualizar `PRD_ADMIN.md` com estes achados.
2. Corrigir o tracking basico de sessao/rota sem alterar schema remoto.
3. Planejar migration especifica para enriquecer `analytics_events`, com backup/validacao antes de aplicar remoto.

## Execucao complementar

### Migration remota aplicada

Arquivo local criado:

- `supabase/migrations/20260528120000_prd_admin_analytics_events_contract.sql`

Aplicacao remota:

```powershell
npx.cmd supabase db query --linked --file supabase\migrations\20260528120000_prd_admin_analytics_events_contract.sql
```

Validacao remota apos aplicacao:

- `analytics_events` agora contem `id`, `event`, `properties`, `created_at`, `org_id`, `user_id`, `role`, `source`, `environment`, `request_id`, `success`, `error`.
- Policies finais confirmadas:
  - `analytics_events_service_role_all`
  - `analytics_events_org_members_select`
  - `analytics_events_authenticated_insert_own`
- Indices finais confirmados:
  - `analytics_events_pkey`
  - `idx_analytics_events_event_date`
  - `idx_analytics_events_org_date`
  - `idx_analytics_events_request_id`
  - `idx_analytics_events_user_date`

### Tipos Supabase

Tipos regenerados com:

```powershell
npx.cmd supabase gen types --linked --lang=typescript --schema public | Set-Content -Path src\integrations\supabase\types.ts
```

Resultado:

- `src/integrations/supabase/types.ts` agora inclui `public.Tables.analytics_events`.

### Permissao Admin

E-mail hardcoded removido da permissao de Admin da plataforma.

Contrato local temporario:

- `canAccessPlatformAdmin(roles)` usa `Presidente`.
- `canManagePlatformAdmins(roles)` usa `Presidente`.

Arquivos alterados:

- `src/utils/adminAccess.ts`
- `src/pages/AdminDashboard.tsx`
- `src/components/admin/AdminManagers.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/CreditsDisplay.tsx`

### Saude do Admin

Placeholder removido:

- `src/components/admin/AdminHealthMetrics.tsx` deixou de exibir `uptime: 99.9`.
- A tela agora valida leituras reais de `profiles`, `user_activity`, `user_interactions` e `analytics_events`.

### Validacao final

```powershell
npm.cmd run build
```

Resultado:

- Build concluido com sucesso.

## Execucao complementar 2

### Ingestao canonica e compatibilidade legada

Arquivos alterados:

- `src/integrations/analytics.ts`
- `src/hooks/useUserInteraction.ts`

Resultado:

- `track()` continua enviando eventos ao PostHog quando configurado.
- Eventos autenticados tambem sao persistidos em `analytics_events` com `org_id`, `user_id`, `role`, `source`, `environment`, `request_id`, `success` e `properties`.
- `useUserInteraction` manteve a gravacao legada em `user_interactions`, mas tambem emite `app.route_viewed` e `app.interaction_recorded` para a fonte canonica.

### Views administrativas aplicadas

Arquivo local criado:

- `supabase/migrations/20260528133000_prd_admin_analytics_aggregation_views.sql`

Aplicacao remota:

```powershell
npx.cmd supabase db query --linked --file supabase\migrations\20260528133000_prd_admin_analytics_aggregation_views.sql
```

Views confirmadas no remoto:

- `admin_analytics_events_unified_view`
- `admin_funnel_daily_view`
- `admin_route_metrics_view`
- `admin_user_activity_summary_view`
- `admin_user_segments_view`

Consulta de sanidade executada no remoto:

- `admin_analytics_events_unified_view`: 5713 linhas
- `admin_route_metrics_view`: 673 linhas
- `admin_user_activity_summary_view`: 158 linhas
- `admin_funnel_daily_view`: 58 linhas
- `admin_user_segments_view`: 74 linhas

Indices confirmados no remoto:

- `idx_user_activity_event_date`
- `idx_user_activity_user_date`
- `idx_user_interactions_target_date`
- `idx_user_interactions_type_date`
- `idx_user_interactions_user_date`

Tipos regenerados novamente com:

```powershell
npx.cmd supabase gen types --linked --lang=typescript --schema public | Set-Content -Path src\integrations\supabase\types.ts
```

Validacao:

```powershell
npm.cmd run build
```

Resultado:

- Build concluido com sucesso.
- Warnings residuais ja existentes: `color-adjust` deprecated e import dinamico/estatico misto de `src/integrations/supabase/client.ts`.
