# PRD_ADMIN - Evidencia P1 Route Conversion Table

Data: 2026-06-05

## Escopo executado

- Criado `src/components/admin/AdminRouteConversionTable.tsx` como tabela reutilizavel para leitura de conversao/uso por rota autenticada.
- Criado `src/components/admin/adminRouteConversionUtils.ts` para calculos testaveis de participacao, views por usuario e largura proporcional da barra.
- Aplicado o novo componente em `src/components/admin/AdminRoutesMetrics.tsx`, substituindo o bloco inline de rotas mais acessadas.
- Criado `src/components/admin/__tests__/adminRouteConversion.test.ts` cobrindo divisoes seguras e largura minima visual para rotas com baixo volume.

## Contrato de produto

A tabela mostra:

- Rota.
- Participacao no total de views do recorte carregado.
- Views totais.
- Usuarios unicos.
- Views por usuario.
- Ultimo evento registrado.

Fonte atual: `admin_route_metrics_view`, consumida pelo pipeline existente de `AdminRoutesMetrics`.

## Itens do PRD avancados

- P1: `Route conversion table` saiu da lista de componentes reutilizaveis pendentes.
- 6.9 Rotas e usabilidade: `Page views por rota` fechado.
- 6.9 Rotas e usabilidade: `Usuarios unicos por rota` fechado.

Permanecem abertos os itens que dependem de outra camada de tracking ou agregacao: conversao por rota publica, proxima rota, abandono, erros, CTA principal e latencia percebida.

## Validacao

```powershell
npx.cmd eslint src/components/admin/AdminRouteConversionTable.tsx src/components/admin/adminRouteConversionUtils.ts src/components/admin/AdminRoutesMetrics.tsx src/components/admin/__tests__/adminRouteConversion.test.ts
```

Resultado: passou.

```powershell
npx.cmd vitest run src/components/admin/__tests__/adminRouteConversion.test.ts
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
