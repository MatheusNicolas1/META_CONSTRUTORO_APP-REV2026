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

- Cores e tipografia existentes (`brand-orange`, neutros, Inter — fonte que o site realmente carrega). Sem gradiente em texto, sem roxo/ciano, sem card dentro de card.
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

## 10. Execução — rodada 2 (2026-09-29, em homologação)

Status: aplicado na branch `claude/elegant-mayer-ok0ydp`; **não publicado em produção**. Aguardando validação dos prints e da homologação (`meta-construtor-homologacao`).

### Feito

- **Cabeçalho e rodapé novos em todas as páginas públicas** via `MarketingShell` (`PublicMegaNav` + `PublicSiteFooter`): home, preço, blog, artigo, contato, legal, central de ajuda, documentação, API, status, atualizações e carreiras.
- **Transição entre páginas** (`PageTransition`): opacidade + 8 px em 220 ms; não anima no primeiro carregamento e respeita `prefers-reduced-motion`.
- **Confirmação/negação animadas** (`src/components/ui/animated-status.tsx`): botão com estados enviando (spinner), sucesso (check verde desenhado em SVG) e erro (X vermelho + leve tremida), anunciados por `aria-live`. Aplicado em `/contato` e no último passo de `/criar-conta`.
- **Páginas novas** geradas de `src/content/marketingPages.ts`: 13 em `/funcionalidades/*`, 4 em `/solucoes/*` e `/modelos` (lista os guias/modelos existentes do blog). Cada uma com breadcrumb, FAQ com JSON-LD, artigos relacionados e CTA; entram no sitemap e no prerender automaticamente; rewrites no `vercel.json`.
- **Vídeos demonstrativos** (6) em `public/videos/`: tour do produto na home e clipes de RDO, checklist, obras, documentos e relatórios nas páginas de funcionalidade. Feitos com Remotion a partir dos prints reais (`public/marketing/prd-prints-*`), marcados "Dados de demonstração"; `<video muted loop playsinline preload="none">` que só toca visível, com botão pausar e pôster JPG. Regerar: `node scripts/render-demo-videos.mjs [id]`.
- **Imagens corrigidas:** print "Equipamentos" apontava para `.webp` inexistente no bucket (agora `.png`); legendas dos carrosséis saíram de cima do print (sobreposição) para baixo; telas de login/cadastro usam foto local em vez de URL externa.
- **Informações corrigidas (PRD_falso):** removidos depoimentos fictícios de login/cadastro; "funciona offline" → "instalável como app (PWA)" (não há fila offline de RDO); FAQ sem promessa de importação de planilha; integração ERP descrita como API genérica (plano Master); cards da home alinhados ao que o sistema faz (sem "controle de versão" de documentos, sem card duplicado); suporte alinhado a `/preco`; títulos/descrições de 8 artigos antigos com acentuação corrigida.
- **SEO:** `/home2`, `/preco2`, `/blog2`, `/contato2`, `/sobre2` saíram do sitemap e ganharam `noindex,follow`; FAQ da home e do preço vêm de `src/content/publicFaqs.ts` (mesmo texto na página e no JSON-LD); títulos H2/H3 em ordem.

### Hugging Face

O conector Hugging Face desta sessão está com a execução de Spaces desligada (`gradio=none`): só consulta parâmetros. Por isso vídeos e animações foram feitos com Remotion e código. Para gerar clipes com modelos do Hub (ex.: Wan 2.2 image-to-video), habilitar a execução de Spaces nas configurações do MCP do Hugging Face.

### Evidências

- Auditoria Playwright da home em 1440/820/390 px: 0 sobreposições; itens fora da tela restantes são esperados (slides do carrossel, tabela de `/preco` com rolagem horizontal no celular).
- `tsc` sem erros; ESLint sem erros (1 aviso react-refresh em `ProductClip.tsx`); `vitest` 107/107; `check-unsourced-claims` OK; `npm run build` OK (sitemap 106 rotas, 138 páginas pré-renderizadas).

### Deploy oficial (aprovado pelo dono em 2026-09-29)

- O domínio `www.metaconstrutor.app.br` fica no projeto `meta-construtor-app-rev-2026` (escopo `meta-construtors-projects`), fora do alcance do conector Vercel desta sessão; e o código em produção (commit `a2f4c0d`) só existe no master local do dono. Por isso o deploy roda no PC dele.
- Script: `node scripts/deploy-producao.mjs` (na pasta do app, no master). Envia o master ao GitHub, junta a branch `claude/elegant-mayer-ok0ydp`, roda testes/claims/build, confere o projeto do domínio e guarda o deploy atual, faz uma prévia, pede `PUBLICAR`, publica com `vercel deploy --prod` e envia o master. Em conflito ou falha, para sem publicar e mostra como desfazer.
- Rollback: `npx vercel rollback <dpl_... guardado pelo script>` ou Instant Rollback no painel.

### Pendente de decisão do dono

- Confirmar: "resposta em até 4 horas úteis", "dados por 30 dias para exportação", emissão de nota fiscal, itens do Enterprise (SLA 99,9%, on-premise, SSO, white label) e o texto de teste de 14 dias em `CheckoutCancel.tsx`/`components/pricing/FaqSection.tsx`.
- Contraste do botão laranja com texto branco (2,80:1) e o `AnimatedGradient` em texto (DESIGN.md).
- `/modelos/rdo-excel` depende de gravar os leads no Supabase; 301 das páginas V2; artigos duplicados do blog (Search Console); texto completo dos 8 artigos antigos ainda sem acento.

