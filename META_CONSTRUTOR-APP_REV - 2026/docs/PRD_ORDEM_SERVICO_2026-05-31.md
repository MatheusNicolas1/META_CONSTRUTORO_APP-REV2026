1|# PRD_ORDEM_SERVICO - Ordem de Servico (OS)
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Ordem de Servico
8|
9|## 1. Objetivo
10|
11|Transformar atividades planejadas em ordens de servico executaveis pelo encarregado no celular, com status operacional, anexos, checklists obrigatorios, fotos, problemas e solicitacoes de materiais.
12|
13|O modulo deve servir como base para experiencia mobile/PWA sem substituir o modulo atual de Atividades.
14|
15|## 2. Escopo
16|
17|### 2.1 Incluido
18|
19|- Criacao de OS a partir de uma atividade existente ou de forma manual.
20|- Campos de OS: descricao, responsavel, obra, data limite, prioridade, anexos e checklists obrigatorios.
21|- Fluxo mobile para marcar inicio/fim, adicionar fotos, reportar problemas e solicitar materiais.
22|- Acompanhamento em tempo real ou por refetch de status: `Pendente`, `Em andamento`, `Concluida`, `Bloqueada`.
23|- Historico de logs da OS.
24|- Notificacao automatica quando OS vence, muda de status ou e aprovada.
25|
26|### 2.2 Fora de escopo
27|
28|- Planejamento completo de cronograma.
29|- App nativo separado; o MVP deve usar PWA responsivo.
30|- Compra automatica de materiais.
31|- Integracao com ERP.
32|
33|## 3. Regras de negocio
34|
35|- Toda OS deve ter `org_id` e `obra_id`.
36|- Uma OS pode nascer de `atividades.id`, mas tambem pode ser criada manualmente.
37|- Quando criada a partir de atividade, a OS deve manter snapshot da descricao para preservar historico.
38|- Status permitido: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `CANCELADA`, `APROVADA`.
39|- Apenas responsavel da OS, `Gerente`, `Administrador` ou `Presidente` podem iniciar/finalizar.
40|- Bloqueio exige motivo e pode gerar solicitacao de material.
41|- Checklist marcado como obrigatorio deve estar concluido antes de finalizar a OS.
42|- Fotos e documentos devem persistir no bucket `documentos` e/ou na tabela `documentos`.
43|- Toda mudanca de status deve gravar log imutavel em `os_logs`.
44|
45|## 4. Tabelas
46|
47|### 4.1 Tabelas novas
48|
49|`ordens_servico`
50|
51|| Coluna | Tipo | Regra |
52|| --- | --- | --- |
53|| `id` | uuid PK | `gen_random_uuid()` |
54|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
55|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
56|| `atividade_id` | uuid FK `atividades(id)` | opcional |
57|| `numero` | text | unico por `org_id` |
58|| `titulo` | text | obrigatorio |
59|| `descricao` | text | obrigatorio |
60|| `responsavel_user_id` | uuid FK `auth.users(id)` | opcional |
61|| `responsavel_nome` | text | snapshot/fallback |
62|| `data_limite` | date | obrigatorio |
63|| `prioridade` | text | `baixa`, `media`, `alta`, `critica` |
64|| `status` | text | status canonico da OS |
65|| `motivo_bloqueio` | text | obrigatorio se bloqueada |
66|| `started_at` | timestamptz | opcional |
67|| `finished_at` | timestamptz | opcional |
68|| `approved_by` | uuid FK `auth.users(id)` | opcional |
69|| `approved_at` | timestamptz | opcional |
70|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
71|| `created_at` | timestamptz | default `now()` |
72|| `updated_at` | timestamptz | trigger padrao |
73|
74|`os_checklists`
75|
76|| Coluna | Tipo | Regra |
77|| --- | --- | --- |
78|| `id` | uuid PK | `gen_random_uuid()` |
79|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
80|| `os_id` | uuid FK `ordens_servico(id)` | cascade |
81|| `checklist_id` | uuid FK `checklists(id)` | opcional |
82|| `titulo` | text | snapshot |
83|| `obrigatorio` | boolean | default `true` |
84|| `status` | text | `pendente`, `concluido`, `dispensado` |
85|| `completed_by` | uuid FK `auth.users(id)` | opcional |
86|| `completed_at` | timestamptz | opcional |
87|
88|`os_anexos`
89|
90|| Coluna | Tipo | Regra |
91|| --- | --- | --- |
92|| `id` | uuid PK | `gen_random_uuid()` |
93|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
94|| `os_id` | uuid FK `ordens_servico(id)` | cascade |
95|| `documento_id` | uuid FK `documentos(id)` | opcional |
96|| `tipo` | text | `projeto`, `foto`, `problema`, `material`, `outro` |
97|| `storage_path` | text | caminho no bucket `documentos` |
98|| `nome_arquivo` | text | snapshot |
99|| `uploaded_by` | uuid FK `auth.users(id)` | obrigatorio |
100|| `created_at` | timestamptz | default `now()` |
101|
102|`os_logs`
103|
104|| Coluna | Tipo | Regra |
105|| --- | --- | --- |
106|| `id` | uuid PK | `gen_random_uuid()` |
107|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
108|| `os_id` | uuid FK `ordens_servico(id)` | cascade |
109|| `event_type` | text | `created`, `status_changed`, `problem_reported`, `material_requested`, `approved` |
110|| `status_from` | text | opcional |
111|| `status_to` | text | opcional |
112|| `payload` | jsonb | detalhes do evento |
113|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
114|| `created_at` | timestamptz | default `now()` |
115|
116|### 4.2 Indices
117|
118|- `idx_os_org_obra_status` em `(org_id, obra_id, status)`.
119|- `idx_os_org_responsavel_status` em `(org_id, responsavel_user_id, status)`.
120|- `idx_os_atividade_id` em `(atividade_id)` quando nao nulo.
121|- `idx_os_logs_os_created_at` em `(os_id, created_at desc)`.
122|- `idx_os_anexos_os_tipo` em `(os_id, tipo)`.
123|
124|### 4.3 RLS
125|
126|- `SELECT`: membros da organizacao podem visualizar OS da org.
127|- `INSERT`: `Presidente`, `Administrador` e `Gerente`.
128|- `UPDATE`: responsavel da OS pode atualizar status operacional; gestores podem atualizar todos os campos permitidos.
129|- `DELETE`: somente `Presidente` e `Administrador`, preferindo soft delete se aplicavel.
130|- `os_logs` deve permitir insert pelos atores autorizados e nao permitir update/delete pelo frontend.
131|- Anexos devem validar `org_id` e `os_id` em todas as policies.
132|
133|### 4.4 Validacao de compatibilidade Supabase
134|
135|Validado contra migrations locais em 2026-05-31.
136|
137|- `public.atividades` existe com `org_id`, `obra_id`, `titulo`, `descricao`, `data`, `status`, `prioridade`, `categoria`, `unidade_medida` e `quantidade_prevista`.
138|- `public.checklists` e `public.checklist_items` existem e foram alinhados para `org_id`.
139|- `public.documentos` existe e o bucket `documentos` e o padrao atual para anexos reais.
140|- `public.notifications` existe e recebeu `org_id` em migrations posteriores.
141|- Nao foi encontrada tabela `ordens_servico`, `os_checklists`, `os_anexos` ou `os_logs`; sem conflito nominal nas migrations locais.
142|- A tabela `atividades` usa status em minusculo (`agendada`, `em_andamento`, `concluida`, `cancelada`). OS deve manter status proprio e mapear atividade apenas quando necessario.
143|
144|## 5. Endpoints e Edge Functions
145|
146|- `approve-os`: opcional, aprova OS concluida e grava `approved_by/approved_at`.
147|- `notify-os-due`: opcional, rotina para OS vencidas.
148|- `request-os-material`: opcional, centraliza solicitacoes de materiais e notificacoes.
149|- CRUD basico pode ser via Supabase client com RLS.
150|- Upload de anexos deve usar bucket `documentos` e gravar metadados em `os_anexos` e/ou `documentos`.
151|
152|## 6. Telas e UX
153|
154|- Rota recomendada: `/app/ordens-servico`.
155|- Acesso contextual em `/app/atividades` para criar OS a partir de atividade.
156|- Acesso contextual em `/app/obras/:id` para OS da obra.
157|- Lista Kanban ou tabela por status: Pendente, Em andamento, Bloqueada, Concluida, Aprovada.
158|- Tela mobile focada no encarregado, com botoes grandes para iniciar, pausar/bloquear, concluir, anexar foto e solicitar material.
159|- Detalhe da OS com timeline de logs e anexos.
160|- Dialog de bloqueio exigindo motivo.
161|- Indicadores de vencimento e SLA.
162|
163|## 7. Hooks, queryKeys e integracao frontend
164|
165|- Criar `src/hooks/useOrdensServico.ts`.
166|- Query keys:
167|  - `['ordens-servico', orgId, filters]`
168|  - `['ordem-servico', orgId, osId]`
169|  - `['os-logs', orgId, osId]`
170|  - `['os-checklists', orgId, osId]`
171|- Mutations devem invalidar `dashboard-stats`, OS por obra e OS por responsavel quando aplicavel.
172|- O app deve usar `useRequireOrg` e nunca consultar OS sem `orgId`.
173|- Realtime pode ser adicionado depois; MVP pode usar refetch e invalidacao.
174|
175|## 8. Testes
176|
177|- Unitarios para transicoes de status permitidas.
178|- Unitarios para bloqueio de conclusao quando checklist obrigatorio esta pendente.
179|- Testes RLS com responsavel, gerente e usuario de outra org.
180|- Teste de criacao a partir de atividade.
181|- Teste de upload de foto/anexo no bucket `documentos`.
182|- Playwright mobile em `/app/ordens-servico` validando iniciar, bloquear e concluir.
183|- Regressao em `/app/atividades` para garantir que a criacao de OS nao quebra atividades atuais.
184|
185|## 9. Criterios de aceite
186|
187|- Usuario cria OS manual e OS a partir de atividade existente.
188|- Encarregado acessa no mobile, inicia, anexa foto, reporta problema e conclui.
189|- Supervisor ve status atualizado e timeline de logs.
190|- OS nao conclui se checklist obrigatorio estiver pendente.
191|- OS vencida aparece em alerta e gera notificacao.
192|- Dados ficam isolados por `org_id`.
193|- Nenhum anexo fica apenas em estado local.
194|- Build, lint e testes existentes continuam passando apos implementacao.
195|
196|## 10. Dependencias
197|
198|- Depende de `orgs`, `org_members`, `obras`, `atividades`, `checklists`, `documentos` e `notifications`.
199|- Depende do PWA/responsividade ja existente para experiencia mobile.
200|- Nao depende de Fluxo de Caixa para o MVP.
201|- Pode alimentar DDS e Portal do Cliente posteriormente com status de execucao e evidencias de campo.
202|- Deve ser implementado antes do Portal do Cliente para disponibilizar progresso operacional confiavel.
203|
204|## 11. Status de implementacao
205|
206|Ultima atualizacao: 2026-06-06
207|
208|### 11.1 Concluido
209|
210|- Migration: `supabase/migrations/20260606230000_prd_ordem_servico_tables.sql` (4 tabelas + indices + RLS)
211|- Hook: `src/hooks/useOrdensServico.ts` (React Query org-bound com createOS e updateStatus)
212|- Pagina: `src/pages/OrdensServico.tsx` (`/app/ordens-servico`)
213|- Rota: `/app/ordens-servico` (protegida)
214|
215|### 11.2 Pendente
216|
217|- Edge Functions: approve-os, notify-os-due, request-os-material
218|
219|## 12. Edge Functions complementares
220|
221|| Função | Arquivo | Função |
222||---|---|---|
223|| ordem-servico-approve | `supabase/functions/ordem-servico-approve/` | Aprovação/rejeição de OS |
224|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Lembretes de OS vencendo |
225|
226|RPCs SQL:
227|- `obter_os_pendentes_aprovacao(p_org_id)` — OS aguardando aprovação
228|- `obter_relatorio_os_mensal(p_org_id, p_mes, p_ano)` — estatísticas mensais
229|
230|## 13. Pendente para produção
231|- Template de checklist vinculado por tipo de OS
232|- Notificação push para OS urgentes
233|- Integração com atividades existentes
234|

## Status de Implementação — 2026-06-06

**Fase atual:** Database + Edge Functions ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260606230000_prd_ordem_servico_tables.sql` |
| Edge Functions | ✅ Completo | `ordem-servico-approve` deployada |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rotas | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `ordens_servico`

**Próximo passo:** Criar hook `useOrdensServico.ts` e página `/app/ordens-servico`
