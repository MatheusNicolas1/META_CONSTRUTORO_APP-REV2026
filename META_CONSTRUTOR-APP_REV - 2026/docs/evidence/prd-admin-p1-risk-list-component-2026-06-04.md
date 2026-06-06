# PRD_ADMIN - P1 componente reutilizavel de lista de risco

Data: 2026-06-04

## Escopo executado

- Criado `src/components/admin/AdminRiskList.tsx` para renderizar uma lista operacional de usuarios em risco.
- Criado `src/components/admin/adminRiskUtils.ts` com helpers testaveis de label, motivo, acao sugerida, tom visual e prioridade.
- `src/components/admin/AdminRetentionMetrics.tsx` passou a buscar a lista de risco em `admin_churn_risk_view`.
- A lista e enriquecida em lote com organizacao principal via `org_members`, sem consulta por usuario.
- A aba Retencao agora mostra usuario, org, plano, ultimo evento, motivo, acao sugerida, quantidade de eventos e nivel de risco.

## Contrato funcional

- `high` aparece antes de `medium`, `low` e `none`.
- `no_activity` gera o motivo `Cadastro sem atividade registrada`.
- `inactive` gera o motivo `Sem evento nos ultimos 30 dias`.
- Risco alto sugere `Acionar onboarding/suporte`.
- Risco medio sugere `Enviar follow-up comercial`.
- Risco baixo ou desconhecido sugere `Monitorar no proximo ciclo`.
- O componente usa `user_id` e dados operacionais, sem buscar PII adicional para analytics.

## Validacao

- `npx.cmd eslint src/components/admin/AdminRiskList.tsx src/components/admin/adminRiskUtils.ts src/components/admin/AdminRetentionMetrics.tsx src/components/admin/__tests__/adminRiskList.test.ts`: passou.
- `npx.cmd vitest run src/components/admin/__tests__/adminRiskList.test.ts`: passou com 1 arquivo e 5 testes.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens fechados

- Visao de Retencao: `Lista de risco com usuario, org, plano, ultimo evento, motivo e acao sugerida`.
- P1: `Criar componentes reutilizaveis` avancou com o componente `Risk list`.
