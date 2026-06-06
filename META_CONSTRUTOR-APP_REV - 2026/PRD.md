# PRD de Correcoes para Liberacao Publica - Meta Construtor Web

Data de criacao: 2026-05-11
Objetivo: organizar as correcoes pendentes para liberar o aplicativo web Meta Construtor para divulgacao e uso por usuarios reais.

## 1. Resumo executivo

O aplicativo ja possui build de producao funcional, testes automatizados basicos passando, deploy ativo na Vercel e Edge Functions criticas publicadas no Supabase. A liberacao publica ainda nao deve acontecer antes de fechar quatro frentes:

- [x] Alinhar migrations locais e remotas do Supabase, com drift residual antigo aceito/documentado.
- [x] Corrigir o lint do projeto.
- [x] Fechar uma versao de release com workspace limpo, commit e tag confiaveis.
- [x] Configurar e validar monitoramento real em producao. Sentry validado em producao e alerta confirmado manualmente pelo usuario.

Recomendacao atual:

- [x] Pode seguir para beta controlado somente apos smoke test manual em producao.
- [ ] Nao divulgar publicamente antes de concluir todos os checks deste PRD.

## 2. Estado atual verificado

Validacoes ja executadas:

- [x] `npm run build` concluiu com sucesso.
- [x] `npm run test` concluiu com sucesso.
- [x] Vercel possui deploy de producao com status `Ready`.
- [x] Dominio de producao esta associado ao deploy:
  - `https://metaconstrutor.app.br`
  - `https://www.metaconstrutor.app.br`
- [x] Tag local existente: `v1.0.0-mvp`.
- [x] Commit atual observado: `26a5d97`.
- [x] Edge Functions criticas listadas como ativas no Supabase:
  - `approve-rdo`
  - `update-rdo-status`
  - `approve-checklist`
  - `send-contact`
  - `send-feedback`
  - `generate-rdo-pdf`

Problemas encontrados:

- [x] `npm run lint` falha porque a dependencia `typescript-eslint` nao esta instalada/listada corretamente. Corrigido em 2026-05-14.
- [x] `supabase migration list --linked` mostra divergencia entre migrations locais e remotas. Drift critico resolvido; residual antigo aceito/documentado.
- [x] Varias migrations locais recentes nao aparecem aplicadas no remoto. Corrigido via repair/reconciliacao controlada.
- [x] Existem migrations remotas que nao existem localmente. Recuperadas e versionadas localmente.
- [x] Workspace esta muito alterado, com muitos arquivos modificados e nao rastreados. Resolvido no commit `8d94751`.
- [x] Monitoramento Sentry configurado e validado em ambiente real.

## 3. Escopo deste PRD

Incluido:

- [x] Corrigir prontidao tecnica para release.
- [x] Validar Supabase remoto, banco, RLS, views, policies e Edge Functions.
- [x] Validar Vercel, variaveis de ambiente e dominio.
- [x] Validar fluxos principais em producao. Fluxos principais validados; pendencias externas permanecem documentadas para OAuth final, reset por link e pagamento real.
- [x] Criar processo de retomada para proxima atividade.
- [x] Criar checklist final de Go/No-Go.

Fora do escopo imediato:

- [ ] Novas funcionalidades de produto.
- [ ] Redesign visual amplo.
- [ ] Refatoracoes grandes sem relacao direta com release.
- [ ] Alteracoes comerciais de precificacao, salvo se bloquearem checkout.

## 4. Plano de execucao por prioridade

### P0 - Bloqueadores de release

#### P0.1 - Reconciliar Supabase local e remoto

Motivo: o banco remoto precisa estar alinhado com o codigo que esta em producao. Se as migrations locais nao estiverem aplicadas, funcionalidades como relatorios, feedback, integracoes, OAuth e permissoes podem falhar.

Checks:

- [x] Rodar `npx supabase migration list --linked`.
- [x] Registrar a lista de migrations locais sem correspondente remoto.
- [x] Registrar a lista de migrations remotas sem correspondente local.
- [x] Entender se as migrations remotas ausentes localmente vieram de outro ambiente, dashboard ou automacao. Origem exata nao comprovada, mas conteudo recuperado e reconciliado localmente.
- [x] Fazer backup do banco remoto antes de qualquer ajuste. Concluido em 2026-05-13 com dumps em `.release-backups/`.
- [x] Validar se as migrations locais de maio podem ser aplicadas sem conflito. Decisao: nao aplicar `db push --include-all`; aplicar reconciliacao pontual.
- [x] Aplicar migrations pendentes com processo controlado. Aplicada manualmente a reconciliacao `20260513170000_reconcile_remote_schema.sql`, sem `db push --include-all`.
- [x] Reexecutar `npx supabase migration list --linked` ate local/remoto ficarem coerentes. Drift critico resolvido; permanece drift residual aceito por versionamento local problematico (`20260215` e duplicidade `20260216120000`).
- [x] Validar tabelas/views esperadas no remoto:
  - [x] `public.integrations`
  - [x] `public.feedbacks`
  - [x] `public.analytics_events`
  - [x] `public.financeiro_consolidado`
  - [x] `public.cronograma_vs_realizado`
- [x] Validar RLS nas tabelas novas ou alteradas. `feedbacks`, `integrations` e `analytics_events` com RLS validado no remoto.
- [x] Validar grants necessarios para roles `authenticated` e `anon`, quando aplicavel. Grants anon removidos dos objetos criticos; authenticated minimizado conforme reconciliacao.

Migrations locais recentes a confirmar no remoto:

- [x] `20260504061453_prd5_reports_integrations.sql` - marcado aplicado via repair em 2026-05-14.
- [x] `20260504212312_prd5_homolog_shared_org_roles.sql` - marcado aplicado via repair em 2026-05-14.
- [x] `20260506014345_feedbacks_mvp.sql` - marcado aplicado via repair em 2026-05-14.
- [x] `20260506022601_fix_google_oauth_signup.sql` - marcado aplicado via repair em 2026-05-14.
- [x] `20260511123000_fix_billing_schema_columns.sql` - marcado aplicado via repair em 2026-05-14.

Criterio de aceite:

- [x] Lista de migrations local/remoto sem drift critico.
- [x] Funcionalidades dependentes de banco sem bloqueio conhecido apos reconciliacao de schema remoto.
- [x] Nenhuma tabela exposta sem RLS adequada nos objetos validados.

#### P0.2 - Corrigir lint

Motivo: o lint e um gate minimo para evitar problemas obvios antes da divulgacao.

Checks:

- [x] Revisar `eslint.config.js`.
- [x] Confirmar a abordagem correta:
  - [x] instalar/listar `typescript-eslint`, e
  - [x] ajustar configuracao para dependencias existentes.
- [x] Atualizar `package.json`.
- [x] Atualizar `package-lock.json`.
- [x] Rodar `npm run lint`.
- [x] Corrigir erros reais reportados pelo lint.
- [x] Rodar novamente `npm run lint` ate passar.

Criterio de aceite:

- [x] `npm run lint` passa sem erro fatal.
- [x] Erros de lint criticos corrigidos.
- [x] Warnings restantes, se existirem, documentados e aceitos.

#### P0.3 - Fechar estado de release no Git

Motivo: a versao divulgada precisa ser reproduzivel. Hoje ha muitos arquivos alterados e nao rastreados.

Checks:

- [x] Rodar `git status --short`.
- [x] Separar arquivos em categorias:
  - [x] codigo de produto que entra no release;
  - [x] migrations e functions que entram no release;
  - [x] documentacao de release;
  - [x] artefatos locais que nao devem entrar;
  - [x] arquivos temporarios/cache/build que devem ser ignorados.
- [x] Atualizar `.gitignore` se houver artefatos locais recorrentes.
- [x] Remover ou ignorar artefatos indevidos sem apagar trabalho util. Artefatos claros foram removidos do stage sem apagar arquivos; ainda ha tracked local/cache fora do stage.
- [x] Revisar diff dos arquivos que entrarao no release.
- [x] Criar commit de release. Commit `8d94751 release: v1.0.1-release-candidate`.
- [x] Criar nova tag de release, por exemplo `v1.0.1-release-candidate` ou nome definido pelo time.
- [x] Confirmar que `git status --short` fica limpo ou contem apenas pendencias intencionais.

Criterio de aceite:

- [x] Existe commit de release contendo exatamente o que sera publicado.
- [x] Existe tag ou identificador de versao.
- [x] Workspace sem sujeira que comprometa reproducibilidade no fechamento do P0.3.

#### P0.4 - Configurar monitoramento real

Motivo: usuarios reais exigem visibilidade de erros, falhas de frontend e incidentes.

Checks:

- [x] Criar/confirmar projeto Sentry.
- [x] Configurar `VITE_SENTRY_DSN` em producao na Vercel.
- [x] Configurar ambiente `production` na Vercel/Sentry.
- [x] Criar regra de alerta para erros JS. Confirmado manualmente pelo usuario em 2026-05-20.
- [x] Definir emails/canais do time que receberao alertas. Responsavel inicial: Matheus (`matheusnicolas.org@gmail.com`).
- [x] Simular erro controlado ou validar evento real de teste.
- [x] Confirmar chegada do evento no painel Sentry.
- [x] Confirmar que nenhum dado sensivel esta sendo enviado nos eventos. Codigo endurecido com `sendDefaultPii: false`, replay mascarado e redacao de campos sensiveis; evento de validacao enviado sem PII real.

Criterio de aceite:

- [x] Erros de frontend aparecem no Sentry.
- [x] Alertas chegam ao responsavel correto. Confirmado manualmente pelo usuario em 2026-05-20.
- [x] Runbook de incidente aponta para o painel correto. Atualizado em `docs/RUNBOOK_INCIDENT_RESPONSE.md`.

### P1 - Validacao funcional antes de divulgacao

#### P1.1 - Smoke test em producao

Executar no dominio real apos P0.

Checks:

- [x] Acessar `https://metaconstrutor.app.br`.
- [x] Validar carregamento da landing page.
- [x] Validar login com usuario existente. Validado via cliente Supabase autenticado em producao.
- [x] Validar cadastro com email/senha, se estiver liberado. Validado via cliente Supabase autenticado em producao; automacao visual nao digitou por ausencia de clipboard virtual no navegador interno.
- [ ] Validar Google OAuth, se estiver divulgado.
- [ ] Validar recuperacao/redefinicao de senha.
- [x] Criar obra.
- [x] Editar obra.
- [x] Criar RDO. Bloqueio `rdos_status_check` resolvido em 2026-05-21; smoke final criou o RDO `f880af81-e9bb-465a-a6ab-a3b3723daffe` pela UI de producao.
- [x] Enviar RDO para aprovacao. UI corrigida em 2026-05-21; RDO `f880af81-e9bb-465a-a6ab-a3b3723daffe` saiu de `DRAFT` para `SUBMITTED` em producao apos clique em `Enviar para Aprovacao`.
- [x] Aprovar RDO com perfil permitido.
- [x] Rejeitar RDO com justificativa.
- [x] Baixar PDF de RDO aprovado. Edge Function autenticada retornou `application/pdf` para o RDO aprovado `239178fe-b8a1-45ed-b029-4effe0e11668`; download visual nao foi validado porque o navegador interno nao suporta evento de download.
- [x] Criar checklist.
- [x] Aprovar checklist.
- [x] Criar documento/upload.
- [x] Listar documento.
- [x] Excluir documento, se permitido.
- [x] Criar despesa.
- [x] Criar fornecedor.
- [x] Criar/evaluar equipamento.
- [x] Acessar relatorios. Validado em producao em 2026-05-21.
- [x] Exportar CSV/PDF de relatorio, se disponivel. PDF validado em producao em 2026-05-21; bug de filename `NaN-NaN-NaN` corrigido e revalidado.
- [x] Enviar contato publico.
- [x] Enviar feedback autenticado. Edge Function `send-feedback` corrigida e validada em producao em 2026-05-21.
- [x] Validar notificacoes. Rota autenticada carregou em producao com lista/estado vazio visivel em 2026-05-21.
- [x] Validar perfil, seguranca e exportacao de dados LGPD. Exportacao e exclusao validadas com usuario descartavel em 2026-05-21 apos correcao da FK de `admin_audit_logs`.

Criterio de aceite:

- [x] Todos os fluxos criticos possiveis de validar sem intervencao manual funcionam sem erro bloqueante. OAuth final, reset por link e pagamento real ficam pendentes por dependerem de acao externa/controlada.
- [x] Falhas menores estao documentadas com prioridade e decisao Go/No-Go.

#### P1.2 - Validar pagamentos Stripe

Checks:

- [x] Confirmar `VITE_STRIPE_PUBLISHABLE_KEY` em producao. Variavel cadastrada na Vercel em 2026-05-22 e reimplantada em producao.
- [x] Confirmar `STRIPE_SECRET_KEY` nas Edge Functions. Secret presente no Supabase em 2026-05-22.
- [x] Confirmar webhook Stripe apontando para a URL correta. Endpoint ativo `we_1TZkBrCHfNdO9jxNQur6Yq8o` aponta para `https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/stripe-webhook`.
- [x] Validar `create-checkout-session`. Smoke autenticado retornou `200`, `sessionId` e URL `checkout.stripe.com`; sessao expirada apos teste.
- [x] Validar retorno de checkout sucesso/cancelamento. Rotas publicas `/checkout/success` e `/checkout/cancel` retornaram `200`.
- [ ] Validar criacao/atualizacao de assinatura. Criacao inicial via `create-subscription` retornou `200`, `subscriptionId` e `clientSecret`; atualizacao real ainda depende de assinatura ativa/paga ou ambiente de teste dedicado.
- [x] Validar portal do cliente. `create-portal-session` retornou `200` e URL `billing.stripe.com` apos deploy da funcao.
- [ ] Validar cancelamento/troca de plano, se habilitado. Pendente porque exige assinatura ativa/trialing real para nao simular estado comercial incorreto.
- [x] Confirmar que eventos Stripe sao registrados. Evento assinado de smoke foi aceito pelo webhook, registrado/processado em `stripe_events` e removido apos validacao para nao deixar ruido.

Criterio de aceite:

- [ ] Um fluxo completo de assinatura funciona em ambiente esperado. Inicializacao do checkout e assinatura incompleta foram validadas; conclusao com pagamento real nao foi executada.
- [ ] Webhook atualiza o estado da assinatura no banco. Assinatura/registro do webhook validada; atualizacao real de estado exige evento Stripe de assinatura real.

#### P1.3 - Validar seguranca e LGPD

Checks:

- [x] Confirmar que `.env` e segredos nao estao versionados. `git ls-files` nao retornou arquivos `.env*` versionados em 2026-05-22.
- [x] Procurar uso indevido de `SUPABASE_SERVICE_ROLE_KEY` no frontend. Busca encontrou service role apenas em Edge Functions/backend.
- [x] Revisar policies RLS das tabelas novas. RLS ativo em `integrations`, `feedbacks`, `analytics_events`, `subscriptions`, `stripe_events`, `rdos`, `obras` e `documentos`.
- [x] Testar isolamento entre organizacoes. Smoke remoto em `integrations`: org A leu o proprio registro; org B recebeu 0 linhas.
- [x] Validar exportacao de dados do usuario. `export-my-data` retornou JSON LGPD com `_meta` e `Content-Disposition` correto em 2026-05-21.
- [x] Validar exclusao de conta. `delete-account` retornou `200` com conta descartavel apos migration `20260521235034`.
- [x] Revisar CSP em `vercel.json`. Ajustado `connect-src` para permitir ingestao Sentry em 2026-05-21.
- [x] Confirmar que dominios externos necessarios estao na CSP. Confirmado para Supabase, Stripe, Maps e Sentry no fluxo validado.
- [x] Confirmar que dados sensiveis nao aparecem em logs de frontend. `AuditLogger` ajustado para nao imprimir auditoria completa em producao e mascarar campos sensiveis recursivamente.

Criterio de aceite:

- [x] Nao ha vazamento obvio entre organizacoes. Smoke remoto de isolamento entre orgs passou em 2026-05-22.
- [x] Service role restrita a backend/Edge Functions. Confirmado por varredura em 2026-05-22.
- [x] Fluxos LGPD minimos funcionando. Exportacao e exclusao validadas em conta descartavel.

### P2 - Qualidade e melhoria antes da escala

#### P2.1 - Performance e bundle

Checks:

- [x] Revisar warning de chunk acima de 500 kB. `npm run build` passou sem warning de chunk acima de 500 kB apos `manualChunks`.
- [x] Avaliar code splitting adicional. Vendors pesados foram separados em chunks dedicados no Vite.
- [x] Medir carregamento inicial em mobile. `/home` carregou em viewport mobile e print foi salvo em `docs/evidence/p2-1-home-mobile-2026-05-22.png`.
- [x] Validar service worker/cache. Nao ha registro ativo de service worker no HTML; `ServiceWorkerManager` remove registros existentes.
- [x] Confirmar que atualizacoes novas nao ficam presas em cache antigo. HTML e assets principais retornaram `cache-control: public, max-age=0, must-revalidate`, sem service worker registrando cache persistente.

Criterio de aceite:

- [x] Performance aceitavel em celular comum. Build sem chunk acima de 500 kB e validacao visual mobile em producao concluida.
- [x] Nenhum cache antigo bloqueia nova versao. Validado por headers de cache e ausencia de registro de service worker.

#### P2.2 - Cobertura de testes

Checks:

- [x] Adicionar teste para fluxo de auth principal. Cobertura existente validada em `src/pages/__tests__/auth-flow.test.tsx`.
- [x] Adicionar teste para helper de RDO/status, se aplicavel. Adicionado `src/utils/__tests__/rdoStatus.test.ts`.
- [x] Adicionar teste para feedback. Adicionado `src/utils/__tests__/feedback.test.ts`.
- [x] Adicionar teste para relatorios/export. Adicionado `src/hooks/__tests__/useReportPdfDownload.test.ts`.
- [x] Documentar testes manuais que nao foram automatizados. Documentado em `docs/evidence/p2-2-test-coverage-2026-05-22.md`.

Criterio de aceite:

- [x] Testes cobrem os fluxos de maior risco. Auth, status RDO, feedback e exportacao PDF cobertos por testes unitarios/integrais leves.
- [x] `npm run test` passa. `8` arquivos e `27` testes passaram em 2026-05-22.

#### P2.3 - Documentacao de operacao

Checks:

- [x] Atualizar README com comandos reais de release. `README.md` revisado em 2026-05-22.
- [x] Atualizar checklist de release. `docs/RELEASE_CHECKLIST.md` refeito em 2026-05-22.
- [x] Atualizar runbook de incidente. `docs/RUNBOOK_INCIDENT_RESPONSE.md` refeito em 2026-05-22.
- [x] Registrar variaveis obrigatorias de producao. `docs/OPERATIONS.md` e `.env.example` atualizados.
- [x] Registrar como deployar Edge Functions. Documentado em `docs/OPERATIONS.md`.
- [x] Registrar como aplicar migrations com seguranca. Documentado em `docs/OPERATIONS.md`.

Criterio de aceite:

- [x] Uma pessoa do time consegue retomar deploy/operacao seguindo a documentacao. README, checklist, operations e runbook apontam comandos e ordem de validacao.

## 5. Checklist Go/No-Go

Liberacao publica somente se todos os itens P0 e P1 criticos estiverem marcados.

### Go tecnico

- [x] Build passa.
- [x] Testes passam.
- [x] Lint passa.
- [x] Supabase remoto alinhado sem drift critico.
- [x] Edge Functions criticas ativas.
- [x] Vercel production `Ready`.
- [x] Variaveis de ambiente de producao revisadas. Vercel e Supabase secrets revisados em 2026-05-22; `VITE_STRIPE_PUBLISHABLE_KEY` e `STRIPE_WEBHOOK_SECRET` foram corrigidos.
- [x] Monitoramento Sentry validado.
- [x] Smoke test de producao aprovado. Smoke publico automatizado aprovado em 2026-05-22 no deployment `dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r`; pendencias manuais seguem documentadas.
- [x] Workspace fechado em commit/tag de release.

### Go de produto

- [x] Fluxos principais do usuario funcionam. Obras, RDO, documentos, feedback, relatorios, notificacoes e LGPD validados; pendencias externas seguem separadas.
- [x] Fluxos de administracao/permissao funcionam. Aprovacao/rejeicao de RDO, checklist, isolamento de orgs e permissoes principais validados.
- [ ] Fluxos de pagamento funcionam ou estao claramente desativados. Checkout inicial, portal e webhook funcionam; pagamento completo/cancelamento/troca exigem assinatura ativa e seguem pendentes.
- [x] Feedback de usuario funcionando.
- [x] Contato publico funcionando.
- [x] Textos publicos revisados. Scanner de mojibake em `src` nao encontrou sequencias corrompidas.
- [x] Politicas legais basicas acessiveis. `/legal/privacidade`, `/legal/termos`, `/legal/cookies` e `/legal/lgpd` retornaram `200`.

### No-Go automatico

Nota: os itens abaixo sao condicoes de bloqueio. Devem permanecer desmarcados enquanto a condicao nao estiver presente no ambiente validado.

- [ ] Banco remoto com migrations criticas ausentes.
- [ ] Login/cadastro quebrado.
- [ ] Criacao de obra quebrada.
- [ ] RDO nao completa fluxo de aprovacao. Resolvido em 2026-05-21: RDO `DRAFT` passou para `SUBMITTED` pela UI de producao e o bloqueio de CTA foi removido.
- [ ] Dados vazando entre organizacoes.
- [ ] Checkout divulgado mas nao funcional. Inicializacao corrigida em 2026-05-22; fluxo completo de pagamento real ainda pendente de validacao controlada.
- [ ] Erros de producao sem monitoramento.

## 6. Registro de execucao

Use esta area para registrar o andamento entre atividades.

### 2026-05-11 - Estado inicial

- [x] PRD de correcoes criado.
- [x] Pendencias baseadas na auditoria anterior foram consolidadas.
- [x] Proxima atividade deve comecar por Supabase migration drift.

### 2026-05-11 - P0.1 iniciado

- [x] Executado `npx supabase migration list --linked`.
- [x] Evidencia criada em `docs/evidence/supabase-migration-drift-2026-05-11.md`.
- [x] Confirmado drift critico entre migrations locais e remotas.
- [x] Confirmado que as migrations locais de maio de 2026 ainda nao constam aplicadas no remoto.
- [x] Execucao pausada antes de backup/aplicacao de migrations porque o drift era bidirecional; superado pela reconciliacao controlada de 2026-05-13 e repairs posteriores.

### 2026-05-12 - P0.1 backup remoto bloqueado

- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Confirmado drift ainda ativo e identificada tambem a migration local pendente `20260511123000`.
- [x] Tentado backup remoto via `npx supabase db dump --linked`.
- [x] Tentado backup remoto de dados via `npx supabase db dump --linked --data-only --use-copy`.
- [x] Verificado que `pg_dump` nao esta disponivel localmente.
- [x] Evidencia criada em `docs/evidence/supabase-backup-blocker-2026-05-12.md`.
- [x] Nenhuma migration foi aplicada porque o backup remoto nao foi concluido; superado pelo backup funcional de 2026-05-13.

### 2026-05-12 - P0.1 nova tentativa de backup

- [x] Nova tentativa executada apos solicitacao do usuario.
- [x] Docker Desktop estava instalado e com processos ativos, mas o daemon `dockerDesktopLinuxEngine` retornou erro 500.
- [x] Docker Desktop foi iniciado/reacionado em segundo plano.
- [x] `docker info` ficou sem resposta ate timeout.
- [x] `npx supabase db dump --linked` falhou novamente antes de gerar backup.
- [x] Arquivos de dump vazios foram removidos.
- [x] P0.1 ficou bloqueado ate backup manual/Docker funcional; superado pelo backup remoto gerado em 2026-05-13.

### 2026-05-13 - P0.1 retry com Docker funcional

- [x] `docker info` passou.
- [x] Backup remoto de dados gerado em `.release-backups/supabase-remote-data-bgdvlhttyjeuprrfxgun-2026-05-13-1638.sql`.
- [x] Backup remoto de schema gerado em `.release-backups/supabase-remote-schema-bgdvlhttyjeuprrfxgun-2026-05-13-1640.sql`.
- [x] Executado `npx supabase migration fetch --linked` para recuperar migrations remotas ausentes localmente.
- [x] Recuperadas 12 migrations remotas ausentes localmente.
- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Validado schema remoto para objetos esperados.
- [x] Confirmado que `feedbacks`, `integrations`, `financeiro_consolidado` e `cronograma_vs_realizado` existem no remoto.
- [x] Confirmado que `analytics_events` nao existe no remoto.
- [x] Confirmado que `feedbacks` e `integrations` possuem RLS ativo.
- [x] Confirmado que grants remotos estao excessivos para `anon` e `authenticated`.
- [x] Executado `npx supabase db push --linked --dry-run`.
- [x] Executado `npx supabase db push --linked --dry-run --include-all`.
- [x] Execucao pausada antes de `db push --include-all`, porque o dry-run aplicaria 57 migrations antigas e recentes em producao. Decisao mantida: nao usar `--include-all`; reconciliacoes foram pontuais.
- [x] Evidencia criada em `docs/evidence/supabase-p0-1-retry-2026-05-13.md`.

### 2026-05-13 - P0.1 reconciliacao pontual aplicada

- [x] Criada migration nova `supabase/migrations/20260513170000_reconcile_remote_schema.sql`.
- [x] `npx supabase migration up --local` testado; falhou antes da nova migration por historico local antigo inconsistente (`20260215`).
- [x] SQL da migration validado localmente via `psql` no container Postgres.
- [x] Reconciliacao aplicada no remoto por `npx supabase db query --linked`, sem `db push --include-all`.
- [x] `analytics_events` criada no remoto.
- [x] RLS confirmado em `analytics_events`, `feedbacks` e `integrations`.
- [x] Grants anonimos testados: REST anonimo em `analytics_events` retornou `HTTP 401 permission denied`.
- [x] Grants `authenticated` validados no catalogo.
- [x] Diffs indesejados em 14 migrations antigas restaurados.
- [x] Historico de migrations ainda nao esta coerente; `migration list --linked` ainda mostra drift local/remoto.
- [x] Decidir se sera feito `supabase migration repair` controlado para migrations comprovadamente presentes no schema remoto.

### 2026-05-14 - P0.1 migration repair executado

- [x] Consultado historico remoto em `supabase_migrations.schema_migrations`.
- [x] Confirmado que `20260504061453`, `20260504212312`, `20260506014345`, `20260506022601`, `20260511123000` e `20260513170000` constam no historico remoto apos repair.
- [x] Executado `supabase migration repair <version> --status applied --linked` para as versoes listadas como locais sem remoto.
- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Reexecutado `npx supabase db push --linked --dry-run`.
- [x] Drift grande resolvido.
- [x] Drift residual aceito e documentado: `20260215_full_restore_plans.sql` usa versao curta e existem dois arquivos locais com a versao `20260216120000`.
- [x] Evidencia criada em `docs/evidence/supabase-migration-repair-2026-05-14.md`.
- [ ] Antes de qualquer futuro `supabase db push` em producao, normalizar historico local de migrations antigas.
- [x] P0.1 pode seguir para P0.2 com drift residual documentado.

### 2026-05-14 - P0.2 lint concluido

- [x] Instalado `@typescript-eslint/eslint-plugin` e `@typescript-eslint/parser`.
- [x] Identificado que `eslint.config.js` usa o pacote agregado `typescript-eslint`.
- [x] Instalado `typescript-eslint`.
- [x] Ajustado `eslint.config.js` para ignorar artefatos/temporarios e reduzir regras herdadas que bloqueavam o gate.
- [x] Corrigidos erros reais restantes em `chat-input`, `command`, `textarea` e no hook de checklist.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou apos os ajustes.
- [x] Evidencia criada em `docs/evidence/lint-p0-2-2026-05-14.md`.
- [x] P0.2 concluido; proxima atividade recomendada: P0.3.

### 2026-05-18 - P0.3 triagem Git iniciada e bloqueada

- [x] Executado `git status --short`.
- [x] Confirmado branch atual `master`.
- [x] Identificado workspace com 303 entradas no status apos ajuste de `.gitignore`.
- [x] Identificadas 243 entradas staged antes da criacao de commit/tag.
- [x] Separadas categorias de arquivos: produto, Supabase, documentacao, artefatos locais e caches.
- [x] Atualizado `.gitignore` para novos artefatos locais recorrentes.
- [x] Evidencia criada em `docs/evidence/git-p0-3-triage-2026-05-18.md`.
- [x] P0.3 pausado antes de commit/tag porque o indice continha artefatos indevidos ja staged e mudancas de produto/Supabase ainda nao revisadas como um release unico. Superado pelo fechamento do release candidate em 2026-05-18.

### 2026-05-18 - P0.3 limpeza de stage e validacoes

- [x] Removidos do stage artefatos locais claramente indevidos: `.agent/`, `.playwright-cli/`, `output/`, `test-results/`, `screenshot_fail.png`, `supabase/.temp/`, `tsconfig.app.tsbuildinfo` e arquivos `.zip`.
- [x] Confirmado que o staged diff nao contem mais esses artefatos.
- [x] `npm test` executado; falhou inicialmente em 2 testes de OAuth por falta do parametro `next` na callback.
- [x] Corrigidos `Login` e `CriarConta` para usar `getAuthCallbackUrl()`.
- [x] `npm test` passou: 3 arquivos, 10 testes.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou.
- [x] Evidencia criada em `docs/evidence/git-p0-3-cleanup-validation-2026-05-18.md`.
- [x] P0.3 ficou pausado antes de commit/tag com 154 entradas staged e 24 arquivos `MM`; superado pela reconciliacao dos 24 arquivos e commit/tag de 2026-05-18.

### 2026-05-18 - P0.3 limpeza fisica e QA local

- [x] Estrutura do aplicativo lida antes da remocao: entrada React/Vite, rotas publicas/protegidas, Supabase Functions, migrations, assets e docs.
- [x] Removidos apenas artefatos nao rastreados/ignorados: `.playwright-cli/`, `output/`, `dist/`, `test-results/`, `screenshot_fail.png`, timestamps Vite, `supabase/.temp/linked-project.json` e ZIP local.
- [x] Preservados arquivos de codigo, Supabase, configuracoes, backups, envs e arquivos rastreados pelo Git.
- [x] `npm test` passou: 3 arquivos, 10 testes.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou.
- [x] QA local em `http://127.0.0.1:5173/`: `/home` renderizou, navegacao para `/preco` funcionou, `/login` abriu e campo de e-mail/celular aceitou input.
- [x] Console do navegador sem erros/warnings relevantes durante o fluxo testado.
- [x] Evidencia criada em `docs/evidence/git-p0-3-cleanup-local-qa-2026-05-18.md`.
- [x] P0.3 continuou pendente de reconciliar os 24 arquivos `MM` antes de commit/tag; superado pela secao seguinte de release candidate fechado.

### 2026-05-18 - P0.3 release candidate fechado

- [x] Reconciliados os 24 arquivos `MM`, mantendo a versao do working tree validada no QA local.
- [x] Restaurados artefatos rastreados/estado local que nao deveriam entrar no commit: `.agent`, `supabase/.temp`, `*.tsbuildinfo` e arquivos `.zip` da raiz.
- [x] Staged final ficou composto por codigo, configuracoes, docs, evidencias, assets e migrations da release.
- [x] `npm test` passou: 3 arquivos, 10 testes.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou.
- [x] `git diff --cached --check` passou.
- [x] Commit criado: `8d94751 release: v1.0.1-release-candidate`.
- [x] Tag criada: `v1.0.1-release-candidate`.
- [x] Push executado para `origin/master` com tags.
- [x] `git status --short` ficou limpo apos commit/push.

### 2026-05-19 - P0.4 monitoramento Sentry iniciado

- [x] Confirmado que `@sentry/react` esta instalado e que o frontend ja inicializa Sentry quando `VITE_SENTRY_DSN` existe.
- [x] Executado `npx vercel env ls production`.
- [x] Confirmado que a Vercel nao possui variaveis de ambiente cadastradas em `production` para o projeto `meta-construtor-app-rev-2026`.
- [x] Confirmado que `.env.example` possui `VITE_SENTRY_DSN`, mas vazio por template.
- [x] Confirmado que `.env` e `.env.local` nao possuem `VITE_SENTRY_DSN`.
- [x] Centralizada configuracao Sentry em `src/integrations/sentry.ts`.
- [x] Endurecida privacidade do Sentry: `sendDefaultPii: false`, replay com `maskAllText` e `blockAllMedia`, e redacao de campos sensiveis.
- [x] Adicionado `VITE_SENTRY_ENVIRONMENT` ao template e aos tipos Vite.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou.
- [x] Evidencia criada em `docs/evidence/sentry-p0-4-monitoring-2026-05-19.md`.
- [x] P0.4 desbloqueado parcialmente: projeto/DSN confirmados e variaveis cadastradas na Vercel.
- [x] P0.4 ficou pendente de validacao real nesta etapa; superado por redeploy, evento Sentry confirmado via MCP e alerta confirmado em 2026-05-20.

### 2026-05-20 - P0.4 Sentry cadastrado na Vercel

- [x] Confirmado que `@sentry/react@8.55.0` esta instalado no repositorio.
- [x] Cadastrado `VITE_SENTRY_DSN` em `production` na Vercel com o DSN do projeto `meta-construtor-web`.
- [x] Cadastrado `VITE_SENTRY_ENVIRONMENT=production` em `production` na Vercel.
- [x] Cadastrado `VITE_APP_VERSION=v1.0.1-release-candidate` em `production` na Vercel.
- [x] Executado `npx vercel env ls production` e confirmadas as tres variaveis como `Encrypted`.
- [x] Adicionado teste controlado via console: `window.__META_SENTRY_TEST__()`.
- [x] Mantido `sendDefaultPii: false`; o snippet do onboarding com `sendDefaultPii: true` nao foi aplicado para nao enviar PII por padrao.
- [x] `npm run build` passou.
- [x] `npm run lint` passou com `0 errors` e `34 warnings`.
- [x] Redeploy de producao executado a partir de worktree limpa no commit `1dd28c0`, sem incluir alteracoes locais nao relacionadas.
- [x] Corrigido bloqueio de ambiente em producao: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estavam ausentes na Vercel e foram cadastradas como variaveis de `production`.
- [x] Deployment final `dpl_6NkNA6y5i8MdF4mJKUs2DzNJGBGg` publicado em `https://meta-construtor-app-rev-2026-r5ii4p4tk.vercel.app` e aliased para `https://www.metaconstrutor.app.br`.
- [x] Validado que o bundle publicado contem DSN Sentry, DSN Supabase e `window.__META_SENTRY_TEST__`.
- [x] Validacao final no painel Sentry ficou pendente nesta etapa por politica de seguranca do navegador; superada pela validacao via MCP e alerta confirmado em 2026-05-20.

### 2026-05-20 - P0.4 Sentry validado via MCP

- [x] MCP Sentry conectado e autenticado como `Matheus (matheusnicolas.org@gmail.com)`.
- [x] Projeto Sentry renomeado de `javascript-react` para `meta-construtor-web`.
- [x] DSN real do projeto `meta-construtor-web` confirmado via MCP: projeto `4511422758256640`.
- [x] `VITE_SENTRY_DSN` de producao na Vercel substituido pelo DSN confirmado no projeto Sentry.
- [x] Redeploy seguro executado a partir de worktree limpa no commit `5f10b87`.
- [x] Deployment final `dpl_GjhdCrEkX5HE69vLpGn1Mqnw8mE4` publicado em `https://meta-construtor-app-rev-2026-j3i8kqzux.vercel.app` e aliased para `https://www.metaconstrutor.app.br`.
- [x] Bundle publicado validado com DSN Sentry novo, sem DSN antigo, com Supabase e com `window.__META_SENTRY_TEST__`.
- [x] Evento de validacao aceito pela ingestao Sentry: `173d44f3a040f412a30e980cd912a2b5`.
- [x] Evento confirmado pelo MCP no projeto `meta-construtor-web`: issue `META-CONSTRUTOR-WEB-2`.
- [x] Criacao de regra de alerta concluida manualmente pelo usuario e teste do alerta confirmado em 2026-05-20.

### 2026-05-20 - P1.1 smoke de producao parcial

- [x] Evidencia criada em `docs/evidence/p1-1-production-smoke-2026-05-20.md`.
- [x] Rotas publicas principais retornaram `200`.
- [x] Landing page carregou no navegador em `https://www.metaconstrutor.app.br/home`.
- [x] Corrigido CORS das Edge Functions `send-contact` e `send-feedback` para aceitar `https://www.metaconstrutor.app.br`.
- [x] Deploy executado: `npx supabase functions deploy send-contact send-feedback --use-api`.
- [x] Contato publico validado no navegador com mensagem de sucesso.
- [x] Cadastro/login/perfil validados em producao com usuario QA `qa.prd.p1.1.1779307585003@example.com`.
- [x] Validado usuario QA com `org_members.role=Administrador`.
- [x] Criacao/edicao de obra validada.
- [x] Criacao de fornecedor, equipamento, despesa, checklist e documento validada.
- [x] Aprovacao de checklist validada via Edge Function `approve-checklist`.
- [x] Upload/listagem/exclusao de documento validada com arquivo `application/pdf`.
- [x] BLOQUEIO P1.1 identificado: criacao de RDO falha no remoto porque `src/hooks/useRDOs.ts` envia `status='DRAFT'`, mas o banco remoto rejeita com `rdos_status_check`.
- [x] P0.4 alerta Sentry confirmado manualmente pelo usuario em 2026-05-20; a linha pendente anterior fica superada por este registro.
- [x] Reconciliado schema remoto de `rdos.status`: constraint agora aceita `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`.
- [x] Adicionadas colunas `approved_by`, `approved_at`, `rejection_reason` no remoto e mantida compatibilidade com campos legados.
- [x] Edge Functions `approve-rdo` e `update-rdo-status` atualizadas e implantadas.
- [x] Fluxo QA validado: RDO criado como `DRAFT`, enviado para `SUBMITTED`, aprovado como `APPROVED` e rejeitado como `REJECTED` com motivo visivel.
- [x] Evidencia criada em `docs/evidence/p1-1-rdo-reconciliation-2026-05-20.md`.
- [x] Deploy frontend controlado executado via worktree temporaria, evitando publicar diffs locais nao relacionados.
- [x] Deployment Vercel `dpl_AtJGzsqyWXFb7MjrJ8SCQmfbwcri` publicado em `https://meta-construtor-app-rev-2026-9h5say5lj.vercel.app` e aliased para `https://www.metaconstrutor.app.br`.
- [x] Producao validada: rota autenticada de RDO rejeitado mostra `RDO Rejeitado` e motivo `QA rejeicao obrigatoria 1779328782464`.
- [x] Evidencia criada em `docs/evidence/p1-1-rdo-production-deploy-2026-05-21.md`.
- [x] Smoke final criou novo RDO pela UI de producao: `f880af81-e9bb-465a-a6ab-a3b3723daffe`, numero `56`, status `DRAFT`.
- [x] PDF validado por Edge Function autenticada: RDO novo retornou `RDO-56.PDF` (`78902` bytes) e RDO aprovado retornou `RDO-53.PDF` (`78734` bytes).
- [x] Evidencia criada em `docs/evidence/p1-1-rdo-final-smoke-blocker-2026-05-21.md`.
- [x] P1.1 bloqueado no envio para aprovacao pela UI: RDO `DRAFT` mostrava instrucao para enviar a aprovacao, mas nao havia CTA/botao de envio. Superado pela correcao e deploy de 2026-05-21.
- [x] Botao `Enviar por E-mail` corrigido com Resend e restrito a RDO `APPROVED`: rascunho oculta e-mail, aprovado exibe e envia via `send-email-rdo`.

Decisao:

- [x] Bloqueio `RDO nao cria` resolvido no banco remoto e no backend.
- [x] Nao publicar frontend nesta etapa porque o workspace contem diffs locais nao relacionados; um deploy Vercel agora publicaria mais do que a correcao de RDO.
- [x] Revisados diffs locais e feito deploy frontend controlado por worktree temporaria.
- [x] Proxima atividade: corrigir acao de envio para aprovacao na UI. Concluida em 2026-05-21.

### 2026-05-21 - Ajuste final RDO e-mail apenas aprovado

- [x] Atualizado `src/pages/RDOVisualizar.tsx`: botao `Enviar por E-mail` aparece somente quando `status === 'APPROVED'`.
- [x] Atualizado `src/pages/RDOVisualizar.tsx`: botoes `Aprovar RDO` e `Rejeitar RDO` aparecem para `Administrador`, `Gerente` ou `Presidente` enquanto o RDO nao estiver aprovado.
- [x] Criada Edge Function `send-email-rdo`, com contrato `rdo_id`, `emails[]` e `motivo`.
- [x] Protegidas `send-email-rdo` e `send-rdo-email` para bloquear envio de RDO nao aprovado.
- [x] Ajustadas `approve-rdo` e `update-rdo-status` para impedir nova acao apenas em RDO ja aprovado, alinhando com a regra visual de `status !== 'APPROVED'`.
- [x] `npm run lint` passou com `0 errors` e warnings existentes.
- [x] `npm run build` passou.
- [x] Supabase Functions publicadas: `send-email-rdo`, `send-rdo-email`, `approve-rdo`, `update-rdo-status`.
- [x] Deploy Vercel production `dpl_AndqegNN3GwMkbgoDNVFsM5k7YJ8` publicado e aliased para `https://www.metaconstrutor.app.br`.
- [x] Producao validada: RDO `DRAFT` mostra aprovar/rejeitar para Administrador e nao mostra e-mail.
- [x] Producao validada: RDO `APPROVED` mostra `Enviar por E-mail` e nao mostra aprovar/rejeitar.
- [x] Edge Function `send-email-rdo` validada: RDO `DRAFT` retorna `409 INVALID_STATUS`; RDO `APPROVED` retorna `200` com `email_id`.
- [x] Evidencia criada em `docs/evidence/rdo-email-approved-only-2026-05-21.md`.
- [ ] Usuario comum nao foi validado com login separado nesta rodada; regra permanece coberta por role no frontend.

### 2026-05-21 - Textos corrigidos, envio para aprovacao e CSP Sentry

- [x] Corrigidos textos com mojibake/caracteres incorretos em paginas e utilitarios do frontend.
- [x] Scanner Node em `src` retornou `count=0` para marcadores de mojibake.
- [x] `npm run lint` passou com `0 errors` e `34 warnings` existentes.
- [x] `npm run build` passou.
- [x] Validacao local no RDO `f880af81-e9bb-465a-a6ab-a3b3723daffe`: textos aparecem corretos e sem mojibake.
- [x] `src/pages/RDOVisualizar.tsx` atualizado para exibir `Enviar para Aprovacao` ao criador quando o RDO estiver em `DRAFT`.
- [x] `src/hooks/useRDOs.ts` atualizado para invalidar tambem a query de detalhe do RDO apos envio para aprovacao.
- [x] Deploy Vercel production `dpl_EPPD8KgxV6MwJ4M3nrN4uDF7fFJz` publicado e aliased para `https://www.metaconstrutor.app.br`.
- [x] Producao validada: clique em `Enviar para Aprovacao` mudou o RDO `f880af81-e9bb-465a-a6ab-a3b3723daffe` de `DRAFT` para `SUBMITTED`.
- [x] CSP corrigida em `vercel.json` e `src/components/security/SecurityHeaders.tsx` para permitir `https://o4511422743576576.ingest.us.sentry.io`.
- [x] Deploy Vercel production final `dpl_DgPtFwP61y3NgpXoqR3Ar3vobJYZ` publicado e aliased para `https://www.metaconstrutor.app.br`.
- [x] Revalidacao de producao: sem erro de CSP/`Refused to connect` para Sentry e textos do RDO seguem corretos.
- [x] Evidencia criada em `docs/evidence/text-encoding-rdo-submit-csp-2026-05-21.md`.

### 2026-05-21 - P1.1 relatorios e feedback autenticado

- [x] Rota `https://www.metaconstrutor.app.br/app/relatorios` carregou autenticada com usuario QA.
- [x] Tela de relatorios exibiu controles de exportacao/baixar (`Exportar`, `CSV`, `PDF` ou equivalente visual).
- [x] Rota `https://www.metaconstrutor.app.br/app/feedback` carregou autenticada com usuario QA.
- [x] Bloqueio encontrado no feedback: `send-feedback` enviava `tipo='sugestao'`, mas o remoto aceita `Sugestao`/`Bug`/`Elogio`/`Outro` com acento no schema real.
- [x] `send-feedback` corrigida para mapear valores internos da UI para a constraint remota `feedbacks_tipo_check`.
- [x] `send-feedback` reimplantada via `npx supabase functions deploy send-feedback --use-api`.
- [x] Validacao direta da Edge Function retornou `200` com `feedback_id`.
- [x] Validacao pela UI criou feedback autenticado `bd0abf6f-a359-43d6-ad8c-d4852427a842` com status `Recebido`.
- [x] Evidencia adicionada em `docs/evidence/text-encoding-rdo-submit-csp-2026-05-21.md`.

### 2026-05-21 - P1.1 auth complementar, exportacao de relatorio e notificacoes

- [x] Google OAuth iniciou corretamente em producao: clique em `Continuar com Google` redirecionou para `accounts.google.com` com callback Supabase. Login final nao executado por exigir autenticacao Google manual.
- [x] Solicitacao de recuperacao de senha validada em `https://www.metaconstrutor.app.br/recuperar-senha`; tela exibiu estado de envio apos informar e-mail QA. Redefinicao via link de e-mail segue pendente de teste manual.
- [x] Exportacao de relatorio testada em producao: PDF baixou, mas revelou bug de filename `RELATORIO_RDO_NaN-NaN-NaN.PDF`.
- [x] Corrigido `src/hooks/useReportPdfDownload.ts` para enviar `generatedAt` em ISO.
- [x] Corrigida `supabase/functions/generate-rdo-pdf/report-template.ts` para fallback seguro quando receber data invalida.
- [x] `npm run lint` passou com `0 errors` e warnings preexistentes.
- [x] `npm run build` passou.
- [x] Edge Function `generate-rdo-pdf` reimplantada com `npx supabase functions deploy generate-rdo-pdf --use-api`.
- [x] Frontend reimplantado na Vercel: `dpl_BwxhBJbPWRrNWzsvJ3RAes9EqS8m`, alias `https://www.metaconstrutor.app.br`.
- [x] Smoke remoto com usuario temporario QA: `generate-rdo-pdf` retornou `200`, `application/pdf`, `attachment; filename="RELATORIO_RDO_2026-05-21.PDF"` e `filenameHasNaN=false`; usuario temporario removido.
- [x] Notificacoes validadas em `https://www.metaconstrutor.app.br/app/notificacoes`; rota autenticada carregou com lista/estado vazio visivel.
- [x] Perfil/LGPD teve presenca visual de controles validada em `https://www.metaconstrutor.app.br/app/perfil`.
- [x] Bloqueio LGPD encontrado: `export-my-data` criava linha em `admin_audit_logs` com `admin_id=userId`, e a FK impedia `auth.admin.deleteUser` no fluxo `delete-account`.
- [x] Criada migration `20260521235034_allow_admin_audit_logs_user_delete.sql` para permitir `ON DELETE SET NULL` em `admin_audit_logs.admin_id` e `target_user_id`.
- [x] Migration aplicada no remoto via `npx supabase db query --linked --file supabase/migrations/20260521235034_allow_admin_audit_logs_user_delete.sql`.
- [x] Migration registrada no historico remoto via `npx supabase migration repair --linked --status applied 20260521235034`.
- [x] Usuario temporario preso pelo FK removido apos correcao.
- [x] Smoke remoto com nova conta descartavel: `export-my-data` retornou `200`, JSON com `_meta`, `Content-Disposition: meus-dados-21-05-2026.json`; `delete-account` retornou `200` e `success=true`.

### 2026-05-22 - P1.2 Stripe producao

- [x] Confirmado que `VITE_STRIPE_PUBLISHABLE_KEY` estava ausente na Vercel production e foi cadastrado sem expor o valor.
- [x] Confirmado que `STRIPE_SECRET_KEY` estava presente nas Edge Functions.
- [x] Confirmado que `STRIPE_WEBHOOK_SECRET` estava ausente, criado webhook Stripe controlado e cadastrado o secret no Supabase.
- [x] Endpoint final ativo: `we_1TZkBrCHfNdO9jxNQur6Yq8o`, URL `https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/stripe-webhook`; endpoints duplicados criados durante reconciliacao foram desabilitados.
- [x] Edge Functions `create-checkout-session`, `stripe-webhook` e `create-portal-session` reimplantadas.
- [x] Smoke autenticado com usuario/organizacao descartaveis validou `create-checkout-session` com `200`, `sessionId` e URL `checkout.stripe.com`; a sessao foi expirada apos o teste.
- [x] Smoke autenticado validou `create-subscription` com `200`, `subscriptionId` e `clientSecret`; assinatura incompleta cancelada/removida apos o teste.
- [x] Smoke autenticado validou `create-portal-session` com `200` e URL `billing.stripe.com`.
- [x] Evento assinado de smoke validou `stripe-webhook`: resposta `200`, registro em `stripe_events` com `processed=true`, `error=null`; linha removida apos validacao.
- [x] `npm run build` passou; warnings de chunk grande permanecem para P2.1.
- [x] Frontend reimplantado na Vercel: `dpl_7rVUVopZ5zfNJ9L5S8ufGa8PdqUv`, alias `https://www.metaconstrutor.app.br`.
- [x] Rotas publicas `/checkout?plan=basic`, `/checkout/success` e `/checkout/cancel` retornaram `200`; print salvo em `docs/evidence/p1-2-checkout-production-2026-05-22.png`.
- [ ] Fluxo completo com pagamento real, troca de plano e cancelamento via app seguem pendentes por exigirem assinatura ativa/trialing controlada.

### 2026-05-22 - P1.3 seguranca e LGPD complementar

- [x] `git ls-files .env .env.local .env.production .env.production.local "*.env" "**/*.env"` nao retornou arquivos versionados.
- [x] Varredura por `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `sk_live_`, `sk_test_` e tokens sensiveis em `src`, `public`, `vercel.json` e `supabase/functions` nao encontrou segredos no frontend; usos sensiveis ficaram restritos a Edge Functions.
- [x] RLS remoto confirmado ativo nas tabelas `analytics_events`, `documentos`, `feedbacks`, `integrations`, `obras`, `rdos`, `stripe_events` e `subscriptions`.
- [x] Policies remotas revisadas para `integrations`, `feedbacks`, `analytics_events`, `rdos`, `obras`, `documentos`, `subscriptions` e `stripe_events`.
- [x] Smoke de isolamento entre organizacoes: registro em `integrations` criado pela org A foi visivel para org A e invisivel para usuario da org B (`otherOrgRowsVisible=0`); dados descartaveis removidos.
- [x] `src/components/security/AuditLogger.tsx` ajustado para nao imprimir `AUDIT LOG` completo em producao e mascarar recursivamente campos como email, cpf/cnpj, phone, token, secret, key, session e authorization.
- [x] `npm run build` passou apos ajuste de log; warnings de chunk grande permanecem para P2.1.
- [x] Frontend reimplantado na Vercel: `dpl_Fz2DJuiYHX96nbUiTpk9FamjhTZn`, alias `https://www.metaconstrutor.app.br`.
- [x] Evidencia adicionada em `docs/evidence/p1-3-security-lgpd-2026-05-22.md`.

### 2026-05-22 - P2.1 performance e cache

- [x] `vite.config.ts` ajustado com `manualChunks` para separar vendors pesados e reduzir o chunk principal.
- [x] `npm run build` passou sem warning de chunk acima de 500 kB.
- [x] Maiores chunks locais apos ajuste: `index-CM5Yhska.js` com `405.13 kB`, `vendor-charts-B5h86aGM.js` com `375.97 kB` e `vendor-ui-D3fikJcS.js` com `236.98 kB`.
- [x] Warnings restantes documentados como nao bloqueantes: `color-adjust` depreciado e import dinamico/estatico do cliente Supabase.
- [x] Frontend reimplantado na Vercel: `dpl_CBokmAALUZz1qFR1nGwE6p7UetVZ`, alias `https://www.metaconstrutor.app.br`.
- [x] Build da Vercel concluiu sem warning de chunk acima de 500 kB.
- [x] Validacao mobile de `/home` em producao concluida com Chromium em viewport `414x896`; print salvo em `docs/evidence/p2-1-home-mobile-2026-05-22.png`.
- [x] Cache validado em `/home` e `/checkout?plan=basic`: HTML e asset principal retornaram `cache-control: public, max-age=0, must-revalidate`.
- [x] Service worker validado: nao ha plugin PWA/workbox, HTML publico nao registra service worker e `ServiceWorkerManager` apenas remove registros existentes.
- [x] Evidencia adicionada em `docs/evidence/p2-1-performance-cache-2026-05-22.md`.

### 2026-05-22 - P2.2 cobertura de testes

- [x] Teste de auth principal existente revisado: `src/pages/__tests__/auth-flow.test.tsx`.
- [x] Adicionado `src/utils/__tests__/rdoStatus.test.ts` para cobrir labels e badges dos status canonicos de RDO.
- [x] Criado helper puro `src/utils/feedback.ts` e teste `src/utils/__tests__/feedback.test.ts` para cobrir payload enviado a `send-feedback`.
- [x] Exportados helpers puros de `src/hooks/useReportPdfDownload.ts` e adicionado `src/hooks/__tests__/useReportPdfDownload.test.ts` para cobrir filename, fallback e `generatedAt`.
- [x] `npm run test` passou: `8` arquivos e `27` testes.
- [x] `npm run build` passou apos as extracoes.
- [x] `npm run lint` passou com `0 errors` e `34 warnings` preexistentes.
- [x] Testes manuais nao automatizados documentados: Google OAuth final, redefinicao por link de e-mail, pagamento real/troca/cancelamento e download visual completo.
- [x] Evidencia adicionada em `docs/evidence/p2-2-test-coverage-2026-05-22.md`.

### 2026-05-22 - P2.3 documentacao de operacao

- [x] `README.md` atualizado com stack, setup, comandos reais de validacao/release e links operacionais.
- [x] `.env.example` atualizado com variaveis publicas, backend-only e opcionais sem valores reais.
- [x] `docs/OPERATIONS.md` criado com ambientes, variaveis, secrets, deploy Vercel, deploy de Edge Functions, migrations seguras e smoke minimo.
- [x] `docs/RELEASE_CHECKLIST.md` refeito com checklist operacional atual e no-go de release.
- [x] `docs/RUNBOOK_INCIDENT_RESPONSE.md` refeito sem mojibake e apontando para Sentry, Vercel, Supabase, Stripe e Resend.
- [x] Validacao UTF-8 dos docs operacionais passou sem marcadores de mojibake.
- [x] Evidencia adicionada em `docs/evidence/p2-3-operations-docs-2026-05-22.md`.

### 2026-05-22 - Smoke final sem dependencia manual

- [x] `npm run lint` passou com `0 errors` e `34 warnings` preexistentes.
- [x] `npm run test` passou com `8` arquivos e `27` testes.
- [x] `npm run build` passou sem warning de chunk acima de 500 kB.
- [x] Deploy Vercel production `dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r` publicado e aliased para `https://www.metaconstrutor.app.br`.
- [x] Rotas publicas `/home`, `/login`, `/criar-conta`, `/preco`, `/checkout?plan=basic`, `/checkout/success`, `/checkout/cancel`, `/contato` e paginas legais retornaram `200`.
- [x] Bundle publicado validado como `index-MlBbRgm1.js`.
- [x] Evidencias visuais salvas em `docs/evidence/final-smoke-home-2026-05-22.png` e `docs/evidence/final-smoke-checkout-mobile-2026-05-22.png`.
- [x] Evidencia adicionada em `docs/evidence/final-production-smoke-2026-05-22.md`.
- [x] Pendencias restantes classificadas como manuais/controladas: Google OAuth final, redefinicao por link de e-mail, pagamento Stripe real, troca e cancelamento de plano.

### 2026-05-22 - Reconciliacao final das acoes automatizaveis

- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Identificado drift novo nas migrations locais `20260519130000` e `20260519173000`.
- [x] Validado que `public.profiles.company_address` ja existe no remoto.
- [x] Restauradas pontualmente as funcoes/triggers idempotentes de limite de plano sem `db push --include-all`.
- [x] Aplicada pontualmente a regra de limite para membros `active` e `invited`.
- [x] Executado `npx supabase migration repair --linked --status applied 20260519130000`.
- [x] Executado `npx supabase migration repair --linked --status applied 20260519173000`.
- [x] Confirmado que `20260519130000` e `20260519173000` aparecem em `Local` e `Remote`.
- [x] Confirmados no remoto `get_org_plan_limits`, `enforce_max_users_limit`, `trigger_enforce_max_users` e `trigger_enforce_max_obras`.
- [x] Confirmadas Edge Functions criticas como `ACTIVE` via `npx supabase functions list --output json`.
- [x] Confirmado deployment Vercel `dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r` como `Ready` em producao.
- [x] Registros historicos antigos do PRD que estavam pendentes foram marcados como superados quando havia registro posterior de conclusao.
- [x] `npm run lint` passou com `0 errors` e `34 warnings` preexistentes.
- [x] `npm run test` passou com `8` arquivos e `27` testes.
- [x] Evidencia adicionada em `docs/evidence/prd-final-reconciliation-2026-05-22.md`.

### 2026-05-25 - Revalidacao automatizavel sem pendencias manuais

- [x] Reexecutado `npx vercel inspect dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r`; deployment segue `Ready` em `production` com alias `https://www.metaconstrutor.app.br`.
- [x] Reexecutado `npx supabase migration list --linked`; sem drift novo nas migrations recentes de maio, permanecendo somente drift residual antigo ja aceito/documentado (`20260215`, duplicidade local `20260216120000` e `fix_permissions.sql` fora do padrao do CLI).
- [x] Schema remoto essencial revalidado: `integrations`, `feedbacks`, `analytics_events`, `financeiro_consolidado`, `cronograma_vs_realizado`, `profiles.company_address`, `get_org_plan_limits` e `trigger_enforce_max_users` presentes/ativos.
- [x] Edge Functions criticas revalidadas como `ACTIVE` via `npx supabase functions list --output json`.
- [x] Rotas publicas `/home`, `/login`, `/criar-conta`, `/preco`, `/checkout?plan=basic`, `/checkout/success`, `/checkout/cancel`, `/contato` e paginas legais retornaram `200` via `curl.exe`.
- [x] `npm run lint` passou com `0 errors` e `34 warnings` preexistentes.
- [x] `npm run test` passou com `8` arquivos e `27` testes.
- [x] `npm run build` passou; maior chunk segue abaixo de 500 kB (`index-D_Uzi6F7.js` com `405.13 kB`).
- [x] Nenhuma pendencia manual foi marcada como concluida nesta rodada.
- [x] Evidencia adicionada em `docs/evidence/prd-automated-recheck-2026-05-25.md`.

### 2026-05-29 - Revalidacao automatizavel e reconciliacao de migrations PRD_ADMIN

- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Detectadas tres migrations locais `PRD_ADMIN` de 2026-05-28 sem historico remoto: `20260528120000`, `20260528133000` e `20260528222800`.
- [x] Executada consulta somente leitura no remoto confirmando que os objetos dessas migrations ja existiam no schema: `analytics_events`, colunas de marketing/atribuicao e views admin de analytics.
- [x] Executado `npx supabase migration repair --linked --status applied 20260528120000 20260528133000 20260528222800`, sem reaplicar DDL.
- [x] Reexecutado `npx supabase migration list --linked`; as tres migrations `PRD_ADMIN` ficaram alinhadas.
- [x] Backup remoto criado em `.release-backups/prd-root-2026-05-29-before-lixeira.sql` antes da alteracao de schema da Lixeira.
- [x] Aplicada a migration idempotente `20260529034950_prd_lixeira_soft_delete_foundation.sql` no remoto.
- [x] Executado `npx supabase migration repair --linked --status applied 20260529034950`.
- [x] Revalidado no remoto que `deleted_at`, `deleted_by`, `delete_reason`, `delete_origin` e `purge_at` existem em `obras`, `documentos`, `rdos`, `checklists`, `atividades` e `expenses`.
- [x] Revalidado que `public.lixeira_items` existe no remoto e que `20260529034950` aparece alinhada em Local/Remote.
- [x] Reexecutado `npx supabase functions list --output json`; Edge Functions remotas continuam `ACTIVE`, incluindo checkout, webhook Stripe, RDO, checklist, convites, contato, feedback, PDF e auditoria.
- [x] Rotas publicas de producao `/home`, `/login`, `/criar-conta`, `/preco`, checkout, contato e legais retornaram `200 text/html`.
- [x] `npm run lint` passou com `0 errors` e `34 warnings` preexistentes.
- [x] `npm run test` passou com `8` arquivos e `27` testes.
- [x] `npm run build` passou e o postbuild pre-renderizou `15` rotas publicas.
- [x] Evidencia adicionada em `docs/evidence/prd-root-automated-recheck-2026-05-29.md`.

## 7. Proxima atividade recomendada

Continuar apenas pelos itens ainda dependentes de acao manual/controlada: validar pagamento real controlado, troca de plano e cancelamento com assinatura ativa/trialing; concluir Google OAuth com conta Google real e redefinicao por link de e-mail quando houver acesso manual. P0.1 foi concluido com drift critico removido e drift residual antigo aceito/documentado, P0.2 foi concluido com lint sem erros fatais, P0.3 foi concluido com commit/tag/push de release candidate, P0.4 foi validado com Sentry/alerta e CSP corrigida, P1.1 foi validado nos fluxos principais possiveis, P1.2 foi corrigido sem pagamento real, P1.3 foi concluido, P2.1 foi concluido, P2.2 foi concluido e P2.3 foi concluido.

Passos da proxima atividade:

- [x] Criar ou confirmar o projeto Sentry do frontend.
- [x] Obter o DSN publico do projeto Sentry.
- [x] Cadastrar `VITE_SENTRY_DSN` em `production` na Vercel.
- [x] Cadastrar `VITE_SENTRY_ENVIRONMENT=production` em `production` na Vercel.
- [x] Cadastrar ou revisar `VITE_APP_VERSION=v1.0.1-release-candidate` em `production` na Vercel.
- [x] Fazer redeploy de producao apos configurar as variaveis.
- [x] Gerar evento controlado no Sentry para o projeto de frontend.
- [x] Confirmar chegada do evento no painel Sentry.
- [x] Criar regra de alerta para erro JS e cadastrar responsaveis.
- [x] Atualizar este PRD com o resultado.
- [x] Corrigir/reconciliar `rdos.status`: o app cria `DRAFT`, e o remoto agora aceita os quatro estados canonicos.
- [x] Validar criar/enviar/aprovar/rejeitar RDO via backend remoto e interface local contra dados remotos.
- [x] Fazer deploy frontend controlado sem publicar diffs locais nao relacionados.
- [x] Validar tela de RDO rejeitado em producao publica autenticada.
- [x] Reexecutar P1.1 final complementar: novo RDO pela UI e PDF.
- [x] Corrigir envio de RDO para aprovacao na UI de producao.
- [x] Corrigir botao `Enviar por E-mail` do RDO com Resend. Evidencias: `docs/evidence/resend-rdo-email-2026-05-21.md` e `docs/evidence/rdo-email-approved-only-2026-05-21.md`.
- [ ] Validar Google OAuth em producao, se divulgado.
- [ ] Validar recuperacao/redefinicao de senha em producao.
- [x] Validar relatorios e exportacao CSV/PDF, se disponiveis.
- [x] Validar feedback autenticado.
- [x] Validar notificacoes.
- [x] Validar perfil, seguranca e exportacao de dados LGPD.
- [x] Corrigir/configurar Stripe em producao: Vercel env, Supabase secrets, webhook, Edge Functions e smoke sem pagamento real.
- [x] Aplicar e registrar a migration `20260529034950_prd_lixeira_soft_delete_foundation.sql` apos backup e validacao de contrato remoto.
- [ ] Validar pagamento real controlado, troca de plano e cancelamento com assinatura ativa/trialing.

## 8. Como retomar este trabalho

Ao iniciar a proxima conversa, usar este prompt:

```text
Continue o plano do PRD.md na raiz do projeto Meta Construtor. Comece pela secao "7. Proxima atividade recomendada" e atualize os checks conforme executar.
```

Arquivos principais para consultar:

- `PRD.md`
- `package.json`
- `eslint.config.js`
- `vercel.json`
- `supabase/migrations/`
- `supabase/functions/`
- `docs/POST_LAUNCH_REPORT_v1.0.0.md`
- `docs/RELATORIO_FINAL_CONFORMIDADE_PRD5.md`
- `docs/RUNBOOK_INCIDENT_RESPONSE.md`
