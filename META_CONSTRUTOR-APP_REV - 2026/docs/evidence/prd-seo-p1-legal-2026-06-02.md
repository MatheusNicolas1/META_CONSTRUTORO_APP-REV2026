# PRD_SEO P1 e paginas legais - 2026-06-02

## Escopo

- Reestruturadas paginas publicas P1: `/status`, `/atualizacoes`, `/carreiras`.
- Reestruturadas paginas legais: `/legal/privacidade`, `/legal/termos`, `/legal/cookies`, `/legal/lgpd`.
- Ajustado rodape publico compartilhado para remover copy de status operacional automatico.
- Nenhum layout interno do app autenticado foi alterado.

## Validacoes

- `npx.cmd impeccable detect src/pages/Status.tsx src/pages/Atualizacoes.tsx src/pages/Carreiras.tsx src/components/landing/FooterSection.tsx`: sem achados.
- `npx.cmd impeccable detect src/pages/legal/LegalPageLayout.tsx src/pages/legal/PrivacyPolicy.tsx src/pages/legal/TermsOfService.tsx src/pages/legal/CookiePolicy.tsx src/pages/legal/LGPD.tsx`: sem achados.
- Smoke Playwright P1: 6 verificacoes passaram em desktop 1366x900 e mobile 390x844.
- Smoke Playwright legal: 8 verificacoes passaram em desktop 1366x900 e mobile 390x844.
- `npm.cmd run lint`: passou com 32 warnings preexistentes, 0 erros.
- `npm.cmd run test`: 12 arquivos passaram, 38 testes passaram.
- `npm.cmd run build`: passou; `postbuild` reportou `Prerendered 15 public route HTML files.`
- HTTP local: `/status`, `/atualizacoes`, `/carreiras`, `/legal/privacidade`, `/legal/termos`, `/legal/cookies`, `/legal/lgpd`, `/sitemap.xml` e `/robots.txt` responderam 200.
- Metadados prerenderizados: 7 rotas validadas com title, canonical, `og:url` e JSON-LD.
- Sitemap e robots: rotas P1/legal presentes em `public/sitemap.xml` e `dist/sitemap.xml`; `robots.txt` aponta para `https://www.metaconstrutor.app.br/sitemap.xml`.

## Evidencias visuais

- `docs/evidence/prd-seo-status-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-status-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-atualizacoes-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-atualizacoes-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-carreiras-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-carreiras-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-legal-privacidade-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-legal-privacidade-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-legal-termos-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-legal-termos-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-legal-cookies-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-legal-cookies-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-legal-lgpd-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-legal-lgpd-mobile-2026-06-02.png`

## Residual

- URL-level Impeccable ainda aponta achados globais de bundle em rotas publicas: `cramped-padding`, fonte unica Inter, `ai-color-palette`, `gradient-text`, `layout-transition` e `nested-cards`.
- Os arquivos alterados neste ciclo passam no Impeccable. O residual deve ser tratado em ciclo proprio de CSS/global bundle e componentes publicos compartilhados.
