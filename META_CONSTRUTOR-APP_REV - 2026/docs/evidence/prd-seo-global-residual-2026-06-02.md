# PRD_SEO - Triagem de residuais globais e recuperacao textual

Data: 2026-06-02

## Escopo

Execucao restrita a rotas publicas de marketing/publicidade e componentes exclusivos dessas rotas. O layout autenticado do app nao foi alterado.

## Correcoes executadas

- Recuperados arquivos publicos que estavam com bytes nulos e impediam leitura por `rg`, Impeccable e TypeScript.
- Recriados `VisualWorkflowSection`, `LegalPageLayout`, `BlogArticle` e `DashboardPreviewMockup` em texto limpo.
- Substituida a pagina `/blog` antiga, com posts ficticios e newsletter fake, por listagem baseada em `src/content/blogArticles.ts`.
- `PricingHero` foi recriado sem `framer-motion`, sem glow/blur decorativo e sem fundo em gradiente.
- `LandingNavigation` removeu `transition-all`, vidro, sombra pesada e arredondamento grande no menu publico.
- `HeroSectionNew` removeu o kicker repetitivo acima do H1, removeu `overflow-hidden` que causava clipping e trouxe o nome do produto para o H1.
- `src/index.css` recebeu override escopado em `body.marketing-surface` para transformar classes antigas de gradiente em cor solida nas paginas publicas.

## Validacao de fonte

```bash
npx.cmd impeccable detect src/index.css src/components/landing/LandingNavigation.tsx src/components/landing/HeroSectionNew.tsx src/components/landing/DashboardPreviewMockup.tsx src/components/pricing/PricingHero.tsx src/pages/Blog.tsx src/pages/BlogArticle.tsx src/pages/legal/LegalPageLayout.tsx src/components/landing/VisualWorkflowSection.tsx
```

Resultado: sem achados reportados.

```bash
rg -n "bg-gradient|gradient-|bg-clip-text|text-transparent|transition-all|duration-700|rotate-|blur-\[|animate-pulse|backdrop-blur|shadow-2xl|rounded-2xl|rounded-3xl" src/components/landing/HeroSectionNew.tsx src/components/landing/DashboardPreviewMockup.tsx src/components/landing/LandingNavigation.tsx src/components/pricing/PricingHero.tsx src/pages/Blog.tsx src/pages/BlogArticle.tsx src/pages/legal/LegalPageLayout.tsx src/components/landing/VisualWorkflowSection.tsx
```

Resultado: sem ocorrencias no recorte publico critico.

## Validacao renderizada

Servidor local:

```bash
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/home
```

Resultado: `200 text/html 2948`.

Scan de cinco URLs criticas:

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/legal/privacidade
```

Resultado: 63 achados renderizados. A maior parte restante vem de residuais globais ou secoes compartilhadas antigas: `cramped-padding`, `line-length`, `repeated-section-kickers`, `nested-cards`, `ai-color-palette`, `gradient-text` e `layout-transition`.

Scan isolado da `/home` apos ajuste do hero:

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home
```

Resultado: 33 achados. Os alertas de clipping e kicker do hero foram removidos; permanecem principalmente `cramped-padding`, `line-length`, kickers repetidos em outras secoes, `nested-cards` e sinais globais de gradiente/layout.

## Gates

```bash
npm.cmd run lint
```

Resultado: passou com 0 erros e 32 warnings preexistentes.

```bash
npm.cmd run test
```

Resultado: passou com 12 arquivos e 40 testes.

```bash
npm.cmd run build
```

Resultado: bloqueado por erro fora do PRD_SEO, em layout/app autenticado:

```text
src/components/NovaObraForm.tsx(319,33): error TS2322: Type '{ onFilesChange: Dispatch<SetStateAction<File[]>>; disabled: boolean; }' is not assignable to type 'IntrinsicAttributes'.
Property 'onFilesChange' does not exist on type 'IntrinsicAttributes'.
```

## Residual priorizado

1. Remover kickers repetidos nas secoes restantes da home: `Funcionalidades`, `Prova tecnica`, `Demonstre pelo app real` e `Perguntas frequentes`.
2. Reduzir `nested-cards` nas secoes antigas da home que ainda usam profundidade visual.
3. Isolar a origem renderizada de `gradient-text`, `ai-color-palette` e `layout-transition`, pois o recorte fonte critico ja nao contem esses padroes.
4. Tratar o erro TypeScript de `NovaObraForm` em PRD proprio ou autorizacao explicita, pois pertence ao app autenticado.
