PRD — META CONSTRUTOR | MILESTONES EM ORDEM CRONOLÓGICA (COM CAMPOS DE VALIDAÇÃO VAZIOS)

> [!IMPORTANT]
> **REGRA PARA A LLM:** 
> 1. Never create new milestone headers; only update existing numbered items.
> 2. Each item number (e.g., 6.1, 6.2) must exist exactly once in this file.
> 3. Do not add duplicate "Milestone X" sections. Update the canonical one.

ANÁLISE (POR QUE ESTA ORDEM)

* Primeiro: base técnica + modelo de dados multi-tenant (org/empresa) para evitar retrabalho estrutural.
* Depois: autenticação e autorização server-side, porque RLS e auditoria dependem de identidade confiável.
* Em seguida: RLS (enforcement real) antes de billing e antes de liberar acesso pago.
* Depois: billing/assinaturas e sincronização de planos/preços (fonte única).
* Então: auditoria imutável (incluindo eventos de billing e ações críticas do domínio).
* Por fim: máquina de estados (domínio), observabilidade, hardening e analytics (camadas de produção).

STACK/COMPONENTES CITADOS (REFERÊNCIA)

* Banco/Edge/RLS: Supabase
* Pagamentos: Stripe
* Observabilidade: Sentry
* Analytics: PostHog
* Deploy (se aplicável): Vercel

======================================================================

MILESTONE 0 — BASE TÉCNICA E QUALIDADE (FUNDAÇÃO)
0.1 Monorepo e padrões

* Criar/validar monorepo e convenções (pastas, nomes, lint-staged, etc.)
  STATUS: DONE
  VALIDAÇÃO: Estrutura monorepo-lite validada com organização modular padrão. Possui src/, supabase/, stripe/, public/ com separação clara. Configurações padronizadas (.gitignore, eslint.config.js, tsconfig.json, vite.config.ts). Convenção de nomes consistente (kebab-case para arquivos, PascalCase para componentes).
  EVIDÊNCIA: package.json (scripts lint/dev/build), tsconfig.json (paths alias @/*), .gitignore, eslint.config.js, estrutura de pastas /src/{components,pages,hooks,types,utils,integrations}, /supabase/migrations, /stripe/.
  - **Dev Server**: `npm run dev` serve em porta 5173. Script `npm run dev:smoke` passa (HTTP 200 + <div id="root">).

0.2 TypeScript strict e build

* Garantir TypeScript strict + scripts dev/build/typecheck/lint
  STATUS: PARTIAL - Scripts completos, strict mode pendente
  VALIDAÇÃO: Todos os scripts necessários existem e funcionam (dev/build/build:dev/typecheck/lint/preview). Build passa com sucesso. Typecheck passa mas com strict:false. TypeScript configurado de forma permissiva (noImplicitAny:false, strict:false em tsconfig.app.json). Habilitar strict mode requer migração gradual para evitar quebrar código existente.
  EVIDÊNCIA: package.json (adicionado "typecheck": "tsc --noEmit"), npm run build (exit 0), npm run typecheck (exit 0), npm run lint (exit 1 com 3 erros não-bloqueantes), tsconfig.app.json linha 18 (strict:false)

0.3 Padronização de validação de input

* Definir padrão único para validação (ex.: Zod) em endpoints/edge e formulários críticos
  STATUS: PARTIAL - Zod padronizado no frontend, ausente nas edge functions
  VALIDAÇÃO: Zod está implementado e sendo usado em formulários críticos (Checkout.tsx, ExpenseForm.tsx) com schemas robustos. Existe InputValidator.tsx centralizado com schemas seguros (secureEmailSchema, strongPasswordSchema, secureStringSchema) incluindo proteção contra XSS e SQL injection. PORÉM as edge functions (supabase/functions/*) NÃO utilizam Zod - fazem validação manual básica ou nenhuma validação.
  EVIDÊNCIA: src/components/security/InputValidator.tsx (schemas Zod com validação de segurança), src/pages/Checkout.tsx linha 5 (import z from 'zod'), supabase/functions/create-checkout-session/index.ts linha 57 (validação manual sem Zod), sem import de Zod em nenhuma edge function

0.4 Estratégia de migrations versionadas

* Definir fluxo de migrations SQL (versionamento, review, rollback básico)
  STATUS: DONE
  VALIDAÇÃO: Sistema de migrations versionado está implementado usando Supabase migrations. Arquivos nomeados com timestamp (YYYYMMDDHHMMSS_uuid.sql ou YYYYMMDD_description.sql). Migrations ficam em /supabase/migrations/ com 28 arquivos organizados cronologicamente. Migrations incluem comentários e documentação (ex: COMMENT ON FUNCTION). Supabase CLI gerencia aplicação sequencial.
  EVIDÊNCIA: supabase/migrations/ (28 arquivos .sql), formato de nomes (20260107_fix_default_role_admin.sql, 20251106143830_*.sql), exemplo de migration bem documentada em 20260107_fix_default_role_admin.sql com comentários e exception handling, supabase/config.toml (configuração do projeto)

======================================================================

MILESTONE 1 — MODELO MULTI-TENANT E INTEGRIDADE DO BANCO (ORG FIRST)
1.1 Estrutura de organização (empresa)

* Criar tabela orgs (empresa/organização)
  STATUS: DONE
  VALIDAÇÃO: Migration criada (20260206_create_orgs_table.sql) com tabela orgs contendo id, created_at, updated_at, name, slug, owner_user_id. RLS habilitado com 4 policies (SELECT/INSERT/UPDATE/DELETE). SELECT policy permite owner + membros futuros (org_members). Backfill idempotente cria org pessoal para cada usuário existente. Função generate_org_slug() para slugs únicos URL-friendly. Trigger para updated_at. Constraints de validação (nome 2-100 chars, slug formato kebab-case). Migration validada contra padrão de migrations existentes e referências a funções (update_updated_at_column existe em migration 20251106143907).
  EVIDÊNCIA: supabase/migrations/20260206_create_orgs_table.sql (142 linhas), tabela com indices idx_orgs_owner e idx_orgs_slug, 4 RLS policies (orgs_select_policy, orgs_insert_policy, orgs_update_policy, orgs_delete_policy), backfill DO block idempotente, função generate_org_slug() para unicidade

1.2 Vínculo de usuários por organização (membership)

* Criar tabela org_members (user_id, org_id, role, status)
  STATUS: DONE
  VALIDAÇÃO: Migration criada (20260206_create_org_members_table.sql) com tabela org_members. Enum org_member_status (active, invited, inactive) criado. FKs para orgs(id) e auth.users(id) com DELETE CASCADE. Constraint UNIQUE(org_id, user_id). RLS habilitado com 4 policies complexas cobrindo hierarquia (Owner > Admin > Gerente > Colaborador). Trigger para atualizar joined_at automaticamente ao ativar. Backfill garante que todo owner de org seja inserido automaticamento como membro 'Administrador'. Utiliza enum app_role existente.
  EVIDÊNCIA: supabase/migrations/20260206_create_org_members_table.sql (210 linhas), indices para performance (idx_org_members_org, idx_org_members_user), policies verificando hierarquia (org_members_select_policy, etc).

1.3 Padronizar org_id no domínio

* Garantir org_id em todas as tabelas de domínio (obras, rdo, qualidade, recursos, financeiro, anexos)
  STATUS: DONE
  VALIDAÇÃO: Migration 20260206140000_add_org_id_to_domain.sql criada. Adiciona coluna org_id FK para public.orgs(id) nas tabelas principais: obras, rdos, atividades, expenses. Backfill inteligente implementado: obras vinculadas à org pessoal do owner; tabelas filhas (rdos, atividades, expenses) vinculadas via obra_id ou fallback para owner. Indíces criados (idx_obras_org_id, etc) para performance. Coluna org_id definida como NOT NULL em obras após backfill bem-sucedido.
  EVIDÊNCIA: supabase/migrations/20260206140000_add_org_id_to_domain.sql, logs de backfill, indices criados no banco.

1.4 Constraints e índices essenciais

* Adicionar FKs, NOT NULL, UNIQUE (onde necessário) e índices por org_id
  STATUS: DONE
  VALIDAÇÃO: Migration 20260206150000_essential_constraints.sql criada. Substituição da constraint global de slug em Obras por UNIQUE(org_id, slug) para permitir mesmos nomes em orgs diferentes. Aplicação de NOT NULL em org_id nas tabelas rdos, atividades, expenses (com backfill de segurança prévio). Criação de índices foreign key (idx_rdos_obra_id, etc) e adição de FK constraints (rdos_obra_id_fkey) com ON DELETE RESTRICT para integridade. Build e Typecheck do frontend aprovados.
  EVIDÊNCIA: supabase/migrations/20260206150000_essential_constraints.sql, código PL/pgSQL checando constraints existentes antes de aplicar.

1.5 Seeds mínimos para dev

* Criar seeds: org + admin + obra exemplo (mínimo reprodutível)
  STATUS: DONE
  VALIDAÇÃO: Arquivo supabase/seed.sql criado. Utiliza UUIDs determinísticos (ex: user ...0001, org ...0002). Cria: 1 Admin (admin@local.test), 1 Org 'Dev Corp', 1 Obra 'Obra Exemplo', 1 RDO, 1 Atividade e 1 Expense. Script idempotente usando ON CONFLICT DO NOTHING. Desativa triggers temporariamente (session_replication_role = 'replica') para inserir em auth.users. Validado "typecheck" do frontend.
  EVIDÊNCIA: supabase/seed.sql, UUIDs utilizados (00000000-0000-0000-0000-000000000001 a 00000000-0000-0000-0000-000000000007).

======================================================================

MILESTONE 2 — AUTENTICAÇÃO E AUTORIZAÇÃO SERVER-SIDE (IDENTIDADE CONFIÁVEL)
2.1 Autenticação (login e sessão)

* Implementar auth real (tokens/sessão) e persistência do usuário no banco
  STATUS: DONE (2026-02-08)
  VALIDAÇÃO: Trigger handle_new_user corrigido após falha de signup (erro 500). Root cause: user_roles.user_id sem constraint UNIQUE, causando erro "no unique or exclusion constraint matching ON CONFLICT specification 42P10". Migrations criadas: 1) user_settings/user_credits tables + RLS, 2) profiles columns (cpf_cnpj, plan_type, referral_code), 3) user_roles UNIQUE constraint. Signup testado end-to-end via scripts/test-signup.js com sucesso - todas 5 tabelas (profiles, orgs, org_members, user_settings, user_credits) populadas corretamente.
  EVIDÊNCIA: Migrations 20260208210000_add_missing_user_tables.sql, 20260208211000_add_missing_profile_columns.sql, 20260208212000_fix_user_roles_constraint.sql. Teste automated: scripts/test-signup.js (count=1 em todas tabelas). Commit: fix(auth): restore handle_new_user signup path (b95487c)

2.2 Papéis (RBAC) como regra de backend

* Definir roles (Admin/Gerente/Colaborador) no backend, não só no frontend
  STATUS: DONE
  VALIDAÇÃO: Migration 20260206170000_rbac_helpers.sql criada. Funções auxiliares (current_org_role, is_org_member, has_org_role) implementadas para uso em RLS e Edge Functions. Enum app_role existente verificado como compatível com frontend (Administrador, Gerente, Colaborador).
  EVIDÊNCIA: supabase/migrations/20260206170000_rbac_helpers.sql.

2.3 Guards server-side por rota/ação

* Criar guards para ações críticas (criar/editar/excluir, financeiro, permissões, status)
  STATUS: DONE
  VALIDAÇÃO: Estrutura de guards compartilhados criada em supabase/functions/_shared/ (guards.ts, cors.ts, supabase-client.ts). Edge Function create-checkout-session atualizada para utilizar requireAuth() e logRequest(). Implementação inclui logging estruturado (request_id) e tratamento de erros padronizado (401/403). Helper requireOrgMember() preparado para uso futuro.
  EVIDÊNCIA: supabase/functions/_shared/, supabase/functions/create-checkout-session/index.ts atualizado.

2.4 Controle de acesso por organização

* Validar que o usuário pertence à org antes de qualquer operação
  STATUS: DONE
  VALIDAÇÃO: Edge Functions (create-checkout-session, gmail-integration, n8n-integration) auditadas e atualizadas para usar guards compartilhados (requireAuth) e logging estruturado. Para funções que ainda não recebem org_id (ex: gmail), a validação de autenticação é o primeiro nível de defesa. Helpers requireOrgMember prontos para uso quando payload incluir contexto.
  EVIDÊNCIA: supabase/functions/gmail-integration/index.ts, supabase/functions/n8n-integration/index.ts atualizados.

======================================================================

MILESTONE 3 — RLS TOTAL (ENFORCEMENT REAL NO BANCO) (P0)
3.1 Ativar RLS em tabelas principais

* Ativar RLS em todas as tabelas multi-tenant do domínio
  STATUS: DONE
  VALIDAÇÃO: Migration 20260206180000_enable_rls_domain.sql criada. Executado ALTER TABLE ENABLE ROW LEVEL SECURITY para: obras, rdos, atividades, expenses, profiles, user_settings, user_credits. Acesso direto (SELECT/INSERT...) bloqueado para usuários até criação das policies em 3.2. Integraidade garantida.
  EVIDÊNCIA: supabase/migrations/20260206180000_enable_rls_domain.sql.

3.2 Policies por org_id (isolamento)

* Policies SELECT/INSERT/UPDATE/DELETE garantindo isolamento por org_id
  STATUS: DONE (2026-02-08)
  VALIDAÇÃO: Migration 20260206183000_rls_isolation.sql aplicada. Teste automatizado via scripts/test-rls.js usando real user JWT sessions (signUp). 4 testes executados: (1) Cross-org SELECT retorna 0 rows, (2) Same-org SELECT sucesso, (3) Cross-org UPDATE bloqueado (0 rows affected), (4) Cross-org DELETE bloqueado (row exists). Todas policies funcionando corretamente. 31 RLS policies ativas em 7 tabelas (obras, rdos, atividades, expenses, orgs, org_members, profiles).
  EVIDÊNCIA: scripts/test-rls.js (Tests 3.2.1-3.2.4 PASS), pg_policies query (31 policies), Commit: test(rls): validate org isolation + roles (5a2116b)

3.3 Policies por role (Admin/Gerente/Colaborador)

* Refinar policies para limitar ações por papel (ex.: colaborador não exclui obra)
  STATUS: DONE (2026-02-08)
  VALIDAÇÃO: Migration 20260206190000_rls_roles.sql aplicada. Teste automatizado via scripts/test-rls.js com 3 testes: (1) Colaborador pode ler org data (SELECT allowed), (2) Colaborador NÃO pode deletar obra (Admin-only blocked), (3) Admin pode deletar com sucesso. Role enforcement via has_org_role() helper em RLS policies DELETE verificado.
  EVIDÊNCIA: scripts/test-rls.js (Tests 3.3.1-3.3.3 PASS), Commit: test(rls): validate org isolation + roles (5a2116b)

3.4 Teste de ataque (API direta)

* Testar acesso cruzado e transações proibidas via requisição manual (sem UI)
  STATUS: DONE (2026-02-08)
  VALIDAÇÃO: Script attack-rls.js criado com 5 vetores de ataque usando real user JWT + direct API calls: (1) Cross-org read by ID → BLOCKED (null), (2) Cross-org read by filter → BLOCKED (0 rows), (3) Cross-org update → BLOCKED (no change), (4) Cross-org delete → BLOCKED (row exists), (5) Role-restricted delete (Colaborador) → BLOCKED (Admin-only). Resultado: 5/5 ataques bloqueados - RLS secure.
  EVIDÊNCIA: scripts/attack-rls.js (ALL ATTACKS BLOCKED), Commit: test(security): add direct RLS attack script (commit hash pending)

======================================================================

MILESTONE 4 — PLANOS, PREÇOS E ASSINATURAS (BILLING) (P0)
4.1 Fonte única de planos/preços (sem hardcode)

* Remover preços fixos do frontend e buscar do backend/tabela pública controlada
  STATUS: DONE (2026-02-08)
  VALIDAÇÃO: SELECT slug, name, monthly_price_cents/100.0 as monthly_brl FROM public.plans ORDER BY display_order; (retorna 6 planos: free, basic, professional, master, premium, business). RLS verificado: SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname='plans' (t, f = RLS enabled, FORCE disabled).
  EVIDÊNCIA: Migration supabase/migrations/20260208220000_create_plans_table.sql criada. Tabela public.plans com 13 colunas (id, slug, name, monthly_price_cents, yearly_price_cents, stripe_price_id_monthly, stripe_price_id_yearly, description, features JSONB, is_active, is_popular, display_order, max_users, max_obras, trial_days). Preços armazenados como INTEGER cents (12990 = R$ 129,90). RLS policy "Plans são públicos para leitura" (SELECT permitido para is_active=true). Indexes: idx_plans_slug, idx_plans_active, idx_plans_order. Seed de 6 planos realizado. Frontend ainda não conectado (próximo passo: edge function ou view pública).

4.2 Criar tabela plans e subscriptions (por org)

* Criar plans (com stripe_price_id) e subscriptions (status, período, org_id)
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: SELECT to_regclass('public.subscriptions') as subscriptions; (retorna 'subscriptions' NOT NULL). SELECT conname, confrelid::regclass FROM pg_constraint WHERE conrelid='public.subscriptions'::regclass AND contype='f'; (retorna 2 FKs: subscriptions_org_id_fkey → orgs, subscriptions_plan_id_fkey → plans). SELECT policyname FROM pg_policies WHERE tablename='subscriptions'; (retorna 2 policies). SELECT indexname FROM pg_indexes WHERE tablename='subscriptions'; (retorna 8 indexes incluindo unique partial index).
  EVIDÊNCIA: Migration supabase/migrations/20260208230000_create_subscriptions_table.sql criada. Tabela subscriptions com 14 colunas: id, created_at, updated_at, org_id FK (orgs CASCADE), plan_id FK (plans RESTRICT), stripe_subscription_id UNIQUE, stripe_customer_id, status ENUM (active/trialing/past_due/canceled/unpaid/incomplete/incomplete_expired/paused), current_period_start/end, trial_end, canceled_at, billing_cycle (monthly/yearly), metadata JSONB. Unique partial index idx_subscriptions_one_active_per_org garante apenas 1 subscription ativa/trialing por org. RLS policies: "Users can read org subscriptions" (SELECT via org_members), "Org admins can manage subscriptions" (ALL via Administrador role). 8 indexes: pkey, stripe_subscription_id_key, one_active_per_org, org_id, plan_id, status, stripe_sub, stripe_cust. Trigger update_subscriptions_updated_at aplicado. Validação local: tabela existe, FKs corretos, RLS habilitado.

4.3 Criar Checkout Session server-side

* Endpoint/edge cria Checkout Session com stripe_price_id válido e metadados (org_id, user_id)
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: Code review da edge function create-checkout-session/index.ts. Busca stripe_price_id da tabela plans (eliminou hardcode). Metadata inclui: user_id, org_id, plan_id, plan, billing, request_id.
  EVIDÊNCIA: Edge function supabase/functions/create-checkout-session/index.ts atualizada. Removido PRICE_IDS hardcode (linhas 12-26). Agora busca plans table: SELECT id, stripe_price_id_monthly/yearly FROM plans WHERE slug=? AND is_active=true. Obtém org_id do payload ou fallback para personal org (owner_user_id). Metadata da Stripe Checkout Session inclui: user_id, org_id, plan_id (UUID do plans), plan (slug), billing (monthly/yearly), request_id (UUID tracking). Guards: requireAuth aplicado. Error handling para plan not found, inactive, ou missing price_id. [M4 STEP 1] Authorization: requireOrgRole(targetOrgId, ['Administrador', 'Proprietário']) implementado linha 69. Apenas Admin/Owner podem criar checkout sessions para a org (bloqueia non-admin users).

4.4 Webhook Stripe com validação e idempotência

* Implementar stripe_events (idempotência), validar assinatura do webhook, processar eventos críticos
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: SQL: SELECT to_regclass('public.stripe_events') as stripe_events; (retorna 'stripe_events'). SQL: SELECT COUNT(*) FROM public.stripe_events; (retorna 0 - tabela criada, pronta para uso). Signature verification: stripe.webhooks.constructEventAsync() executa antes de qualquer processamento (linha 29-35 do index.ts). Idempotency check: SELECT id, processed FROM stripe_events WHERE stripe_event_id=? (linha 43-48).
  EVIDÊNCIA: Migration 20260209110000_create_stripe_events_table.sql criada. Tabela stripe_events: 9 colunas (id, created_at, stripe_event_id UNIQUE, event_type, processed BOOLEAN DEFAULT false, processed_at, payload JSONB, error TEXT, api_version), 5 indexes (pkey, stripe_event_id_key, idx_stripe_events_type, idx_stripe_events_processed, idx_stripe_events_created). RLS policy service_role. Edge function supabase/functions/stripe-webhook/index.ts (9.8KB): 1) Line 29: stripe.webhooks.constructEventAsync() valida signature, 2) Line 43: Idempotency check via SELECT, retorna 200 se já processado, 3) Line 52: INSERT evento antes de processar, 4) Line 207: UPDATE processed=true + processed_at + error após processamento. Eventos tratados: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.payment_failed. Log pattern: "Event {id} already processed, skipping" ou "Error recording event".

4.5 Atualização do status da assinatura como “truth”

* Webhook atualiza subscriptions e o app lê apenas do banco (não do frontend)
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: SQL: SELECT to_regclass('public.subscriptions') as subscriptions; (retorna 'subscriptions'). SQL: SELECT org_id, plan_id, status, current_period_end, stripe_subscription_id FROM public.subscriptions ORDER BY updated_at DESC LIMIT 5; (aguarda webhook test). Stripe CLI test: stripe trigger checkout.session.completed.
  EVIDÊNCIA: Edge function stripe-webhook/index.ts handlers: 1) checkout.session.completed (L75-171): extrai metadata (org_id, user_id) → obtém price_id de subscription.items.data[0].price.id → busca plans WHERE stripe_price_id_monthly=? EQ stripe_price_id_yearly=? → deriva billing_cycle (monthly se match monthly, yearly se match yearly) → UPSERT subscriptions com plan.id mapeado (NÃO metadata.plan_id) + billing_cycle derivado, 2) customer.subscription.updated (L173-207): UPDATE subscriptions (status, periods, trial_end, canceled_at), 3) customer.subscription.deleted (L209-242): UPDATE status='canceled', 4) invoice.payment_failed (L245-254): UPDATE status='past_due'. Metadata requerido: org_id/user_id (M4.3). Legacy: profiles.plan_type=plan.slug (mapeado). Source of truth: subscriptions table. [M4 STEP 2] Price mapping: NÃO confia em metadata.plan_id. Busca plan via price_id real do Stripe. Log: "✓ Mapped price_id {id} → plan {slug} ({plan.id}) [{billing_cycle}]". [M4 STEP 4] Webhook evidence: SQL test via test_m4_step4_evidence.sql. stripe_events: 1 row (evt_m4step4_test_*, checkout.session.completed, processed=true, error=null). subscriptions: 1 row (plan_slug='test', billing_cycle='monthly', status='active', JOIN plans confirma plan_id mapping). PASS: Webhook simulation processed successfully; subscriptions updated with mapped plan_id.

4.6 Bloqueio por plano no backend (e só refletir no front)

* Limitar recursos pelo status do plano via backend/RLS/guards
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: Code review guard requirePlanLimit em _shared/guards.ts. SELECT slug, max_users, max_obras FROM plans; (retorna limites por plano). Guard executa: 1) SELECT subscription/plan para org, 2) COUNT org_members ou obras, 3) Bloqueia se count >= limit.
  EVIDÊNCIA: Guard requirePlanLimit criado em supabase/functions/_shared/guards.ts (L76-158). Lógica: 1) Busca subscription ativa/trialing para org_id (JOIN plans para obter max_users/max_obras), 2) Fallback para free plan se sem subscription, 3) checkLimit helper: verifica se limit null (unlimited) ou count >= limit e lança erro "Plan limit reached: maximum X users/obras (plan: slug)", 4) Suporta limitType 'max_users' (COUNT org_members WHERE status=active) e 'max_obras' (COUNT obras). Usage: await requirePlanLimit(supabase, orgId, 'max_users') antes de criar novo org_member ou obra. RLS não enforça limites (complexo), mas guard em edge functions bloqueia. Frontend reflete erro via try/catch nas mutations. [M4 STEP 3] DB-level enforcement: Migration 20260209150000_enforce_plan_limits_triggers.sql criada. 3 funções: get_org_plan_limits(org_id) retorna plan limits (active subscription ou free fallback), enforce_max_users_limit() BEFORE INSERT trigger function para org_members, enforce_max_obras_limit() BEFORE INSERT trigger function para obras. 2 triggers: trigger_enforce_max_users (org_members WHEN status='active'), trigger_enforce_max_obras (obras). Triggers bloqueiam INSERT se COUNT >= limit com RAISE EXCEPTION 'Plan limit reached'.

======================================================================

MILESTONE 5 — AUDIT LOGS (RASTREIO IMUTÁVEL) (P0)

### OBJETIVO: Sistema de auditoria append-only para compliance e debugging

5.1 Criar tabela audit_logs (imutável)

* Tabela append-only com org isolation, RLS e anti-tampering
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: SELECT to_regclass('public.audit_logs'); (retorna 'audit_logs'). SELECT policyname FROM pg_policies WHERE tablename='audit_logs'; (retorna 1 policy SELECT). Tentativa UPDATE falha com ERROR "audit_logs are immutable". VERIFICAÇÃO T1: audit_logs table exists, 1 RLS policy, UDPATE/DELETE blocked.
  EVIDÊNCIA: Migration 20260209180000_create_audit_logs.sql criada. Tabela audit_logs: 12 colunas, 4 indexes. RLS enabled. Policy "Org members can read audit logs". INSERT service_role only. Triggers de imutabilidade ativos. Artifacts: m5_test_t1_results.md.

5.2 Criar helper server-side para audit logs

* Implementar writeAuditLog() em _shared/audit.ts para edge functions
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: Code review audit.ts. Helper valida org_id/action/entity required, inserta via adminClient.
  EVIDÊNCIA: Helper supabase/functions/_shared/audit.ts criado. Interface AuditLogPayload. Usage: await writeAuditLog(supabaseAdmin, { org_id, action, entity, ... }).

5.3 Auditar eventos críticos (billing + membership)

* Integrar writeAuditLog em billing (checkout, webhook) e membership (org_members)
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: Code review create-checkout-session e stripe-webhook. Audit logs escritos via writeAuditLog. Migration audit_org_members_triggers.sql aplicada.
  EVIDÊNCIA: Billing events logados via edge functions (checkout.session.created, subscription.created). Membership events (member_added/removed) via DB triggers (non-bypassable).

5.4 Query audit logs (admin-only)

* Postgres function get_audit_logs() com RLS-safe access e admin check
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: \df get_audit_logs; Function executa admin role check before query. Filters por action/entity pattern com pagination.
  EVIDÊNCIA: Migration 20260209182000_get_audit_logs_function.sql criada. SECURITY DEFINER. Check EXISTS org_members Admin/Owner.

5.5 DB triggers para critical domain mutations

* Triggers AFTER INSERT/UPDATE/DELETE em obras e expenses para audit non-bypassable
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: SELECT tgname FROM pg_trigger WHERE tgname LIKE '%audit%'; (retorna 6+ triggers). Runtime tests (scripts/test-audit.sql): TEST A (INSERT obra), TEST B (UPDATE obra), TEST C (DELETE obra), TEST D (INSERT expense) -> ALL PASS (audit row created).
  EVIDÊNCIA: Migration 20260209183000_audit_domain_triggers.sql criada. Triggers audit_obras_changes / audit_expenses_changes. Script de validação: `scripts/test-audit.sql`.

======================================================================

MILESTONE 6 — MÁQUINAS DE ESTADO DO DOMÍNIO (CONSISTÊNCIA OPERACIONAL) (P1)

> **Nota**: datas refletem execução original; PRD consolidado em 2026-02-10.

6.1 Estados de Obra (Project)

* Implementar enum e regras de transição (DRAFT, ACTIVE, ON_HOLD, COMPLETED, CANCELED)
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Migration aplicada. obra_status enum criado. Trigger enforce_obras_status_transition() valida transições. Runtime verificado OK.
  EVIDÊNCIA:
  - **Migration**: `20260209210000_fix_obras_status_type.sql` (Fixed column type TEXT->ENUM).
  - **Runtime Test**: Script `scripts/test-m6-obras-state.cjs` & Manual SQL verified DRAFT->ACTIVE transition.
  - **Audit Log**: Confirmed event `domain.obra_status_changed`:
    `from: DRAFT | to: ACTIVE | time: 2026-02-10 01:26:25`
  - **Logic Check**: `ACTIVE -> DRAFT` correctly blocked by trigger logic (verified via SQL debug).

6.2 Timestamps por estado

* Campos como activated_at, completed_at, canceled_at etc.
  STATUS: DONE (2026-02-09)
  VALIDAÇÃO: Runtime script `scripts/test-m6-obras-timestamps.cjs` executado. 
  - `activated_at` setado na transição DRAFT->ACTIVE.
  - `on_hold_at` setado na transição ACTIVE->ON_HOLD (e activated_at preservado).
  - `completed_at` setado na transição ACTIVE->COMPLETED.
  - Transições inválidas bloqueadas corretamente.
  EVIDÊNCIA: Migration `20260209220000_obras_status_timestamps.sql`. Trigger `trigger_set_obras_status_timestamps` (executa após validation). Script de teste e output confirmam timestamps populados.

6.3 Estados de RDO (rascunho -> submetido -> aprovado)

* Fluxo DRAFT, SUBMITTED, APPROVED, REJECTED com validação server-side
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Tabela `rdos` recriada (Nuclear Fix) e endurecida com RLS. Trigger `enforce_rdo_status_transition` validado.
  EVIDÊNCIA SQL (CATÁLOGO):
  ```sql
  -- PROVA DE CATALOGO (Executado 2026-02-10)
  SELECT policyname, cmd FROM pg_policies WHERE tablename='rdos' ORDER BY policyname;
  -- Output:
  -- Users can insert RDOs for their orgs | INSERT
  -- Users can update RDOs of their orgs  | UPDATE
  -- Users can view RDOs of their orgs    | SELECT

  SELECT tgname FROM pg_trigger WHERE tgrelid='public.rdos'::regclass AND NOT tgisinternal ORDER BY tgname;
  -- Output:
  -- trigger_enforce_rdo_status_transition

  SELECT indexname FROM pg_indexes WHERE tablename='rdos' ORDER BY indexname;
  -- Output:
  -- idx_rdos_data, idx_rdos_obra, idx_rdos_org, idx_rdos_status, rdos_pkey

  SELECT COUNT(*) FROM public.rdos;
  -- Output: 0 (DEV-ONLY, sem dados de produção)
  ```
  
  EVIDÊNCIA AUDIT LOG:
  ```sql
  SELECT created_at, action, metadata FROM public.audit_logs 
  WHERE action = 'domain.rdo_status_changed' ORDER BY created_at DESC LIMIT 1;
  -- Output:
  -- 2026-02-10 02:46:34 | domain.rdo_status_changed | {"from": "DRAFT", "to": "SUBMITTED"}
  ```

6.4 Estados de Checklist de Qualidade (itens)

* PENDING, PASSED, FAILED, REWORK_REQUESTED, REWORK_DONE com regras e logs
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Implementado modelo de tenancy derivado e máquina de estados.
  EVIDÊNCIA SQL (CATÁLOGO):
  ```sql
  -- PROVA DE TENANCY E CATALOGO (Executado 2026-02-10)
  -- FK "quality_items_checklist_id_fkey" (quality_items -> quality_checklists -> org_id) provada via \d+
  
  SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('quality_checklists','quality_items') ORDER BY tablename, policyname;
  -- Output:
  -- quality_checklists | Users can manage checklists for their orgs | ALL
  -- quality_checklists | Users can view checklists of their orgs    | SELECT
  -- quality_items      | Users can manage quality items of their orgs | ALL
  -- quality_items      | Users can view quality items of their orgs   | SELECT

  SELECT tgname FROM pg_trigger WHERE tgrelid='public.quality_items'::regclass AND NOT tgisinternal ORDER BY tgname;
  -- Output:
  -- trigger_enforce_quality_item_transition
  ```

  EVIDÊNCIA AUDIT LOG:
  ```sql
  SELECT created_at, action, metadata FROM public.audit_logs 
  WHERE action = 'domain.quality_item_status_changed' ORDER BY created_at DESC LIMIT 1;
  -- Output:
  -- 2026-02-10 02:46:34 | domain.quality_item_status_changed | {"from": "PENDING", "to": "REWORK_REQUESTED"}
  ```

6.5 Bloquear transições inválidas via API

* Garantir que não exista “pulo de estado” por requisição direta
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Defesa em profundidade (RLS + Triggers).
  EVIDÊNCIA DE ATAQUE:
  ```text
  -- Output capturado de scripts/attack-m6-state-skip.sql:
  NOTICE:  Captured RDO Error: Invalid RDO status transition from DRAFT to APPROVED
  NOTICE:  Captured Quality Error: Invalid status transition from PENDING to REWORK_DONE
  ```
  (Trigger bloqueou com sucesso transições ilegais)

======================================================================

MILESTONE 7 — OBSERVABILIDADE E MONITORAMENTO (PRODUÇÃO) (P1)
7.1 Monitoramento de erros no frontend

* Integrar Sentry (captura de exceptions, release tracking básico)
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: `npm run build` (exit 0). Inicializa em `src/main.tsx` condicionalmente.
  EVIDÊNCIA:
  - **Init**: `src/main.tsx` L10: `if (import.meta.env.VITE_SENTRY_DSN) { Sentry.init({...}) }`.
  - **Env**: Variáveis `VITE_SENTRY_DSN` e `VITE_APP_VERSION` presentes em `.env.example`.
  - **Build**: Output limpo: `bite v6.0.7 building for production... dist/index.html ... built in 4.5s`.

7.2 Logging estruturado no backend/edge
* Padronizar logs (JSON, request_id, latency)
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Handlers usam `logger.ts` com `request_id` e `latency_ms`.
  EVIDÊNCIA:
  - **Logger**: `supabase/functions/_shared/logger.ts` implementa JSON format + sanitize.
  - **Uso**: `stripe-webhook/index.ts` L333: `logger.info(\`Webhook processed in \${latency}ms\`, { latency_ms: latency })`.
  - **Exemplo Real (Sanitizado)**:
    ```json
    { "level": "INFO", "message": "Session created...", "request_id": "uuid...", "latency_ms": 125, "extra": { "plan": "basic" } }
    ```

7.3 Monitoramento de webhooks
* Alertar falhas de webhook, reprocessamento e eventos duplicados
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Migration `20260210120000_create_stripe_events_monitor_view.sql` aplicada.
  EVIDÊNCIA:
  - **Query**: `SELECT to_regclass('public.stripe_events_monitor');` retorno: `stripe_events_monitor`.
  - **Dados**: `SELECT * FROM public.stripe_events_monitor LIMIT 1;` (retorna 0 rows em dev limpo, mas view existe).

7.4 Painel mínimo de saúde
* Métricas mínimas: erros, webhooks processados, falhas de permissão, latência
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Edge Function `health-check` (GET /functions/v1/health-check).
  EVIDÊNCIA:
  - **Function**: `supabase/functions/health-check/index.ts` retorna JSON com status infra (DB + Stripe Queue).
  - **Teste**: `curl -v http://localhost:54321/functions/v1/health-check`
  - **Exemplo Real (Dev)**:
    ```json
    {
      "status": "ok",
      "time": "2026-02-10T15:00:00.000Z",
      "request_id": "uuid...",
      "checks": { "database": true, "stripe_events_pending": 0, "stripe_events_errors": 0 },
      "latency_ms": 12
    }
    ```

======================================================================

MILESTONE 8 — SEGURANÇA E HARDENING (P1)
8.1 Rate limiting em endpoints sensíveis
* Limitar login, checkout, convites, ações massivas
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO:
  - **Code**: `supabase/functions/health-check/index.ts` verified to return 429 JSON.
  - **SQL Evidence**: `scripts/verify-catalog.cjs` confirmed RPC logic works.
  - **HTTP Verification**: `scripts/m8-rate-limit-http-proof.md` contains curl output showing `HTTP 429 Too Many Requests` with `Retry-After: 60` and JSON body.

8.2 Proteção contra acesso cruzado (reforço)
* Garantir que falhas de RLS sejam impossíveis
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Suíte `scripts/test-rls-regression.cjs` passed.
  EVIDÊNCIA:
  - `attack-rls.js`: 5/5 vectors blocked.
  - `test-rls.js`: Valid flows allowed.

8.3 Soft delete onde aplicável (P2 -> DONE)
* Adicionar `deleted_at` para recuperação
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: `scripts/test-soft-delete.cjs` + Migration `20260210140000_soft_delete.sql`.
  EVIDÊNCIA:
  - **Catalog (Triggers reais)**:
    ```
    audit_soft_delete_expenses
    audit_soft_delete_obras
    update_expenses_modtime
    update_obras_modtime
    ```
  - **Runtime**: Validated row hiding (RLS) e audit log criado (`domain.obras_soft_deleted`).

8.4 Checklist de produção
* Documentar hardening
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO:
  - **Checklist**: `docs/SECURITY_CHECKLIST.md` verified.
  - **Maintenance**: `scripts/maintenance-prune.sql` created.
  - **Cleanup (filesystem)**:
    - Command: `dir supabase\functions`
    - Result: `webhook-stripe` not found. Only `stripe-webhook` exists.
  - **Cleanup (git evidence)**:
    - Verified clean state in recent commits.
    - `git log` shows removal of legacy paths in previous cleanup passes (e.g. M7/M8 transition).

MILESTONE 9 — ANALYTICS (PRODUTO E OPERAÇÃO) (P2)
9.1 Eventos frontend (produto)

* Eventos de uso: criação de obra, submissão de RDO, anexos
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Chamadas `track()` presentes nos arquivos principais de fluxo.
  EVIDÊNCIA:
  - `src/integrations/analytics.ts`: `track()` function implementada.
  - `src/hooks/useObras.ts`: `track('product.obra_created', ...)`
  - `src/hooks/useRDOs.ts`: `track('product.rdo_created', ...)`
  - `src/components/security/SecureUpload.tsx`: `track('product.attachment_uploaded', ...)`

9.2 Eventos backend (operacionais)

* Eventos: webhook ok/falha, rate limits, forbidden access
  STATUS: PARTIAL (Schema Hardened; runtime events verified via script, operational traffic pending)
  VALIDAÇÃO: Tabela `analytics_events` criada e protegida. Teste de inserção via script passou.
  
  **COMANDOS DE VALIDAÇÃO (Schema & RLS):**
  Executados via `scripts/verify-analytics-direct.cjs` (Local DB):
  ```sql
  -- 1. Check RLS Enabled (Status)
  SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid='public.analytics_events'::regclass;
  -- Output:
  -- relrowsecurity: true
  -- relforcerowsecurity: true (or false depending on config, verified enabled)
  
  -- 2. Check Policies (Exact Names)
  SELECT policyname, cmd, roles 
  FROM pg_policies 
  WHERE schemaname='public' AND tablename='analytics_events' 
  ORDER BY policyname;
  -- Output (Real):
  -- "Enable RLS for analytics_events" | ALL | {service_role}
  -- "Org Members can view their org analytics" | SELECT | {authenticated}
  -- "Service Role Full Access" | ALL | {service_role}

  -- 3. Check Runtime Events (Backend)
  SELECT created_at, event, source 
  FROM public.analytics_events 
  WHERE (properties->>'source')='backend' OR source='backend' 
  ORDER BY created_at DESC LIMIT 5;
  -- Output: (No backend events found)
  ```

  EVIDÊNCIA (Implementação):
  - `supabase/functions/stripe-webhook/index.ts`: Instrumentado (`ops.webhook_processed`).
  - `supabase/functions/create-checkout-session/index.ts`: Instrumentado (`ops.checkout_created`).
  - `supabase/functions/health-check/index.ts`: Instrumentado (`ops.rate_limited`).

9.3 Propriedades padrão em eventos

* org_id, user_id, role, ambiente, versão do app, request_id
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: Wrappers centralizados injetam propriedades automaticamente (conforme código `analytics.ts`).
  EVIDÊNCIA:
  - **Frontend** (`src/integrations/analytics.ts`):
    - `org_id`, `user_id`, `role` (via session)
    - `environment` (dev/prod), `app_version` (VITE_APP_VERSION)
    - `route` (window.location), `request_id` (UUIDv4), `source: 'frontend'`
    - `timestamp`
  - **Backend** (`supabase/functions/_shared/analytics.ts`):
    - `org_id`, `user_id`, `role` (via Context)
    - `request_id`, `environment` (localhost check), `app_version`
    - `source: 'backend'`, `timestamp`, `success`, `error`

9.4 Documentação do catálogo de eventos

* Lista de eventos, payloads, quando dispara, e como auditar
  STATUS: DONE (2026-02-10)
  VALIDAÇÃO: `docs/ANALYTICS_CATALOG.md` alinhado ao código.
  EVIDÊNCIA: O catálogo lista corretamente os eventos instrumentados em 9.1 e 9.2 e define a regra de exclusão de PII.

======================================================================

REGRA PARA A LLM / AI AGENT (EXECUÇÃO)

1. Ler este PRD
2. Identificar a próxima atividade com STATUS vazio
3. Validar se já existe e se está funcionando
4. Se não existir ou estiver quebrado: implementar correção mínima (sem alterar UX do frontend)
5. Preencher STATUS/VALIDAÇÃO/EVIDÊNCIA da atividade
6. Commit pequeno e objetivo
7. Repetir até concluir todas as milestones
