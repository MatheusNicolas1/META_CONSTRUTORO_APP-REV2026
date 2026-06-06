# PRD_SEO - artigos restantes do blog

Data: 2026-06-06

## Escopo

Revisao de consistencia SEO e copy acima da dobra nas paginas publicas:

- `/blog/documentos-por-obra`
- `/blog/checklist-qualidade-obra`

O escopo ficou restrito as paginas publicas de marketing/blog. Nenhuma tela autenticada do app foi alterada.

## Resultado

- Confirmados `title`, `description`, `canonical`, `og:url`, `og:title` e JSON-LD especificos por artigo.
- Confirmado H1 unico por artigo.
- Confirmado texto acima da dobra alinhado ao snippet SEO de cada pagina.
- Confirmado `body.marketing-surface=true` nos artigos.
- Confirmada ausencia de overflow horizontal no viewport mobile.
- Confirmado HTML prerenderizado com metadados unicos para os dois artigos.

## Evidencia DOM local

Comando executado contra `http://127.0.0.1:5173`:

```powershell
node <playwright-dom-smoke>
```

Resultado resumido:

```json
[
  {
    "route": "/blog/documentos-por-obra",
    "title": "Documentos por obra | Meta Construtor",
    "description": "Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.",
    "canonical": "https://www.metaconstrutor.app.br/blog/documentos-por-obra",
    "ogUrl": "https://www.metaconstrutor.app.br/blog/documentos-por-obra",
    "category": "Documentos",
    "h1": "Quais documentos precisam estar ligados a cada obra",
    "summary": "Documento solto em pasta compartilhada perde contexto. Documento ligado a obra, etapa e responsavel vira evidencia consultavel.",
    "h1Count": 1,
    "descriptionCount": 1,
    "canonicalCount": 1,
    "ogTitleCount": 1,
    "jsonLdCount": 2,
    "marketingSurface": true,
    "overflow": 0
  },
  {
    "route": "/blog/checklist-qualidade-obra",
    "title": "Checklist de qualidade na obra | Meta Construtor",
    "description": "Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.",
    "canonical": "https://www.metaconstrutor.app.br/blog/checklist-qualidade-obra",
    "ogUrl": "https://www.metaconstrutor.app.br/blog/checklist-qualidade-obra",
    "category": "Checklists",
    "h1": "Quando usar checklist, ocorrencia, atividade ou anexo",
    "summary": "Muitas equipes registram tudo no mesmo lugar. A rotina fica mais clara quando cada tipo de registro tem uma funcao.",
    "h1Count": 1,
    "descriptionCount": 1,
    "canonicalCount": 1,
    "ogTitleCount": 1,
    "jsonLdCount": 2,
    "marketingSurface": true,
    "overflow": 0
  }
]
```

## Evidencia prerender

Leitura direta dos arquivos:

- `dist/blog/documentos-por-obra/index.html`
- `dist/blog/checklist-qualidade-obra/index.html`

Resultado:

```json
[
  {
    "route": "/blog/documentos-por-obra",
    "title": "Documentos por obra | Meta Construtor",
    "description": "Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.",
    "canonical": "https://www.metaconstrutor.app.br/blog/documentos-por-obra",
    "ogUrl": "https://www.metaconstrutor.app.br/blog/documentos-por-obra",
    "descCount": 1,
    "canonicalCount": 1,
    "ogTitleCount": 1,
    "jsonLdCount": 2
  },
  {
    "route": "/blog/checklist-qualidade-obra",
    "title": "Checklist de qualidade na obra | Meta Construtor",
    "description": "Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.",
    "canonical": "https://www.metaconstrutor.app.br/blog/checklist-qualidade-obra",
    "ogUrl": "https://www.metaconstrutor.app.br/blog/checklist-qualidade-obra",
    "descCount": 1,
    "canonicalCount": 1,
    "ogTitleCount": 1,
    "jsonLdCount": 2
  }
]
```

## Gates

- `npx.cmd impeccable detect src/content/blogArticles.ts src/pages/BlogArticle.tsx src/config/seo.ts scripts/prerender-public-routes.mjs` - passou sem achados reportados.
- `npm.cmd run lint -- --quiet` - passou.
- `npm.cmd run test` - passou, 23 arquivos e 75 testes.
- `npm.cmd run build` - passou; `postbuild` gerou sitemap e `Prerendered 18 public route HTML files.`

Avisos restantes do build: `color-adjust` depreciado e import dinamico/estatico de Supabase, ambos preexistentes.

## Proxima fatia recomendada

Revisar o indice `/blog` como hub SEO: densidade de links internos para artigos, consistencia entre cards e snippets, breadcrumbs/Schema e copy acima da dobra, mantendo a superficie publica e sem alterar o layout autenticado do app.
