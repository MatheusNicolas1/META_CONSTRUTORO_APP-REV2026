# PRD_ADMIN - P1 componente reutilizavel de timeline de eventos

Data: 2026-06-03

## Escopo executado

- Criado `src/components/admin/AdminEventTimeline.tsx` para renderizar timelines administrativas de eventos.
- Criado `src/components/admin/adminTimelineEvent.ts` com helpers testaveis de label e metadados.
- `src/components/admin/AdminUsers.tsx` passou a usar `AdminEventTimeline` no detalhe do usuario.
- `src/components/admin/AdminOrganizationsMetrics.tsx` passou a usar `AdminEventTimeline` no detalhe da organizacao.
- Removida duplicacao visual de cards de evento entre os dois modais.

## Contrato funcional

- O componente aceita eventos com `event`, `route`, `source` e `created_at`.
- O label usa `event` e cai para `evento` quando ausente.
- Os metadados usam `route`, depois `source`, e caem para `sem rota`.
- O componente preserva estado de carregamento e estado vazio.
- O helper foi nomeado `adminTimelineEvent.ts` para evitar conflito de casing no Windows com `AdminEventTimeline.tsx`.

## Validacao

- `npx.cmd eslint src/components/admin/AdminEventTimeline.tsx src/components/admin/adminTimelineEvent.ts src/components/admin/AdminUsers.tsx src/components/admin/AdminOrganizationsMetrics.tsx src/components/admin/__tests__/adminEventTimeline.test.ts`: passou.
- `npx.cmd vitest run src/components/admin/__tests__/adminEventTimeline.test.ts`: passou com 1 arquivo e 3 testes.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens avancados

- P1: `Criar componentes reutilizaveis` ganhou o componente `Event timeline`.
- Ainda permanecem pendentes como componentes reutilizaveis completos: funil, cohort table, segment table, route conversion table e risk list.
