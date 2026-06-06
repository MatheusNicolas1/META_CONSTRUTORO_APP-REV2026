# Evidencia - PRD_DASHBOARD Ciclo 5 - 2026-05-31

## Escopo executado

- `GlobalSearch.tsx` deixou de abrir modal/mockup ao clicar no campo ou usar `Ctrl+K`.
- A busca do dashboard agora permanece inline, aceita digitacao direta e consulta obras, RDOs e documentos reais da organizacao.
- `Ctrl+K` foca o input renderizado, sem exibir o texto/modal `Busca Global`.
- `Logo.tsx` usa a mesma tipografia para `META` e `Construtor`; `META` alterna entre azul no modo claro e branco no modo dark.
- `AppSidebar.tsx` removeu a duplicacao de Dashboard/Obras/RDO/Check no painel expandido e passou a exibir um bloco de ultimos RDOs criados.
- `analytics.ts` voltou a persistir eventos autenticados com `user_id`, `org_id`, `source`, `environment` e campos de atribuicao, respeitando a policy RLS de `analytics_events`.

## Registro Impeccable / Vercel

- Impeccable foi usado como direcao de produto para evitar modal como primeira solucao e preservar uma busca inline, mais direta para tarefa operacional.
- A validacao seguiu o registro de produto: navegacao previsivel, densidade util, foco em RDO e ausencia de elementos decorativos sem funcao.
- Vercel CLI foi consultado para manter o fluxo de deploy de producao via CLI.

## Validacao local

- `npx.cmd tsc -b --clean; npm.cmd run build`: passou.
- `npm.cmd run build`: passou apos ajuste final de foco do `Ctrl+K`.
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "/app/dashboard renders authenticated"`: 6 passed em 320, 390, 768, 1024, 1440 e 1920.
- `npx.cmd playwright test scripts/prd-layout-smoke.spec.ts --grep "/home"`: 4 passed em 320, 390, 768 e 1440.

## Deploy Vercel

- Comando: `npx.cmd vercel deploy --prod --yes`.
- Deployment final: `dpl_3VnJ6fv6rUBcsiC7wPvR8SEkuPrn`.
- URL de deploy final: `https://meta-construtor-app-rev-2026-8c0biq5wv.vercel.app`.
- Alias de producao: `https://www.metaconstrutor.app.br`.
- `npx.cmd vercel inspect https://meta-construtor-app-rev-2026-8c0biq5wv.vercel.app`: status `Ready`, target `production`.
- `curl.exe -I https://www.metaconstrutor.app.br/home`: HTTP 200.
- `curl.exe -I https://www.metaconstrutor.app.br/app/dashboard`: HTTP 200.

## Observacoes

- A primeira rodada do smoke autenticado encontrou `403` em `analytics_events`; a causa era o insert sem `user_id/source`, incompatível com RLS. O payload foi corrigido.
- A validacao do `Ctrl+K` foi reforcada para foco sincrono quando o input ja esta renderizado, mantendo fallback assincrono para estados compactos.
