# PRD_SEO - Tipografia publica e reducao de profundidade visual

Data: 2026-06-02
Escopo: paginas publicas de marketing, com foco em `/home`.

## Alteracoes executadas

- Adicionado carregamento de `Archivo` e `Noto Sans` no `index.html`, mantendo `Inter` como fallback.
- Criado escopo CSS `body.marketing-surface` em `src/index.css` para aplicar tipografia publica sem alterar o layout autenticado.
- `LandingNavigation` agora adiciona/remove `marketing-surface` no `body` durante o ciclo de vida das paginas publicas que usam a navegacao de marketing.
- A home publica foi achatada visualmente em componentes de marketing: menos wrappers com borda/sombra, icones sem mini-card decorativo e FAQ/preview/tour com divisores em vez de cards aninhados.

## Comandos e resultados

```powershell
npx.cmd impeccable detect src/components/landing/LandingNavigation.tsx src/components/landing/HeroSectionNew.tsx src/components/landing/DashboardPreviewMockup.tsx src/components/landing/VisualWorkflowSection.tsx src/components/landing/ModernFeaturesSection.tsx src/components/landing/StatsSection.tsx src/components/landing/VideoDemo.tsx src/components/landing/CaseStudies.tsx src/components/landing/EnhancedTestimonials.tsx src/components/landing/BenefitsSection.tsx src/components/landing/FAQSection.tsx src/index.css index.html
```

Resultado: sem achados reportados nos arquivos alterados.

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/home
```

Resultado: 27 achados de URL restantes. O DOM renderizado nao apresenta cards aninhados visiveis pela heuristica local usada nesta rodada; residual do CLI ainda mistura `cramped-padding`, `line-length` e sinais provaveis de CSS/bundle global.

Scan consolidado em 13 URLs publicas locais:

```text
total=124
cramped-padding=36
nested-cards=27
gradient-text=26
layout-transition=13
ai-color-palette=13
line-length=9
```

Comparativo da rodada: scan consolidado anterior tinha 136 achados; novo scan tem 124. `overused-font` e `single-font` nao reapareceram.

## Smoke DOM

Desktop e mobile em `/home`:

```text
bodyClass=marketing-surface
h1=Gestao de obras, RDO e documentos em uma tela visual
h1Font=Archivo, "Noto Sans", Inter, system-ui, sans-serif
navFont=Archivo, "Noto Sans", Inter, system-ui, sans-serif
cardPairsVisiveis=0
```

Screenshots:

- `docs/evidence/prd-seo-home-depth-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-home-depth-mobile-2026-06-02.png`

## Gates

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

- Lint: passou com 32 warnings preexistentes e 0 erros.
- Testes: 12 arquivos passaram, 38 testes passaram.
- Build: passou; `postbuild` executou sitemap/prerender e reportou `Prerendered 18 public route HTML files.`

## Residual

- O Impeccable por URL ainda reporta `gradient-text`, `ai-color-palette` e `layout-transition`, mas a inspeção DOM das rotas amostradas nao encontrou texto com `background-clip:text`; esses itens devem ser tratados como triagem de CSS/bundle antes de novas alteracoes visuais.
- Restam ajustes reais de `cramped-padding` e `line-length` por rota publica.
