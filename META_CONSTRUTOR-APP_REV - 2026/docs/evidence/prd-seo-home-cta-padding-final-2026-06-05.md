# PRD_SEO - CTA padding final da home publica

Data: 2026-06-05

## Escopo

- Continuacao do `PRD_SEO.md`.
- Escopo limitado a `/home` e componentes publicos de marketing renderizados na home.
- Nao altera layout autenticado do app.

## Diagnostico

O comando anterior do PRD pedia investigar `cramped-padding` restante em `/home` com evidencia DOM especifica, ignorando `#root`, overlays fixos e superficies full-width intencionais.

Resultado da investigacao:

- `/home` renderizada tinha 7 achados no Impeccable: 4 `cramped-padding`, 2 `gradient-text` e 1 `layout-transition`.
- Smoke DOM confirmou `h1=1`, `body.marketing-surface=true` e `overflow=0`.
- A inspeção DOM filtrada por superficie real mostrou que, excluindo o wrapper raiz, os elementos corrigiveis eram botoes publicos com fundo/borda e padding vertical computado como `0px`.
- Os botoes afetados eram CTAs da home:
  - `Comecar pelo plano gratuito`
  - `Falar com atendimento`
  - `Entrar no app`
  - `Ver planos`
  - `Comecar gratuitamente`
  - `Falar com vendas`

## Alteracoes executadas

- Adicionado `py-3` aos CTAs publicos de:
  - `src/components/landing/HeroSectionNew.tsx`
  - `src/components/landing/VideoDemo.tsx`
  - `src/components/landing/CaseStudies.tsx`
  - `src/components/landing/EnhancedTestimonials.tsx`
  - `src/components/landing/BenefitsSection.tsx`

O ajuste preserva a estrutura visual, mas evita que os botoes tenham padding vertical computado como zero.

## Evidencia Impeccable

Fonte:

- `npx.cmd impeccable detect src\components\landing\HeroSectionNew.tsx src\components\landing\VideoDemo.tsx src\components\landing\CaseStudies.tsx src\components\landing\EnhancedTestimonials.tsx src\components\landing\BenefitsSection.tsx`: sem achados.

Rota focada:

- `npx.cmd impeccable detect http://127.0.0.1:5173/home`
- Resultado: 3 achados.
- `cramped-padding` foi removido da home.
- Residuos restantes na home: `gradient-text` x2 e `layout-transition` x1.

DOM:

- Todos os CTAs publicos inspecionados passaram a ter padding computado `12px` no topo e `12px` na base.
- `/home`: `h1=1`, `body.marketing-surface=true`, `overflow=0`.

Consolidado final em 13 rotas publicas:

- Comando: `npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/api http://127.0.0.1:5173/status http://127.0.0.1:5173/atualizacoes http://127.0.0.1:5173/carreiras http://127.0.0.1:5173/legal/privacidade`
- Resultado: 39 achados.
- Baseline anterior registrado: 45 achados.
- Resultado atual: todas as 13 rotas publicas do consolidado reportam somente 3 residuos globais cada (`gradient-text` x2 e `layout-transition` x1).

## Validacao

- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: passou, 20 arquivos e 66 testes.
- `npm.cmd run build`: passou, com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`

Avisos do build:

- `color-adjust` depreciado em CSS de impressao.
- Aviso Vite preexistente de import dinamico/estatico de `src/integrations/supabase/client.ts`.

## Residuos e proximo comando

- Nao ha mais `cramped-padding` corrigivel na home publica dentro do recorte renderizado.
- Residuos atuais sao globais e recorrentes por rota:
  - `gradient-text` x2
  - `layout-transition` x1
- Proximo comando recomendado: investigar `gradient-text` com busca CSS/DOM focada em `bg-clip-text`, `text-transparent`, `background-clip: text` e classes geradas; corrigir apenas se houver seletor publico renderizado claro. Se a origem for CSS/bundle compartilhado sem elemento publico, registrar como residuo global e avancar para metadados/copy SEO.
