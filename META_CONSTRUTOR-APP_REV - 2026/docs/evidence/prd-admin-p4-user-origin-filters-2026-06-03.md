# PRD_ADMIN - P4 filtros de usuario por origem/campanha

Data: 2026-06-03

## Escopo executado

- `src/components/admin/AdminUsers.tsx` passou a carregar atribuicao de marketing por usuario a partir de `analytics_events`.
- Cada linha de usuario agora possui `acquisition_source`, `acquisition_campaign` e `acquisition_ref`.
- A tabela exibe a coluna `Origem`, combinando origem e campanha, com referencia quando houver.
- Os filtros globais `source` e `campaign` agora tambem afetam a aba `Usuarios`, alem dos filtros locais de plano, role, status, atividade e risco.
- `src/components/admin/adminUsersExport.ts` passou a exportar origem, campanha e referencia no CSV do segmento filtrado.

## Contrato funcional

- A origem usa `utm_source` quando disponivel e faz fallback para `source`.
- A campanha usa `utm_campaign`.
- A referencia usa `ref`.
- A atribuicao e carregada em lote por `user_id`, ordenada por evento mais recente, evitando consulta por linha de usuario.
- A busca textual continua restrita a dados administrativos da tabela; origem/campanha entram pelos filtros globais de marketing.

## Validacao

- `npx.cmd eslint src/components/admin/AdminUsers.tsx src/components/admin/adminUsersExport.ts src/components/admin/__tests__/adminUsersExport.test.ts`: passou.
- `npx.cmd vitest run src/components/admin/__tests__/adminUsersExport.test.ts`: passou com 1 arquivo e 3 testes.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens fechados

- Criterio de aceite: `A tabela de usuarios filtra por plano, role, status, origem, atividade e risco`.
