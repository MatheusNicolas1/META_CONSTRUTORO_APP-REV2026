# PRD_INTEGRACAO_ERP - Integracao com ERP

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Integracao com ERP

## 1. Objetivo

Permitir troca controlada de dados com ERPs de construcao e gestao empresarial, como Totvs, Sankhya, Oracle, SAP e outros, via webhook ou API, com logs de sincronizacao e fila de reprocessamento.

O modulo deve ser liberado apenas para planos Master ou Enterprise/equivalente, conforme contrato comercial vigente.

## 2. Escopo

### 2.1 Incluido

- Configuracao de endpoints de saida para enviar despesas, notas fiscais e medicoes aprovadas.
- Configuracao de endpoints de entrada para receber orcamento aprovado, fornecedores e precos de insumos.
- Log de sincronizacao com status `sucesso`, `erro`, `pendente`.
- Fila de webhooks/eventos com retries e idempotencia.
- Sincronizacao manual e automatica/agendada.
- Gate por plano da organizacao.

### 2.2 Fora de escopo

- Conector certificado especifico de cada ERP no MVP.
- Transformacoes fiscais complexas.
- ETL historico massivo.
- Sincronizacao bidirecional em tempo real garantida.

## 3. Regras de negocio

- Apenas organizacoes em plano habilitado podem ativar ERP.
- Cada configuracao deve pertencer a uma `org_id`.
- Credenciais devem ser armazenadas com protecao adequada; evitar expor secrets no frontend.
- Eventos de saida devem ser idempotentes por entidade, tipo e versao.
- Eventos de entrada devem validar assinatura/token antes de gravar qualquer dado.
- Falhas devem ficar em `webhook_queue` para retry manual/automatico.
- Logs devem preservar payload resumido, status, erro e resposta, mascarando dados sensiveis.
- Medicoes aprovadas so podem ser enviadas apos aprovacao financeira.
- Despesas devem respeitar status aprovado quando a configuracao exigir.

## 4. Tabelas

### 4.1 Tabelas novas

`integracao_erp_config`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `provider` | text | `totvs`, `sankhya`, `oracle`, `sap`, `custom` |
| `nome` | text | obrigatorio |
| `enabled` | boolean | default `false` |
| `sync_mode` | text | `manual`, `automatico`, `agendado` |
| `outbound_endpoints` | jsonb | despesas, nf, medicoes |
| `inbound_endpoints` | jsonb | orcamento, fornecedores, insumos |
| `auth_type` | text | `api_key`, `oauth2`, `basic`, `signature`, `none` |
| `credentials_ref` | text | referencia segura/secret |
| `mapping` | jsonb | mapeamento de campos |
| `last_sync_at` | timestamptz | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`sync_logs`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `config_id` | uuid FK `integracao_erp_config(id)` | opcional |
| `direction` | text | `inbound` ou `outbound` |
| `entity_type` | text | `expense`, `invoice`, `medicao`, `fornecedor`, `orcamento`, `insumo` |
| `entity_id` | uuid | opcional |
| `status` | text | `sucesso`, `erro`, `pendente`, `ignorado` |
| `request_payload` | jsonb | mascarado |
| `response_payload` | jsonb | mascarado |
| `error_message` | text | opcional |
| `attempt` | integer | default `1` |
| `started_at` | timestamptz | default `now()` |
| `finished_at` | timestamptz | opcional |

`webhook_queue`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `config_id` | uuid FK `integracao_erp_config(id)` | opcional |
| `direction` | text | `inbound` ou `outbound` |
| `event_type` | text | obrigatorio |
| `entity_type` | text | obrigatorio |
| `entity_id` | uuid | opcional |
| `payload` | jsonb | obrigatorio |
| `status` | text | `pendente`, `processando`, `sucesso`, `erro`, `cancelado` |
| `attempts` | integer | default `0` |
| `max_attempts` | integer | default `5` |
| `available_at` | timestamptz | default `now()` |
| `processed_at` | timestamptz | opcional |
| `idempotency_key` | text | unico por `org_id` |
| `last_error` | text | opcional |
| `created_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_integracao_erp_org_enabled` em `(org_id, enabled)`.
- `idx_sync_logs_org_status_started` em `(org_id, status, started_at desc)`.
- `idx_sync_logs_entity` em `(org_id, entity_type, entity_id)`.
- `idx_webhook_queue_available` em `(status, available_at)`.
- `idx_webhook_queue_idempotency` unico em `(org_id, idempotency_key)`.

### 4.3 RLS

- `integracao_erp_config`:
  - `SELECT`: membros da org.
  - `INSERT/UPDATE/DELETE`: `Presidente` e `Administrador`; `Gerente` apenas se liberado.
- `sync_logs`:
  - `SELECT`: membros da org.
  - `INSERT`: service role/Edge Functions; frontend nao deve inserir logs diretamente.
  - `UPDATE/DELETE`: bloqueado para frontend.
- `webhook_queue`:
  - `SELECT`: gestores da org.
  - `INSERT/UPDATE`: service role/Edge Functions.
  - `DELETE`: service role ou cancelamento controlado.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- Existe `public.integrations`, mas o check constraint de `service` aceita apenas `whatsapp`, `gmail`, `drive`, `googledrive`, `google_drive` e `n8n`. Nao e compativel com ERP sem migration de alteracao.
- Decisao proposta: criar `integracao_erp_config` em vez de sobrecarregar `public.integrations`.
- Existem Edge Functions de integracoes (`whatsapp-integration`, `gmail-integration`, `google-drive-integration`, `n8n-integration`) que servem como referencia de padrao, mas nao implementam ERP.
- Existem `plans` e `subscriptions`. `plans` inclui `master`, `premium` e `business`, mas nao foi identificado slug `enterprise` nas migrations locais.
- Gate recomendado no MVP: liberar para `master`, `premium` e `business`, ou criar/renomear plano `enterprise` em decisao comercial posterior.
- `public.expenses`, `public.fornecedores`, `public.obras` e a proposta de `medicoes_contrato` serao fontes de eventos.
- Nao foram encontradas tabelas `integracao_erp_config`, `sync_logs` ou `webhook_queue`; sem conflito nominal com nomes propostos.

## 5. Endpoints e Edge Functions

- `erp-webhook-inbound`: endpoint publico controlado para receber eventos do ERP.
- `erp-sync-manual`: dispara sincronizacao manual de uma entidade ou periodo.
- `erp-sync-dispatcher`: processa `webhook_queue` e envia eventos outbound.
- `erp-test-connection`: valida endpoint, autenticacao e mapping.
- `erp-schedule-sync`: rotina agendada para modo automatico/agendado.
- Todas devem validar plano, `org_id`, role e idempotencia.

## 6. Telas e UX

- Rota recomendada: `/app/integracoes/erp`.
- Aba `Configuracao`: provider, endpoints, auth, mapping e teste de conexao.
- Aba `Eventos`: fila de webhooks com status, tentativas e retry manual.
- Aba `Logs`: historico filtravel por status, entidade, periodo e direcao.
- Aba `Permissoes`: mostra se o plano atual permite ERP.
- Alertas claros para plano nao habilitado, credencial ausente e falha de webhook.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useIntegracaoERP.ts`.
- Query keys:
  - `['integracao-erp-config', orgId]`
  - `['integracao-erp-logs', orgId, filters]`
  - `['integracao-erp-queue', orgId, filters]`
  - `['integracao-erp-plan-gate', orgId]`
- Usar `useRequireOrg`.
- Nunca retornar credenciais completas para o frontend.
- Mutations de teste/sync manual devem chamar Edge Functions.

## 8. Testes

- Unitarios para gate de plano.
- Unitarios para idempotency key e retry.
- Teste de masking de payload sensivel.
- Testes RLS garantindo que usuario comum nao altera configuracao.
- Teste de Edge Function inbound com token invalido e valido.
- Teste de outbound mockado com status sucesso/erro.
- Playwright para configuracao, teste de conexao e visualizacao de logs.
- Regressao em `/app/integracoes` atual.

## 9. Criterios de aceite

- Organizacao em plano habilitado configura ERP e testa conexao.
- Organizacao sem plano habilitado ve bloqueio claro e nao consegue ativar.
- Despesa/medicao aprovada gera evento outbound quando configurado.
- Webhook inbound valido cria/atualiza dado permitido ou fica pendente para revisao.
- Erros ficam registrados em `sync_logs` e `webhook_queue`.
- Retry manual funciona e preserva idempotencia.
- Credenciais nao aparecem no frontend nem em logs.
- Build, lint e testes existentes continuam passando apos implementacao.

## 10. Dependencias

- Depende de `orgs`, `org_members`, `plans`, `subscriptions` e helpers RLS.
- Depende de `expenses` para despesas/notas fiscais.
- Depende do PRD_GESTAO_CONTRATOS_MEDICOES para sincronizar medicoes aprovadas.
- Pode depender do PRD_FLUXO_CAIXA_CURVA_ABC para enviar/receber previsoes financeiras.
- Deve ficar por ultimo na ordem de implementacao por depender de decisoes comerciais, seguranca de credenciais e contratos de API externos.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido

- Migration: `supabase/migrations/20260607000000_prd_erp_tables.sql` (3 tabelas: integracao_erp_config, sync_logs, webhook_queue)
- Hook: `src/hooks/useIntegracaoERP.ts` (React Query com configuracoes, logs, fila, gate de plano)
- Pagina: `src/pages/IntegracaoERP.tsx` (`/app/integracoes/erp` com abas: Configuracao, Eventos, Logs, Permissoes)
- Rota: `/app/integracoes/erp` (protegida: Presidente, Administrador)

## 12. Edge Functions complementares

| Função | Arquivo | Função |
|---|---|---|
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Disparo de eventos webhook |

RPCs SQL:
- `obter_status_sync_erp(p_org_id)` — status da integração
- `obter_eventos_fila_webhook(p_org_id, p_status, p_limite)` — fila de eventos

## 13. Pendente para produção
- Implementar adaptadores por provedor (Omie, ContaAzul, etc.)
- Definir gate de plano enterprise
- Configurar webhooks reais com provedores
- Testes de segurança de credenciais
