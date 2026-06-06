# PRD_ADMIN P2 - atribuicao anonima e eventos publicos

Data: 2026-05-28
Escopo: primeira execucao de P2 do `PRD_ADMIN.md`.

## Schema remoto

Migration criada via CLI:

```powershell
npx.cmd supabase migration new prd_admin_marketing_attribution
```

Arquivo:

- `supabase/migrations/20260528222800_prd_admin_marketing_attribution.sql`

Aplicacao remota:

```powershell
npx.cmd supabase db query --linked --file supabase\migrations\20260528222800_prd_admin_marketing_attribution.sql
```

Campos adicionados a `analytics_events`:

- `anonymous_id`
- `session_id`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `ref`
- `referrer`

Policy criada:

- `analytics_events_anon_insert_public`, para `anon`, somente `INSERT`, exigindo `user_id is null`, `org_id is null`, `source = 'frontend'` e evento publico permitido.

Views complementares criadas:

- `admin_org_usage_summary_view`
- `admin_campaign_performance_view`
- `admin_checkout_funnel_view`
- `admin_churn_risk_view`

Tipos regenerados:

```powershell
npx.cmd supabase gen types --linked --lang=typescript --schema public | Set-Content -Path src\integrations\supabase\types.ts
```

## Frontend

Arquivos alterados:

- `src/integrations/analytics.ts`
- `src/components/analytics/PublicMarketingTracker.tsx`
- `src/components/PerformanceOptimizedApp.tsx`

Resultado:

- `anonymous_id` persistido em `localStorage`.
- `session_id` persistido em `sessionStorage`.
- UTMs/ref capturados da URL e enviados para PostHog/Supabase.
- Page views anonimos publicos emitem `app.public_page_viewed` para `/home`, `/preco`, `/checkout`, `/criar-conta` e `/contato`.

## Validacao

Build:

```powershell
npm.cmd run build
```

Resultado:

- Build concluido com sucesso.
- Warnings residuais ja conhecidos: `color-adjust` deprecated e import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

Smoke Playwright local:

- URL: `http://127.0.0.1:5174/home?utm_source=codex&utm_medium=smoke&utm_campaign=prd_admin&ref=qa`
- Titulo: `Meta Construtor | Sistema de gestao de obras e RDO digital`
- `anonymous_id`: criado
- `session_id`: criado
- Logs de console: nenhum erro/warning capturado
- Screenshot: `C:\tmp\prd-admin-home-smoke.png`

Validacao remota Supabase:

- `app.public_page_viewed` encontrado com `utm_source=codex`, `utm_medium=smoke`, `utm_campaign=prd_admin`, `ref=qa`, `anonymous_id` e `session_id`.

## Pendencias

## Complemento 2026-05-29

Arquivos alterados:

- `src/components/analytics/PublicMarketingTracker.tsx`
- `src/integrations/analytics.ts`
- `vercel.json`

Resultado:

- Rotas publicas passam a emitir eventos especificos:
  - `marketing.home_viewed`
  - `marketing.pricing_viewed`
  - `billing.checkout_viewed`
  - `auth.signup_viewed`
  - `marketing.contact_viewed`
- Cliques em CTAs publicos passam a emitir `marketing.cta_clicked`.
- Labels de CTA sao sanitizados para nao enviar e-mail ou telefone.
- `setAnalyticsSession` emite `auth.user_identified` na primeira associacao do usuario autenticado com o contexto anonimo.
- CSP da Vercel passou a permitir PostHog: `app.posthog.com`, `us.i.posthog.com`, `eu.i.posthog.com`.

Smoke Playwright local:

- `/preco?utm_source=codex&utm_medium=smoke&utm_campaign=prd_admin_final&ref=qa`: sem erros/warnings.
- `/checkout?plan=basic&utm_source=codex&utm_medium=smoke&utm_campaign=prd_admin_final&ref=qa`: sem erros; warning esperado do Stripe por HTTP local.
- `/criar-conta?utm_source=codex&utm_medium=smoke&utm_campaign=prd_admin_final&ref=qa`: sem erros/warnings.

Validacao remota Supabase:

- Eventos encontrados com `utm_campaign=prd_admin_final`:
  - `app.public_page_viewed`
  - `marketing.pricing_viewed`
  - `billing.checkout_viewed`
  - `auth.signup_viewed`
  - `marketing.cta_clicked`

Validacao pre-deploy:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Resultado:

- Lint: 0 erros, 34 warnings existentes.
- Testes: 8 arquivos, 27 testes passando.
- Build: concluido com sucesso.

## Deploy 2026-05-29

Comando:

```powershell
npx.cmd vercel --prod --yes
```

Resultado:

- Deployment final: `dpl_5URuvifQKqP5SkDVTgXzSCF6mvde`
- URL: `https://meta-construtor-app-rev-2026-bfvpldhhj.vercel.app`
- Alias principal: `https://www.metaconstrutor.app.br`
- Alias adicional: `https://metaconstrutor.app.br`
- Status Vercel Inspect: `Ready`

Smoke HTTP de producao:

```text
home 200 text/html; charset=utf-8 4529
preco 200 text/html; charset=utf-8 4338
checkout 200 text/html; charset=utf-8 3540
criar-conta 200 text/html; charset=utf-8 3540
```

## Pendencias restantes

- Criar filtros globais por periodo, plano, role, campanha, origem, rota e org.
- Instrumentar onboarding, primeira ativacao e cliques autenticados relevantes para heatmap.
- Validar usuario comum/admin autorizado com sessoes reais.
