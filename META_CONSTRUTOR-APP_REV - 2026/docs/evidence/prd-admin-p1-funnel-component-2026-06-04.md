# PRD_ADMIN - P1 componente reutilizavel de funil

Data: 2026-06-04

## Escopo executado

- Criado `src/components/admin/AdminFunnel.tsx` para renderizar funis administrativos.
- Criado `src/components/admin/adminFunnelUtils.ts` com helpers testaveis de maximo, largura e conversao.
- `src/components/admin/AdminOverviewMetrics.tsx` passou a usar `AdminFunnel` no funil principal.
- `src/components/admin/AdminCoupons.tsx` passou a usar `AdminFunnel` no funil comercial de campanhas/cupons.

## Contrato funcional

- O componente aceita etapas com `label`, `value` e `source`.
- Cada etapa mostra valor absoluto, fonte e conversao em relacao a etapa anterior quando aplicavel.
- Valores positivos pequenos mantem largura minima visivel de 6%.
- Valores zerados renderizam estado vazio quando todas as etapas estao zeradas.
- O helper foi nomeado `adminFunnelUtils.ts` para evitar conflito de casing no Windows com `AdminFunnel.tsx`.

## Validacao

- `npx.cmd eslint src/components/admin/AdminFunnel.tsx src/components/admin/adminFunnelUtils.ts src/components/admin/AdminOverviewMetrics.tsx src/components/admin/AdminCoupons.tsx src/components/admin/__tests__/adminFunnel.test.ts`: passou.
- `npx.cmd vitest run src/components/admin/__tests__/adminFunnel.test.ts`: passou com 1 arquivo e 3 testes.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens fechados/avancados

- P1: `Criar componentes reutilizaveis` avancou com o componente `Funil`.
- Criterio de aceite: `O funil principal mostra visitantes, cadastros, checkout, assinatura e ativacao`.
