1|# PRD_GESTAO_CONTRATOS_MEDICOES - Gestao de Contratos e Medicoes
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Gestao de Contratos e Medicoes
8|
9|## 1. Objetivo
10|
11|Controlar contratos com fornecedores e prestadores, gerenciar medicoes baseadas em percentual fisico e gerar boletins de medicao com fotos, itens medidos, assinaturas e historico de reajustes/aditivos.
12|
13|## 2. Escopo
14|
15|### 2.1 Incluido
16|
17|- CRUD de contratos por obra, fornecedor, escopo, valor total, vigencia e anexos.
18|- Cadastro de itens contratados por unidade, quantidade e valor unitario.
19|- Cadastro de medicoes por percentual fisico, quantidade medida, valor faturado e data de referencia.
20|- Aprovacao de medicao em duas etapas: validacao de campo e aprovacao financeira.
21|- Geracao de boletim de medicao em PDF.
22|- Historico de aditivos, reajustes e anexos.
23|- Integracao futura com Fluxo de Caixa para previsao/realizado de recebimentos e pagamentos.
24|
25|### 2.2 Fora de escopo
26|
27|- Assinatura eletronica externa completa.
28|- Retencoes tributarias complexas.
29|- Integracao ERP no MVP.
30|- Gestao juridica completa do contrato.
31|
32|## 3. Regras de negocio
33|
34|- Todo contrato deve possuir `org_id`, `obra_id` e fornecedor/prestador.
35|- O nome `contratos` nao deve ser usado para a nova tabela sem resolver conflito de schema existente.
36|- O contrato deve possuir valor total aprovado e vigencia.
37|- Medicao nao pode ultrapassar 100% acumulado por item sem aditivo aprovado.
38|- Medicao passa por duas etapas:
39|  - Campo: encarregado/gerente valida execucao fisica.
40|  - Financeiro: gerente/admin aprova faturamento.
41|- Boletim PDF so pode ser emitido para medicao validada ou aprovada.
42|- Aditivo altera escopo, prazo ou valor e deve preservar historico.
43|- Fotos e anexos devem usar persistencia real em Storage/tabela `documentos`.
44|
45|## 4. Tabelas
46|
47|### 4.1 Tabelas novas
48|
49|Por compatibilidade, este PRD propoe nomes especificos do dominio de obra, em vez de reutilizar `contratos`.
50|
51|`obra_contratos`
52|
53|| Coluna | Tipo | Regra |
54|| --- | --- | --- |
55|| `id` | uuid PK | `gen_random_uuid()` |
56|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
57|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
58|| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
59|| `fornecedor_nome` | text | obrigatorio como snapshot |
60|| `numero` | text | unico por `org_id` |
61|| `escopo` | text | obrigatorio |
62|| `valor_total` | numeric(15,2) | maior que zero |
63|| `data_inicio` | date | obrigatorio |
64|| `data_fim` | date | opcional |
65|| `status` | text | `rascunho`, `ativo`, `suspenso`, `encerrado`, `cancelado` |
66|| `anexos` | jsonb | referencias auxiliares |
67|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
68|| `created_at` | timestamptz | default `now()` |
69|| `updated_at` | timestamptz | trigger padrao |
70|
71|`contrato_itens`
72|
73|| Coluna | Tipo | Regra |
74|| --- | --- | --- |
75|| `id` | uuid PK | `gen_random_uuid()` |
76|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
77|| `contrato_id` | uuid FK `obra_contratos(id)` | cascade |
78|| `descricao` | text | obrigatorio |
79|| `unidade` | text | obrigatorio |
80|| `quantidade_total` | numeric(15,4) | maior que zero |
81|| `valor_unitario` | numeric(15,4) | maior ou igual a zero |
82|| `valor_total` | numeric(15,2) | calculado ou gravado |
83|| `ordem` | integer | opcional |
84|
85|`medicoes_contrato`
86|
87|| Coluna | Tipo | Regra |
88|| --- | --- | --- |
89|| `id` | uuid PK | `gen_random_uuid()` |
90|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
91|| `contrato_id` | uuid FK `obra_contratos(id)` | obrigatorio |
92|| `numero` | text | unico por contrato |
93|| `data_referencia` | date | obrigatorio |
94|| `percentual_executado` | numeric(8,4) | 0 a 100 |
95|| `valor_faturado` | numeric(15,2) | maior ou igual a zero |
96|| `status_campo` | text | `pendente`, `validada`, `rejeitada` |
97|| `validado_por` | uuid FK `auth.users(id)` | opcional |
98|| `validado_at` | timestamptz | opcional |
99|| `status_financeiro` | text | `pendente`, `aprovada`, `rejeitada` |
100|| `aprovado_por` | uuid FK `auth.users(id)` | opcional |
101|| `aprovado_at` | timestamptz | opcional |
102|| `motivo_rejeicao` | text | opcional |
103|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
104|| `created_at` | timestamptz | default `now()` |
105|
106|`medicao_itens`
107|
108|| Coluna | Tipo | Regra |
109|| --- | --- | --- |
110|| `id` | uuid PK | `gen_random_uuid()` |
111|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
112|| `medicao_id` | uuid FK `medicoes_contrato(id)` | cascade |
113|| `contrato_item_id` | uuid FK `contrato_itens(id)` | obrigatorio |
114|| `quantidade_medida` | numeric(15,4) | maior ou igual a zero |
115|| `percentual_item` | numeric(8,4) | 0 a 100 |
116|| `valor_medido` | numeric(15,2) | maior ou igual a zero |
117|| `observacoes` | text | opcional |
118|
119|`boletins_medicao`
120|
121|| Coluna | Tipo | Regra |
122|| --- | --- | --- |
123|| `id` | uuid PK | `gen_random_uuid()` |
124|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
125|| `medicao_id` | uuid FK `medicoes_contrato(id)` | obrigatorio |
126|| `numero` | text | unico por `org_id` |
127|| `pdf_path` | text | caminho no Storage |
128|| `assinaturas` | jsonb | aprovadores e responsaveis |
129|| `gerado_por` | uuid FK `auth.users(id)` | obrigatorio |
130|| `gerado_at` | timestamptz | default `now()` |
131|
132|`aditivos_contrato`
133|
134|| Coluna | Tipo | Regra |
135|| --- | --- | --- |
136|| `id` | uuid PK | `gen_random_uuid()` |
137|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
138|| `contrato_id` | uuid FK `obra_contratos(id)` | obrigatorio |
139|| `tipo` | text | `valor`, `prazo`, `escopo`, `reajuste` |
140|| `descricao` | text | obrigatorio |
141|| `valor_delta` | numeric(15,2) | opcional |
142|| `data_inicio_delta` | date | opcional |
143|| `data_fim_delta` | date | opcional |
144|| `status` | text | `rascunho`, `aprovado`, `cancelado` |
145|| `aprovado_por` | uuid FK `auth.users(id)` | opcional |
146|| `aprovado_at` | timestamptz | opcional |
147|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
148|| `created_at` | timestamptz | default `now()` |
149|
150|### 4.2 Indices
151|
152|- `idx_obra_contratos_org_obra_status` em `(org_id, obra_id, status)`.
153|- `idx_obra_contratos_fornecedor` em `(org_id, fornecedor_id)`.
154|- `idx_medicoes_contrato_status` em `(org_id, contrato_id, status_campo, status_financeiro)`.
155|- `idx_boletins_medicao_medicao` unico em `(medicao_id)`.
156|- `idx_aditivos_contrato_status` em `(org_id, contrato_id, status)`.
157|
158|### 4.3 RLS
159|
160|- `SELECT`: membros da organizacao.
161|- `INSERT/UPDATE` de contrato e aditivo: `Presidente`, `Administrador`, `Gerente`.
162|- Validacao de campo: responsavel operacional, `Gerente`, `Administrador` ou `Presidente`.
163|- Aprovacao financeira: `Gerente`, `Administrador` ou `Presidente`, com possibilidade de restringir a `Administrador` por configuracao futura.
164|- `DELETE`: somente `Presidente`/`Administrador`, preferindo cancelamento ou soft delete.
165|- Boletins emitidos devem ser imutaveis; nova emissao cria novo registro ou nova versao.
166|
167|### 4.4 Validacao de compatibilidade Supabase
168|
169|Validado contra migrations locais em 2026-05-31.
170|
171|- Conflito detectado: `supabase/migrations/20260408025953_create_sflow_tables.sql` ja cria uma tabela `contratos` sem `org_id`, ligada a `projetos/propostas` do SFlow e com policy anon permissiva. Este PRD nao deve criar outra `contratos`.
172|- Decisao proposta: usar `obra_contratos` para contratos operacionais multi-tenant do Meta Construtor.
173|- `public.fornecedores`, `public.obras`, `public.documentos` e bucket `documentos` existem e devem ser usados como dependencias.
174|- `public.expenses` existe e pode receber despesa gerada por medicao aprovada em etapa futura.
175|- Nao foram encontradas tabelas `obra_contratos`, `medicoes_contrato`, `boletins_medicao` ou `aditivos_contrato`; sem conflito nominal com os nomes propostos.
176|- Antes da implementacao, revisar a tabela SFlow `contratos` e decidir se ela sera mantida isolada, migrada ou depreciada.
177|
178|## 5. Endpoints e Edge Functions
179|
180|- `generate-boletim-medicao-pdf`: gera PDF do boletim com itens, fotos e assinaturas.
181|- `approve-medicao-campo`: opcional, registra validacao de campo.
182|- `approve-medicao-financeiro`: opcional, registra aprovacao financeira e eventos financeiros.
183|- `create-medicao-cashflow-entry`: opcional, integra com Fluxo de Caixa quando aprovado.
184|- CRUD basico pode usar Supabase client com RLS, mas aprovacoes devem preferir Edge Function/RPC para validar transicoes.
185|
186|## 6. Telas e UX
187|
188|- Rota recomendada: `/app/contratos`.
189|- Aba `Contratos`: lista, filtros por obra, fornecedor, status e vigencia.
190|- Tela de contrato: dados gerais, itens contratados, anexos, medicoes, aditivos e historico.
191|- Fluxo de nova medicao com itens, percentual executado, fotos e observacoes.
192|- Painel de aprovacao em duas etapas.
193|- Acao `Gerar boletim PDF`.
194|- Atalho na obra: `/app/obras/:id` deve mostrar contratos e medicoes da obra.
195|
196|## 7. Hooks, queryKeys e integracao frontend
197|
198|- Criar `src/hooks/useContratosMedicoes.ts`.
199|- Query keys:
200|  - `['obra-contratos', orgId, filters]`
201|  - `['obra-contrato', orgId, contratoId]`
202|  - `['medicoes-contrato', orgId, contratoId]`
203|  - `['boletins-medicao', orgId, medicaoId]`
204|  - `['aditivos-contrato', orgId, contratoId]`
205|- Mutations devem invalidar contratos por obra e dashboard financeiro quando aplicavel.
206|- Nao usar mocks de boletim ou assinatura; se PDF falhar, mostrar erro real.
207|
208|## 8. Testes
209|
210|- Unitarios para acumulado de medicao por item e limite de 100%.
211|- Unitarios para transicao de status campo/financeiro.
212|- Testes RLS entre organizacoes.
213|- Teste de conflito de nome garantindo que migrations novas nao criem `public.contratos`.
214|- Playwright para criar contrato, item, medicao e aprovar em duas etapas.
215|- Teste de PDF do boletim.
216|- Regressao em fornecedores, documentos e relatorios.
217|
218|## 9. Criterios de aceite
219|
220|- Usuario cria contrato vinculado a obra e fornecedor.
221|- Usuario cadastra itens mediveis e registra medicao por quantidade/percentual.
222|- Encarregado valida campo e gerente aprova financeiro em etapas separadas.
223|- Sistema bloqueia medicao acumulada acima de 100% sem aditivo aprovado.
224|- Boletim PDF e gerado com itens, fotos e assinaturas.
225|- Aditivo altera historico sem sobrescrever dados anteriores.
226|- Dados ficam isolados por `org_id`.
227|- Build, lint e testes existentes continuam passando apos implementacao.
228|
229|## 10. Dependencias
230|
231|- Depende de `orgs`, `org_members`, `obras`, `fornecedores`, `documentos` e bucket `documentos`.
232|- Depende da decisao sobre a tabela SFlow `contratos`; ate la, usar `obra_contratos`.
233|- Pode se integrar ao PRD_FLUXO_CAIXA_CURVA_ABC para gerar previsoes/realizados.
234|- Deve ser implementado antes do PRD_PORTAL_CLIENTE se aprovacoes de escolhas/boletins forem exibidas ao cliente.
235|- Deve ser implementado antes do PRD_INTEGRACAO_ERP se medicoes aprovadas forem sincronizadas com ERP.
236|
237|## 11. Status de implementacao
238|
239|Ultima atualizacao: 2026-06-06
240|
241|### 11.1 Concluido
242|
243|- Migration: `supabase/migrations/20260606234500_prd_contratos_medicoes_tables.sql` (6 tabelas: obra_contratos, contrato_itens, medicoes_contrato, medicao_itens, boletins_medicao, aditivos_contrato)
244|- Hook: `src/hooks/useContratosMedicoes.ts` (React Query com contratos, itens, medicoes, boletins, aditivos, aprovacao campo/financeiro)
245|- Pagina: `src/pages/Contratos.tsx` (`/app/contratos` com lista, detalhe, medicoes e aditivos)
246|- Rota: `/app/contratos` (protegida: Presidente, Administrador, Gerente)
247|
248|## 12. Edge Functions complementares
249|
250|| Função | Arquivo | Função |
251||---|---|---|
252|| calcular-medicao | `supabase/functions/calcular-medicao/` | Calcula valor apurado da medição |
253|| medicao-approve-flow | `supabase/functions/medicao-approve-flow/` | Fluxo de aprovação campo → financeiro |
254|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Notificações de aprovação pendente |
255|
256|RPCs SQL:
257|- `obter_resumo_contrato(p_org_id, p_contrato_id)` — resumo com saldo a medir
258|- `obter_medicoes_pendentes_aprovacao(p_org_id, p_nivel)` — medições por nível
259|
260|## 13. Pendente para produção
261|- Reajuste automático por índice
262|- Geração de boletim PDF
263|- Aditivos com workflow de aprovação
264|

## Status de Implementação — 2026-06-06

**Fase atual:** Database + Edge Functions ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260606234500_prd_contratos_medicoes_tables.sql` |
| Edge Functions | ✅ Completo | `calcular-medicao`, `medicao-approve-flow` deployadas |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rotas | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `obra_contratos`, `contratos_medicoes`

**Próximo passo:** Criar hook `useContratosMedicoes.ts` e página `/app/contratos`
