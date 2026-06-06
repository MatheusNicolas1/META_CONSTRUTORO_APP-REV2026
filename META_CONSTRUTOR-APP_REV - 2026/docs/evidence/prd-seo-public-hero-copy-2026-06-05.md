# PRD_SEO - Copy acima da dobra em paginas publicas

Data: 2026-06-05

## Escopo

- Rotas revisadas: `/contato`, `/central-ajuda`, `/documentacao`, `/api`, `/status`, `/atualizacoes`, `/carreiras`.
- Tipo de alteracao: copy de primeira dobra e descriptions SEO relacionadas.
- Limite respeitado: nenhuma alteracao no layout autenticado do app.

## Alteracoes de copy

- `/contato`
  - H1 passou para `Fale com a equipe do Meta Construtor`.
  - Subtitulo passou a orientar suporte, demonstracao, planos, parcerias e contexto da obra/equipe.
- `/central-ajuda`
  - H1 passou para `Ajuda para organizar obra, RDO e acesso`.
  - Subtitulo passou a destacar primeira obra, registros de campo e suporte humano.
- `/documentacao`
  - H1 passou para `Documentacao tecnica com limites claros`.
  - Subtitulo passou a explicar fluxos existentes, autenticacao e integracoes sem contrato publico.
- `/api`
  - H1 passou para `Integracoes tecnicas do Meta Construtor`.
  - Subtitulo passou a comunicar Edge Functions, permissoes e ausencia de REST API externa/SDK publico nesta versao.
- `/status`
  - H1 passou para `Status operacional do Meta Construtor`.
  - Subtitulo passou a deixar claro que uptime, latencia e incidentes numericos dependem de monitoramento externo auditavel.
- `/atualizacoes`
  - H1 passou para `Atualizacoes verificaveis do produto`.
  - Subtitulo passou a conectar RDO, documentos, checklists, integracoes e backend validado.
- `/carreiras`
  - H1 passou para `Trabalhe em produto para rotina real de obra`.
  - Subtitulo passou a explicar o contexto do produto sem anunciar vagas inexistentes.

## Metadados

- `src/config/seo.ts` e `scripts/prerender-public-routes.mjs` foram alinhados com as novas descriptions de:
  - `/contato`
  - `/central-ajuda`
  - `/documentacao`
  - `/api`
  - `/atualizacoes`

## Evidencia DOM

Smoke com Playwright nas sete rotas alteradas confirmou:

- `h1Count=1` em todas as rotas.
- `descriptionCount=1` em todas as rotas.
- `canonical` e `ogUrl` apontando para `https://www.metaconstrutor.app.br/...`.
- `body.marketing-surface=true` em todas as rotas.
- `overflow=0` em todas as rotas no viewport mobile `390x900`.
- Largura de H1/subtitulo dentro do viewport, sem quebra horizontal.

## Validacao

- `npx.cmd impeccable detect` nos arquivos alterados: sem achados.
- `npm.cmd run lint -- --quiet`: passou.
- `npm.cmd run test`: 22 arquivos passaram, 72 testes passaram.
- `npm.cmd run build`: passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`
- Avisos de build observados e nao tratados neste ciclo:
  - `color-adjust` depreciado.
  - import dinamico/estatico de Supabase.

## Proximo comando

Revisar consistencia entre copy publica e snippets dos artigos restantes do blog (`/blog/documentos-por-obra` e `/blog/checklist-qualidade-obra`), confirmando title, description, canonical, H1 unico, texto acima da dobra e prerender HTML.
