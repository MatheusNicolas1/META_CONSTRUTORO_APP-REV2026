1|# PRD_INTEGRACAO_ERP - Integracao com ERP
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Integracao com ERP
8|
9|## 1. Objetivo
10|
11|Permitir troca controlada de dados com ERPs de construcao e gestao empresarial, como Totvs, Sankhya, Oracle, SAP e outros, via webhook ou API, com logs de sincronizacao e fila de reprocessamento.
12|
13|O modulo deve ser liberado apenas para planos Master ou Enterprise/equivalente, conforme contrato comercial vigente.
14|
15|## 2. Escopo
16|
17|### 2.1 Incluido
18|
19|- Configuracao de endpoints de saida para enviar despesas, notas fiscais e medicoes aprovadas.
20|- Configuracao de endpoints de entrada para receber orcamento aprovado, fornecedores e precos de insumos.
21|- Log de sincronizacao com status `sucesso`, `erro`, `pendente`.
22|- Fila de webhooks/eventos com retries e idempotencia.
23|- Sincronizacao manual e automatica/agendada.
24|- Gate por plano da organizacao.
25|
26|### 2.2 Fora de escopo
27|
28|- Conector certificado especifico de cada ERP no MVP.
29|- Transformacoes fiscais complexas.
30|- ETL historico massivo.
31|- Sincronizacao bidirecional em tempo real garantida.
32|
33|## 3. Regras de negocio
34|
35|- Apenas organizacoes em plano habilitado podem ativar ERP.
36|- Cada configuracao deve pertencer a uma `org_id`.
37|- Credenciais devem ser armazenadas com protecao adequada; evitar expor secrets no frontend.
38|- Eventos de saida devem ser idempotentes por entidade, tipo e versao.
39|- Eventos de entrada devem validar assinatura/token antes de gravar qualquer dado.
40|- Falhas devem ficar em `webhook_queue` para retry manual/automatico.
41|- Logs devem preservar payload resumido, status, erro e resposta, mascarando dados sensiveis.
42|- Medicoes aprovadas so podem ser enviadas apos aprovacao financeira.
43|- Despesas devem respeitar status aprovado quando a configuracao exigir.
44|
45|## 4. Tabelas
46|
47|### 4.1 Tabelas novas
48|
49|`integracao_erp_config`
50|
51|| Coluna | Tipo | Regra |
52|| --- | --- | --- |
53|| `id` | uuid PK | `gen_random_uuid()` |
54|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
55|| `provider` | text | `totvs`, `sankhya`, `oracle`, `sap`, `custom` |
56|| `nome` | text | obrigatorio |
57|| `enabled` | boolean | default `false` |
58|| `sync_mode` | text | `manual`, `automatico`, `agendado` |
59|| `outbound_endpoints` | jsonb | despesas, nf, medicoes |
60|| `inbound_endpoints` | jsonb | orcamento, fornecedores, insumos |
61|| `auth_type` | text | `api_key`, `oauth2`, `basic`, `signature`, `none` |
62|| `credentials_ref` | text | referencia segura/secret |
63|| `mapping` | jsonb | mapeamento de campos |
64|| `last_sync_at` | timestamptz | opcional |
65|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
66|| `created_at` | timestamptz | default `now()` |
67|| `updated_at` | timestamptz | trigger padrao |
68|
69|`sync_logs`
70|
71|| Coluna | Tipo | Regra |
72|| --- | --- | --- |
73|| `id` | uuid PK | `gen_random_uuid()` |
74|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
75|| `config_id` | uuid FK `integracao_erp_config(id)` | opcional |
76|| `direction` | text | `inbound` ou `outbound` |
77|| `entity_type` | text | `expense`, `invoice`, `medicao`, `fornecedor`, `orcamento`, `insumo` |
78|| `entity_id` | uuid | opcional |
79|| `status` | text | `sucesso`, `erro`, `pendente`, `ignorado` |
80|| `request_payload` | jsonb | mascarado |
81|| `response_payload` | jsonb | mascarado |
82|| `error_message` | text | opcional |
83|| `attempt` | integer | default `1` |
84|| `started_at` | timestamptz | default `now()` |
85|| `finished_at` | timestamptz | opcional |
86|
87|`webhook_queue`
88|
89|| Coluna | Tipo | Regra |
90|| --- | --- | --- |
91|| `id` | uuid PK | `gen_random_uuid()` |
92|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
93|| `config_id` | uuid FK `integracao_erp_config(id)` | opcional |
94|| `direction` | text | `inbound` ou `outbound` |
95|| `event_type` | text | obrigatorio |
96|| `entity_type` | text | obrigatorio |
97|| `entity_id` | uuid | opcional |
98|| `payload` | jsonb | obrigatorio |
99|| `status` | text | `pendente`, `processando`, `sucesso`, `erro`, `cancelado` |
100|| `attempts` | integer | default `0` |
101|| `max_attempts` | integer | default `5` |
102|| `available_at` | timestamptz | default `now()` |
103|| `processed_at` | timestamptz | opcional |
104|| `idempotency_key` | text | unico por `org_id` |
105|| `last_error` | text | opcional |
106|| `created_at` | timestamptz | default `now()` |
107|
108|### 4.2 Indices
109|
110|- `idx_integracao_erp_org_enabled` em `(org_id, enabled)`.
111|- `idx_sync_logs_org_status_started` em `(org_id, status, started_at desc)`.
112|- `idx_sync_logs_entity` em `(org_id, entity_type, entity_id)`.
113|- `idx_webhook_queue_available` em `(status, available_at)`.
114|- `idx_webhook_queue_idempotency` unico em `(org_id, idempotency_key)`.
115|
116|### 4.3 RLS
117|
118|- `integracao_erp_config`:
119|  - `SELECT`: membros da org.
120|  - `INSERT/UPDATE/DELETE`: `Presidente` e `Administrador`; `Gerente` apenas se liberado.
121|- `sync_logs`:
122|  - `SELECT`: membros da org.
123|  - `INSERT`: service role/Edge Functions; frontend nao deve inserir logs diretamente.
124|  - `UPDATE/DELETE`: bloqueado para frontend.
125|- `webhook_queue`:
126|  - `SELECT`: gestores da org.
127|  - `INSERT/UPDATE`: service role/Edge Functions.
128|  - `DELETE`: service role ou cancelamento controlado.
129|
130|### 4.4 Validacao de compatibilidade Supabase
131|
132|Validado contra migrations locais em 2026-05-31.
133|
134|- Existe `public.integrations`, mas o check constraint de `service` aceita apenas `whatsapp`, `gmail`, `drive`, `googledrive`, `google_drive` e `n8n`. Nao e compativel com ERP sem migration de alteracao.
135|- Decisao proposta: criar `integracao_erp_config` em vez de sobrecarregar `public.integrations`.
136|- Existem Edge Functions de integracoes (`whatsapp-integration`, `gmail-integration`, `google-drive-integration`, `n8n-integration`) que servem como referencia de padrao, mas nao implementam ERP.
137|- Existem `plans` e `subscriptions`. `plans` inclui `master`, `premium` e `business`, mas nao foi identificado slug `enterprise` nas migrations locais.
138|- Gate recomendado no MVP: liberar para `master`, `premium` e `business`, ou criar/renomear plano `enterprise` em decisao comercial posterior.
139|- `public.expenses`, `public.fornecedores`, `public.obras` e a proposta de `medicoes_contrato` serao fontes de eventos.
140|- Nao foram encontradas tabelas `integracao_erp_config`, `sync_logs` ou `webhook_queue`; sem conflito nominal com nomes propostos.
141|
142|## 5. Endpoints e Edge Functions
143|
144|- `erp-webhook-inbound`: endpoint publico controlado para receber eventos do ERP.
145|- `erp-sync-manual`: dispara sincronizacao manual de uma entidade ou periodo.
146|- `erp-sync-dispatcher`: processa `webhook_queue` e envia eventos outbound.
147|- `erp-test-connection`: valida endpoint, autenticacao e mapping.
148|- `erp-schedule-sync`: rotina agendada para modo automatico/agendado.
149|- Todas devem validar plano, `org_id`, role e idempotencia.
150|
151|## 6. Telas e UX
152|
153|- Rota recomendada: `/app/integracoes/erp`.
154|- Aba `Configuracao`: provider, endpoints, auth, mapping e teste de conexao.
155|- Aba `Eventos`: fila de webhooks com status, tentativas e retry manual.
156|- Aba `Logs`: historico filtravel por status, entidade, periodo e direcao.
157|- Aba `Permissoes`: mostra se o plano atual permite ERP.
158|- Alertas claros para plano nao habilitado, credencial ausente e falha de webhook.
159|
160|## 7. Hooks, queryKeys e integracao frontend
161|
162|- Criar `src/hooks/useIntegracaoERP.ts`.
163|- Query keys:
164|  - `['integracao-erp-config', orgId]`
165|  - `['integracao-erp-logs', orgId, filters]`
166|  - `['integracao-erp-queue', orgId, filters]`
167|  - `['integracao-erp-plan-gate', orgId]`
168|- Usar `useRequireOrg`.
169|- Nunca retornar credenciais completas para o frontend.
170|- Mutations de teste/sync manual devem chamar Edge Functions.
171|
172|## 8. Testes
173|
174|- Unitarios para gate de plano.
175|- Unitarios para idempotency key e retry.
176|- Teste de masking de payload sensivel.
177|- Testes RLS garantindo que usuario comum nao altera configuracao.
178|- Teste de Edge Function inbound com token invalido e valido.
179|- Teste de outbound mockado com status sucesso/erro.
180|- Playwright para configuracao, teste de conexao e visualizacao de logs.
181|- Regressao em `/app/integracoes` atual.
182|
183|## 9. Criterios de aceite
184|
185|- Organizacao em plano habilitado configura ERP e testa conexao.
186|- Organizacao sem plano habilitado ve bloqueio claro e nao consegue ativar.
187|- Despesa/medicao aprovada gera evento outbound quando configurado.
188|- Webhook inbound valido cria/atualiza dado permitido ou fica pendente para revisao.
189|- Erros ficam registrados em `sync_logs` e `webhook_queue`.
190|- Retry manual funciona e preserva idempotencia.
191|- Credenciais nao aparecem no frontend nem em logs.
192|- Build, lint e testes existentes continuam passando apos implementacao.
193|
194|## 10. Dependencias
195|
196|- Depende de `orgs`, `org_members`, `plans`, `subscriptions` e helpers RLS.
197|- Depende de `expenses` para despesas/notas fiscais.
198|- Depende do PRD_GESTAO_CONTRATOS_MEDICOES para sincronizar medicoes aprovadas.
199|- Pode depender do PRD_FLUXO_CAIXA_CURVA_ABC para enviar/receber previsoes financeiras.
200|- Deve ficar por ultimo na ordem de implementacao por depender de decisoes comerciais, seguranca de credenciais e contratos de API externos.
201|
202|## 11. Status de implementacao
203|
204|Ultima atualizacao: 2026-06-06
205|
206|### 11.1 Concluido
207|
208|- Migration: `supabase/migrations/20260607000000_prd_erp_tables.sql` (3 tabelas: integracao_erp_config, sync_logs, webhook_queue)
209|- Hook: `src/hooks/useIntegracaoERP.ts` (React Query com configuracoes, logs, fila, gate de plano)
210|- Pagina: `src/pages/IntegracaoERP.tsx` (`/app/integracoes/erp` com abas: Configuracao, Eventos, Logs, Permissoes)
211|- Rota: `/app/integracoes/erp` (protegida: Presidente, Administrador)
212|
213|## 12. Edge Functions complementares
214|
215|| Função | Arquivo | Função |
216||---|---|---|
217|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Disparo de eventos webhook |
218|
219|RPCs SQL:
220|- `obter_status_sync_erp(p_org_id)` — status da integração
221|- `obter_eventos_fila_webhook(p_org_id, p_status, p_limite)` — fila de eventos
222|
223|## 13. Pendente para produção
224|- Implementar adaptadores por provedor (Omie, ContaAzul, etc.)
225|- Definir gate de plano enterprise
226|- Configurar webhooks reais com provedores
227|- Testes de segurança de credenciais
228|

## Status de Implementação — 2026-06-06

**Fase atual:** Database ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260607000000_prd_erp_tables.sql` |
| Edge Functions | ⏸️ Pendente | Criar se necessário |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rotas | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `integracao_erp_config`, `integracao_erp_sync_log`

**Próximo passo:** Criar hook e subrota `/app/integracoes/erp`
