# PRD_ROTAS_PUBLICAS - Arquitetura de informação das páginas públicas

Data de criação: 2026-09-29
Status: PROPOSTA EM HOMOLOGAÇÃO — aguardando validação do usuário (nenhuma rota publicada foi alterada)
Produto: Meta Construtor Web
Baseline: `PRD_MESTRE.md`, `PRD_SEO.md`, `DESIGN.md`, `PRODUCT.md`, `docs/PRD_PUBLICAS_AFTER_EFFECTS_REMOTION.md` (benchmark Canva de 2026-06-06)
Prévia: rota `/demo/navegacao` (noindex, fora do sitemap)

## 1. Objetivo

Organizar as rotas públicas e o menu a partir do modelo de arquitetura de informação do Canva PT-BR, mantendo cores, tipografia e tom do Meta Construtor. Resultado esperado: o visitante encontra a funcionalidade que procura em até dois cliques, e cada módulo real do produto ganha uma página indexável para buscas específicas.

## 2. Benchmark (Canva PT-BR)

Fonte: análise registrada em `docs/PRD_PUBLICAS_AFTER_EFFECTS_REMOTION.md` §1. Em 2026-09-29 não foi possível uma leitura nova: o conector Firecrawl não expôs as ferramentas de scraping e o domínio canva.com está bloqueado pela política de rede deste ambiente.

Padrões adotados:

| Padrão Canva | Adaptação Meta Construtor |
| --- | --- |
| Menu por intenção, com submenus agrupados (mega menu) | Produto, Soluções, Modelos grátis, Aprender, Planos |
| Uma URL por recurso/caso de uso | `/funcionalidades/<modulo>` e `/solucoes/<publico>` |
| Biblioteca de modelos como porta de entrada | `/modelos` e `/modelos/rdo-excel` (substitui `/captura`) |
| Central de aprendizado | Blog em temas, central de ajuda, documentação, API, status |
| Rodapé denso como mapa do site | 5 colunas: Produto, Soluções, Modelos e conteúdo, Suporte, Empresa |

Não adotados: paleta roxo/ciano, texto em gradiente, prova social por volume (proibida sem fonte pelo `PRD_falso.md`).

## 3. Fonte única da IA

`src/config/publicRoutes.ts` concentra rotas, menu, rodapé, rotas a consolidar e temas do blog. Menu (`PublicMegaNav`) e rodapé (`PublicSiteFooter`) leem dessa configuração; ao aprovar, sitemap e prerender devem passar a ler dela também.

Status de rota: `ativa` (existe), `nova` (proposta), `consolidar` (sai do índice e redireciona).

## 4. Mapa de rotas

### Produto — `/funcionalidades/...` (todas novas; descrevem apenas módulos existentes no app)

| Grupo | Página | URL | Busca principal |
| --- | --- | --- | --- |
| Rotina de campo | RDO digital | `/funcionalidades/rdo-digital` | rdo digital · diário de obra |
| Rotina de campo | Checklists de qualidade | `/funcionalidades/checklist-de-obra` | checklist de obra |
| Rotina de campo | DDS | `/funcionalidades/dds` | dds segurança do trabalho |
| Rotina de campo | Ordens de serviço | `/funcionalidades/ordem-de-servico` | ordem de serviço obra |
| Gestão da obra | Obras e atividades | `/funcionalidades/controle-de-obras` | controle de obras |
| Gestão da obra | Equipes e equipamentos | `/funcionalidades/equipes-e-equipamentos` | gestão de equipes na construção civil |
| Gestão da obra | Documentos da obra | `/funcionalidades/documentos-de-obra` | documentos de obra |
| Gestão da obra | Relatórios | `/funcionalidades/relatorios-de-obra` | relatório de obra |
| Financeiro e integrações | Contratos e medições | `/funcionalidades/medicao-de-obra` | medição de obra |
| Financeiro e integrações | Fluxo de caixa e curva ABC | `/funcionalidades/fluxo-de-caixa-de-obra` | fluxo de caixa de obra |
| Financeiro e integrações | Despesas e fornecedores | `/funcionalidades/despesas-e-fornecedores` | controle de despesas de obra |
| Financeiro e integrações | Portal do cliente | `/funcionalidades/portal-do-cliente` | portal do cliente construtora |
| Financeiro e integrações | Integração com ERP | `/funcionalidades/integracao-erp` | integração sienge |

A home (`/`) continua disputando "sistema de gestão de obras"; as páginas de funcionalidade usam termos específicos para não canibalizar a home.

### Soluções — `/solucoes/...` (novas)

`/solucoes/construtoras`, `/solucoes/engenheiros`, `/solucoes/diretoria` (públicos do `PRODUCT.md`) e `/solucoes/obras-publicas` (validar posicionamento comercial antes de publicar).

### Modelos grátis (novas)

`/modelos` e `/modelos/rdo-excel`. Pré-requisito: os leads de `/captura` hoje ficam só no `localStorage` do visitante; precisam ser gravados no Supabase antes de a página ir ao ar.

### Aprender, conversão, empresa e legal (ativas, sem mudança de URL)

`/blog`, `/central-ajuda`, `/documentacao`, `/api`, `/atualizacoes`, `/status`, `/`, `/preco`, `/criar-conta`, `/contato`, `/sobre`, `/carreiras`, `/legal/*`.

## 5. Consolidação

| URL atual | Destino | Motivo |
| --- | --- | --- |
| `/home2`, `/preco2`, `/blog2`, `/contato2`, `/sobre2` | `/`, `/preco`, `/blog`, `/contato`, `/sobre` | Duplicam as páginas principais e estão no sitemap (canibalização). Tirar do sitemap e redirecionar (301) após escolher o layout. |
| `/captura` | `/modelos/rdo-excel` | SEO indexável configurado em `seo.ts`, mas sem rota no router (abre 404); leads só no navegador. |
| `/home` | `/` | Menu e rodapé atuais apontam para `/home`; links internos devem ir direto para `/`. |

## 6. Blog

- 73 artigos em 17 categorias com nomes repetidos ("Gestão de obras", "Gestão de Obras", "Gestao de obras"). Proposta: 7 temas em `/blog/tema/<tema>` (prefixo evita colisão com `/blog/:slug`), cada tema ligado à página de funcionalidade correspondente.
- 14 pares de artigos disputam a mesma busca (lista em `blogDuplicates`). Decidir qual manter com cliques/impressões do Search Console; o outro recebe 301.

## 7. Design e acessibilidade

- Cores e tipografia existentes (`brand-orange`, neutros, Plus Jakarta Sans). Sem gradiente em texto, sem roxo/ciano, sem card dentro de card.
- Texto laranja pequeno usa `orange-700` (#C2410C, contraste 5,18:1). O laranja da marca (#F97316) com texto branco tem 2,80:1 — abaixo do AA (4,5:1). Decisão pendente: manter o botão atual ou escurecer o fundo do CTA / usar texto escuro (6,40:1).
- Menu: abre por clique ou passagem do mouse (com atraso de intenção), fecha com Esc (foco volta ao gatilho), clique fora ou troca de rota; `aria-expanded`/`aria-controls`; animação só de opacidade/deslocamento (180 ms) e desligada com `prefers-reduced-motion`.
- Gaveta no celular/tablet (< 1024 px) com seções em acordeão e CTAs fixos no rodapé da gaveta, respeitando safe area.

## 8. Evidências da prévia (2026-09-29)

- Auditoria automática de sobreposição/estouro em `/demo/navegacao` (Playwright): 0 sobreposições, 0 estouro horizontal e 0 elementos fora da tela em 1440, 820 e 390 px; menus abertos verificados em 1024, 1280 e 1440 px e gaveta em 320, 390 e 820 px, todos sem sobreposição.
- ESLint sem erros nos arquivos novos/alterados; TypeScript sem erros nesses arquivos; `scripts/check-unsourced-claims.mjs` OK; `vitest` 107/107.

## 9. Próximos passos (após aprovação)

1. Trocar `PublicNav`/`PublicFooter` por `PublicMegaNav`/`PublicSiteFooter` nas rotas públicas.
2. Criar o template de página de funcionalidade e publicar primeiro `/funcionalidades/rdo-digital` (demo antes do deploy).
3. Tirar `/home2`…`/sobre2` do sitemap e aplicar 301 em `vercel.json`.
4. Gerar sitemap e prerender a partir de `publicRoutes.ts`.
5. Temas do blog e consolidação dos artigos duplicados com dados do Search Console.
