# PRD_DASHBOARD - Redesign do Dashboard Principal

Produto: Meta Construtor Web  
Rota principal: `/app/dashboard`  
Data de criacao: 2026-05-28  
Status: Ciclo 4 com menu lateral Canva-like validado e deployado em producao  
Responsavel operacional: Codex  

## 1. Objetivo

Migrar o dashboard principal do Meta Construtor para uma experiencia inspirada no dashboard do Canva, mantendo o contexto de gestao de obras. A interface deve ter navegacao lateral com estados expandido e recolhido, area principal mais ampla, busca em destaque, atalhos rapidos, conteudo recente em grid visual e uso responsivo da marca textual Meta Construtor.

O resultado esperado nao e copiar o Canva literalmente. O objetivo e adaptar a estrutura de produtividade visual do Canva para o dominio do Meta Construtor: obras, RDOs, checklist, equipes, documentos, relatorios e acoes recentes.

## 2. Referencias recebidas

- Print 1: Canva com menu lateral expandido.
- Print 2: Canva com menu lateral recolhido.
- Logo icone: `C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\LOGOMARCAS\Design sem nome (25).png`
- Logo completa: `C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\LOGOMARCAS\META_CONSTRUTOR_LOGO.png`

## 3. Registro obrigatorio de design

- [x] Skill Impeccable carregado para orientar o processo de produto.
- [x] Registro de design inferido: `product`, porque a alteracao e em app autenticado, dashboard e shell operacional.
- [x] Referencia Impeccable usada: `.agents/skills/impeccable/reference/product.md`.
- [x] Antes de editar UI, executar ou registrar uma etapa Impeccable de shape/layout para o dashboard principal.
- [x] Figma/Canva MCP foram solicitados pelo usuario para a etapa `/home`, mas nao ficaram expostos como ferramentas executaveis nesta sessao via `tool_search`; a execucao visual foi feita diretamente no codigo com direcao Impeccable e referencias dos prints.

Observacao: o loader do Impeccable nao encontrou `PRODUCT.md` nem `DESIGN.md` no contexto atual. Para maior consistencia de marca, uma etapa futura pode criar esses arquivos ou rodar o fluxo equivalente de documentacao antes da implementacao visual.

## 4. Estado atual mapeado

Arquivos principais:

- `src/pages/Dashboard.tsx`: delega a tela para `OptimizedDashboard`.
- `src/components/OptimizedDashboard.tsx`: conteudo atual do dashboard, cards de metricas, calendario de atividade, RDOs recentes e obras recentes.
- `src/components/OptimizedLayout.tsx`: shell autenticado, header, busca global, acoes de usuario, sidebar e bottom navigation PWA.
- `src/components/AppSidebar.tsx`: menu lateral atual, estados expandido/recolhido via `SidebarProvider`.
- `src/components/Logo.tsx`: logo atual em texto `Meta` + `Construtor`.
- `src/components/ui/sidebar.tsx`: base shadcn/Radix da sidebar.
- `src/hooks/useDashboardStats.ts`: dados das metricas do dashboard.
- `src/index.css` e `tailwind.config.ts`: tokens visuais, cores, responsividade e utilitarios.

Problemas atuais para o novo objetivo:

- O header atual compete com a area principal; no Canva, o espaco principal absorve busca e atalhos.
- O dashboard atual usa estrutura SaaS comum: titulo, botoes, cards numericos e listas.
- A sidebar ja recolhe, mas ainda parece menu administrativo padrao, nao um launcher vertical com icones fortes.
- A marca atual e textual e deve substituir a logomarca em imagem no dashboard/shell.
- A home do dashboard nao possui grid visual de itens recentes semelhante aos projetos recentes do Canva.
- A busca global existe, mas nao e protagonista da tela.

## 5. Escopo funcional

### 5.1 Shell e sidebar

- [x] Preservar `SidebarProvider`, `SidebarTrigger` e acessibilidade do componente existente.
- [x] Criar comportamento visual inspirado no Canva:
  - sidebar expandida com logo, criacao/acesso rapido e secoes;
  - sidebar recolhida com coluna estreita de icones;
  - item ativo com destaque claro;
  - tooltips no modo recolhido;
  - rodape com usuario, notificacoes ou atalho para configuracoes quando aplicavel.
- [x] Garantir que a sidebar continue fechando automaticamente em mobile.
- [x] Validar modo PWA, onde a bottom navigation ainda pode substituir a sidebar.

### 5.2 Header e area principal

- [x] Reduzir o peso do header fixo no desktop.
- [x] Avaliar mover a busca global para o hero do dashboard em desktop, mantendo acesso compacto em outras rotas.
- [x] Criar hero/top band do dashboard com gradiente sutil inspirado no Canva, usando a paleta Meta Construtor.
- [x] Evitar gradiente de texto e efeitos decorativos excessivos, conforme regra Impeccable.
- [x] Preservar acoes existentes: notificacoes, tema, creditos e perfil.

### 5.3 Conteudo do dashboard

- [x] Substituir o topo atual por uma area de boas-vindas e busca ampla.
- [x] Criar trilha horizontal de atalhos rapidos:
  - Novo RDO
  - Nova Obra
  - Checklist
  - Equipes
  - Documentos
  - Relatorios
  - Despesas
  - Integracoes
- [x] Transformar metricas atuais em indicadores menos pesados, integrados ao layout.
- [x] Criar secao "Recentes" com cards visuais para:
  - obras recentes;
  - RDOs recentes;
  - documentos recentes, se houver fonte real;
  - relatorios ou atalhos de operacao, se houver fonte real.
- [x] Manter `ActivityCalendarModern`, mas reposicionar como painel secundario ou insight.
- [x] Nao exibir dados ficticios. Quando uma fonte nao existir, usar estado vazio real e acao clara.

### 5.4 Marca responsiva

- [x] Substituir o uso ativo da logomarca em imagem por nome tipografico `META CONSTRUTOR`.
- [x] Atualizar `src/components/Logo.tsx` para suportar:
  - variante completa textual;
  - variante icone/compacta quando realmente necessaria;
  - tamanhos `sm`, `md`, `lg`, `xl`;
  - `aria-label` acessivel.
- [x] Usar nome completo quando a sidebar estiver expandida.
- [x] Ocultar o nome quando a sidebar estiver recolhida.
- [x] Usar `Meta` em azul no modo claro e branco no modo escuro; `Construtor` em laranja.
- [x] Ciclo 4: configurar `Balgeri` como tipografia preferencial local da palavra `Meta`, com fallback para `Gristela`, `Rosca`, `Moonet`, `Casser` e fonte cursiva do sistema.

### 5.5 Responsividade

- [x] Desktop largo: sidebar expandida ou recolhida, hero amplo, atalhos em linha e grid de recentes.
- [x] Desktop medio/tablet: atalhos com scroll horizontal controlado, grid com 2 a 3 colunas.
- [x] Mobile web: sidebar em drawer, busca e atalhos empilhados sem overflow horizontal indevido.
- [x] PWA mobile: respeitar bottom navigation, sem botoes cobertos no final do scroll.
- [x] Validar 320, 390, 768, 1024, 1440 e 1920 px.

## 6. Escopo tecnico

- [x] Criar componentes pequenos se a tela ficar grande:
  - `DashboardHero`
  - `DashboardQuickActions`
  - `DashboardRecentGrid`
  - `DashboardMetricStrip`
  - `BrandLogo`
- [x] Reutilizar hooks existentes antes de criar novas queries.
- [x] Evitar nova dependencia visual se lucide, Tailwind, Radix e shadcn existentes forem suficientes.
- [x] Manter lazy loading de secoes pesadas.
- [x] Garantir que skeletons e estados vazios continuem renderizando sem layout shift.
- [x] Preservar rotas e permissoes atuais.
- [x] Atualizar testes ou scripts de smoke se houver seletores dependentes do layout antigo.

## 7. Migracao proposta

### Fase 0 - Preparacao

- [x] Confirmar qual logo sera usada como principal:
  - decisao Ciclo 1: usar `META_CONSTRUTOR_LOGO.png` para expandido e `Design sem nome (25).png` para recolhido;
  - decisao Ciclo 2: remover o uso ativo dessas imagens no dashboard/shell e usar nome tipografico.
- [x] Ciclo 1 copiou assets para caminho versionado no repo.
- [x] Ciclo 2 removeu o uso ativo desses assets no dashboard/shell e adotou marca tipografica.
- [x] Registrar decisao Impeccable de shape/layout.
- [x] Capturar screenshot atual de `/app/dashboard` com menu expandido e recolhido.

### Fase 1 - Logo e shell

- [x] Atualizar `Logo.tsx` para marca tipografica responsiva.
- [x] Ajustar `AppSidebar.tsx` para mostrar nome expandido e ocultar no modo recolhido.
- [x] Ajustar largura, padding, hover, ativo e tooltips da sidebar.
- [x] Validar que o menu recolhido nao corta icones nem labels em tooltip.

### Fase 2 - Dashboard Canva-like

- [x] Refatorar `OptimizedDashboard.tsx` em secoes.
- [x] Implementar hero com busca ampla.
- [x] Implementar atalhos rapidos com icones.
- [x] Reorganizar metricas, calendario e recentes.
- [x] Adicionar estados vazios consistentes.

### Fase 3 - Responsividade e temas

- [x] Verificar light mode.
- [x] Verificar dark mode.
- [x] Melhorar tokens do dark mode para fundo/cartoes/bordas mais sutis.
- [x] Verificar mobile web.
- [x] Verificar PWA standalone.
- [x] Verificar sidebar expandida e recolhida em desktop.
- [x] Ciclo 4: revalidar menu em modelo trilho fixo + painel expandido, evitando corte de `Mais`, perfil e calendario em 768 px.
- [x] Ciclo 5: revalidar busca inline sem modal/mockup e painel expandido com ultimos RDOs em vez de links duplicados.

### Fase 4 - Validacao e evidencia

- [x] `npm.cmd run build`
- [x] Smoke visual autenticado em `/app/dashboard`.
- [x] Smoke publico em `/home`.
- [x] Screenshot desktop 1440, sidebar expandida.
- [x] Screenshot desktop 1440, sidebar recolhida.
- [x] Screenshot mobile 390.
- [x] Smoke tablet 768.
- [x] Smoke adicional dashboard 320, 1024 e 1920.
- [x] Deploy Vercel producao.
- [x] Verificacao HTTP producao `/home`.
- [x] Verificacao HTTP producao `/app/dashboard`.
- [x] Registrar evidencia em `docs/evidence/`.
- [x] Atualizar este PRD com itens concluidos e pendencias reais.

## 8. Criterios de aceite

- [x] A tela `/app/dashboard` lembra estruturalmente o dashboard do Canva: sidebar vertical, busca protagonista, atalhos circulares/compactos e grid de recentes.
- [x] A experiencia continua claramente Meta Construtor, com paleta e conteudo de obras/RDOs.
- [x] A marca textual `META CONSTRUTOR` substitui a logomarca em imagem no dashboard/shell.
- [x] O menu expandido e recolhido funcionam sem quebra visual.
- [x] O menu lateral nao depende de barra de rolagem propria.
- [x] O menu `Mais` concentra funcionalidades secundarias.
- [x] O botao laranja principal cria novo RDO, nao nova obra.
- [x] O menu superior direito fica restrito aos creditos do plano free; notificacoes, tema e perfil ficam na lateral.
- [x] A busca do dashboard permite digitar diretamente no campo; `Ctrl+K` foca o input inline e nao abre mockup/modal.
- [x] O painel expandido da sidebar mostra ultimos RDOs reais e evita repetir Dashboard/Obras/RDO/Check do trilho principal.
- [x] A marca `META CONSTRUTOR` usa a mesma familia/tipografia nos dois termos; `META` alterna azul no modo claro e branco no modo dark.
- [x] O layout nao gera scroll horizontal indevido.
- [x] O modo dark/light preserva contraste minimo e legibilidade.
- [x] O dashboard nao usa dados falsos para preencher recentes ou metricas.
- [x] Build passa.
- [x] Evidencias visuais foram capturadas e referenciadas no PRD.

## 9. Riscos e cuidados

- Risco: copiar demais o Canva e perder identidade do produto. Mitigacao: usar padrao estrutural, mas com cores, copy e entidades do Meta Construtor.
- Risco: quebrar responsividade PWA ja validada em PRDs anteriores. Mitigacao: testar PWA/mobile antes de concluir.
- Risco: trocar `Logo.tsx` e afetar landing/public pages. Mitigacao: suportar variantes e revisar usos existentes.
- Risco: buscar recentes de documentos/relatorios sem fonte real. Mitigacao: so exibir fonte real; caso contrario, estado vazio.
- Risco: header global de outras rotas ser afetado por mudancas especificas do dashboard. Mitigacao: condicionar mudancas ao pathname ou componentes de dashboard.

## 10. Pendencias manuais

- [ ] Usuario aprovar se a inspiracao do menu lateral em trilho + painel ja esta proxima o suficiente do Canva.
- [x] Usuario substituiu a direcao anterior: no dashboard/shell deve aparecer marca textual, nao logomarca em imagem.
- [ ] Usuario confirmar se quer manter os cards numericos como primeira dobra ou mover para uma faixa secundaria.

## 11. Proxima atividade recomendada

Ciclo 5 concluido e publicado em producao. Proxima atividade recomendada: revisao visual manual em `https://www.metaconstrutor.app.br/app/dashboard`, validando busca inline, menu expandido/recolhido e ultimos RDOs na sidebar.

## 12. Log de execucao

- 2026-05-28: PRD criado. Mapeados os arquivos atuais do dashboard, shell, sidebar, logo, tokens e hook de metricas. Registrada obrigatoriedade de uso do Impeccable no processo e uso opcional de Figma/Canva MCP quando houver necessidade de prototipo ou extracao visual adicional.
- 2026-05-29: Ciclo 1 implementado. Logos versionadas em `public/brand`, `Logo.tsx`, `AppSidebar.tsx`, `OptimizedLayout.tsx`, `GlobalSearch.tsx`, `OptimizedDashboard.tsx` e constantes da sidebar atualizados. Evidencia registrada em `docs/evidence/prd-dashboard-ciclo-1-2026-05-29.md`. Build, smoke autenticado do dashboard, tema e PWA standalone passaram.
- 2026-05-29: Ciclo 2 implementado. Marca em imagem removida do uso ativo no dashboard/shell e substituida por `META CONSTRUTOR` tipografico. Sidebar ficou sem rolagem propria, ganhou menu `Mais`, botao principal `Novo RDO`, notificacoes/tema/perfil no rodape lateral e topo com apenas creditos free. `/home` recebeu hero mais visual, marca textual e nova secao `VisualWorkflowSection`. Build passou; smoke autenticado do dashboard passou em 390, 768 e 1440; smoke publico de `/home` passou em 320, 390, 768 e 1440; screenshot desktop `/home` registrado em `docs/evidence/prd-dashboard-ciclo-2-home-desktop-2026-05-29.png`.
- 2026-05-29: Continuidade do ciclo 2. Smoke autenticado do dashboard ampliado para 320, 390, 768, 1024, 1440 e 1920, com 6 testes aprovados. Deploy Vercel producao concluido: `dpl_DEUA9ibSqbhmh7yzDFKrW11EoWkj`, URL `https://meta-construtor-app-rev-2026-n67488dnc.vercel.app`, alias `https://www.metaconstrutor.app.br`. Verificacao HTTP pos-deploy retornou 200 em `/home` e `/app/dashboard`.
- 2026-05-29: Ciclo 3 iniciado para corrigir responsividade reportada pelo usuario. Ajustados o clipping do calendario com sidebar expandida, visibilidade do botao `Mais`, troca de posicao entre botao do menu e marca textual, alinhamento do topo da sidebar e tipografia estilizada de `Meta`. Build passou; smoke autenticado do dashboard passou em 320, 390, 768, 1024, 1440 e 1920 com verificacao adicional de `Mais` e overflow do calendario; smoke publico de `/home` passou em 320, 390, 768 e 1440. Evidencia: `docs/evidence/prd-dashboard-ciclo-3-responsive-fixes-2026-05-29.md`.
- 2026-05-29: Ciclo 3 publicado em producao na Vercel. Deployment `dpl_ABPKB84zg3n1Nqo5LyYZBuurXjEa`, URL `https://meta-construtor-app-rev-2026-2kijx0sv4.vercel.app`, alias `https://www.metaconstrutor.app.br`, status `Ready`. Verificacao HTTP pos-deploy retornou 200 em `/home` e `/app/dashboard`.
- 2026-05-29: Ciclo 4 implementado para aproximar o menu lateral dos novos prints do Canva. `AppSidebar.tsx` foi reestruturado em trilho fixo de icones + painel expandido com marca textual; menu `Mais`, perfil, notificacoes e tema permanecem no trilho sem barra de rolagem propria; `Balgeri` foi configurada como fonte local preferencial da marca; larguras da sidebar foram ajustadas para `5.5rem` recolhida e `25.5rem` expandida; calendario foi reduzido em 768 px para evitar overflow interno. Build passou; smoke autenticado do dashboard passou em 320, 390, 768, 1024, 1440 e 1920; smoke publico de `/home` passou em 320, 390, 768 e 1440. Evidencia: `docs/evidence/prd-dashboard-ciclo-4-sidebar-canvas-2026-05-29.md`.
- 2026-05-29: Ciclo 4 publicado em producao na Vercel. Deployment `dpl_Hu2xmMgUVoLu1XJoDuhQnAy7wT7s`, URL `https://meta-construtor-app-rev-2026-gvudw8pkf.vercel.app`, alias `https://www.metaconstrutor.app.br`, status `Ready`. Verificacao HTTP pos-deploy retornou 200 em `/home` e `/app/dashboard`.
- 2026-05-31: Ciclo 5 implementado. `GlobalSearch.tsx` deixou de abrir modal/mockup e passou a manter busca inline com digitacao direta para obras, RDOs e documentos; `Ctrl+K` foca o input inline; `Logo.tsx` usa a mesma tipografia para `META` e `Construtor`, com `META` azul no modo claro e branco no dark; `AppSidebar.tsx` substitui links duplicados no painel expandido por ultimos RDOs reais; `analytics.ts` foi corrigido para inserir eventos autenticados em `analytics_events` respeitando RLS. Build passou; smoke autenticado do dashboard passou em 320, 390, 768, 1024, 1440 e 1920; smoke publico de `/home` passou em 320, 390, 768 e 1440. Evidencia: `docs/evidence/prd-dashboard-ciclo-5-inline-search-rdos-2026-05-31.md`.
- 2026-05-31: Ciclo 5 publicado em producao na Vercel. Deployment final `dpl_3VnJ6fv6rUBcsiC7wPvR8SEkuPrn`, URL `https://meta-construtor-app-rev-2026-8c0biq5wv.vercel.app`, alias `https://www.metaconstrutor.app.br`, status `Ready`. Verificacao HTTP pos-deploy retornou 200 em `/home` e `/app/dashboard`.
