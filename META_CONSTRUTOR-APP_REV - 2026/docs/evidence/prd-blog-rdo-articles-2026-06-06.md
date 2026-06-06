# PRD_BLOG - Ciclo 1 artigos RDO

Data: 2026-06-06  
Escopo: blog publico, quatro artigos PAA sobre RDO, SEO tecnico, sitemap e prerender.

## Arquivos alterados

- `PRD_BLOG.md`
- `PRD_MESTRE.md`
- `src/content/blogArticles.ts`
- `src/pages/Blog.tsx`
- `src/pages/BlogArticle.tsx`
- `src/config/seo.ts`
- `scripts/generate-sitemap.mjs`
- `scripts/prerender-public-routes.mjs`
- `public/sitemap.xml`
- `dist/sitemap.xml`
- `dist/blog/<slug>/index.html`

## Artigos entregues

| Rota | Pergunta-alvo | Status |
| --- | --- | --- |
| `/blog/o-que-e-rdo` | O que e um RDO? | OK |
| `/blog/o-que-e-rdos` | O que e RDOS? | OK |
| `/blog/rdo-na-policia` | O que significa RDO na policia? | OK |
| `/blog/rdo-de-empresa` | O que e um RDO de empresa? | OK |

Tambem foram mantidos e enriquecidos os artigos de apoio:

- `/blog/como-estruturar-rdo`
- `/blog/documentos-por-obra`
- `/blog/checklist-qualidade-obra`

## Validacoes executadas

### Sintaxe dos scripts

```bash
node --check scripts\prerender-public-routes.mjs
node --check scripts\generate-sitemap.mjs
```

Resultado: OK.

### Build

```bash
npm run build
```

Resultado: OK.

Observacoes:

- `tsc -b` concluiu.
- `vite build` concluiu.
- `postbuild` executou `generate-sitemap.mjs` e `prerender-public-routes.mjs`.
- Foram gerados 22 HTMLs publicos prerenderizados.
- Warnings existentes: `color-adjust` depreciado e aviso de chunking por import dinamico/estatico de Supabase.

### Impeccable

```bash
npx.cmd impeccable detect src/pages/Blog.tsx src/pages/BlogArticle.tsx src/content/blogArticles.ts src/config/seo.ts
```

Resultado: OK, sem achados retornados no recorte de blog.

### Sitemap

```bash
rg -n "/blog/o-que-e-rdo|/blog/o-que-e-rdos|/blog/rdo-na-policia|/blog/rdo-de-empresa" public\sitemap.xml dist\sitemap.xml
```

Resultado: OK. As quatro URLs aparecem em `public/sitemap.xml` e `dist/sitemap.xml`.

### Prerender SEO

```bash
rg -n "FAQPage|Article|O que e um RDO|RDOs|RDO na policia|RDO de empresa" dist\blog\o-que-e-rdo\index.html dist\blog\o-que-e-rdos\index.html dist\blog\rdo-na-policia\index.html dist\blog\rdo-de-empresa\index.html
```

Resultado: OK.

Confirmado nos HTMLs prerenderizados:

- `<title>` especifico por artigo.
- `meta description` especifica por artigo.
- `canonical` especifico por artigo.
- Open Graph e Twitter tags.
- `Article` JSON-LD.
- `BreadcrumbList` JSON-LD.
- `FAQPage` JSON-LD para as quatro novas rotas.

## Smoke visual

Ferramenta: Playwright via Node REPL.  
Motivo do fallback: Browser/IAB nao estava callable nesta sessao via `tool_search`; foi usado Playwright local contra `npm run preview`.

Servidor temporario:

```bash
npm run preview -- --host 127.0.0.1 --port 5189
```

Rotas testadas:

- `/blog`
- `/blog/o-que-e-rdo`
- `/blog/o-que-e-rdos`
- `/blog/rdo-na-policia`
- `/blog/rdo-de-empresa`

Viewports:

- Desktop: 1440x1200
- Mobile: 390x1000

Resultado consolidado:

- HTTP 200 em todas as rotas.
- Um H1 por rota.
- Artigos com `<article>` renderizado.
- FAQ visivel nas quatro rotas novas.
- Texto esperado presente.
- Sem overflow horizontal.
- Sem erros de console.

## Screenshots

- `docs/evidence/prd-blog-blog-index-desktop-2026-06-06.png`
- `docs/evidence/prd-blog-blog-index-mobile-2026-06-06.png`
- `docs/evidence/prd-blog-o-que-e-rdo-desktop-2026-06-06.png`
- `docs/evidence/prd-blog-o-que-e-rdo-mobile-2026-06-06.png`
- `docs/evidence/prd-blog-o-que-e-rdos-desktop-2026-06-06.png`
- `docs/evidence/prd-blog-o-que-e-rdos-mobile-2026-06-06.png`
- `docs/evidence/prd-blog-rdo-na-policia-desktop-2026-06-06.png`
- `docs/evidence/prd-blog-rdo-na-policia-mobile-2026-06-06.png`
- `docs/evidence/prd-blog-rdo-de-empresa-desktop-2026-06-06.png`
- `docs/evidence/prd-blog-rdo-de-empresa-mobile-2026-06-06.png`

Inspecao visual direta:

- `prd-blog-blog-index-desktop-2026-06-06.png`: listagem com sete artigos, ordem correta dos quatro artigos novos no topo, sem quebra de layout.
- `prd-blog-o-que-e-rdo-mobile-2026-06-06.png`: artigo mobile com H1 legivel, FAQ visivel, pontos principais abaixo do conteudo e CTA final sem overflow.

## Referencia externa usada

- SSP/SP Transparencia: confirma uso de Registro Digital de Ocorrencias da Policia Civil (RDO) como fonte/sistema de ocorrencias. Uso no conteudo: desambiguar o artigo `/blog/rdo-na-policia` sem transformar o Meta Construtor em fonte oficial policial.
