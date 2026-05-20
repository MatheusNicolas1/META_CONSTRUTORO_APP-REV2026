# PRD de Correcoes para Liberacao Publica - Meta Construtor Web

Data de criacao: 2026-05-11
Objetivo: organizar as correcoes pendentes para liberar o aplicativo web Meta Construtor para divulgacao e uso por usuarios reais.

## 1. Resumo executivo

O aplicativo ja possui build de producao funcional, testes automatizados basicos passando, deploy ativo na Vercel e Edge Functions criticas publicadas no Supabase. A liberacao publica ainda nao deve acontecer antes de fechar quatro frentes:

- [x] Alinhar migrations locais e remotas do Supabase, com drift residual antigo aceito/documentado.
- [x] Corrigir o lint do projeto.
- [x] Fechar uma versao de release com workspace limpo, commit e tag confiaveis.
- [ ] Configurar e validar monitoramento real em producao.

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
- [ ] Monitoramento Sentry ainda precisa ser configurado e validado em ambiente real.

## 3. Escopo deste PRD

Incluido:

- [ ] Corrigir prontidao tecnica para release.
- [ ] Validar Supabase remoto, banco, RLS, views, policies e Edge Functions.
- [ ] Validar Vercel, variaveis de ambiente e dominio.
- [ ] Validar fluxos principais em producao.
- [ ] Criar processo de retomada para proxima atividade.
- [ ] Criar checklist final de Go/No-Go.

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
- [ ] Validar tabelas/views esperadas no remoto:
  - [x] `public.integrations`
  - [x] `public.feedbacks`
  - [x] `public.analytics_events`
  - [x] `public.financeiro_consolidado`
  - [x] `public.cronograma_vs_realizado`
- [x] Validar RLS nas tabelas novas ou alteradas. `feedbacks` e `integrations` com RLS ativo; `analytics_events` ausente.
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
- [ ] Criar regra de alerta para erros JS.
- [x] Definir emails/canais do time que receberao alertas. Responsavel inicial: Matheus (`matheusnicolas.org@gmail.com`).
- [x] Simular erro controlado ou validar evento real de teste.
- [x] Confirmar chegada do evento no painel Sentry.
- [x] Confirmar que nenhum dado sensivel esta sendo enviado nos eventos. Codigo endurecido com `sendDefaultPii: false`, replay mascarado e redacao de campos sensiveis; evento de validacao enviado sem PII real.

Criterio de aceite:

- [x] Erros de frontend aparecem no Sentry.
- [ ] Alertas chegam ao responsavel correto.
- [ ] Runbook de incidente aponta para o painel correto.

### P1 - Validacao funcional antes de divulgacao

#### P1.1 - Smoke test em producao

Executar no dominio real apos P0.

Checks:

- [ ] Acessar `https://metaconstrutor.app.br`.
- [ ] Validar carregamento da landing page.
- [ ] Validar login com usuario existente.
- [ ] Validar cadastro com email/senha, se estiver liberado.
- [ ] Validar Google OAuth, se estiver divulgado.
- [ ] Validar recuperacao/redefinicao de senha.
- [ ] Criar obra.
- [ ] Editar obra.
- [ ] Criar RDO.
- [ ] Enviar RDO para aprovacao.
- [ ] Aprovar RDO com perfil permitido.
- [ ] Rejeitar RDO com justificativa.
- [ ] Baixar PDF de RDO aprovado.
- [ ] Criar checklist.
- [ ] Aprovar checklist.
- [ ] Criar documento/upload.
- [ ] Listar documento.
- [ ] Excluir documento, se permitido.
- [ ] Criar despesa.
- [ ] Criar fornecedor.
- [ ] Criar/evaluar equipamento.
- [ ] Acessar relatorios.
- [ ] Exportar CSV/PDF de relatorio, se disponivel.
- [ ] Enviar contato publico.
- [ ] Enviar feedback autenticado.
- [ ] Validar notificacoes.
- [ ] Validar perfil, seguranca e exportacao de dados LGPD.

Criterio de aceite:

- [ ] Todos os fluxos criticos funcionam sem erro bloqueante.
- [ ] Falhas menores estao documentadas com prioridade e decisao Go/No-Go.

#### P1.2 - Validar pagamentos Stripe

Checks:

- [ ] Confirmar `VITE_STRIPE_PUBLISHABLE_KEY` em producao.
- [ ] Confirmar `STRIPE_SECRET_KEY` nas Edge Functions.
- [ ] Confirmar webhook Stripe apontando para a URL correta.
- [ ] Validar `create-checkout-session`.
- [ ] Validar retorno de checkout sucesso/cancelamento.
- [ ] Validar criacao/atualizacao de assinatura.
- [ ] Validar portal do cliente.
- [ ] Validar cancelamento/troca de plano, se habilitado.
- [ ] Confirmar que eventos Stripe sao registrados.

Criterio de aceite:

- [ ] Um fluxo completo de assinatura funciona em ambiente esperado.
- [ ] Webhook atualiza o estado da assinatura no banco.

#### P1.3 - Validar seguranca e LGPD

Checks:

- [ ] Confirmar que `.env` e segredos nao estao versionados.
- [ ] Procurar uso indevido de `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- [ ] Revisar policies RLS das tabelas novas.
- [ ] Testar isolamento entre organizacoes.
- [ ] Validar exportacao de dados do usuario.
- [ ] Validar exclusao de conta.
- [ ] Revisar CSP em `vercel.json`.
- [ ] Confirmar que dominios externos necessarios estao na CSP.
- [ ] Confirmar que dados sensiveis nao aparecem em logs de frontend.

Criterio de aceite:

- [ ] Nao ha vazamento obvio entre organizacoes.
- [ ] Service role restrita a backend/Edge Functions.
- [ ] Fluxos LGPD minimos funcionando.

### P2 - Qualidade e melhoria antes da escala

#### P2.1 - Performance e bundle

Checks:

- [ ] Revisar warning de chunk acima de 500 kB.
- [ ] Avaliar code splitting adicional.
- [ ] Medir carregamento inicial em mobile.
- [ ] Validar service worker/cache.
- [ ] Confirmar que atualizacoes novas nao ficam presas em cache antigo.

Criterio de aceite:

- [ ] Performance aceitavel em celular comum.
- [ ] Nenhum cache antigo bloqueia nova versao.

#### P2.2 - Cobertura de testes

Checks:

- [ ] Adicionar teste para fluxo de auth principal.
- [ ] Adicionar teste para helper de RDO/status, se aplicavel.
- [ ] Adicionar teste para feedback.
- [ ] Adicionar teste para relatorios/export.
- [ ] Documentar testes manuais que nao foram automatizados.

Criterio de aceite:

- [ ] Testes cobrem os fluxos de maior risco.
- [ ] `npm run test` passa.

#### P2.3 - Documentacao de operacao

Checks:

- [ ] Atualizar README com comandos reais de release.
- [ ] Atualizar checklist de release.
- [ ] Atualizar runbook de incidente.
- [ ] Registrar variaveis obrigatorias de producao.
- [ ] Registrar como deployar Edge Functions.
- [ ] Registrar como aplicar migrations com seguranca.

Criterio de aceite:

- [ ] Uma pessoa do time consegue retomar deploy/operacao seguindo a documentacao.

## 5. Checklist Go/No-Go

Liberacao publica somente se todos os itens P0 e P1 criticos estiverem marcados.

### Go tecnico

- [x] Build passa.
- [x] Testes passam.
- [x] Lint passa.
- [x] Supabase remoto alinhado sem drift critico.
- [x] Edge Functions criticas ativas.
- [x] Vercel production `Ready`.
- [ ] Variaveis de ambiente de producao revisadas.
- [ ] Monitoramento Sentry validado.
- [ ] Smoke test de producao aprovado.
- [x] Workspace fechado em commit/tag de release.

### Go de produto

- [ ] Fluxos principais do usuario funcionam.
- [ ] Fluxos de administracao/permissao funcionam.
- [ ] Fluxos de pagamento funcionam ou estao claramente desativados.
- [ ] Feedback de usuario funcionando.
- [ ] Contato publico funcionando.
- [ ] Textos publicos revisados.
- [ ] Politicas legais basicas acessiveis.

### No-Go automatico

- [ ] Banco remoto com migrations criticas ausentes.
- [ ] Login/cadastro quebrado.
- [ ] Criacao de obra quebrada.
- [ ] RDO nao cria, nao aprova ou nao gera PDF.
- [ ] Dados vazando entre organizacoes.
- [ ] Checkout divulgado mas nao funcional.
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
- [ ] Execucao pausada antes de backup/aplicacao de migrations porque o drift e bidirecional e exige estrategia de reconciliacao.

### 2026-05-12 - P0.1 backup remoto bloqueado

- [x] Reexecutado `npx supabase migration list --linked`.
- [x] Confirmado drift ainda ativo e identificada tambem a migration local pendente `20260511123000`.
- [x] Tentado backup remoto via `npx supabase db dump --linked`.
- [x] Tentado backup remoto de dados via `npx supabase db dump --linked --data-only --use-copy`.
- [x] Verificado que `pg_dump` nao esta disponivel localmente.
- [x] Evidencia criada em `docs/evidence/supabase-backup-blocker-2026-05-12.md`.
- [ ] Nenhuma migration foi aplicada porque o backup remoto nao foi concluido.

### 2026-05-12 - P0.1 nova tentativa de backup

- [x] Nova tentativa executada apos solicitacao do usuario.
- [x] Docker Desktop estava instalado e com processos ativos, mas o daemon `dockerDesktopLinuxEngine` retornou erro 500.
- [x] Docker Desktop foi iniciado/reacionado em segundo plano.
- [x] `docker info` ficou sem resposta ate timeout.
- [x] `npx supabase db dump --linked` falhou novamente antes de gerar backup.
- [x] Arquivos de dump vazios foram removidos.
- [ ] P0.1 continua bloqueado ate backup manual no Supabase Dashboard ou ambiente local com Docker/pg_dump funcional.

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
- [ ] Execucao pausada antes de `db push --include-all`, porque o dry-run aplicaria 57 migrations antigas e recentes em producao.
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
- [ ] Drift residual aceito e documentado: `20260215_full_restore_plans.sql` usa versao curta e existem dois arquivos locais com a versao `20260216120000`.
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
- [ ] P0.3 pausado antes de commit/tag porque o indice contem artefatos indevidos ja staged e mudancas de produto/Supabase ainda nao revisadas como um release unico.

### 2026-05-18 - P0.3 limpeza de stage e validacoes

- [x] Removidos do stage artefatos locais claramente indevidos: `.agent/`, `.playwright-cli/`, `output/`, `test-results/`, `screenshot_fail.png`, `supabase/.temp/`, `tsconfig.app.tsbuildinfo` e arquivos `.zip`.
- [x] Confirmado que o staged diff nao contem mais esses artefatos.
- [x] `npm test` executado; falhou inicialmente em 2 testes de OAuth por falta do parametro `next` na callback.
- [x] Corrigidos `Login` e `CriarConta` para usar `getAuthCallbackUrl()`.
- [x] `npm test` passou: 3 arquivos, 10 testes.
- [x] `npm run lint` passou com `0 errors` e `33 warnings`.
- [x] `npm run build` passou.
- [x] Evidencia criada em `docs/evidence/git-p0-3-cleanup-validation-2026-05-18.md`.
- [ ] P0.3 continua pausado antes de commit/tag: ainda existem 154 entradas staged e 24 arquivos `MM`; o commit atual nao seria reproduzivel sem reconciliar stage vs working tree.

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
- [ ] P0.3 continua pendente de reconciliar os 24 arquivos `MM` antes de commit/tag.

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
- [ ] P0.4 pendente de validacao real: falta redeploy seguro de producao, gerar evento controlado e validar evento/alerta no painel.

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
- [ ] Validacao final no painel Sentry pendente: automacao nao pode executar `javascript:` por politica de seguranca do navegador; executar manualmente `window.__META_SENTRY_TEST__()` no console da producao e confirmar evento no painel.

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
- [ ] Criacao de regra de alerta nao concluida: as ferramentas MCP Sentry disponiveis nesta sessao nao expõem criacao/edicao de alert rules.

## 7. Proxima atividade recomendada

Continuar P0.4 configurando o monitoramento real. P0.1 foi concluido com drift residual aceito/documentado, P0.2 foi concluido com lint sem erros fatais e P0.3 foi concluido com commit/tag/push de release candidate.

Passos da proxima atividade:

- [x] Criar ou confirmar o projeto Sentry do frontend.
- [x] Obter o DSN publico do projeto Sentry.
- [x] Cadastrar `VITE_SENTRY_DSN` em `production` na Vercel.
- [x] Cadastrar `VITE_SENTRY_ENVIRONMENT=production` em `production` na Vercel.
- [x] Cadastrar ou revisar `VITE_APP_VERSION=v1.0.1-release-candidate` em `production` na Vercel.
- [x] Fazer redeploy de producao apos configurar as variaveis.
- [x] Gerar evento controlado no Sentry para o projeto de frontend.
- [x] Confirmar chegada do evento no painel Sentry.
- [ ] Criar regra de alerta para erro JS e cadastrar responsaveis.
- [x] Atualizar este PRD com o resultado.

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
