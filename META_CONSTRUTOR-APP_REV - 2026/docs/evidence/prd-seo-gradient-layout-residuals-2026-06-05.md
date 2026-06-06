# PRD_SEO - Residuos gradient-text e layout-transition

Data: 2026-06-05

## Escopo

- Rotas publicas verificadas: `/home`, `/preco`, `/sobre`, `/contato`, `/blog`, `/blog/como-estruturar-rdo`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras`, `/legal/privacidade`.
- Regra operacional aplicada: manter alteracoes nas paginas publicas de marketing/publicidade e nao alterar layout autenticado.

## Investigacao

- Busca de fonte por `gradient-text`, `bg-clip-text`, `text-transparent`, `background-clip:text` e gradientes mostrou ocorrencias de texto com clip em `src/pages/RecuperarEmail.tsx` e `src/components/FluidMenuDemo.tsx`, fora das paginas publicas de marketing.
- Smoke DOM nas 13 rotas publicas confirmou:
  - `h1=1` em todas as rotas.
  - `body.marketing-surface=true` em todas as rotas.
  - `overflow=0` em todas as rotas.
  - `gradientItems=0` em todas as rotas.
  - `transitionItems=[]` em todas as rotas apos ajuste do acordeao.
- O unico achado publico corrigivel antes do ajuste era `transition-all` nos triggers da FAQ de `/preco`.

## Alteracoes

- `src/components/pricing/FaqSection.tsx`
  - Trigger da FAQ publica de precos passou a declarar `transition-colors duration-150`.
- `src/components/ui/accordion.tsx`
  - `AccordionTrigger` trocou `transition-all` por `transition-colors`.
  - `AccordionContent` deixou de aplicar `transition-all`, mantendo as animacoes `animate-accordion-up` e `animate-accordion-down`.

## Impeccable

- `npx.cmd impeccable detect src/components/ui/accordion.tsx src/components/pricing/FaqSection.tsx`: sem achados.
- Scan consolidado em 13 URLs publicas locais ainda reporta 39 achados globais:
  - `gradient-text` x2 por rota.
  - `layout-transition` x1 por rota.
- Classificacao: os 39 achados restantes nao tem elemento publico visivel reproduzivel via DOM computado neste ciclo. `gradient-text` segue associado a fonte fora do marketing publico; `layout-transition` segue como heuristica global apos DOM limpo.

## Validacao

- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: 21 arquivos passaram, 69 testes passaram.
- `npm.cmd run build`: passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- Avisos de build observados e nao tratados neste ciclo:
  - `color-adjust` depreciado.
  - import dinamico/estatico de Supabase.

## Proximo comando

Avancar para revisao SEO de metadados e copy publica das rotas restantes, priorizando titulos, descriptions, canonical, OG/Twitter e texto acima da dobra. Nao perseguir `gradient-text`/`layout-transition` sem seletor DOM publico reproduzivel.
