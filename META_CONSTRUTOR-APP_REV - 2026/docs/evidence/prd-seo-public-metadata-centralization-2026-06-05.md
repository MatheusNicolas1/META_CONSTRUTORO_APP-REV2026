# PRD_SEO - Centralizacao de metadados publicos

Data: 2026-06-05

## Escopo

- Rotas publicas indexaveis revisadas: `/home`, `/preco`, `/sobre`, `/contato`, `/blog`, `/blog/como-estruturar-rdo`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras`, `/legal/privacidade`.
- Regra operacional: nenhuma alteracao de layout autenticado; o trabalho ficou em metadados/copy SEO e paginas publicas.

## Problemas encontrados

- `Contato`, `APIPage`, `Status`, `Atualizacoes`, `CentralAjuda`, `Documentacao` e `Carreiras` usavam `<SEO>` hardcoded em vez do catalogo `seoPages`.
- `/contato` ainda apontava canonical antigo para `https://metaconstrutor.com.br/contato`.
- O template `index.html` mantinha description, OG e Twitter tags estaticas de `/home`, que apareciam antes das tags do Helmet em rotas renderizadas no cliente.
- `BlogArticle` procurava SEO de artigo dentro de `seoPages` usando o slug, mas os artigos nao eram exportados nesse objeto. O artigo `/blog/como-estruturar-rdo` herdava title/description/canonical do indice `/blog` em runtime.

## Alteracoes

- `src/pages/Contato.tsx`, `APIPage.tsx`, `Status.tsx`, `Atualizacoes.tsx`, `CentralAjuda.tsx`, `Documentacao.tsx` e `Carreiras.tsx` passaram a usar `SEO {...seoPages.*}`.
- `index.html` deixou de declarar metadados SEO especificos de rota no template base, mantendo o prerender como fonte das tags publicas estaticas.
- `src/config/seo.ts` passou a exportar `seoBlogArticles`, reaproveitado em `publicIndexablePages`.
- `src/pages/BlogArticle.tsx` passou a usar `seoBlogArticles[slug]`, corrigindo title, description, canonical, OG e JSON-LD dos artigos.
- `scripts/prerender-public-routes.mjs` foi sincronizado com as descricoes do catalogo central para `/sobre`, `/documentacao`, `/api`, `/status`, `/atualizacoes` e `/carreiras`.
- Descricoes de API/documentacao/status/atualizacoes/carreiras foram ajustadas para evitar promessa ambigua e manter comunicacao verificavel.

## Evidencia DOM

Smoke com Playwright nas rotas afetadas confirmou:

- `descriptionCount=1`.
- `canonicalCount=1`.
- `ogTitleCount=1`.
- Canonicals em `https://www.metaconstrutor.app.br/...`.
- `/blog/como-estruturar-rdo` agora renderiza:
  - title: `Como estruturar RDO util | Meta Construtor`
  - canonical: `https://www.metaconstrutor.app.br/blog/como-estruturar-rdo`
  - OG URL: `https://www.metaconstrutor.app.br/blog/como-estruturar-rdo`

## Evidencia prerender

Leitura direta dos arquivos em `dist` apos build confirmou uma description, um canonical e um `og:title` em:

- `dist/home/index.html`
- `dist/contato/index.html`
- `dist/documentacao/index.html`
- `dist/api/index.html`
- `dist/status/index.html`
- `dist/atualizacoes/index.html`
- `dist/carreiras/index.html`
- `dist/blog/como-estruturar-rdo/index.html`

## Validacao

- `npx.cmd impeccable detect` nos arquivos alterados: sem achados.
- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: 21 arquivos passaram, 69 testes passaram.
- `npm.cmd run build`: passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- Avisos de build observados e nao tratados neste ciclo:
  - `color-adjust` depreciado.
  - import dinamico/estatico de Supabase.

## Proximo comando

Revisar copy acima da dobra nas rotas publicas ainda genericas (`/contato`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras`) para alinhar H1, subtitulo e CTA ao mesmo vocabulário operacional dos metadados, sem alterar layout autenticado.
