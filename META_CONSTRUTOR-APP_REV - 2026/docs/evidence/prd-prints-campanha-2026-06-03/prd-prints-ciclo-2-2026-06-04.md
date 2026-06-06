# PRD_PRINTS - Ciclo 2

Data: 2026-06-04

## Objetivo

Fechar a pendencia tecnica do Ciclo 1, recapturar os screenshots publicitarios e deixar o manifesto em estado final para revisao de campanha.

## Correcao aplicada

- Rota afetada: `/app/atividades`.
- Causa raiz: a consulta de equipamentos usava a coluna inexistente `created_by`, retornando 400 no Supabase.
- Arquivo corrigido: `src/hooks/useEquipamentos.ts`.
- Novo filtro: `org_id` e `user_id`.

## Validacao funcional

- Smoke isolado de `/app/atividades`: 36 linhas renderizadas.
- Eventos de console/resposta critica no smoke isolado: 0.
- Lote completo recapturado com `scripts/prd-prints-screenshots.mjs`.

## Manifesto final

- Status: `captured`.
- Screenshots: 20.
- Screenshots com status `captured`: 20.
- `console_events`: 0.
- `transient_console_events`: 0.
- Ultimo screenshot: `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`.

## Validacoes finais

- `npm run lint`: passou com 31 warnings existentes e 0 erros.
- `npm run test`: passou com 16 arquivos e 53 testes.
- `npm run build`: passou; postbuild prerenderizou 18 rotas publicas.

## Observacao publicitaria

Os arquivos permanecem fora de `public/` e nao registram senhas, tokens ou dados reais de clientes. A revisao humana final antes de publicar continua recomendada como controle editorial.
