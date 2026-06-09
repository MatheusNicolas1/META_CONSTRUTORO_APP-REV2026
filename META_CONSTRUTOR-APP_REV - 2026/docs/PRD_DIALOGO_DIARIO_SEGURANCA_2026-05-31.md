1|# PRD_DIALOGO_DIARIO_SEGURANCA - Dialogo Diario de Seguranca (DDS)
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Dialogo Diario de Seguranca
8|
9|## 1. Objetivo
10|
11|Criar um diario de seguranca com sugestao de temas baseada no segmento da empresa, riscos comuns, normas NR aplicaveis e historico de acidentes/ocorrencias registrados.
12|
13|O modulo deve diferenciar seguranca operacional de campo da pagina atual de seguranca/auditoria do sistema.
14|
15|## 2. Escopo
16|
17|### 2.1 Incluido
18|
19|- Cadastro do perfil de seguranca da empresa: segmento, riscos comuns e normas NR aplicaveis.
20|- Sugestao de tema ao iniciar DDS com base em perfil, segmento e ocorrencias recentes.
21|- Registro de DDS com data, obra, participantes, assinaturas digitais, tema, descricao e fotos.
22|- Acompanhamento mensal de DDS realizados e meta de cumprimento.
23|- Exportacao de relatorio mensal de seguranca.
24|- Uso de ocorrencias de RDO quando existirem dados em `rdos.detalhes`.
25|
26|### 2.2 Fora de escopo
27|
28|- CAT/eSocial.
29|- Controle completo de EPI/estoque.
30|- Gestao de treinamentos obrigatorios.
31|- Assinatura digital juridica avancada com ICP-Brasil.
32|
33|## 3. Regras de negocio
34|
35|- Cada organizacao deve possuir no maximo um perfil ativo em `perfil_empresa_seguranca`.
36|- O segmento define um conjunto inicial de riscos e normas NR sugeridas.
37|- A sugestao de tema deve considerar ocorrencias recentes em RDO, especialmente acidentes, materiais em falta e problemas reportados.
38|- Um DDS pode ser vinculado a uma obra ou ser geral da empresa.
39|- Participantes podem ser usuarios do sistema ou participantes externos cadastrados por nome/funcao.
40|- Assinatura digital deve registrar nome, hash/metadata, data/hora, IP quando aplicavel e usuario criador.
41|- Meta padrao inicial: 1 DDS por dia util por organizacao, configuravel.
42|- Relatorio mensal deve listar DDS realizados, ausencias, temas, participantes e evidencias.
43|- Nenhum tema sugerido pode ser apresentado como dado real sem origem registrada em `sugestoes_temas`.
44|
45|## 4. Tabelas
46|
47|### 4.1 Tabelas novas
48|
49|`perfil_empresa_seguranca`
50|
51|| Coluna | Tipo | Regra |
52|| --- | --- | --- |
53|| `id` | uuid PK | `gen_random_uuid()` |
54|| `org_id` | uuid FK `orgs(id)` | obrigatorio e unico |
55|| `segmento` | text | ex: `construcao_civil`, `mineracao`, `industrial` |
56|| `riscos_comuns` | text[] | default vazio |
57|| `normas_nr` | text[] | ex: `NR-18`, `NR-35` |
58|| `meta_dds_mensal` | integer | opcional |
59|| `meta_dds_dia_util` | boolean | default `true` |
60|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
61|| `updated_by` | uuid FK `auth.users(id)` | opcional |
62|| `created_at` | timestamptz | default `now()` |
63|| `updated_at` | timestamptz | trigger padrao |
64|
65|`dds_registros`
66|
67|| Coluna | Tipo | Regra |
68|| --- | --- | --- |
69|| `id` | uuid PK | `gen_random_uuid()` |
70|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
71|| `obra_id` | uuid FK `obras(id)` | opcional |
72|| `sugestao_id` | uuid FK `sugestoes_temas(id)` | opcional |
73|| `data` | date | obrigatorio |
74|| `tema` | text | obrigatorio |
75|| `descricao` | text | obrigatorio |
76|| `status` | text | `rascunho`, `realizado`, `cancelado` |
77|| `fotos` | jsonb | paths ou documentos vinculados |
78|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
79|| `created_at` | timestamptz | default `now()` |
80|| `updated_at` | timestamptz | trigger padrao |
81|
82|`dds_participantes`
83|
84|| Coluna | Tipo | Regra |
85|| --- | --- | --- |
86|| `id` | uuid PK | `gen_random_uuid()` |
87|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
88|| `dds_id` | uuid FK `dds_registros(id)` | cascade |
89|| `user_id` | uuid FK `auth.users(id)` | opcional |
90|| `nome` | text | obrigatorio |
91|| `funcao` | text | opcional |
92|| `assinatura_path` | text | opcional |
93|| `assinatura_hash` | text | opcional |
94|| `signed_at` | timestamptz | opcional |
95|| `created_at` | timestamptz | default `now()` |
96|
97|`sugestoes_temas`
98|
99|| Coluna | Tipo | Regra |
100|| --- | --- | --- |
101|| `id` | uuid PK | `gen_random_uuid()` |
102|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
103|| `obra_id` | uuid FK `obras(id)` | opcional |
104|| `segmento` | text | opcional |
105|| `tema` | text | obrigatorio |
106|| `motivo` | text | explicacao da sugestao |
107|| `prioridade` | text | `baixa`, `media`, `alta` |
108|| `origem` | text | `perfil`, `rdo`, `manual`, `sistema` |
109|| `ocorrencias_count` | integer | default `0` |
110|| `periodo_inicio` | date | opcional |
111|| `periodo_fim` | date | opcional |
112|| `payload` | jsonb | evidencias da sugestao |
113|| `gerado_at` | timestamptz | default `now()` |
114|
115|### 4.2 Indices
116|
117|- `idx_perfil_seg_org` unico em `(org_id)`.
118|- `idx_dds_registros_org_data` em `(org_id, data desc)`.
119|- `idx_dds_registros_org_obra_data` em `(org_id, obra_id, data desc)`.
120|- `idx_dds_participantes_dds` em `(dds_id)`.
121|- `idx_sugestoes_temas_org_gerado` em `(org_id, gerado_at desc)`.
122|
123|### 4.3 RLS
124|
125|- `SELECT`: membros ativos da org.
126|- `INSERT`: membros ativos da org; se a tela limitar por role, manter tambem validacao no frontend.
127|- `UPDATE`: criador do registro enquanto `rascunho`, ou `Presidente`, `Administrador`, `Gerente`.
128|- `DELETE`: somente gestores; para registros realizados, preferir cancelamento/soft delete.
129|- Participantes podem ser inseridos por quem cria o DDS; update de assinatura deve validar `dds_id` e `org_id`.
130|
131|### 4.4 Validacao de compatibilidade Supabase
132|
133|Validado contra migrations locais em 2026-05-31.
134|
135|- Existe rota/pagina `/app/seguranca`, mas ela usa auditoria/seguranca do sistema. O DDS deve usar rota nova (`/app/dds`) ou submodulo claro para nao confundir seguranca operacional com auditoria.
136|- `public.rdos` possui `detalhes jsonb` e historico do frontend grava acidentes e problemas em detalhes; isso pode alimentar sugestoes de DDS.
137|- `public.obras` existe e permite vincular DDS por obra.
138|- `public.documentos` e bucket `documentos` existem para fotos e assinaturas.
139|- Nao foram encontradas tabelas `perfil_empresa_seguranca`, `dds_registros`, `dds_participantes` ou `sugestoes_temas`; sem conflito nominal nas migrations locais.
140|- Como houve drift anterior no contrato de RDO, antes da implementacao deve ser feita leitura do schema remoto para confirmar `rdos.detalhes` e campos de ocorrencias usados na sugestao.
141|
142|## 5. Endpoints e Edge Functions
143|
144|- `suggest-dds-theme`: calcula sugestoes com base em perfil, segmento e ocorrencias recentes.
145|- `generate-dds-monthly-report`: gera PDF mensal de seguranca.
146|- `sign-dds-participant`: opcional, registra assinatura digital com hash e metadados.
147|- CRUD de perfil e DDS pode usar Supabase client com RLS.
148|- Upload de fotos/assinaturas deve usar bucket `documentos` com path contendo `org_id`/`dds_id`.
149|
150|## 6. Telas e UX
151|
152|- Rota recomendada: `/app/dds`.
153|- Aba `Perfil de seguranca`: segmento, riscos comuns, NRs e metas.
154|- Aba `Novo DDS`: sugestao automatica, tema, descricao, obra, fotos e participantes.
155|- Tela mobile para coleta de assinaturas em campo.
156|- Aba `Historico`: filtros por obra, periodo, tema, status e participante.
157|- Aba `Indicadores`: DDS realizados no mes, meta, aderencia e temas recorrentes.
158|- Exportacao de relatorio mensal.
159|
160|## 7. Hooks, queryKeys e integracao frontend
161|
162|- Criar `src/hooks/useDDS.ts`.
163|- Query keys:
164|  - `['dds-profile', orgId]`
165|  - `['dds-registros', orgId, filters]`
166|  - `['dds-registro', orgId, ddsId]`
167|  - `['dds-sugestoes', orgId, obraId]`
168|  - `['dds-metas', orgId, periodo]`
169|- Mutations devem invalidar apenas a org ativa.
170|- Estados vazios devem informar que nao existem DDS/ocorrencias suficientes, sem exemplos falsos.
171|
172|## 8. Testes
173|
174|- Unitarios para calculo de meta mensal.
175|- Unitarios para sugestao com e sem ocorrencias recentes.
176|- Teste de assinatura de participante e persistencia.
177|- Testes RLS com duas organizacoes.
178|- Playwright mobile para registrar DDS com participante e foto.
179|- Teste de exportacao do relatorio mensal.
180|- Regressao garantindo que `/app/seguranca` atual nao foi quebrada.
181|
182|## 9. Criterios de aceite
183|
184|- Administrador configura perfil de seguranca da empresa.
185|- Sistema sugere tema com motivo rastreavel.
186|- Encarregado registra DDS no celular com participantes e assinatura.
187|- Fotos/assinaturas persistem apos reload.
188|- Indicador mensal calcula realizados vs meta.
189|- PDF mensal lista DDS, participantes, temas e evidencias.
190|- Dados ficam isolados por `org_id`.
191|- Build, lint e testes existentes continuam passando apos implementacao.
192|
193|## 10. Dependencias
194|
195|- Depende de `orgs`, `org_members`, `obras`, `rdos`, `documentos` e bucket `documentos`.
196|- Depende do contrato real de `rdos.detalhes` para sugestoes baseadas em ocorrencias.
197|- Nao depende de Fluxo de Caixa, Contratos, Portal do Cliente ou ERP.
198|- Pode receber evidencias do modulo OS quando OS bloqueadas/problemas de campo estiverem prontos.
199|- Deve preservar a pagina atual de seguranca/auditoria, sem trocar seu significado.
200|
201|## 11. Status de implementacao
202|
203|Ultima atualizacao: 2026-06-06
204|
205|### 11.1 Concluido
206|
207|- Migration: `supabase/migrations/20260606233000_prd_dds_tables.sql` (4 tabelas + indices + RLS)
208|- Hook: `src/hooks/useDDS.ts` (React Query org-bound com perfil, registros, sugestoes, indicadores)
209|- Pagina: `src/pages/DDS.tsx` (`/app/dds` com 4 abas: Perfil, Novo DDS, Historico, Indicadores)
210|- Rota: `/app/dds` (protegida, sem conflito com `/app/seguranca`)
211|
212|## 12. Edge Functions complementares
213|
214|| Função | Arquivo | Função |
215||---|---|---|
216|| sugerir-tema-dds | `supabase/functions/sugerir-tema-dds/` | Sugestão de temas por segmento |
217|| indicadores-mensais-dds | `supabase/functions/indicadores-mensais-dds/` | Indicadores mensais consolidados |
218|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Lembretes de DDS pendente |
219|
220|RPCs SQL:
221|- `obter_sequencia_dds(p_org_id, p_ano)` — próximo número sequencial
222|- `obter_indicadores_dds_mensal(p_org_id, p_mes, p_ano)` — indicadores agregados
223|
224|## 13. Pendente para produção
225|- Biblioteca expandida de temas
226|- Relatório mensal de segurança exportável
227|

## Status de Implementação — 2026-06-06

**Fase atual:** Database + Edge Functions ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260606233000_prd_dds_tables.sql` |
| Edge Functions | ✅ Completo | `indicadores-mensais-dds` deployada |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rotas | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `dds_registros`, `perfil_empresa_seguranca`

**Próximo passo:** Criar hook `useDDS.ts` e página `/app/dds`
