# PRD_ADMIN - Evidencia P1 Cohort Table

Data: 2026-06-06

## Escopo executado

- Criado `src/components/admin/AdminCohortTable.tsx` como tabela reutilizavel de cohorts D1/D7/D30.
- Criado `src/components/admin/adminCohortUtils.ts` para calculos testaveis de retencao por janela e agregacao por plano.
- Aplicado o novo componente em `src/components/admin/AdminRetentionMetrics.tsx`, usando `first_event_at` e `last_event_at` de `admin_user_segments_view`.
- Criado `src/components/admin/__tests__/adminCohortTable.test.ts` cobrindo janelas D1/D7/D30, taxa segura e agrupamento por plano.

## Contrato de produto

A tabela mostra:

- Plano/cohort.
- Usuarios no recorte.
- Retencao D1.
- Retencao D7.
- Retencao D30.
- Quantidade absoluta de usuarios retidos por janela.

Fonte atual: `admin_user_segments_view`.

## Limite conhecido

Esta fatia fecha o componente reutilizavel `Cohort table` de P1 e entrega cohorts por plano. O item funcional `Cohorts D1, D7, D30 por plano/campanha` permanece parcial porque a view atual nao expoe campanha/atribuicao junto aos usuarios segmentados.

## Itens do PRD avancados

- P1: `Cohort table` saiu da lista de componentes reutilizaveis pendentes.
- P1: `Criar componentes reutilizaveis` foi marcado como concluido.
- 6.5: `Cohorts D1, D7, D30 por plano/campanha` recebeu evidencia parcial por plano.

## Validacao

```powershell
npx.cmd eslint src/components/admin/AdminCohortTable.tsx src/components/admin/adminCohortUtils.ts src/components/admin/AdminRetentionMetrics.tsx src/components/admin/__tests__/adminCohortTable.test.ts
```

Resultado: passou.

```powershell
npx.cmd vitest run src/components/admin/__tests__/adminCohortTable.test.ts
```

Resultado: passou com 1 arquivo e 3 testes.

```powershell
npx.cmd tsc --noEmit --pretty false
```

Resultado: passou.

```powershell
npm.cmd run build
```

Resultado: passou. Warnings remanescentes iguais aos ja registrados no PRD: deprecacao CSS `color-adjust` e aviso de import dinamico/estatico do cliente Supabase.
