# PRD_SEO - fotos reais em paginas publicas

Data: 2026-06-04

## Escopo

- Execucao limitada a paginas publicas de marketing e SEO.
- Nenhum layout autenticado do app foi alterado.
- Fonte localizada: `fotos criativo`, na raiz do workspace.

## Assets publicados

As imagens originais da pasta `fotos criativo` foram tratadas como acervo fonte. Foram publicadas apenas versoes otimizadas para web em `public/marketing/obras-reais/`.

- `estrutura-metalica-aerea.jpg`: 249 KB, usada no hero da home e como Open Graph/Twitter image.
- `cobertura-metalica-canteiro.jpg`: 319 KB, usada em beneficios da home.
- `equipe-cobertura-metalica.jpg`: 334 KB, usada no fluxo operacional da home.
- `quadra-coberta-finalizada.jpg`: 163 KB, usada na pagina `/sobre`.
- `public/marketing/obras-reais/README.md`: registra origem, uso e regra de nao referenciar originais pesados diretamente.

## Alteracoes publicas

- `src/components/landing/HeroSectionNew.tsx`: o primeiro viewport passou a exibir foto real de obra em painel de midia, sem imagem como fundo de texto.
- `src/components/landing/VisualWorkflowSection.tsx`: adicionada imagem real de equipe em cobertura metalica.
- `src/components/landing/BenefitsSection.tsx`: adicionada imagem real de canteiro em execucao.
- `src/pages/Sobre.tsx`: substituido mockup antigo por imagem real de obra finalizada e SEO hardcoded por `seoPages.sobre`.
- `src/config/seo.ts`: separado `LOGO_IMAGE` de `DEFAULT_OG_IMAGE`; Open Graph padrao agora usa foto real.
- `index.html` e `scripts/prerender-public-routes.mjs`: fallback/prerender passaram a usar a foto real como `og:image` e `twitter:image`.

## Validacao

- `npx.cmd impeccable detect` em arquivos fonte alterados: sem achados.
- Smoke DOM em `/home`:
  - H1 unico.
  - `body.marketing-surface`.
  - imagens reais de obra presentes no DOM.
  - `og:image` apontando para `https://www.metaconstrutor.app.br/marketing/obras-reais/estrutura-metalica-aerea.jpg`.
  - canonical `https://www.metaconstrutor.app.br/home`.
  - sem overflow horizontal.
- Smoke DOM em `/sobre`:
  - H1 unico.
  - imagem real de obra finalizada carregada.
  - `og:image` real.
  - canonical `https://www.metaconstrutor.app.br/sobre`.
  - sem overflow horizontal.
- `curl.exe -I`:
  - `/home`: HTTP 200.
  - `/sobre`: HTTP 200.
  - `/marketing/obras-reais/estrutura-metalica-aerea.jpg`: HTTP 200, `Content-Type: image/jpeg`.
- Impeccable renderizado em `/home` e `/sobre`: 19 achados, sem novos problemas de contraste apos remover foto como fundo de texto.
- Impeccable consolidado em 13 URLs publicas: 65 achados, queda de 67 para 65 neste ciclo.
- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: passou com 17 arquivos e 58 testes.
- `npm.cmd run build`: passou; `postbuild` executou sitemap e prerender com `Prerendered 18 public route HTML files.`
- `dist/home/index.html` e `dist/sobre/index.html`: canonical correto e `og:image`/`twitter:image` com foto real.

## Evidencias visuais

- `docs/evidence/prd-seo-fotos-criativo-contact-sheet-2026-06-04.jpg`
- `docs/evidence/prd-seo-real-photos-home-desktop-2026-06-04.png`
- `docs/evidence/prd-seo-real-photos-sobre-desktop-2026-06-04.png`

## Residuos

- Permanecem residuos globais ja conhecidos de `cramped-padding`, `nested-cards`, `gradient-text` e `layout-transition`, especialmente em `/home`, artigo do blog e legal.
- Proximo ciclo recomendado: continuar a reducao de `nested-cards` em `/home`, agora preservando as fotos reais como prova visual.
