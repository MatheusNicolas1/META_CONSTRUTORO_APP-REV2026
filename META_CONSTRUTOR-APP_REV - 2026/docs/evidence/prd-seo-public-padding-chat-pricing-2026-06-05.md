# PRD_SEO - padding publico, chat e pricing

Data: 2026-06-05

## Escopo

- Continuacao do `PRD_SEO.md`.
- Escopo limitado a paginas publicas/de publicidade.
- Sem alteracao de layout autenticado do app.

## Alteracoes executadas

- Adicionado inset minimo em secoes publicas full-width de home, preco, sobre e contato para reduzir residuos reais de `cramped-padding`.
- Ajustado o chat publico de `/contato`:
  - titulo interno deixou de usar `h1` e passou para `h2`;
  - painel ganhou padding proprio;
  - removido `overflow-hidden` do painel para nao prender filho posicionado;
  - adicionada hierarquia `h2` antes dos cards de canais oficiais.
- Ajustado `SafeSuspense` para respeitar `fallback={null}` de forma explicita.
- Aplicado `fallback={null}` apenas nas rotas publicas de marketing/documentacao/legal, evitando o fallback textual `Carregando...` nas paginas publicas renderizadas.
- Achatado o selo "Mais Popular" em `/preco`, removendo borda dentro do card do plano e eliminando `nested-cards` nessa rota.
- Removido `font-sans` explicito da rota `/preco`.

## Arquivos alterados neste ciclo

- `src/components/PerformanceOptimizedApp.tsx`
- `src/components/SafeSuspense.tsx`
- `src/components/chat/ExpandableChatDemo.tsx`
- `src/components/landing/BenefitsSection.tsx`
- `src/components/landing/CaseStudies.tsx`
- `src/components/landing/EnhancedTestimonials.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/landing/HeroSectionNew.tsx`
- `src/components/landing/IntegrationsBanner.tsx`
- `src/components/landing/StatsSection.tsx`
- `src/components/landing/VideoDemo.tsx`
- `src/components/pricing/FaqSection.tsx`
- `src/components/pricing/PricingHero.tsx`
- `src/components/ui/expandable-chat.tsx`
- `src/components/ui/pricing.tsx`
- `src/pages/Contato.tsx`
- `src/pages/Preco.tsx`
- `src/pages/Sobre.tsx`

## Evidencia Impeccable

Fonte:

- `npx.cmd impeccable detect` nos arquivos alterados de home/preco/sobre/contato: sem achados.
- `npx.cmd impeccable detect src\components\PerformanceOptimizedApp.tsx src\components\SafeSuspense.tsx`: sem achados.
- `npx.cmd impeccable detect src\pages\Contato.tsx src\components\ui\expandable-chat.tsx`: sem achados.
- `npx.cmd impeccable detect src\components\ui\pricing.tsx src\pages\Preco.tsx`: sem achados.

Rotas focadas:

- `/preco`: caiu para 3 achados (`gradient-text` x2 e `layout-transition` global). `nested-cards`, `cramped-padding` e `overused-font` nao foram reportados no scan isolado final.
- `/contato`: caiu para 3 achados (`gradient-text` x2 e `layout-transition` global). `low-contrast`, `skipped-heading`, `line-length` e `clipped-overflow-container` nao foram reportados no scan isolado final.
- Smoke DOM em `/contato`: `h1=1`, `hasCarregando=false`, `marketingSurface=true`, `overflow=0`.
- Smoke DOM em `/preco`: `h1=1`, `overflow=0`.

Consolidado final em 13 rotas publicas:

- Comando: `npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/api http://127.0.0.1:5173/status http://127.0.0.1:5173/atualizacoes http://127.0.0.1:5173/carreiras http://127.0.0.1:5173/legal/privacidade`
- Resultado: 45 achados.
- Baseline anterior registrado: 46 achados.
- Diferenca liquida: -1 no consolidado, com eliminacao de problemas reais em `/preco` e `/contato`; residuos restantes sao majoritariamente `gradient-text`, `layout-transition`, `cramped-padding` de wrappers/full-width e heuristica tipografica intermitente em `/sobre`.

## Validacao

- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: passou, 20 arquivos e 66 testes.
- `npm.cmd run build`: passou, com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`

Avisos do build:

- `color-adjust` depreciado em CSS de impressao.
- Aviso Vite preexistente de import dinamico/estatico de `src/integrations/supabase/client.ts`.

## Residuos e proximo comando

- Nao perseguir `gradient-text` e `layout-transition` sem seletor DOM publico reproduzivel, pois seguem aparecendo como sinais globais de CSS/bundle.
- Nao corrigir `#root` nem wrappers full-width intencionais sem evidencia de container publico real.
- Proximo comando recomendado: investigar exclusivamente o `cramped-padding` restante de `/home` com DOM selector mais especifico que ignore `#root`, overlays fixos e superficies intencionais; se nao houver seletor publico real, registrar como falso positivo e avancar para revisao de metadados/copy SEO.
