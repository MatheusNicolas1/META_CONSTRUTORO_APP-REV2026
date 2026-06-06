# PRD_SEO artigos do blog - 2026-06-02

## Escopo

- Criadas rotas reais de artigos evergreen para fechar a pendencia `Criar rotas de posts ou decidir noindex`.
- Rotas adicionadas:
  - `/blog/como-estruturar-rdo`
  - `/blog/documentos-por-obra`
  - `/blog/checklist-qualidade-obra`
- Conteudo centralizado em `src/content/blogArticles.ts`.
- Criado `src/pages/BlogArticle.tsx`.
- Atualizados `src/pages/Blog.tsx`, `src/components/PerformanceOptimizedApp.tsx`, `src/config/seo.ts`, `scripts/generate-sitemap.mjs`, `scripts/prerender-public-routes.mjs` e `vercel.json`.
- Nenhum layout interno do app autenticado foi alterado.

## Validacoes

- `npx.cmd impeccable detect src/pages/Blog.tsx src/pages/BlogArticle.tsx src/content/blogArticles.ts src/config/seo.ts`: sem achados.
- `npm.cmd run build`: passou; `postbuild` reportou `Prerendered 18 public route HTML files.`
- `npm.cmd run lint`: passou com 32 warnings preexistentes e 0 erros.
- `npm.cmd run test`: 12 arquivos passaram, 38 testes passaram.
- HTTP local: `/blog`, tres artigos e `/sitemap.xml` responderam 200.
- Smoke Playwright em `/blog` e tres artigos: 8 verificacoes passaram em desktop 1366x900 e mobile 390x844.
- Metadados prerenderizados: tres artigos validados com canonical, `og:url` e JSON-LD.
- Sitemap: tres artigos presentes em `public/sitemap.xml` e `dist/sitemap.xml`.

## Evidencias visuais

- `docs/evidence/prd-seo-blog-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-blog-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-blog-rdo-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-blog-rdo-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-blog-documentos-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-blog-documentos-mobile-2026-06-02.png`
- `docs/evidence/prd-seo-blog-checklist-desktop-2026-06-02.png`
- `docs/evidence/prd-seo-blog-checklist-mobile-2026-06-02.png`

## Residual

- `npx.cmd impeccable detect` em URLs locais do blog retornou 43 achados renderizados.
- Os achados continuam concentrados no bundle/CSS global e componentes publicos compartilhados: `cramped-padding`, fonte unica Inter, `ai-color-palette`, `gradient-text`, `layout-transition` e `nested-cards`.
- Os arquivos alterados neste ciclo passam no Impeccable.
