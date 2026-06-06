# PRD_SEO - status residual e pricing publico

Data: 2026-06-04

## Escopo

- Execucao limitada a paginas publicas de marketing/publicidade.
- Nenhum layout autenticado do app foi alterado.
- Rotas trabalhadas: `/status` e `/preco`.

## Alteracoes

- `src/pages/Status.tsx`: removidos selos com borda dentro de secoes com borda, eliminando o achado renderizado de `nested-cards` em `/status`.
- `src/components/ui/pricing.tsx`: removidos `framer-motion`, confetti, `transition-all`, sombras fortes, escala visual, `ring` decorativo e importacoes de carousel nao usadas no componente publico de planos.
- `src/components/pricing/PricingHero.tsx`: removido badge do hero e mantido rotulo tipografico simples.
- `src/components/pricing/FaqSection.tsx`: copy ajustada para suporte e planos sem promessa de chat, gerente dedicado ou condicoes nao validadas.
- `src/pages/Preco.tsx`: skeleton publico reduzido de `rounded-2xl` para `rounded-lg` e CTAs/textos normalizados.

## Evidencia Impeccable

- Scan fonte:
  - `npx.cmd impeccable detect src\pages\Preco.tsx src\components\ui\pricing.tsx src\components\pricing\PricingHero.tsx src\components\pricing\FaqSection.tsx src\pages\Status.tsx`
  - Resultado: sem achados nos arquivos alterados.
- Scan renderizado focado:
  - `npx.cmd impeccable detect http://127.0.0.1:5173/status http://127.0.0.1:5173/preco`
  - Resultado final: 8 achados.
  - `/status`: `nested-cards` saiu; restaram `cramped-padding`, `gradient-text` global e `layout-transition` global.
  - `/preco`: sem `nested-cards`; restaram `cramped-padding`, `gradient-text` global e `layout-transition` global.
- Scan consolidado em 13 URLs publicas:
  - Resultado final: 67 achados.
  - Baseline anterior registrado no PRD: 93 achados.
  - Reducao do ciclo: 26 achados renderizados.

## Evidencia DOM

- `/status`: H1 unico, `body.marketing-surface`, sem overflow horizontal, `nestedBorderedCount=0`.
- `/preco`: H1 unico, `body.marketing-surface`, sem overflow horizontal. O scanner renderizado nao reportou `nested-cards` apos a limpeza dos cards de plano.

## Validacao tecnica

- `curl.exe -I` retornou HTTP 200 com `text/html` para `/status` e `/preco`.
- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: passou com 16 arquivos e 53 testes.
- `npm.cmd run build`: bloqueado por erro fora do escopo PRD_SEO:
  - `src/components/admin/AdminOrganizationsMetrics.tsx(23,8): Module ... AdminEventTimeline has no default export.`
  - `src/components/admin/AdminUsers.tsx(65,8): Module ... AdminEventTimeline has no default export.`
  - conflito de casing entre `AdminEventTimeline.ts` e `adminEventTimeline.ts`.
- `npx.cmd vite build`: tambem bloqueado pelo mesmo import de admin em `AdminUsers.tsx`.

## Residuos

- O achado `low-contrast` em `/contato` aponta para texto transiente `Carregando...` vindo de carregamento global/compartilhado, nao da fonte local de `Contato.tsx`, cujo `Suspense` esta com `fallback={null}`.
- `gradient-text`, `ai-color-palette` e `layout-transition` seguem recorrentes por CSS/bundle compartilhado. A regra operacional continua: nao alterar layout autenticado do app para reduzir residuo de scanner em rota publica.
- Proximo ciclo recomendado: atacar `nested-cards` restantes em `/home`, artigo do blog e legal, usando evidencia DOM por rota antes de editar.
