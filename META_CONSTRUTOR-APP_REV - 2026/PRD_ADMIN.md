# PRD_ADMIN - Reestruturacao do Admin para metricas de usuarios, marketing e uso do app

Data de criacao: 2026-05-28
Status: novo PRD operacional
Escopo principal: transformar o painel administrativo do Meta Construtor em uma area de inteligencia de usuarios, aquisicao, ativacao, engajamento, retencao, receita, suporte e governanca da plataforma.

## 1. Resumo executivo

O painel administrativo atual ja possui uma rota dedicada em `/app/admin/dashboard`, com abas para metricas, usuarios, cupons, mapa de calor e administradores. A estrutura, porem, ainda mistura indicadores operacionais de obras com indicadores de produto e marketing. O novo objetivo do Admin nao deve ser analisar a performance de uma obra especifica, mas sim entender como usuarios, organizacoes e contas usam o aplicativo, onde abandonam o funil, quais rotas geram conversao, quais recursos criam ativacao, quais planos/campanhas performam melhor e quais contas precisam de acao comercial ou suporte.

Resultado esperado:

- [ ] Novo Admin orientado a ciclo de vida do usuario, nao a obra.
- [ ] Funil completo de marketing: visita publica, CTA, cadastro, checkout, assinatura, ativacao e retencao.
- [ ] Analise de rotas publicas e autenticadas por volume, conversao, abandono e erro.
- [ ] Gestao de usuarios com segmentacao por plano, role, organizacao, status, ultima atividade e risco.
- [ ] Configuracao de usuarios e administradores com trilha de auditoria clara.
- [ ] Instrumentacao consistente entre PostHog, `analytics_events`, `user_activity` e `user_interactions`.
- [ ] Dashboards com dados reais, queries otimizadas e sem dados ficticios.
- [ ] Regras de privacidade/LGPD preservadas: eventos sem PII sensivel, acesso restrito e exportacao controlada.

## 2. Objetivo do produto Admin

O Admin deve responder perguntas de negocio, marketing e produto:

- [ ] Quantos visitantes chegam nas rotas publicas e de onde vieram?
- [ ] Quais CTAs geram cadastro, checkout ou contato?
- [ ] Onde os usuarios abandonam: landing, preco, checkout, criar conta, onboarding ou primeiro uso?
- [ ] Quais usuarios ativaram de fato o app apos cadastro?
- [ ] Quanto tempo leva ate o primeiro valor percebido?
- [ ] Quais modulos sao mais usados por papel: Presidente, Administrador, Gerente, Colaborador?
- [ ] Quais contas estao em risco de churn por inatividade?
- [ ] Quais planos, cupons, referencias e campanhas trazem usuarios com maior ativacao?
- [ ] Quais organizacoes crescem em numero de membros e uso?
- [ ] Quais rotas geram mais erro, lentidao, suporte ou abandono?
- [ ] Quais usuarios precisam de intervencao comercial, suporte ou ajuste administrativo?

## 3. Fora do escopo

- [ ] Criar um dashboard de desempenho financeiro ou fisico de cada obra.
- [ ] Otimizar cronograma, RDO, despesas ou progresso de obra como fim principal.
- [ ] Trocar precificacao sem decisao comercial aprovada.
- [ ] Expor e-mails, telefones, CPF/CNPJ ou enderecos em eventos de analytics.
- [ ] Dar acesso administrativo global para usuarios comuns da organizacao.
- [ ] Usar dados mockados para dashboards finais.

## 4. Diagnostico atual do codigo

Levantamento estatico feito nos arquivos:

- [x] `src/components/PerformanceOptimizedApp.tsx`
- [x] `src/pages/AdminDashboard.tsx`
- [x] `src/components/admin/AdminMetrics.tsx`
- [x] `src/components/admin/AdminOperationalMetrics.tsx`
- [x] `src/components/admin/AdminAcquisitionMetrics.tsx`
- [x] `src/components/admin/AdminEngagementMetrics.tsx`
- [x] `src/components/admin/AdminHealthMetrics.tsx`
- [x] `src/components/admin/AdminUsers.tsx`
- [x] `src/components/admin/AdminCoupons.tsx`
- [x] `src/components/admin/AdminManagers.tsx`
- [x] `src/components/admin/AdminHeatmap.tsx`
- [x] `src/integrations/analytics.ts`
- [x] `src/components/InteractionTracker.tsx`
- [x] `src/hooks/useUserInteraction.ts`
- [x] `src/utils/activityTracker.ts`
- [x] `docs/ANALYTICS_CATALOG.md`
- [x] migrations relacionadas a `user_activity`, `user_interactions`, `admin_users_view`, `coupons`, `referrals` e `admin_audit_logs`

### 4.1 - Rotas existentes

Rotas publicas de aquisicao e confianca:

- `/home`
- `/sobre`
- `/contato`
- `/preco`
- `/atualizacoes`
- `/carreiras`
- `/blog`
- `/legal/privacidade`
- `/legal/termos`
- `/legal/cookies`
- `/legal/lgpd`
- `/central-ajuda`
- `/documentacao`
- `/status`
- `/api`
- `/perfil/:slug`

Rotas de autenticacao e conversao:

- `/login`
- `/logout`
- `/recuperar-senha`
- `/redefinir-senha`
- `/criar-conta`
- `/auth/callback`
- `/mfa`
- `/renovar-sessao`
- `/checkout`
- `/checkout/success`
- `/checkout/cancel`

Rotas autenticadas de produto que devem virar fonte de metricas de uso:

- `/app/dashboard`
- `/app/obras`
- `/app/obras/:id`
- `/app/rdo`
- `/app/rdo/novo`
- `/app/rdo/:id/visualizar`
- `/app/atividades`
- `/app/checklist`
- `/app/checklist/:id`
- `/app/equipes`
- `/app/colaboradores`
- `/app/equipamentos`
- `/app/mais`
- `/app/documentos`
- `/app/fornecedores`
- `/app/despesas`
- `/app/relatorios`
- `/app/integracoes`
- `/app/configuracoes`
- `/app/perfil`
- `/app/notificacoes`
- `/app/feedback`
- `/app/faq`
- `/app/seguranca`
- `/app/configurar-perfil`

Rota administrativa principal:

- `/app/admin/dashboard`

Redirecionamentos legados:

- `/dashboard/*` -> `/app/dashboard`
- `/obras/*` -> `/app/obras/*`
- `/rdo/*` -> `/app/rdo/*`
- `/atividades/*` -> `/app/atividades/*`
- `/checklist/*` -> `/app/checklist/*`
- `/equipes/*` -> `/app/equipes/*`
- `/colaboradores/*` -> `/app/colaboradores/*`
- `/equipamentos/*` -> `/app/equipamentos/*`
- `/documentos/*` -> `/app/documentos/*`
- `/fornecedores/*` -> `/app/fornecedores/*`
- `/despesas/*` -> `/app/despesas/*`
- `/relatorios/*` -> `/app/relatorios/*`
- `/integracoes/*` -> `/app/integracoes/*`
- `/configuracoes/*` -> `/app/configuracoes/*`
- `/admin/dashboard` -> `/app/admin/dashboard`

### 4.2 - Admin atual

`src/pages/AdminDashboard.tsx` hoje mostra:

- Aba `Metricas`
- Aba `Usuarios`
- Aba `Cupons`
- Aba `Mapa de Calor`
- Aba `Administradores`, condicionada ao e-mail `matheusnicolas.org@gmail.com`

`AdminMetrics` hoje divide metricas em:

- `Operacional`
- `Aquisicao`
- `Engajamento`
- `Saude`

Problema central:

- [ ] `Operacional` usa `obras`, `rdos`, `expenses`, `equipamentos` e progresso de obra como primeira leitura. Isso serve para uma empresa cliente, mas nao para analise administrativa de marketing/uso da plataforma.
- [ ] `Aquisicao` usa novos usuarios em `profiles`, mas calcula conversao por criacao de RDO em uma organizacao ativa, misturando plataforma inteira com uma org especifica.
- [ ] `Engajamento` usa `user_activity`, enquanto o tracker global de rotas grava `user_interactions`. Existem duas fontes paralelas para atividades.
- [ ] `Heatmap` consulta `view_analytics_top_buttons`, `view_analytics_top_pages` e `view_analytics_top_items`, baseadas em `user_interactions`, mas poucos cliques manuais parecem instrumentados.
- [ ] `AdminUsers` consulta `admin_users_view`, enriquece por usuario com `user_credits` e `user_activity`, mas pode gerar N+1 queries por pagina.
- [x] `AdminHealthMetrics` usa placeholders como `uptime: 99.9` em vez de monitoramento real.
  RESOLVIDO: `src/components/admin/AdminHealthMetrics.tsx` nao exibe uptime inventado; a aba agora usa checks reais de leitura e a Edge Function `health-check`. Evidencia: `docs/evidence/prd-admin-p4-health-segmentation-2026-06-03.md`.
- [ ] A autorizacao mistura conceitos: a rota exige `roles={["Presidente"]}`, enquanto o componente verifica `hasRole("Administrador")`. Pela hierarquia, Presidente passa, mas o contrato fica confuso para manutencao.

### 4.3 - Fontes de dados existentes

Fontes ja presentes e relevantes:

- `profiles`: cadastro, plano, dados basicos, onboarding, referral_code.
- `orgs`: organizacoes e dono.
- `org_members`: membros, role, status, convite e entrada.
- `user_roles`: role global.
- `user_settings`: preferencias como tema.
- `subscriptions`: assinatura, status, periodo, plano.
- `plans`: planos e limites.
- `coupons`: campanhas promocionais e uso de cupom.
- `referrals`: indicacoes e bonus.
- `user_credits`: saldo e consumo indireto.
- `user_activity`: eventos nomeados como `view_dashboard`, `create_rdo`, `complete_onboarding`.
- `user_interactions`: page views, clicks, viewed items e metadata.
- `analytics_events`: catalogo padronizado com `event`, `org_id`, `user_id`, `role`, `source`, `properties`, `environment`, `request_id`, `success`, `error`.
- `admin_audit_logs`: trilha de acoes administrativas.
- PostHog via `src/integrations/analytics.ts`.

Lacunas atuais:

- [ ] Nao ha contrato unico dizendo qual fonte manda em page view, click, evento de produto e evento backend.
- [ ] `setAnalyticsSession` existe, mas precisa ser confirmado se e chamado quando usuario/org/role carregam.
- [ ] Eventos publicos anonimos de marketing nao aparecem claramente persistidos no fallback.
- [ ] UTM, ref, campanha, origem, dispositivo e landing page nao estao normalizados.
- [ ] Dados de checkout/cupom/assinatura precisam estar conectados ao funil.
- [ ] Algumas views administrativas podem nao estar protegidas/otimizadas o suficiente para leitura global.

## 5. Principios da reestruturacao

- [ ] O Admin deve olhar a plataforma inteira, com filtros por periodo, plano, role, campanha, org e rota.
- [ ] Toda metrica deve ter definicao, fonte, filtro, permissao e criterio de validacao.
- [ ] Indicadores por obra podem existir apenas como eventos de ativacao ou uso, nunca como centro do Admin.
- [ ] Cada card deve ter drill-down para usuarios, organizacoes, rotas ou eventos que explicam o numero.
- [ ] Eventos devem ser imutaveis e sem PII sensivel.
- [ ] Dados derivados devem vir de views/RPCs otimizadas, nao de N+1 queries no frontend.
- [ ] A UI deve ser densa, escaneavel e operacional, sem layout de landing page.
- [ ] Acoes perigosas em usuarios devem exigir confirmacao, motivo e registro em `admin_audit_logs`.

## 6. Nova arquitetura de informacao do Admin

### 6.1 - Visao geral

Objetivo: painel inicial para diretoria, marketing e produto.

Metricas:

- [ ] Visitantes anonimos por periodo.
- [ ] Cadastros iniciados.
- [ ] Cadastros concluidos.
- [ ] Checkouts iniciados.
- [ ] Assinaturas/trials ativados.
- [ ] Usuarios ativos diarios, semanais e mensais.
- [ ] Organizacoes ativas.
- [ ] Usuarios em risco de churn.
- [ ] Receita ou plano ativo, quando o contrato Stripe estiver confiavel.
- [ ] Eventos de erro/queda de funil.

Visualizacoes:

- [ ] Funil principal: `visita -> CTA -> cadastro -> checkout -> assinatura -> primeira ativacao -> retencao D7`.
- [ ] Cards de variacao vs periodo anterior.
- [ ] Top rotas por conversao e abandono.
- [ ] Alertas de queda de conversao, erro de checkout, aumento de churn ou queda de atividade.

### 6.2 - Aquisicao e marketing

Objetivo: entender origem e qualidade dos leads.

Metricas:

- [ ] Page views publicos por rota.
- [ ] CTR de CTA por rota e posicao.
- [ ] Taxa de clique em plano na `/preco`.
- [ ] Leads/cadastros por UTM source, medium, campaign, content e term.
- [ ] Conversao por dispositivo e viewport.
- [ ] Conversao por referencia (`ref`) e programa de indicacao.
- [ ] Desempenho de cupons por campanha.

Eventos necessarios:

- `marketing.page_view`
- `marketing.cta_clicked`
- `marketing.pricing_viewed`
- `marketing.plan_selected`
- `marketing.contact_started`
- `marketing.contact_submitted`
- `marketing.referral_landed`
- `marketing.coupon_applied`

Rotas prioritarias:

- `/home`
- `/preco`
- `/checkout`
- `/criar-conta`
- `/contato`
- `/sobre`
- `/blog`
- `/central-ajuda`
- `/documentacao`

### 6.3 - Cadastro, onboarding e ativacao

Objetivo: medir se o usuario virou usuario funcional.

Metricas:

- [ ] Cadastro iniciado.
- [ ] Cadastro concluido.
- [ ] Confirmacao/auth callback concluido.
- [ ] Login inicial.
- [ ] Perfil configurado.
- [ ] Organizacao criada ou selecionada.
- [ ] Primeiro membro convidado.
- [ ] Primeiro acesso a rota chave.
- [ ] Primeira acao de valor no app.
- [ ] Tempo ate primeira acao de valor.
- [ ] Onboarding concluido.

Eventos necessarios:

- `auth.signup_started`
- `auth.signup_completed`
- `auth.login_succeeded`
- `onboarding.profile_completed`
- `onboarding.org_ready`
- `activation.first_member_invited`
- `activation.first_core_action`
- `activation.onboarding_completed`

Observacao: uma acao como criar obra, criar RDO ou convidar colaborador pode ser usada como sinal de ativacao, mas o dashboard deve mostrar isso como comportamento do usuario/conta, nao como analise de obra.

### 6.4 - Engajamento e utilizacao do app

Objetivo: entender frequencia, profundidade e modulos usados.

Metricas:

- [ ] DAU, WAU, MAU.
- [ ] Stickiness: DAU/MAU.
- [ ] Sessao media por usuario.
- [ ] Rotas autenticadas mais acessadas.
- [ ] Modulos mais usados por role.
- [ ] Usuarios ativos por organizacao.
- [ ] Frequencia de uso por plano.
- [ ] Cliques em acoes principais.
- [ ] Uso mobile/PWA vs desktop.
- [ ] Exportacoes, downloads, convites e integracoes configuradas.

Eventos necessarios:

- `app.route_viewed`
- `app.navigation_clicked`
- `app.primary_action_clicked`
- `app.search_used`
- `app.export_started`
- `app.export_completed`
- `app.integration_viewed`
- `app.integration_connected`
- `app.notification_opened`

Rotas com tracking obrigatorio:

- `/app/dashboard`
- `/app/rdo`
- `/app/rdo/novo`
- `/app/relatorios`
- `/app/documentos`
- `/app/integracoes`
- `/app/configuracoes`
- `/app/perfil`
- `/app/equipes`
- `/app/feedback`

### 6.5 - Retencao, risco e suporte

Objetivo: identificar usuarios que precisam de intervencao.

Metricas:

- [ ] Usuarios sem login ha 7, 14 e 30 dias.
- [ ] Contas que cadastraram mas nunca ativaram.
- [ ] Contas que ativaram mas pararam de usar.
- [ ] Contas com queda brusca de eventos.
- [ ] Convites pendentes sem aceite.
- [ ] Falhas de login, reset, checkout e edge functions.
- [ ] Feedbacks enviados e status.
- [ ] Tickets/mensagens de contato, se houver.

Visoes:

- [x] Lista de risco com usuario, org, plano, ultimo evento, motivo e acao sugerida.
  EVIDENCIA: `src/components/admin/AdminRetentionMetrics.tsx` usa `admin_churn_risk_view`, enriquece org principal em lote via `org_members` e renderiza a lista reutilizavel `src/components/admin/AdminRiskList.tsx`. Evidencia: `docs/evidence/prd-admin-p1-risk-list-component-2026-06-04.md`.
- [ ] Cohorts D1, D7, D30 por plano/campanha.
  PARCIAL: `src/components/admin/AdminCohortTable.tsx` mostra cohorts D1/D7/D30 por plano a partir de `first_event_at` e `last_event_at` de `admin_user_segments_view`; o recorte por campanha permanece pendente ate a view expor atribuicao/campanha junto aos usuarios. Evidencia: `docs/evidence/prd-admin-p1-cohort-table-2026-06-06.md`.
- [ ] Retencao por primeiro recurso usado.
- [ ] Falhas por rota e por browser.

### 6.6 - Receita, planos, cupons e checkout

Objetivo: conectar marketing com monetizacao.

Metricas:

- [ ] Checkout iniciado por plano.
- [ ] Checkout concluido por plano.
- [ ] Checkout cancelado.
- [ ] Upgrade/downgrade.
- [ ] Trial iniciado.
- [ ] Trial convertido.
- [ ] Assinatura ativa, cancelada, past_due, trialing.
- [ ] Cupom usado, conversao por cupom e receita estimada.
- [ ] Receita por plano, quando Stripe estiver reconciliado.

Eventos necessarios:

- `billing.checkout_started`
- `billing.checkout_completed`
- `billing.checkout_cancelled`
- `billing.subscription_created`
- `billing.subscription_updated`
- `billing.subscription_cancelled`
- `billing.portal_opened`
- `billing.coupon_created`
- `billing.coupon_used`

### 6.7 - Usuarios e contas

Objetivo: substituir uma tabela simples por uma central de operacao de usuarios.

Filtros:

- [ ] Nome/e-mail, com cuidado para nao levar PII para eventos.
- [ ] Plano.
- [ ] Role.
- [ ] Status de assinatura.
- [ ] Status de organizacao.
- [ ] Ativo/inativo.
- [ ] Campanha/origem.
- [ ] Data de cadastro.
- [ ] Ultimo acesso.
- [ ] Risco de churn.
- [ ] Onboarding completo/incompleto.

Colunas recomendadas:

- [ ] Usuario.
- [ ] Organizacao principal.
- [ ] Plano e status.
- [ ] Role principal e roles por org.
- [ ] Origem/campanha.
- [ ] Cadastro.
- [ ] Ultimo acesso.
- [ ] Primeira ativacao.
- [ ] Eventos nos ultimos 7/30 dias.
- [ ] Convites criados/aceitos.
- [ ] Indicacoes.
- [ ] Creditos.
- [ ] Risco.

Acoes:

- [ ] Ver perfil administrativo.
- [ ] Ver timeline de eventos.
- [ ] Alterar plano, se permitido.
- [ ] Ajustar creditos, se permitido.
- [ ] Suspender/reativar.
- [ ] Enviar convite/manual follow-up, se canal existir.
- [ ] Exportar segmento.
- [ ] Registrar nota administrativa.

Todas as acoes devem:

- [ ] Exigir permissao adequada.
- [ ] Pedir motivo quando alteram acesso, plano, creditos ou status.
- [ ] Registrar `admin_audit_logs`.
- [ ] Invalidar cache/query corretamente.

### 6.8 - Organizacoes e configuracao de usuarios

Objetivo: entender contas B2B e estrutura de uso por organizacao.

Metricas:

- [ ] Organizacoes criadas por periodo.
- [ ] Organizacoes com membros ativos.
- [ ] Media de membros por org.
- [ ] Convites pendentes por org.
- [ ] Roles distribuidas por org.
- [ ] Plano por org.
- [ ] Modulos usados por org.
- [ ] Org com maior crescimento.
- [ ] Org sem atividade recente.

Requisitos:

- [ ] Admin global deve enxergar orgs sem depender de `activeOrgId` local.
- [ ] Visao da org deve mostrar membros, roles, convites, plano, assinatura e timeline resumida.
- [ ] Alteracao de role deve ser separada entre role global e role dentro da org.
- [ ] A aba `Administradores` nao deve depender apenas de e-mail fixo; deve usar permissao global clara.

### 6.9 - Rotas e usabilidade

Objetivo: transformar navegacao em mapa de produto e marketing.

Metricas:

- [x] Page views por rota.
  EVIDENCIA: `src/components/admin/AdminRouteConversionTable.tsx` consome as linhas de `admin_route_metrics_view` exibidas em `AdminRoutesMetrics`, com total de views, participacao e barra proporcional por rota.
- [x] Usuarios unicos por rota.
  EVIDENCIA: `src/components/admin/AdminRouteConversionTable.tsx` exibe usuarios unicos por rota e `views/usuario` com calculo seguro em `src/components/admin/adminRouteConversionUtils.ts`.
- [x] Tempo medio por rota.
- [x] Proxima rota mais comum.
- [x] Saida/abandono por rota.
- [x] Erros por rota.
- [x] CTA principal por rota.
- [x] Conversao por rota publica.
- [x] Rotas autenticadas sem uso.
- [x] Rotas com maior latencia percebida.

Relatorios:

- [ ] Mapa de rotas publicas.
- [ ] Mapa de rotas autenticadas.
- [ ] Caminho ate cadastro.
- [ ] Caminho ate checkout.
- [ ] Caminho ate primeira ativacao.
- [ ] Caminho ate cancelamento/inatividade.

### 6.10 - Saude, auditoria e seguranca

Objetivo: mostrar confiabilidade administrativa sem placeholders.

Metricas:

- [x] Status real de Edge Functions criticas.
- [x] Erros de checkout.
- [x] Erros de auth.
- [x] Erros de Supabase/RLS relevantes para usuarios.
- [x] Taxa de eventos com falha.
- [x] Ultima ingestao de analytics.
- [x] Acoes administrativas por admin.
- [x] Tentativas bloqueadas por permissao.

Substituicoes necessarias:

- [x] Remover `uptime: 99.9` hardcoded.
  EVIDENCIA: `AdminHealthMetrics` nao possui uptime estimado; exibe resumo operacional derivado dos checks reais executados.
- [x] Usar Sentry/Supabase logs/health-check real quando disponivel.
  EVIDENCIA: a aba Saude invoca a Edge Function `health-check` e mostra status/fila/erros Stripe retornados por ela; Sentry permanece fora por nao haver contrato local configurado neste PRD.
- [x] Diferenciar saude de produto, saude de tracking e saude operacional.
  EVIDENCIA: `AdminHealthMetrics` agora separa checks em Produto, Tracking e Operacao, com helper testavel em `src/components/admin/adminHealth.ts`.

## 7. Contrato de dados proposto

### 7.1 - Evento canonico

Todo evento administrativo/marketing/produto deve seguir o formato:

```json
{
  "event": "namespace.action",
  "created_at": "ISO-8601",
  "anonymous_id": "string-or-null",
  "user_id": "uuid-or-null",
  "org_id": "uuid-or-null",
  "role": "string-or-null",
  "route": "/path",
  "source": "frontend|backend|edge|db",
  "environment": "production|development",
  "request_id": "uuid",
  "session_id": "string-or-null",
  "utm_source": "string-or-null",
  "utm_medium": "string-or-null",
  "utm_campaign": "string-or-null",
  "referral_code": "string-or-null",
  "properties": {}
}
```

Regras:

- [ ] E-mail, telefone, CPF/CNPJ, endereco e nome completo nao entram em `properties`.
- [ ] A UI administrativa pode buscar PII para tabelas de usuarios, mas eventos de analytics nao devem gravar PII.
- [ ] Eventos anonimos devem ser conectados ao usuario apos cadastro quando possivel, sem expor dados sensiveis.
- [ ] `request_id` deve permitir rastrear frontend -> edge function -> banco.

### 7.2 - Fonte unica por tipo de dado

Decisao proposta:

- Page views e cliques: consolidar em `analytics_events` ou em view materializada derivada de `user_interactions`, mas nao manter duas leituras concorrentes.
- Eventos de produto: usar `analytics_events` como fonte canonica, com PostHog como destino externo.
- Atividade historica legada: migrar/normalizar `user_activity` para o mesmo modelo ou criar views de compatibilidade.
- Heatmap: continuar usando views, mas alimentadas por eventos canonicos e nao apenas por inserts isolados.
- Admin audit: manter em `admin_audit_logs`, separado de analytics.

## 8. Permissoes e governanca

Roles atuais:

- `Presidente`
- `Administrador`
- `Gerente`
- `Colaborador`

Problemas a resolver:

- [x] Definir se `/app/admin/dashboard` e para `Presidente`, `Administrador` global, ou ambos.
- [ ] Separar `Administrador` da organizacao de `Administrador global da plataforma`.
- [x] Registrar decisao de acesso presidencial por e-mail ate existir permissao global propria.
- [ ] Criar permissao explicita para:
  - ver metricas globais;
  - exportar usuarios;
  - alterar planos;
  - alterar creditos;
  - suspender usuarios;
  - gerir administradores;
  - criar cupons;
  - ver PII.
- [ ] Registrar todas as acoes sensiveis em `admin_audit_logs`.

Modelo sugerido:

- `platform_owner`: acesso total.
- `platform_admin`: metricas, usuarios e operacao.
- `marketing_admin`: aquisicao, campanhas, cupons e exportacao limitada.
- `support_admin`: usuarios, orgs, timeline e suporte, sem receita completa.
- `finance_admin`: planos, assinaturas e checkout.

Decisao de produto em 2026-06-01:

- O acesso ao painel de metricas fica disponivel apenas para `matheusnicolas.org@gmail.com`.
- O ponto de entrada sai do menu lateral e passa para a aba `Meu Perfil`, ao lado de `Seguranca`.
- A rota `/app/admin/dashboard` permanece protegida por autenticação e aplica redirecionamento interno para qualquer outro e-mail.
- Esta regra e uma excecao operacional solicitada pelo presidente ate a criacao de uma permissao global persistida no banco.

## 9. Plano de execucao por prioridade

### P0 - Auditoria, contrato e seguranca

- [x] Confirmar no Supabase remoto a existencia e estrutura de:
  - `profiles`
  - `orgs`
  - `org_members`
  - `user_roles`
  - `subscriptions`
  - `plans`
  - `coupons`
  - `referrals`
  - `user_activity`
  - `user_interactions`
  - `analytics_events`
  - `admin_audit_logs`
  - `admin_users_view`
  - `view_analytics_top_buttons`
  - `view_analytics_top_pages`
  - `view_analytics_top_items`
  EVIDENCIA: dump remoto `C:\tmp\prd-admin-remote-public-schema.sql` e `docs/evidence/prd-admin-p0-contract-2026-05-28.md`. Todos os objetos existem; `menu_engagement_metrics` tambem foi confirmado. Gap inicial de `analytics_events` foi corrigido pela migration `20260528120000_prd_admin_analytics_events_contract.sql`.
- [x] Mapear policies RLS de cada tabela/view administrativa.
  EVIDENCIA: `docs/evidence/prd-admin-p0-contract-2026-05-28.md` registra policies/grants relevantes para `analytics_events`, `user_activity`, `user_interactions`, `admin_audit_logs`, `coupons`, `subscriptions`, `referrals`, `profiles`, `org_members`, `user_roles`, `plans` e `orgs`.
- [x] Decidir fonte canonica de analytics.
  DECISAO: `analytics_events` sera a fonte canonica futura para Admin/marketing/produto/backend. `user_activity` e `user_interactions` ficam como fontes legadas/compatibilidade ate migration e views de consolidacao.
- [x] Corrigir divergencia entre `user_activity`, `user_interactions` e `analytics_events`.
  EVIDENCIA: `src/integrations/analytics.ts` agora persiste eventos autenticados em `analytics_events`; `src/hooks/useUserInteraction.ts` tambem emite `app.route_viewed` e `app.interaction_recorded`; `supabase/migrations/20260528133000_prd_admin_analytics_aggregation_views.sql` criou views de compatibilidade/agregacao sobre as tres fontes.
- [x] Garantir que `initAnalytics`, `setAnalyticsSession`, `resetUser` e tracking de rota estejam conectados ao ciclo de auth/org.
  EVIDENCIA: `src/components/auth/AuthContext.tsx`, `src/contexts/OrgContext.tsx`, `src/components/OptimizedLayout.tsx`.
- [x] Definir permissao global temporaria de Admin.
  EVIDENCIA: `src/utils/adminAccess.ts`, `src/pages/AdminDashboard.tsx`, `src/components/admin/AdminManagers.tsx`, `src/components/AppSidebar.tsx`, `src/components/PerformanceOptimizedApp.tsx`, `src/security/RBACMatrix.ts`. Contrato temporario revisado em 2026-06-01: acesso restrito ao e-mail presidencial `matheusnicolas.org@gmail.com` ate existir `platform_roles`.
- [x] Remover ou substituir metricas hardcoded/placeholders do Admin.
  EVIDENCIA: `src/components/admin/AdminHealthMetrics.tsx` removeu `uptime: 99.9` e passou a exibir checks reais de leitura em `profiles`, `user_activity`, `user_interactions` e `analytics_events`.
- [x] Criar catalogo atualizado de eventos em `docs/ANALYTICS_CATALOG.md`.
  EVIDENCIA: secao `Admin Metrics Restructure Notes (PRD_ADMIN P0)` adicionada com decisao canonica, fontes legadas e namespaces planejados.

### P1 - Reestruturar UI do Admin

- [x] Trocar abas atuais por nova IA:
  - Visao geral
  - Aquisicao
  - Ativacao
  - Engajamento
  - Retencao
  - Receita
  - Usuarios
  - Organizacoes
  - Rotas
  - Campanhas
  - Saude
  - Auditoria
  EVIDENCIA: `src/pages/AdminDashboard.tsx` usa a nova IA com 12 abas e remove a estrutura anterior `metricas/usuarios/cupons/heatmap/administradores`.
- [x] Remover `AdminOperationalMetrics` da primeira posicao.
  EVIDENCIA: `AdminOperationalMetrics` foi movido para a aba `Ativacao`; a primeira aba agora e `Visao geral`.
- [x] Reclassificar metricas de obra como sinais de ativacao/uso.
  EVIDENCIA: `src/components/admin/AdminOperationalMetrics.tsx` foi reposicionado e rotulado como ativacao/uso operacional.
- [x] Criar filtros globais de periodo, plano, role, campanha, origem, rota e org.
  EVIDENCIA: `src/components/admin/AdminFilters.tsx` conectado ao Admin e aplicado em Overview, Rotas, Retencao, Receita, Organizacoes e Auditoria.
- [x] Criar componentes reutilizaveis:
  - KPI card com variacao.
  - Funil.
  - Cohort table.
  - Segment table.
  - Event timeline.
  - Route conversion table.
  - Risk list.
  EVIDENCIA: criado `src/components/admin/AdminMetricCard.tsx`; criado `src/components/admin/AdminFunnel.tsx` com helper testavel `src/components/admin/adminFunnelUtils.ts` e aplicado em Visao geral/Campanhas; criado `src/components/admin/AdminEventTimeline.tsx` com helper testavel `src/components/admin/adminTimelineEvent.ts` e aplicado nos detalhes de usuario/organizacao; criado `src/components/admin/AdminRiskList.tsx` com helper testavel `src/components/admin/adminRiskUtils.ts` e aplicado em Retencao; criado `src/components/admin/AdminRouteConversionTable.tsx` com helper testavel `src/components/admin/adminRouteConversionUtils.ts` e aplicado em Rotas; criado `src/components/admin/AdminSegmentTable.tsx` com helper testavel `src/components/admin/adminSegmentUtils.ts` e aplicado em Retencao; criado `src/components/admin/AdminCohortTable.tsx` com helper testavel `src/components/admin/adminCohortUtils.ts` e aplicado em Retencao; novos paineis para overview, rotas, retencao, receita, organizacoes e auditoria. Evidencias: `docs/evidence/prd-admin-p1-funnel-component-2026-06-04.md`, `docs/evidence/prd-admin-p1-event-timeline-component-2026-06-03.md`, `docs/evidence/prd-admin-p1-risk-list-component-2026-06-04.md`, `docs/evidence/prd-admin-p1-route-conversion-table-2026-06-05.md`, `docs/evidence/prd-admin-p1-segment-table-2026-06-05.md` e `docs/evidence/prd-admin-p1-cohort-table-2026-06-06.md`.
- [ ] Garantir responsividade desktop/mobile sem perder densidade operacional.

### P2 - Instrumentacao de marketing e produto

- [x] Capturar UTM e `ref` em entrada publica.
  EVIDENCIA: `src/integrations/analytics.ts` captura `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e `ref`; validado em smoke local com `utm_campaign=prd_admin`.
- [x] Persistir `anonymous_id` e `session_id`.
  EVIDENCIA: `anonymous_id` fica em `localStorage`, `session_id` em `sessionStorage` e ambos foram adicionados a `analytics_events`.
- [x] Associar `anonymous_id` ao `user_id` no cadastro/login.
  EVIDENCIA: `setAnalyticsSession` emite `auth.user_identified` uma vez por usuario identificado, mantendo `anonymous_id`/`session_id` no payload.
- [x] Instrumentar CTAs da landing, preco, contato, checkout e criar conta.
  EVIDENCIA: `PublicMarketingTracker` captura cliques em `a`, `button` e `[role='button']` nas rotas publicas, sanitizando e-mail/telefone antes do envio.
- [x] Instrumentar page views publicos anonimos.
  EVIDENCIA: `src/components/analytics/PublicMarketingTracker.tsx` emite `app.public_page_viewed` para `/home`, `/preco`, `/checkout`, `/criar-conta` e `/contato`.
- [x] Instrumentar eventos de checkout e cupom.
  EVIDENCIA: `/checkout` emite `billing.checkout_viewed`; cliques em CTAs/cupom entram como `marketing.cta_clicked`. Eventos remotos confirmados com `utm_campaign=prd_admin_final`.
- [x] Instrumentar onboarding e primeira ativacao.
  EVIDENCIA: `Onboarding.tsx` emite `onboarding.started`, progresso, conclusao/pulo; `useRDOs.ts` emite `activation.first_rdo_created` no primeiro RDO do usuario na org.
- [x] Instrumentar rotas autenticadas com nome canonico.
  EVIDENCIA: `useUserInteraction.ts` usa `canonicalizeAuthenticatedRoute` para registrar `canonical_path` e `route_name` em page views autenticados.
- [x] Instrumentar cliques manuais relevantes para heatmap.
  EVIDENCIA: `useUserInteraction.ts` captura cliques autenticados globais em botoes, links, menuitems e `data-analytics-id`, persistindo em `user_interactions` e emitindo `app.authenticated_click`.
- [x] Criar testes para garantir que eventos nao contem PII.
  EVIDENCIA: `src/utils/analyticsPrivacy.ts` e `src/utils/__tests__/analyticsPrivacy.test.ts` validam redacao de e-mail, documentos, telefone e chaves sensiveis antes da persistencia.

### P3 - Views/RPCs administrativas

- [x] Criar views/RPCs para agregacoes de Admin, evitando N+1 no frontend.
  EVIDENCIA: criada `admin_analytics_events_unified_view` como base de compatibilidade entre `analytics_events`, `user_activity` e `user_interactions`.
- [x] Criar `admin_user_segments_view`.
- [x] Criar `admin_funnel_daily_view`.
- [x] Criar `admin_route_metrics_view`.
- [x] Criar `admin_user_activity_summary_view`.
- [x] Criar `admin_org_usage_summary_view`.
- [x] Criar `admin_campaign_performance_view`.
- [x] Criar `admin_checkout_funnel_view`.
- [x] Criar `admin_churn_risk_view`.
- [x] Criar indices por `created_at`, `user_id`, `org_id`, `event`, `route`, `session_id`.
  EVIDENCIA: indices base ja existiam para `analytics_events`, `user_activity`, `user_interactions`, `anonymous_id`, `session_id` e `utm_source`; migration `supabase/migrations/20260603193116_prd_admin_query_indexes.sql` adiciona indices idempotentes para `created_at`, rota derivada, `utm_campaign`, `utm_medium`, `ref`, `source/event/created_at`, rota legada em `user_activity` e page views em `user_interactions`. Evidencia: `docs/evidence/prd-admin-p3-query-indexes-plan-2026-06-03.md`.
- [ ] Validar plano de query antes de liberar dashboards pesados.
  PARCIAL: evidencia `docs/evidence/prd-admin-p3-query-indexes-plan-2026-06-03.md` documenta queries `EXPLAIN (ANALYZE, BUFFERS)` para staging/base real. Execucao local via Supabase CLI ficou bloqueada por `Invalid db.major_version: 17` na CLI `2.20.12`; item permanece aberto ate validar em banco populado.

### P4 - Usuarios, orgs e operacao comercial

- [x] Reestruturar `AdminUsers` para segmentos e drill-down.
  EVIDENCIA: `src/components/admin/AdminUsers.tsx` agora usa consultas em lote para usuarios, segmentos, risco, creditos, orgs, assinaturas e atribuicao de marketing; remove enriquecimento N+1 por linha.
- [x] Adicionar detalhe de usuario com:
  - perfil;
  - orgs;
  - roles;
  - plano;
  - timeline de eventos;
  - ultimos logins;
  - cupons/referrals;
  - risco;
  - auditoria de acoes administrativas.
  EVIDENCIA: detalhe implementado para perfil, orgs, roles, plano, creditos, risco, timeline recente de eventos, ultimos logins por `analytics_events`, auditoria, indicacoes por `referrer_id`/`new_user_id`, codigo/bonus de indicacao do perfil e eventos de cupom/campanha filtrados por `analytics_events.user_id`. Evidencias: `docs/evidence/prd-admin-p4-user-coupons-referrals-2026-06-02.md` e `docs/evidence/prd-admin-p4-user-detail-logins-2026-06-03.md`.
- [x] Criar detalhe de organizacao.
  EVIDENCIA: `src/components/admin/AdminOrganizationsMetrics.tsx` possui drill-down por organizacao com membros, roles, assinatura, uso e eventos recentes. Evidencia: `docs/evidence/prd-admin-p4-organization-detail-2026-06-02.md`.
- [x] Criar fluxo seguro para alterar plano/creditos.
  EVIDENCIA: `AdminUsers` mantem mutacoes administrativas de plano/creditos com registro em `admin_audit_logs`.
- [x] Criar fluxo seguro para suspender/reativar usuario.
  EVIDENCIA: `src/components/admin/AdminUsers.tsx` agora usa a Edge Function `suspend-user` com `action: "suspend"` e `action: "unsuspend"`, exige motivo no dialogo e registra a auditoria no backend como `SUSPEND_USER`/`UNSUSPEND_USER`. Evidencia: `docs/evidence/prd-admin-p4-user-reactivation-2026-06-02.md`.
- [x] Exportar CSV por segmento com limites e auditoria.
  EVIDENCIA: exportacao limita 500 linhas do segmento atual e registra `EXPORT_USERS_SEGMENT` em `admin_audit_logs`.
- [x] Criar gestao de campanhas/cupons conectada ao funil.
  EVIDENCIA: `src/components/admin/AdminCoupons.tsx` agora combina CRUD de cupons, KPIs de uso, campanhas/ref sources de `admin_campaign_performance_view`, funil diario de `admin_funnel_daily_view`, filtros globais de campanha/origem e auditoria administrativa para criar, ativar/desativar e excluir cupons. Evidencia: `docs/evidence/prd-admin-p4-campaigns-coupons-funnel-2026-06-03.md`.

### P5 - Validacao e release

- [x] Rodar `npm run lint`.
  EVIDENCIA: `npm.cmd run lint` passou em 2026-05-29 com 34 warnings existentes e 0 erros.
- [x] Rodar `npm run test`.
  EVIDENCIA: `npm.cmd run test` passou em 2026-05-29 com 8 arquivos e 27 testes.
- [x] Rodar `npm run build`.
  EVIDENCIA: `npm.cmd run build` validado em 2026-05-28 apos migrations, tipos, tracking e views.
  OBS 2026-06-02: `npm.cmd run build` foi reexecutado apos o incremento de detalhe do usuario e falhou em `src/components/NovaObraForm.tsx:319` por contrato fora do escopo do PRD_ADMIN (`DocumentosObra` nao aceita `onFilesChange`). Validacoes focadas do PRD_ADMIN passaram com `npx.cmd eslint src/components/admin/AdminUsers.tsx src/components/admin/AdminOrganizationsMetrics.tsx` e `npx.cmd tsc --noEmit --pretty false`.
  OBS 2026-06-03: `npm.cmd run build` passou apos a gestao de campanhas/cupons conectada ao funil; permanecem apenas warnings existentes de CSS `color-adjust` e import dinamico/estatico do Supabase.
  OBS 2026-06-03 P5 export: `npm.cmd run build` passou apos a validacao de exportacao/auditoria com helper testavel.
  OBS 2026-06-03 P3 indices: `npm.cmd run build` passou apos a migration de indices administrativos; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-03 P4 logins: `npm.cmd run build` passou apos adicionar ultimos logins no detalhe do usuario; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-03 P4 filtros usuarios: `npm.cmd run build` passou apos adicionar origem/campanha/ref na tabela e exportacao de usuarios; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-03 Saude admin: `npm.cmd run build` passou apos segmentar checks de Produto, Tracking e Operacao na aba Saude; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-03 P1 Event timeline: `npm.cmd run build` passou apos extrair `AdminEventTimeline` e aplicar em usuarios/organizacoes; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-04 P1 Risk list: `npm.cmd run build` passou apos extrair `AdminRiskList` e conectar a lista a `admin_churn_risk_view` + `org_members`; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-04 P1 Funnel: `npm.cmd run build` passou apos extrair `AdminFunnel` e aplicar em Visao geral/Campanhas; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-05 P1 Route conversion table: `npm.cmd run build` passou apos extrair `AdminRouteConversionTable` e aplicar em Rotas; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-05 P1 Segment table: `npm.cmd run build` passou apos extrair `AdminSegmentTable` e aplicar em Retencao; warnings remanescentes iguais aos anteriores.
  OBS 2026-06-06 P1 Cohort table: `npm.cmd run build` passou apos extrair `AdminCohortTable` e aplicar em Retencao; warnings remanescentes iguais aos anteriores.
- [x] Validar anonymous `/home`, `/preco`, `/checkout`, `/criar-conta` sem erros de console.
  EVIDENCIA: `/home`, `/preco`, `/checkout?plan=basic` e `/criar-conta` validados localmente com Playwright anonimo. Unico warning: Stripe avisa sobre HTTP local em `/checkout`, esperado fora de HTTPS.
- [x] Validar usuario comum sem acesso ao Admin.
  EVIDENCIA: `src/utils/__tests__/adminAccess.test.ts` e `docs/evidence/prd-admin-p5-access-validation-2026-06-01.md` validam negacao para usuario comum.
- [x] Validar admin autorizado com acesso ao Admin.
  EVIDENCIA: `src/utils/__tests__/adminAccess.test.ts` valida acesso ao contrato de rota pelo e-mail presidencial `matheusnicolas.org@gmail.com`.
- [ ] Validar dashboard com banco vazio, parcial e populado.
- [x] Validar ausencia de PII em eventos.
  EVIDENCIA: teste `analyticsPrivacy.test.ts` passou com 3 cenarios, e `track` sanitiza propriedades antes do PostHog e da tabela `analytics_events`.
- [x] Validar exportacao e trilha em `admin_audit_logs`.
  EVIDENCIA: exportacao de usuarios agora usa helpers testaveis em `src/components/admin/adminUsersExport.ts`; `src/components/admin/__tests__/adminUsersExport.test.ts` valida CSV, escape de aspas, limite de 500 linhas e payload de auditoria `EXPORT_USERS_SEGMENT`. Evidencia: `docs/evidence/prd-admin-p5-export-audit-validation-2026-06-03.md`.
- [x] Registrar evidencias em `docs/evidence/`.
  EVIDENCIA: `docs/evidence/prd-admin-p1-filtros-privacidade-2026-05-31.md`.

## 10. Criterios de aceite

Admin de metricas:

- [ ] O painel inicial nao usa mais progresso/orcamento de obras como KPI principal.
- [x] O funil principal mostra visitantes, cadastros, checkout, assinatura e ativacao.
  EVIDENCIA 2026-06-04: `AdminOverviewMetrics` usa `AdminFunnel` com etapas de rotas vistas/usuarios ativos, cadastros, checkout e assinaturas; `AdminCoupons` reutiliza o mesmo componente no funil comercial com eventos de cupom. Evidencia: `docs/evidence/prd-admin-p1-funnel-component-2026-06-04.md`.
- [x] Cada KPI mostra fonte, periodo e variacao.
- [x] Cada grafico suporta estado vazio, carregando e erro.
- [x] Rotas publicas e autenticadas aparecem em relatorios separados.

Usuarios:

- [x] A tabela de usuarios filtra por plano, role, status, origem, atividade e risco.
  EVIDENCIA 2026-06-03: `AdminUsers` aplica filtros locais de plano, role, status, atividade e risco, alem dos filtros globais de origem/campanha por atribuicao em `analytics_events`; exportacao inclui origem, campanha e referencia. Evidencia: `docs/evidence/prd-admin-p4-user-origin-filters-2026-06-03.md`.
- [x] O detalhe do usuario mostra timeline de eventos sem expor PII em analytics.
  EVIDENCIA 2026-06-03: detalhe consulta `analytics_events` por `user_id`, mostra evento, rota/origem, data e sessao truncada para logins; nao renderiza `properties` brutas nem consulta `auth.users` no cliente. Evidencia: `docs/evidence/prd-admin-p4-user-detail-logins-2026-06-03.md`.
- [x] Acoes administrativas registram auditoria.
- [x] Exportacao respeita permissao e registra evento/auditoria.
  EVIDENCIA 2026-06-03: contrato de CSV e payload de auditoria coberto por `adminUsersExport.test.ts`.

Marketing:

- [ ] UTMs e referencias sao capturadas e persistidas.
- [ ] `/home`, `/preco`, `/checkout`, `/criar-conta` e `/contato` possuem tracking de page view e CTA.
- [ ] Cupons mostram uso, conversao e impacto no funil.
- [ ] Referrals mostram indicacoes, conversao e qualidade de ativacao.

Governanca:

- [x] Acesso presidencial por e-mail registrado como excecao operacional solicitada.
- [x] Usuario comum nao acessa `/app/admin/dashboard`.
- [x] Admin de org nao ganha metricas globais por engano.
- [x] Eventos de analytics nao gravam e-mail, telefone, CPF/CNPJ ou endereco.
  EVIDENCIA 2026-06-03: `analyticsPrivacy.test.ts` cobre sanitizacao e o detalhe administrativo de logins usa somente campos operacionais nao sensiveis de `analytics_events`.

Performance:

- [ ] Dashboards nao executam N+1 queries por linha de usuario.
- [x] Views/RPCs possuem indices adequados.
  EVIDENCIA 2026-06-03: migration `20260603193116_prd_admin_query_indexes.sql` cobre rota/campanha/funil alem dos indices base ja existentes.
- [ ] Admin carrega em tempo aceitavel com base real.

## 11. Riscos

- [ ] Drift entre Supabase local e remoto pode fazer views antigas nao existirem em producao.
- [ ] Dados de `user_activity` e `user_interactions` podem divergir, gerando numeros contraditorios.
- [ ] Eventos anonimos podem exigir ajuste cuidadoso de RLS e privacidade.
- [ ] Admin global pode vazar dados entre organizacoes se role global e role de org nao forem separados.
- [ ] Dashboard pesado pode impactar banco se agregacoes forem feitas direto no frontend.
- [ ] PostHog pode receber eventos sem sessao se `setAnalyticsSession` nao for chamado apos auth/org.
- [ ] Uso de placeholders pode dar falsa confianca, especialmente em saude/uptime.

## 12. No-Go

Nao considerar pronto se:

- [ ] Qualquer metrica principal usa dado mockado ou hardcoded.
- [ ] Usuario comum acessa Admin.
- [ ] Eventos contem PII sensivel.
- [ ] Funil nao diferencia usuario anonimo, cadastrado, ativado e pagante.
- [ ] A tabela de usuarios faz N+1 query sem plano de otimizacao.
- [ ] Rotas publicas anonimas disparam erros 401 visiveis.
- [ ] Acoes administrativas alteram plano, creditos, role ou status sem auditoria.
- [ ] O painel continua centrado em obras em vez de usuarios e uso do app.

## 13. Comandos sugeridos para retomada

Inventario de rotas e Admin:

```powershell
rg -n "Route path=|AdminDashboard|AdminMetrics|AdminUsers|AdminHeatmap|AdminCoupons|AdminManagers" src
```

Inventario de analytics:

```powershell
rg -n "track\\(|trackActivity|user_activity|user_interactions|analytics_events|PostHog|posthog|utm|referral|coupon" src supabase docs
```

Contrato Supabase local:

```powershell
rg -n "user_activity|user_interactions|analytics_events|admin_users_view|admin_audit_logs|coupons|referrals" supabase/migrations src/integrations/supabase/types.ts
```

Validacao final:

```powershell
npm run lint
npm run test
npm run build
```

Smoke publico recomendado:

```powershell
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" https://metaconstrutor.app.br/home
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" https://metaconstrutor.app.br/preco
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" "https://metaconstrutor.app.br/checkout?plan=basic"
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" https://metaconstrutor.app.br/criar-conta
```

## 14. Registro de execucao

### 2026-05-28 - Criacao do PRD_ADMIN

- [x] Criado PRD raiz `PRD_ADMIN.md`.
- [x] Revisada a rota principal em `src/components/PerformanceOptimizedApp.tsx`.
- [x] Revisada a tela `src/pages/AdminDashboard.tsx`.
- [x] Revisados componentes atuais de Admin em `src/components/admin/`.
- [x] Revisado catalogo atual em `docs/ANALYTICS_CATALOG.md`.
- [x] Revisados trackers atuais em `src/integrations/analytics.ts`, `src/hooks/useUserInteraction.ts` e `src/utils/activityTracker.ts`.
- [x] Identificada divergencia estrutural entre metricas centradas em obras e o novo objetivo centrado em usuarios/marketing.
- [x] Identificada necessidade de fonte canonica para analytics.
- [x] Identificada necessidade de separar admin global de admin de organizacao.

### 2026-05-28 - Execucao P0 contrato e tracking basico

- [x] Gerado dump remoto do schema `public` vinculado via `npx.cmd supabase db dump --linked --schema public --file C:\tmp\prd-admin-remote-public-schema.sql`.
- [x] Confirmada existencia remota de `profiles`, `orgs`, `org_members`, `user_roles`, `subscriptions`, `plans`, `coupons`, `referrals`, `user_activity`, `user_interactions`, `analytics_events`, `admin_audit_logs`, `admin_users_view`, `menu_engagement_metrics`, `view_analytics_top_buttons`, `view_analytics_top_items` e `view_analytics_top_pages`.
- [x] Criada evidencia em `docs/evidence/prd-admin-p0-contract-2026-05-28.md`.
- [x] Confirmado gap critico: `analytics_events` remoto possui apenas `id`, `event`, `properties`, `created_at`, enquanto o catalogo espera colunas contextuais para Admin/marketing.
- [x] Decidido que `analytics_events` sera a fonte canonica futura, mantendo `user_activity` e `user_interactions` como legado/compatibilidade ate migration.
- [x] Atualizado `docs/ANALYTICS_CATALOG.md` com notas do `PRD_ADMIN P0`.
- [x] Conectado `setAnalyticsSession` e `resetUser` ao ciclo de auth em `src/components/auth/AuthContext.tsx`.
- [x] Conectado `setAnalyticsSession` ao ciclo de organizacao ativa/role em `src/contexts/OrgContext.tsx`.
- [x] Corrigido tracking de rota de RDO em `src/components/OptimizedLayout.tsx`: `/app/rdos` para `/app/rdo`.
- [x] Validado `npm.cmd run build` com sucesso apos os ajustes de codigo.
- [x] Criada e aplicada migration controlada `supabase/migrations/20260528120000_prd_admin_analytics_events_contract.sql` para enriquecer `analytics_events` remoto.
- [x] Validadas colunas, policies e indices de `analytics_events` apos aplicacao remota.
- [x] Regenerado `src/integrations/supabase/types.ts`; `analytics_events` agora existe nos tipos.
- [x] Substituida permissao de super admin baseada em e-mail por helpers em `src/utils/adminAccess.ts`.
- [x] Removidas ocorrencias de `matheusnicolas.org@gmail.com`, `isSuperAdmin` e `hasRole('Administrador')` como gate de Admin global.
- [x] Removido placeholder de uptime em `AdminHealthMetrics`; saude do Admin agora usa leituras reais de banco/tracking.
- [x] Validado `npm.cmd run build` com sucesso apos migration, tipos e ajustes de Admin.
- [x] Atualizado `track()` para gravar eventos autenticados em `analytics_events` com `request_id`, contexto de org/usuario/role e `source: frontend`.
- [x] Atualizado `useUserInteraction` para manter compatibilidade com `user_interactions` e emitir eventos canonicos `app.route_viewed` e `app.interaction_recorded`.
- [x] Criada e aplicada migration `supabase/migrations/20260528133000_prd_admin_analytics_aggregation_views.sql`.
- [x] Confirmadas no remoto as views `admin_analytics_events_unified_view`, `admin_route_metrics_view`, `admin_user_activity_summary_view`, `admin_funnel_daily_view` e `admin_user_segments_view`; todas retornaram linhas em consulta de sanidade.
- [x] Confirmados indices remotos para `user_activity` e `user_interactions`; tipos Supabase regenerados.
- [x] Validado `npm.cmd run build` com sucesso apos as views e tipos finais.

### 2026-05-28 - Execucao P1 Admin IA e views no frontend

- [x] Reestruturada `src/pages/AdminDashboard.tsx` para a nova IA: Visao geral, Aquisicao, Ativacao, Engajamento, Retencao, Receita, Usuarios, Organizacoes, Rotas, Campanhas, Saude e Auditoria.
- [x] Criados componentes de leitura administrativa usando views/tabelas reais: `AdminOverviewMetrics`, `AdminRoutesMetrics`, `AdminRetentionMetrics`, `AdminRevenueMetrics`, `AdminOrganizationsMetrics` e `AdminAuditLogs`.
- [x] Criado componente reutilizavel `AdminMetricCard`.
- [x] Reclassificado `AdminOperationalMetrics` como ativacao/uso operacional, removendo obras da primeira posicao do Admin.
- [x] Mantido `AdminManagers` dentro de Auditoria apenas para quem pode gerenciar admins.
- [x] Validado `npm.cmd run build` com sucesso apos a reestruturacao do Admin.

### 2026-05-28 - Execucao P2 atribuicao e eventos publicos

- [x] Criada via CLI a migration `supabase/migrations/20260528222800_prd_admin_marketing_attribution.sql`.
- [x] Aplicada migration remota adicionando `anonymous_id`, `session_id`, UTMs, `ref` e `referrer` em `analytics_events`.
- [x] Criada policy `analytics_events_anon_insert_public` para insert anonimo restrito a eventos publicos sem `user_id`/`org_id`.
- [x] Criadas views complementares `admin_org_usage_summary_view`, `admin_campaign_performance_view`, `admin_checkout_funnel_view` e `admin_churn_risk_view`.
- [x] Regenerado `src/integrations/supabase/types.ts` com novos campos/views.
- [x] Atualizado `src/integrations/analytics.ts` para persistir contexto anonimo/sessao/atribuicao em eventos.
- [x] Criado `src/components/analytics/PublicMarketingTracker.tsx` e conectado em `PerformanceOptimizedApp`.
- [x] Smoke local de `/home?utm_source=codex&utm_medium=smoke&utm_campaign=prd_admin&ref=qa` com Playwright: sem logs de erro, `anonymous_id` e `session_id` criados.
- [x] Validado no Supabase remoto que `app.public_page_viewed` chegou com UTM/ref e IDs anonimos.
- [x] Validado `npm.cmd run build` com sucesso apos P2.

### 2026-05-29 - Execucao P2/P5 tracking final e validacao pre-deploy

- [x] `PublicMarketingTracker` passou a emitir eventos especificos por rota publica: `marketing.pricing_viewed`, `billing.checkout_viewed`, `auth.signup_viewed`, `marketing.home_viewed` e `marketing.contact_viewed`.
- [x] `PublicMarketingTracker` passou a capturar cliques de CTA com sanitizacao de e-mail/telefone.
- [x] `setAnalyticsSession` passou a emitir `auth.user_identified` na primeira associacao de usuario autenticado com o contexto anonimo.
- [x] `vercel.json` atualizado para permitir conexoes PostHog no CSP (`app.posthog.com`, `us.i.posthog.com`, `eu.i.posthog.com`).
- [x] Smoke Playwright anonimo em `/preco`, `/checkout?plan=basic` e `/criar-conta`: sem erros de console; warning esperado do Stripe em HTTP local no checkout.
- [x] Confirmados no Supabase remoto eventos `app.public_page_viewed`, `marketing.pricing_viewed`, `billing.checkout_viewed`, `auth.signup_viewed` e `marketing.cta_clicked` com `utm_campaign=prd_admin_final`.
- [x] Validado `npm.cmd run lint`: 0 erros, 34 warnings existentes.
- [x] Validado `npm.cmd run test`: 8 arquivos e 27 testes passando.
- [x] Validado `npm.cmd run build` com sucesso.
- [x] Deploy de producao executado via `npx.cmd vercel --prod --yes`.
- [x] Vercel Inspect confirmou deployment final `dpl_5URuvifQKqP5SkDVTgXzSCF6mvde` como `Ready`.
- [x] Smoke HTTP de producao validou `/home`, `/preco`, `/checkout?plan=basic` e `/criar-conta` com `200 text/html`.

### 2026-05-31 - Execucao P1 filtros globais e P2 privacidade

- [x] Criado `AdminFilters` com periodo, plano, role, campanha, origem, rota e org.
- [x] `AdminDashboard` passou a renderizar filtros globais antes das abas administrativas.
- [x] Aplicados filtros em `AdminOverviewMetrics`, `AdminRoutesMetrics`, `AdminRetentionMetrics`, `AdminRevenueMetrics`, `AdminOrganizationsMetrics` e `AdminAuditLogs`.
- [x] Criado `analyticsPrivacy` para sanitizar PII antes de enviar eventos ao PostHog e persistir em `analytics_events`.
- [x] Criado teste de privacidade `src/utils/__tests__/analyticsPrivacy.test.ts`.
- [x] Removido residuo de `step`/modal antigo em `Checkout.tsx` que bloqueava o build, mantendo o checkout hospedado atual.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p1-filtros-privacidade-2026-05-31.md`.
- [x] Validado `npm.cmd test -- src/utils/__tests__/analyticsPrivacy.test.ts`: 1 arquivo, 3 testes passando.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.
- [x] Validado lint focado nos arquivos tocados: sem erros ou warnings.
- [x] Validado `npm.cmd run build`: build, sitemap e prerender publicos concluidos com sucesso.

### 2026-06-01 - Execucao P2 tracking autenticado e ativacao

- [x] Criado `authenticatedAnalytics` para canonicalizar rotas autenticadas, remover IDs dinamicos e sanitizar labels de interacao.
- [x] `useUserInteraction` passou a registrar page views autenticados com `canonical_path` e `route_name`.
- [x] `useUserInteraction` passou a capturar cliques autenticados globais em botoes, links, menuitems e `data-analytics-id`.
- [x] `Onboarding` passou a emitir eventos de inicio, progresso, conclusao e pulo.
- [x] `useRDOs` passou a emitir `activation.first_rdo_created` no primeiro RDO do usuario na org ativa.
- [x] Criado teste `src/utils/__tests__/authenticatedAnalytics.test.ts`.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p2-authenticated-tracking-2026-06-01.md`.
- [x] Validado `npm.cmd test -- src/utils/__tests__/authenticatedAnalytics.test.ts src/utils/__tests__/analyticsPrivacy.test.ts`: 2 arquivos, 6 testes passando.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.
- [x] Validado lint focado nos arquivos tocados: sem erros ou warnings.
- [x] Validado `npm.cmd run build`: build, sitemap e prerender publicos concluidos com sucesso.

### 2026-06-01 - Execucao P4 usuarios, segmentos e drill-down

- [x] `AdminUsers` reestruturado para segmentos, risco, atividade, orgs, plano, assinatura e creditos.
- [x] Removido padrao N+1 por linha; dados de usuarios agora sao enriquecidos por consultas em lote.
- [x] Adicionados KPIs de usuarios no recorte, ativos 7 dias, em risco e pagantes/trial.
- [x] Adicionados filtros por plano, role, atividade, risco e status, combinados aos filtros globais do Admin.
- [x] Adicionado detalhe de usuario com perfil, orgs, plano, roles, creditos, risco, timeline de eventos e auditoria administrativa.
- [x] Mantidas acoes de alterar plano, alterar creditos e suspender usuario com auditoria.
- [x] Exportacao por segmento limitada a 500 linhas e auditada via `EXPORT_USERS_SEGMENT`.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p4-users-segments-2026-06-01.md`.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.
- [x] Validado `npx.cmd eslint src/components/admin/AdminUsers.tsx`: sem erros ou warnings.
- [x] Validado `npm.cmd run build`: build, sitemap e prerender publicos concluidos com sucesso.

### 2026-06-01 - Execucao P5 validacao automatizada de acesso Admin

- [x] Criado `src/utils/__tests__/adminAccess.test.ts`.
- [x] Validado que somente `matheusnicolas.org@gmail.com` passa na regra presidencial.
- [x] Validado que `Colaborador`, `Administrador` de org e `Presidente` com e-mail diferente nao acessam `/app/admin/dashboard`.
- [x] Validado que o e-mail presidencial acessa o contrato da rota administrativa.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p5-access-validation-2026-06-01.md`.
- [x] Validado lint focado: sem erros.
- [x] Validado `npx.cmd vitest run src/utils/__tests__/adminAccess.test.ts src/components/security/__tests__/security.test.tsx`: 2 arquivos e 9 testes passando.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.

### 2026-06-02 - Execucao P4 reativacao segura de usuario

- [x] Confirmado que `suspend-user` ja possui contrato `action: "suspend" | "unsuspend"` e auditoria `SUSPEND_USER`/`UNSUSPEND_USER`.
- [x] `AdminUsers` passou a usar uma mutacao unica `changeUserAccess` para suspender e reativar.
- [x] Adicionada acao `Reativar` no menu de usuario.
- [x] Dialogo de suspensao/reativacao agora exige motivo antes de chamar a Edge Function.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p4-user-reactivation-2026-06-02.md`.
- [x] Validado lint focado em `AdminUsers`: sem erros.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.
- [x] Validado `npm.cmd run build`: build, sitemap e prerender publicos concluidos com sucesso; warnings Vite nao bloqueantes existentes.

### 2026-06-02 - Execucao P4 detalhe de organizacao

- [x] `AdminOrganizationsMetrics` passou a carregar `orgs`, `org_members`, `admin_org_usage_summary_view`, `subscriptions` e eventos recentes em lote.
- [x] Adicionado botao `Detalhe` por organizacao.
- [x] Adicionado modal com KPIs, dados base, assinatura, distribuicao de roles, membros e eventos recentes.
- [x] Registrada evidencia em `docs/evidence/prd-admin-p4-organization-detail-2026-06-02.md`.
- [x] Validado lint focado em `AdminOrganizationsMetrics`: sem erros.
- [x] Validado `npx.cmd tsc --noEmit --pretty false`: sem erros.
- [x] Validado `npm.cmd run build`: build, sitemap e prerender publicos concluidos com sucesso; warnings Vite nao bloqueantes existentes.

## 15. Proxima atividade recomendada

Continuar P3/P4/P5:

1. Validar com sessao real de admin a aba Usuarios e confirmar exportacao/auditoria em runtime.
2. Validar suspensao/reativacao em runtime com sessao presidencial e confirmar `SUSPEND_USER`/`UNSUSPEND_USER` em `admin_audit_logs`.
3. Validar visualmente a aba Organizacoes com sessao presidencial real.
4. Validar plano de query das views administrativas pesadas.

Ponto de retomada: abrir este arquivo, partir da secao P3/P4/P5, consultar as evidencias recentes em `docs/evidence/` e manter cada validacao registrada em `docs/evidence/`.
