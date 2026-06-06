# PRD_BLOG - Blog publico, RDO e ranqueamento organico

Status: Pronto para revisao - Ciclo 1 implementado e validado  
Data de criacao: 2026-06-06  
Owner tecnico: Codex  
Produto: Meta Construtor Web  
Escopo: blog publico, artigos indexaveis, SEO tecnico, FAQ schema e clareza comercial para decisores

## 1. Objetivo

Criar e manter uma secao de blog publica para capturar buscas informacionais sobre RDO, direcionar usuarios para o contexto correto da construcao civil e apoiar conversao comercial do Meta Construtor.

O primeiro ciclo deve responder diretamente as perguntas do bloco "As pessoas tambem perguntam" informado pelo usuario:

- O que e um RDO?
- O que e RDOS?
- O que significa RDO na policia?
- O que e um RDO de empresa?

## 2. Fontes e baseline

Baseline obrigatorio:

- `PRD_MESTRE.md`: fonte operacional consolidada.
- `PRD_SEO.md`: dominio canonico, metadados centralizados, sitemap, robots e escopo restrito a paginas publicas.
- `src/config/seo.ts`: fonte central de metadados.
- `src/content/blogArticles.ts`: fonte central do conteudo do blog.
- `scripts/generate-sitemap.mjs`: geracao de sitemap.
- `scripts/prerender-public-routes.mjs`: HTML SEO prerenderizado por rota publica.

Decisoes herdadas do `PRD_MESTRE.md`:

- Preservar dominio canonico `https://www.metaconstrutor.app.br`.
- Nao alterar layout interno do app autenticado.
- Manter paginas publicas com metadados centralizados, canonical, robots, Open Graph, Twitter e JSON-LD.
- Usar evidencia objetiva antes de marcar itens como concluidos.

## 3. Interpretacao de SEO e CEO

SEO:

- Capturar buscas de topo de funil sobre RDO.
- Responder a pergunta principal nos primeiros paragrafos.
- Usar H1 unico, H2/H3 em ordem, FAQ visivel e FAQPage schema.
- Evitar canibalizacao entre artigos: a pagina `o-que-e-rdo` e a pagina pilar; `o-que-e-rdos` atende variacao/plural; `rdo-na-policia` desambigua a sigla; `rdo-de-empresa` aproxima a busca da decisao comercial.

CEO:

- Neste PRD, "CEO" significa clareza para decisores executivos, conforme interpretacao ja usada em `PRD_SEO.md`.
- Cada artigo deve responder: o que e, por que importa, como reduz risco operacional e qual proximo passo comercial faz sentido.
- CTAs devem ser contextuais e discretos, sem transformar artigo informacional em landing page agressiva.

## 4. Arquitetura de conteudo

| Rota | Pergunta-alvo | Intencao | Papel no funil | Status |
| --- | --- | --- | --- | --- |
| `/blog/o-que-e-rdo` | O que e um RDO? | Descoberta da sigla | Pilar informacional de RDO na construcao civil | Implementado |
| `/blog/o-que-e-rdos` | O que e RDOS? | Variacao/plural da sigla | Captura de busca variante e linkagem para pilar | Implementado |
| `/blog/rdo-na-policia` | O que significa RDO na policia? | Desambiguacao da sigla | Evita rejeicao e separa policia de obra | Implementado |
| `/blog/rdo-de-empresa` | O que e um RDO de empresa? | Busca empresarial/comercial | Aproxima RDO de gestao e decisao executiva | Implementado |
| `/blog/como-estruturar-rdo` | Como estruturar RDO | Guia pratico | Conteudo de apoio para usuario mais avancado | Mantido e enriquecido |
| `/blog/documentos-por-obra` | Documentos de obra | Apoio operacional | Linkagem para documentos e evidencias | Mantido e enriquecido |
| `/blog/checklist-qualidade-obra` | Checklist de obra | Apoio operacional | Linkagem para qualidade, ocorrencias e anexos | Mantido e enriquecido |

## 5. Requisitos funcionais

- [x] Criar PRD raiz `PRD_BLOG.md`.
- [x] Manter `/blog` como rota publica indexavel.
- [x] Criar artigos para as quatro perguntas informadas pelo usuario.
- [x] Renderizar artigos via fonte central `src/content/blogArticles.ts`.
- [x] Renderizar pagina de detalhe em `/blog/:slug`.
- [x] Adicionar FAQ visivel em cada artigo.
- [x] Adicionar tempo de leitura, categoria, intencao e termos-alvo em cada artigo.
- [x] Manter CTAs contextuais para `/home`, `/preco`, `/contato` ou artigo pilar.

## 6. Requisitos SEO tecnico

- [x] Cada artigo tem `seoTitle`, `description`, `canonical`, `robots=index,follow` e `type=article`.
- [x] Cada artigo gera `Article` JSON-LD em `src/config/seo.ts`.
- [x] Cada artigo gera `FAQPage` JSON-LD em `src/config/seo.ts`.
- [x] Novas rotas foram adicionadas ao sitemap.
- [x] Novas rotas foram adicionadas ao prerender publico.
- [x] O prerender inclui `Article` e `FAQPage` para as quatro novas rotas PAA.

## 7. Regras editoriais

- Responder a pergunta principal de forma direta no inicio.
- Usar linguagem simples, especifica para construtoras e equipes de obra.
- Diferenciar claramente RDO policial de RDO de obra.
- Evitar promessas juridicas, policiais ou oficiais fora do escopo do Meta Construtor.
- Evitar conteudo repetido entre `o-que-e-rdo` e `o-que-e-rdos`.
- Usar CTA apenas depois de entregar a resposta informacional.

## 8. Criterios de aceite

- `/blog` lista os sete artigos sem depender de dados externos.
- `/blog/o-que-e-rdo`, `/blog/o-que-e-rdos`, `/blog/rdo-na-policia` e `/blog/rdo-de-empresa` carregam com H1 unico, FAQ visivel e CTA.
- `public/sitemap.xml` contem as quatro novas URLs.
- `dist/blog/<slug>/index.html` e gerado no build para as novas URLs.
- `npm run build` conclui sem erro.
- Smoke visual em desktop e mobile confirma ausencia de tela em branco e conteudo principal acessivel.

## 9. Evidencias

Evidencia do Ciclo 1:

- `docs/evidence/prd-blog-rdo-articles-2026-06-06.md`

## 10. Pendencias futuras

- Criar imagens Open Graph especificas por artigo.
- Medir indexacao e impressoes no Google Search Console apos publicacao.
- Expandir cluster de RDO com comparativos: modelo de RDO, RDO digital, diario de obra, Livro de Ordem e erros comuns.
- Avaliar links internos de `/home`, `/preco` e `/central-ajuda` para os artigos pilar.
