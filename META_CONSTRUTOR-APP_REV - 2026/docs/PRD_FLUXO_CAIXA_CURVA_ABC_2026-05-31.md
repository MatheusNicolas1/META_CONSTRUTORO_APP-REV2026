1|# PRD_FLUXO_CAIXA_CURVA_ABC - Fluxo de Caixa e Curva ABC
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Fluxo de Caixa e Curva ABC
8|
9|## 1. Objetivo
10|
11|Permitir que a construtora preveja entradas e saidas financeiras por obra ao longo do tempo, compare planejado vs realizado e visualize a Curva ABC financeira para identificar desvios relevantes antes que virem estouro de caixa.
12|
13|O modulo deve aproveitar o Controle de Despesas existente como fonte de realizado quando possivel, sem duplicar informacao financeira ja persistida em `public.expenses`.
14|
15|## 2. Escopo
16|
17|### 2.1 Incluido
18|
19|- Cadastro de previsao de desembolso por obra, data, categoria, fornecedor e valor.
20|- Cadastro de previsao de recebimento por obra, medicao aprovada, aditivo ou lancamento manual.
21|- Consolidacao de realizado a partir de despesas aprovadas e lancamentos financeiros manuais.
22|- Geracao de Curva ABC com percentual financeiro planejado vs realizado por periodo, categoria e obra.
23|- Alertas configuraveis quando o realizado ultrapassar o planejado em mais de X%.
24|- Graficos interativos de linha, barras empilhadas e distribuicao por categoria.
25|- Exportacao em PDF/CSV usando o padrao atual da central de relatorios.
26|
27|### 2.2 Fora de escopo
28|
29|- Integracao bancaria direta.
30|- Emissao fiscal.
31|- Contabilidade completa ou conciliacao contabil.
32|- Sincronizacao com ERP, que fica no PRD de Integracao ERP.
33|
34|## 3. Regras de negocio
35|
36|- Todo registro deve possuir `org_id` obrigatorio e respeitar a organizacao ativa.
37|- Previsoes de saida podem ser cadastradas manualmente ou derivadas de contrato, OS, compra ou despesa prevista.
38|- Previsoes de entrada podem ser cadastradas manualmente ou derivadas de medicao aprovada/aditivo quando o modulo de Contratos estiver pronto.
39|- Lancamentos realizados de despesa devem priorizar `public.expenses` como fonte canonica.
40|- Lancamentos realizados manuais devem registrar origem, usuario criador e justificativa.
41|- Curva ABC deve calcular acumulado planejado, acumulado realizado, percentual realizado, percentual planejado e desvio percentual.
42|- O limite de alerta deve ser configuravel por obra e ter default inicial de 10%.
43|- Alertas devem ser gerados apenas para desvios confirmados por dados persistidos, sem dados ficticios.
44|- Usuarios `Presidente`, `Administrador` e `Gerente` podem criar e aprovar ajustes financeiros; `Colaborador` pode visualizar apenas se permitido pelas regras atuais de role.
45|
46|## 4. Tabelas
47|
48|### 4.1 Tabelas novas
49|
50|`fluxo_caixa_previsao`
51|
52|| Coluna | Tipo | Regra |
53|| --- | --- | --- |
54|| `id` | uuid PK | `gen_random_uuid()` |
55|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
56|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
57|| `tipo` | text | `entrada` ou `saida` |
58|| `origem` | text | `manual`, `despesa`, `medicao`, `aditivo`, `outro` |
59|| `categoria` | text | compatibilizar com `expenses.cost_category` para saidas |
60|| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
61|| `fornecedor_nome` | text | snapshot para fornecedores externos |
62|| `descricao` | text | obrigatorio |
63|| `data_prevista` | date | obrigatorio |
64|| `valor_previsto` | numeric(15,2) | maior que zero |
65|| `status` | text | `planejado`, `confirmado`, `cancelado`, `realizado` |
66|| `alerta_percentual` | numeric(6,2) | override por lancamento |
67|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
68|| `updated_by` | uuid FK `auth.users(id)` | opcional |
69|| `created_at` | timestamptz | default `now()` |
70|| `updated_at` | timestamptz | trigger padrao |
71|
72|`fluxo_caixa_realizado`
73|
74|| Coluna | Tipo | Regra |
75|| --- | --- | --- |
76|| `id` | uuid PK | `gen_random_uuid()` |
77|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
78|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
79|| `previsao_id` | uuid FK `fluxo_caixa_previsao(id)` | opcional |
80|| `expense_id` | uuid FK `expenses(id)` | opcional, para saidas reais |
81|| `medicao_id` | uuid | opcional, FK futura para medicoes |
82|| `tipo` | text | `entrada` ou `saida` |
83|| `categoria` | text | obrigatorio |
84|| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
85|| `data_realizada` | date | obrigatorio |
86|| `valor_realizado` | numeric(15,2) | maior que zero |
87|| `origem` | text | `manual`, `expense`, `medicao`, `erp` |
88|| `external_ref` | text | opcional |
89|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
90|| `created_at` | timestamptz | default `now()` |
91|
92|`curva_abc_log`
93|
94|| Coluna | Tipo | Regra |
95|| --- | --- | --- |
96|| `id` | uuid PK | `gen_random_uuid()` |
97|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
98|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
99|| `competencia` | date | primeiro dia do mes |
100|| `base_planejada` | numeric(15,2) | acumulado planejado |
101|| `base_realizada` | numeric(15,2) | acumulado realizado |
102|| `percentual_planejado` | numeric(8,4) | 0 a 100 |
103|| `percentual_realizado` | numeric(8,4) | 0 a 100 |
104|| `desvio_percentual` | numeric(8,4) | realizado - planejado |
105|| `limite_alerta_percentual` | numeric(6,2) | limite aplicado |
106|| `status` | text | `ok`, `alerta`, `critico` |
107|| `snapshot` | jsonb | dados do calculo |
108|| `gerado_por` | uuid FK `auth.users(id)` | opcional |
109|| `generated_at` | timestamptz | default `now()` |
110|
111|### 4.2 Indices
112|
113|- `idx_fluxo_previsao_org_obra_data` em `(org_id, obra_id, data_prevista)`.
114|- `idx_fluxo_previsao_org_tipo_status` em `(org_id, tipo, status)`.
115|- `idx_fluxo_realizado_org_obra_data` em `(org_id, obra_id, data_realizada)`.
116|- `idx_fluxo_realizado_expense_id` unico parcial quando `expense_id is not null`.
117|- `idx_curva_abc_org_obra_competencia` em `(org_id, obra_id, competencia desc)`.
118|
119|### 4.3 RLS
120|
121|- Habilitar RLS em todas as tabelas novas.
122|- `SELECT`: `public.is_org_member(org_id)`.
123|- `INSERT`: `public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[])`.
124|- `UPDATE`: mesmo criterio de insert, com `WITH CHECK` por `org_id`.
125|- `DELETE`: somente `Presidente` e `Administrador`; preferir soft delete se o modulo Lixeira estiver aprovado.
126|- Edge Functions que recalculam curva devem usar service role apenas para a organizacao recebida e validar membership antes de executar.
127|
128|### 4.4 Validacao de compatibilidade Supabase
129|
130|Validado contra migrations locais em 2026-05-31.
131|
132|- `public.orgs`, `public.org_members`, `public.is_org_member` e `public.has_org_role` existem e devem ser a base de multi-tenancy.
133|- `public.expenses` existe e possui `org_id`, `obra_id`, `cost_category`, `supplier_name`, `amount`, `date_of_expense` e `approval_status`; o realizado financeiro de saida deve reutilizar essa fonte.
134|- A view `public.financeiro_consolidado` ja consolida `expenses` por `org_id`, `obra_id`, periodo e categoria; o novo modulo pode criar views complementares, mas nao deve quebrar essa view.
135|- `public.fornecedores` e `public.obras` ja existem com `org_id`.
136|- Nao foi encontrada tabela existente com nomes `fluxo_caixa_previsao`, `fluxo_caixa_realizado` ou `curva_abc_log`; sem conflito nominal nas migrations locais.
137|- Ha historico de drift em Supabase neste projeto. Antes da implementacao, executar verificacao read-only do schema remoto para confirmar colunas atuais de `expenses`, `obras` e `fornecedores`.
138|
139|## 5. Endpoints e Edge Functions
140|
141|- `recalculate-cashflow-abc`: recebe `org_id`, `obra_id`, periodo inicial/final e grava snapshot em `curva_abc_log`.
142|- `send-cashflow-alerts`: opcional, envia notificacoes quando `desvio_percentual` superar o limite configurado.
143|- `export-cashflow-report`: opcional, gera PDF/CSV seguindo o padrao dos relatorios atuais.
144|- Frontend pode operar CRUD via Supabase client quando RLS for suficiente; calculos consolidados devem ficar em RPC/view ou Edge Function para evitar divergencia no cliente.
145|
146|## 6. Telas e UX
147|
148|- Rota recomendada: `/app/fluxo-caixa`.
149|- Acesso tambem pela aba financeira de `/app/obras/:id`.
150|- Visao principal com filtros por obra, periodo, tipo, categoria, fornecedor e status.
151|- Cards de resumo: saldo previsto, saldo realizado, desvio total, proximo alerta.
152|- Grafico de linha para acumulado planejado vs realizado.
153|- Barras empilhadas por categoria e mes.
154|- Tabela editavel de previsoes com acao de converter em realizado manual.
155|- Painel de alertas com severidade `ok`, `alerta` e `critico`.
156|- Exportacao pela central de relatorios em `/app/relatorios`.
157|
158|## 7. Hooks, queryKeys e integracao frontend
159|
160|- Criar `src/hooks/useFluxoCaixa.ts` com React Query.
161|- Query keys obrigatoriamente org-bound:
162|  - `['fluxo-caixa-previsoes', orgId, obraId, filters]`
163|  - `['fluxo-caixa-realizado', orgId, obraId, filters]`
164|  - `['curva-abc', orgId, obraId, competencia]`
165|  - `['cashflow-alerts', orgId, obraId]`
166|- Mutations devem invalidar apenas keys da organizacao ativa.
167|- Evitar arrays mockados; estados vazios devem informar ausencia real de lancamentos.
168|- Usar `recharts`, que ja existe no projeto, para graficos.
169|
170|## 8. Testes
171|
172|- Unitarios para calculo de acumulado, percentual e desvio da Curva ABC.
173|- Unitarios para regra de alerta configuravel por obra.
174|- Testes de hooks garantindo queryKeys com `orgId`.
175|- Testes de RLS com dois usuarios de organizacoes diferentes.
176|- Smoke Playwright em desktop e mobile para `/app/fluxo-caixa`.
177|- Teste de regressao em `/app/despesas` para garantir que o modulo nao alterou aprovacao de despesas existente.
178|- Teste de exportacao PDF/CSV se a funcao de relatorio entrar no MVP.
179|
180|## 9. Criterios de aceite
181|
182|- O usuario cria previsao de saida e entrada vinculadas a uma obra.
183|- Despesas aprovadas aparecem como realizado sem duplicacao manual obrigatoria.
184|- A Curva ABC mostra planejado vs realizado por periodo com desvio calculado.
185|- Alerta e gerado quando o limite configurado e ultrapassado.
186|- Dados de uma organizacao nao aparecem para usuarios de outra organizacao.
187|- Reload da pagina preserva filtros basicos e dados persistidos.
188|- Build, lint e testes existentes continuam passando apos implementacao.
189|- Relatorio exportado nao usa dados ficticios.
190|
191|## 10. Dependencias
192|
193|- Depende das tabelas existentes `orgs`, `org_members`, `obras`, `expenses` e `fornecedores`.
194|- Depende dos helpers RLS `is_org_member` e `has_org_role`.
195|- Nao depende dos outros cinco novos modulos para o MVP.
196|- Recebe ganho funcional posterior do PRD_GESTAO_CONTRATOS_MEDICOES, pois medicoes aprovadas poderao gerar previsoes/realizados de entrada.
197|- Integra com PRD_INTEGRACAO_ERP apenas depois que ERP for aprovado, para enviar/receber eventos financeiros.
198|
199|## 11. Status de implementacao
200|
201|Ultima atualizacao: 2026-06-06
202|
203|### 11.1 Concluido (MVP)
204|
205|- Migration: `supabase/migrations/20260606223000_prd_fluxo_caixa_tables.sql` (3 tabelas + indices + RLS)
206|- Hook: `src/hooks/useFluxoCaixa.ts` (React Query org-bound com saldo, previsoes, realizado, curva ABC)
207|- Pagina: `src/pages/FluxoCaixa.tsx` (`/app/fluxo-caixa`)
208|- Rota: `/fluxo-caixa/*` (legacy) e `/app/fluxo-caixa` (protegida)
209|
210|### 11.2 Pendente
211|
212|- Edge Function `recalculate-cashflow-abc` para snapshots automaticos da curva
213|
214|## 12. Edge Functions complementares
215|
216|| Função | Arquivo | Finalidade |
217||---|---|---|
218|| calcular-receitas-previstas | `supabase/functions/calcular-receitas-previstas/` | Agrupa entradas previstas + contratos ativos |
219|| consolidar-fluxo-caixa | `supabase/functions/consolidar-fluxo-caixa/` | Saldo inicial, previsto x realizado mensal |
220|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Alertas de saldo baixo e lembretes |
221|
222|RPCs SQL:
223|- `obter_saldo_acumulado_mes(p_org_id, p_data)` — saldo acumulado
224|- `obter_curva_abc(p_org_id, p_data_inicio, p_data_fim)` — classificação A/B/C por fornecedor
225|
226|## 13. Pendente para produção
227|
228|- Integração com Contratos para gerar previsões automáticas de entrada
229|- Gráfico de Curva ABC na página
230|- Exportar relatório mensal em PDF
231|

## Status de Implementação — 2026-06-06

**Fase atual:** Database + Edge Functions ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260606223000_prd_fluxo_caixa_tables.sql` |
| Edge Functions | ✅ Completo | `calcular-receita`, `consolidar-fluxo` deployadas |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rotas | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `fluxo_caixa_previsao`, `fluxo_caixa_realizado`, `curva_abc_log`

**Próximo passo:** Criar hook `useFluxoCaixa.ts` e página `/app/fluxo-caixa`
