# PRD_ADMIN - Evidencia P1 Segment Table

Data: 2026-06-05

## Escopo executado

- Criado `src/components/admin/AdminSegmentTable.tsx` como tabela reutilizavel para leitura operacional dos segmentos de usuarios.
- Criado `src/components/admin/adminSegmentUtils.ts` para calculos testaveis de participacao, medias por usuario e largura proporcional da barra.
- Aplicado o novo componente em `src/components/admin/AdminRetentionMetrics.tsx`, abaixo dos KPIs de retencao.
- Criado `src/components/admin/__tests__/adminSegmentTable.test.ts` cobrindo divisoes seguras e largura minima visual para segmentos com baixo volume.

## Contrato de produto

A tabela mostra, por segmento:

- Usuarios no segmento.
- Participacao no recorte filtrado.
- Total de eventos.
- Rotas vistas.
- Interacoes.
- Medias por usuario para eventos, rotas e interacoes.

Fonte atual: `admin_user_segments_view`, respeitando os filtros globais de plano e role ja aplicados na aba Retencao.

## Itens do PRD avancados

- P1: `Segment table` saiu da lista de componentes reutilizaveis pendentes.
- P1: componentes reutilizaveis agora mantem apenas `Cohort table` como pendencia dessa linha.

Nao foram fechados os itens de cohort D1/D7/D30, retencao por primeiro recurso usado ou falhas por rota/browser, pois eles exigem agregacoes e tracking adicionais.

## Validacao

```powershell
npx.cmd eslint src/components/admin/AdminSegmentTable.tsx src/components/admin/adminSegmentUtils.ts src/components/admin/AdminRetentionMetrics.tsx src/components/admin/__tests__/adminSegmentTable.test.ts
```

Resultado: passou.

```powershell
npx.cmd vitest run src/components/admin/__tests__/adminSegmentTable.test.ts
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
