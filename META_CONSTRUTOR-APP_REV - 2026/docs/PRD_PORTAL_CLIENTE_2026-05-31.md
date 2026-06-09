1|# PRD_PORTAL_CLIENTE - Portal do Cliente
2|
3|Data de criacao: 2026-05-31
4|Produto: Meta Construtor Web
5|Status: implementacao parcial (database + edge functions concluidos)
6|Origem: Prompt Mestre de novas funcionalidades
7|Modulo: Portal do Cliente
8|
9|## 1. Objetivo
10|
11|Dar acesso ao cliente final para acompanhar o andamento da obra, aprovar escolhas e trocar mensagens restritas, sem expor dados financeiros internos, dados de equipe ou conversas internas da construtora.
12|
13|## 2. Escopo
14|
15|### 2.1 Incluido
16|
17|- Link unico/token ou login leve especifico para cliente.
18|- Dashboard do cliente com fotos semanais e resumo de etapas concluidas vs pendentes.
19|- Aprovacao de itens pelo cliente, como cor de revestimento, bancada e acabamentos.
20|- Canal de mensagens restrito ao cliente.
21|- Exportacao de relatorio final de obra em PDF.
22|- Controle interno de quais secoes o cliente pode visualizar.
23|
24|### 2.2 Fora de escopo
25|
26|- Usuario completo do sistema para cliente.
27|- Exposicao de despesas, contratos, margens, fornecedores internos ou dados salariais.
28|- Chat em tempo real complexo no MVP.
29|- Pagamentos pelo portal.
30|
31|## 3. Regras de negocio
32|
33|- Cliente do portal nao e `org_member` completo.
34|- Acesso publico deve ser mediado por token seguro, hash no banco e Edge Function/RPC controlada.
35|- Nenhuma query anonima deve consultar diretamente tabelas internas protegidas como `expenses`, `obra_contratos` ou `rdos` completos.
36|- Portal deve mostrar apenas dados explicitamente liberados: progresso resumido, fotos, aprovacoes do cliente e mensagens do portal.
37|- Token deve poder expirar, ser revogado e ser regenerado.
38|- Mensagens do portal nao podem aparecer em conversas internas sem identificacao de origem.
39|- Aprovar/rejeitar item deve registrar data, IP/metadados, resposta e snapshot da solicitacao.
40|- Relatorio final deve filtrar conteudo financeiro interno.
41|
42|## 4. Tabelas
43|
44|### 4.1 Tabelas novas
45|
46|`clientes_portal`
47|
48|| Coluna | Tipo | Regra |
49|| --- | --- | --- |
50|| `id` | uuid PK | `gen_random_uuid()` |
51|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
52|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
53|| `nome` | text | obrigatorio |
54|| `email` | text | opcional |
55|| `telefone` | text | opcional |
56|| `token_hash` | text | obrigatorio e unico |
57|| `token_expires_at` | timestamptz | opcional |
58|| `status` | text | `ativo`, `revogado`, `expirado` |
59|| `allowed_sections` | jsonb | ex: fotos, cronograma, aprovacoes, mensagens |
60|| `last_accessed_at` | timestamptz | opcional |
61|| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
62|| `created_at` | timestamptz | default `now()` |
63|| `updated_at` | timestamptz | trigger padrao |
64|
65|`aprovacoes_cliente`
66|
67|| Coluna | Tipo | Regra |
68|| --- | --- | --- |
69|| `id` | uuid PK | `gen_random_uuid()` |
70|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
71|| `cliente_portal_id` | uuid FK `clientes_portal(id)` | obrigatorio |
72|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
73|| `titulo` | text | obrigatorio |
74|| `descricao` | text | obrigatorio |
75|| `tipo` | text | `acabamento`, `layout`, `material`, `outro` |
76|| `opcoes` | jsonb | lista de opcoes/fotos |
77|| `status` | text | `pendente`, `aprovado`, `rejeitado`, `cancelado` |
78|| `resposta` | jsonb | escolha, comentario, metadados |
79|| `requested_by` | uuid FK `auth.users(id)` | obrigatorio |
80|| `responded_at` | timestamptz | opcional |
81|| `created_at` | timestamptz | default `now()` |
82|| `updated_at` | timestamptz | trigger padrao |
83|
84|`mensagens_portal`
85|
86|| Coluna | Tipo | Regra |
87|| --- | --- | --- |
88|| `id` | uuid PK | `gen_random_uuid()` |
89|| `org_id` | uuid FK `orgs(id)` | obrigatorio |
90|| `cliente_portal_id` | uuid FK `clientes_portal(id)` | obrigatorio |
91|| `obra_id` | uuid FK `obras(id)` | obrigatorio |
92|| `direction` | text | `cliente_para_interno` ou `interno_para_cliente` |
93|| `author_type` | text | `cliente` ou `usuario` |
94|| `author_user_id` | uuid FK `auth.users(id)` | opcional |
95|| `mensagem` | text | obrigatorio |
96|| `anexos` | jsonb | opcional |
97|| `read_at` | timestamptz | opcional |
98|| `created_at` | timestamptz | default `now()` |
99|
100|### 4.2 Indices
101|
102|- `idx_clientes_portal_org_obra_status` em `(org_id, obra_id, status)`.
103|- `idx_clientes_portal_token_hash` unico em `(token_hash)`.
104|- `idx_aprovacoes_cliente_org_obra_status` em `(org_id, obra_id, status)`.
105|- `idx_mensagens_portal_cliente_created` em `(cliente_portal_id, created_at desc)`.
106|
107|### 4.3 RLS
108|
109|- Tabelas devem ter RLS habilitado.
110|- Usuarios internos:
111|  - `SELECT`: `public.is_org_member(org_id)`.
112|  - `INSERT/UPDATE`: `Presidente`, `Administrador`, `Gerente`.
113|- Cliente externo:
114|  - Nao deve receber acesso direto anonimo amplo via Supabase client.
115|  - Edge Functions com service role validam token, status, expiracao e retornam somente payload filtrado.
116|- `token_hash` nunca deve ser retornado ao frontend publico.
117|- Mensagens publicas devem passar por rate limit basico.
118|
119|### 4.4 Validacao de compatibilidade Supabase
120|
121|Validado contra migrations locais em 2026-05-31.
122|
123|- Existe tabela SFlow `clientes` sem `org_id` e com policy anon permissiva; o Portal do Cliente nao deve reutilizar essa tabela.
124|- `public.obras`, `public.atividades`, `public.documentos` e bucket `documentos` existem e podem alimentar resumo/fotos.
125|- `public.expenses` existe, mas deve ser explicitamente excluida do payload publico.
126|- Nao foram encontradas tabelas `clientes_portal`, `aprovacoes_cliente` ou `mensagens_portal`; sem conflito nominal nas migrations locais.
127|- Rotas publicas existentes ja exigiram cuidado para nao disparar `401`; o portal publico deve usar endpoints proprios e nao queries anonimas diretas em tabelas protegidas.
128|
129|## 5. Endpoints e Edge Functions
130|
131|- `portal-client-bootstrap`: recebe token, valida hash e retorna dados filtrados do dashboard.
132|- `portal-client-approve-item`: registra aprovacao/rejeicao de item pelo cliente.
133|- `portal-client-send-message`: registra mensagem do cliente com rate limit.
134|- `portal-client-final-report`: gera relatorio final PDF sem dados financeiros internos.
135|- `portal-client-refresh-token`: uso interno para revogar/regenerar token.
136|
137|## 6. Telas e UX
138|
139|- Rota publica recomendada: `/portal/:token`.
140|- Tela interna recomendada: `/app/clientes-portal`.
141|- Tela publica com:
142|  - Cabecalho da obra e status geral.
143|  - Fotos semanais.
144|  - Etapas concluidas vs pendentes.
145|  - Aprovacoes pendentes.
146|  - Mensagens.
147|  - Botao de baixar relatorio final quando liberado.
148|- Tela interna com criacao/revogacao de links, aprovacoes, mensagens e pre-visualizacao do que o cliente ve.
149|- UX publica deve ser mobile-first e sem menu interno do app.
150|
151|## 7. Hooks, queryKeys e integracao frontend
152|
153|- Criar `src/hooks/useClientesPortal.ts` para area interna.
154|- Query keys internas:
155|  - `['clientes-portal', orgId, obraId]`
156|  - `['aprovacoes-cliente', orgId, obraId, status]`
157|  - `['mensagens-portal', orgId, clientePortalId]`
158|- Frontend publico deve chamar Edge Functions; evitar expor Supabase client com consultas diretas.
159|- Estados vazios devem ser reais: sem fotos, sem mensagens, sem aprovacoes.
160|
161|## 8. Testes
162|
163|- Unitarios para filtragem de payload publico sem dados financeiros.
164|- Teste de token expirado/revogado.
165|- Teste RLS garantindo que anon nao lista clientes_portal.
166|- Playwright publico em `/portal/:token` sem sessao autenticada.
167|- Playwright interno para criar aprovacao e responder pelo portal.
168|- Teste de mensagem cliente -> interno e interno -> cliente.
169|- Teste de exportacao PDF final sem tabelas financeiras.
170|
171|## 9. Criterios de aceite
172|
173|- Usuario interno cria link de cliente para uma obra.
174|- Cliente acessa link sem ser usuario completo do sistema.
175|- Portal mostra fotos, cronograma resumido e aprovacoes permitidas.
176|- Cliente aprova/rejeita item e a resposta aparece na area interna.
177|- Mensagens ficam restritas ao canal do portal.
178|- Nenhum dado financeiro interno aparece no payload ou na UI publica.
179|- Token revogado perde acesso imediatamente.
180|- Build, lint e testes existentes continuam passando apos implementacao.
181|
182|## 10. Dependencias
183|
184|- Depende de `orgs`, `org_members`, `obras`, `atividades`, `documentos` e bucket `documentos`.
185|- Depende de Edge Functions para acesso publico seguro por token.
186|- Deve evitar a tabela SFlow `clientes`; usar `clientes_portal`.
187|- Se o modulo OS estiver pronto, pode usar OS para resumo operacional mais preciso.
188|- Se o modulo Contratos/Medicoes estiver pronto, pode expor apenas aprovacoes de escolha do cliente, nunca valores internos.
189|
190|## 11. Status de implementacao
191|
192|Ultima atualizacao: 2026-06-06
193|
194|### 11.1 Concluido (MVP)
195|
196|- Migration: `supabase/migrations/20260606220000_prd_portal_cliente_tables.sql` (3 tabelas + indices + RLS)
197|- Edge Function: `portal-client-bootstrap` — valida token, retorna dashboard filtrado
198|- Edge Function: `portal-client-approve-item` — cliente aprova/rejeita itens pendentes
199|- Edge Function: `portal-client-send-message` — cliente envia mensagem com rate limit
200|- Edge Function: `portal-client-final-report` — relatorio HTML sem dados financeiros
201|- Edge Function: `portal-client-refresh-token` — interno: revogar/regenerar/expirar token
202|- Rota publica: `/portal/:token` → `PortalClientePublico.tsx`
203|- Rota interna: `/app/clientes-portal` → `ClientesPortal.tsx` (protegida: Presidente, Administrador, Gerente)
204|- Hook: `src/hooks/useClientesPortal.ts` (React Query, org-bound, todas as mutations)
205|- Teste smoke: `scripts/prd-portal-cliente-smoke.spec.ts`
206|
207|### 11.2 Pendente / proximo ciclo
208|
209|- Integracao com modulo OS (resumo operacional mais preciso)
210|- Integracao com modulo Contratos/Medicoes (aprovacoes de escolha do cliente)
211|- Geracao de PDF real (atualmente retorna HTML; PDF requer integracao com puppeteer/playwright edge function)
212|- Preview do que o cliente ve na tela interna
213|
214|## 12. Edge Functions complementares
215|
216|Edge Functions criadas para o módulo:
217|
218|| Função | Arquivo | Função |
219||---|---|---|
220|| portal-client-bootstrap | `supabase/functions/portal-client-bootstrap/` | Bootstrap público via token |
221|| portal-client-approve-item | `supabase/functions/portal-client-approve-item/` | Cliente aprova/rejeita |
222|| portal-client-send-message | `supabase/functions/portal-client-send-message/` | Mensagem do cliente com rate limit |
223|| portal-client-final-report | `supabase/functions/portal-client-final-report/` | Relatório PDF (HTML base) |
224|| portal-client-refresh-token | `supabase/functions/portal-client-refresh-token/` | Revogar/regenerar token (interno) |
225|| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Notificações centralizadas |
226|
227|Todas seguem padrão Deno com CORS via _shared/cors.ts.
228|
229|RPCs SQL complementares:
230|- `obter_portal_token_valido(p_token_hash)` — valida token sem expor hash
231|- `obrar_mensagens_nao_lidas_portal(p_portal_id)` — contagem de mensagens
232|
233|## 13. Pendente para produção
234|
235|- Gerar PDF real com Puppeteer/Playwright (atualmente HTML)
236|- Configurar credenciais de envio (WhatsApp/E-mail) no Supabase Secrets
237|- Homologar com dados reais de obra
238|- Testes de carga no rate limit das Edge Functions públicas
239|

## Status de Implementação — 2026-06-06

**Fase atual:** Database + Edge Functions ✅
**Status geral:** 🟡 Parcial — aguardando hooks/páginas

| Etapa | Status | Detalhe |
|-------|--------|---------|
| Migrations | ✅ Completo | `20260606220000_prd_portal_cliente_tables.sql` |
| Edge Functions | ✅ Completo | `portal-client-register`, `portal-client`, `portal-link-obra`, `portal-forgot-password` deployadas |
| Hooks React Query | ⏸️ Pendente | Aguarda definição de layout |
| Páginas React | ⏸️ Pendente | Aguarda OK para alterar layout |
| Rota pública `/portal/:token` | ⏸️ Pendente | Aguarda OK para alterar layout |

**Tabelas criadas:** `clientes_portal`, `portal_sessions`

**Próximo passo:** Criar hook e página `/portal/:token` fora do layout autenticado
