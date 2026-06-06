# PRD_PORTAL_CLIENTE - Portal do Cliente

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Portal do Cliente

## 1. Objetivo

Dar acesso ao cliente final para acompanhar o andamento da obra, aprovar escolhas e trocar mensagens restritas, sem expor dados financeiros internos, dados de equipe ou conversas internas da construtora.

## 2. Escopo

### 2.1 Incluido

- Link unico/token ou login leve especifico para cliente.
- Dashboard do cliente com fotos semanais e resumo de etapas concluidas vs pendentes.
- Aprovacao de itens pelo cliente, como cor de revestimento, bancada e acabamentos.
- Canal de mensagens restrito ao cliente.
- Exportacao de relatorio final de obra em PDF.
- Controle interno de quais secoes o cliente pode visualizar.

### 2.2 Fora de escopo

- Usuario completo do sistema para cliente.
- Exposicao de despesas, contratos, margens, fornecedores internos ou dados salariais.
- Chat em tempo real complexo no MVP.
- Pagamentos pelo portal.

## 3. Regras de negocio

- Cliente do portal nao e `org_member` completo.
- Acesso publico deve ser mediado por token seguro, hash no banco e Edge Function/RPC controlada.
- Nenhuma query anonima deve consultar diretamente tabelas internas protegidas como `expenses`, `obra_contratos` ou `rdos` completos.
- Portal deve mostrar apenas dados explicitamente liberados: progresso resumido, fotos, aprovacoes do cliente e mensagens do portal.
- Token deve poder expirar, ser revogado e ser regenerado.
- Mensagens do portal nao podem aparecer em conversas internas sem identificacao de origem.
- Aprovar/rejeitar item deve registrar data, IP/metadados, resposta e snapshot da solicitacao.
- Relatorio final deve filtrar conteudo financeiro interno.

## 4. Tabelas

### 4.1 Tabelas novas

`clientes_portal`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `nome` | text | obrigatorio |
| `email` | text | opcional |
| `telefone` | text | opcional |
| `token_hash` | text | obrigatorio e unico |
| `token_expires_at` | timestamptz | opcional |
| `status` | text | `ativo`, `revogado`, `expirado` |
| `allowed_sections` | jsonb | ex: fotos, cronograma, aprovacoes, mensagens |
| `last_accessed_at` | timestamptz | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`aprovacoes_cliente`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `cliente_portal_id` | uuid FK `clientes_portal(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `titulo` | text | obrigatorio |
| `descricao` | text | obrigatorio |
| `tipo` | text | `acabamento`, `layout`, `material`, `outro` |
| `opcoes` | jsonb | lista de opcoes/fotos |
| `status` | text | `pendente`, `aprovado`, `rejeitado`, `cancelado` |
| `resposta` | jsonb | escolha, comentario, metadados |
| `requested_by` | uuid FK `auth.users(id)` | obrigatorio |
| `responded_at` | timestamptz | opcional |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`mensagens_portal`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `cliente_portal_id` | uuid FK `clientes_portal(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `direction` | text | `cliente_para_interno` ou `interno_para_cliente` |
| `author_type` | text | `cliente` ou `usuario` |
| `author_user_id` | uuid FK `auth.users(id)` | opcional |
| `mensagem` | text | obrigatorio |
| `anexos` | jsonb | opcional |
| `read_at` | timestamptz | opcional |
| `created_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_clientes_portal_org_obra_status` em `(org_id, obra_id, status)`.
- `idx_clientes_portal_token_hash` unico em `(token_hash)`.
- `idx_aprovacoes_cliente_org_obra_status` em `(org_id, obra_id, status)`.
- `idx_mensagens_portal_cliente_created` em `(cliente_portal_id, created_at desc)`.

### 4.3 RLS

- Tabelas devem ter RLS habilitado.
- Usuarios internos:
  - `SELECT`: `public.is_org_member(org_id)`.
  - `INSERT/UPDATE`: `Presidente`, `Administrador`, `Gerente`.
- Cliente externo:
  - Nao deve receber acesso direto anonimo amplo via Supabase client.
  - Edge Functions com service role validam token, status, expiracao e retornam somente payload filtrado.
- `token_hash` nunca deve ser retornado ao frontend publico.
- Mensagens publicas devem passar por rate limit basico.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- Existe tabela SFlow `clientes` sem `org_id` e com policy anon permissiva; o Portal do Cliente nao deve reutilizar essa tabela.
- `public.obras`, `public.atividades`, `public.documentos` e bucket `documentos` existem e podem alimentar resumo/fotos.
- `public.expenses` existe, mas deve ser explicitamente excluida do payload publico.
- Nao foram encontradas tabelas `clientes_portal`, `aprovacoes_cliente` ou `mensagens_portal`; sem conflito nominal nas migrations locais.
- Rotas publicas existentes ja exigiram cuidado para nao disparar `401`; o portal publico deve usar endpoints proprios e nao queries anonimas diretas em tabelas protegidas.

## 5. Endpoints e Edge Functions

- `portal-client-bootstrap`: recebe token, valida hash e retorna dados filtrados do dashboard.
- `portal-client-approve-item`: registra aprovacao/rejeicao de item pelo cliente.
- `portal-client-send-message`: registra mensagem do cliente com rate limit.
- `portal-client-final-report`: gera relatorio final PDF sem dados financeiros internos.
- `portal-client-refresh-token`: uso interno para revogar/regenerar token.

## 6. Telas e UX

- Rota publica recomendada: `/portal/:token`.
- Tela interna recomendada: `/app/clientes-portal`.
- Tela publica com:
  - Cabecalho da obra e status geral.
  - Fotos semanais.
  - Etapas concluidas vs pendentes.
  - Aprovacoes pendentes.
  - Mensagens.
  - Botao de baixar relatorio final quando liberado.
- Tela interna com criacao/revogacao de links, aprovacoes, mensagens e pre-visualizacao do que o cliente ve.
- UX publica deve ser mobile-first e sem menu interno do app.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useClientesPortal.ts` para area interna.
- Query keys internas:
  - `['clientes-portal', orgId, obraId]`
  - `['aprovacoes-cliente', orgId, obraId, status]`
  - `['mensagens-portal', orgId, clientePortalId]`
- Frontend publico deve chamar Edge Functions; evitar expor Supabase client com consultas diretas.
- Estados vazios devem ser reais: sem fotos, sem mensagens, sem aprovacoes.

## 8. Testes

- Unitarios para filtragem de payload publico sem dados financeiros.
- Teste de token expirado/revogado.
- Teste RLS garantindo que anon nao lista clientes_portal.
- Playwright publico em `/portal/:token` sem sessao autenticada.
- Playwright interno para criar aprovacao e responder pelo portal.
- Teste de mensagem cliente -> interno e interno -> cliente.
- Teste de exportacao PDF final sem tabelas financeiras.

## 9. Criterios de aceite

- Usuario interno cria link de cliente para uma obra.
- Cliente acessa link sem ser usuario completo do sistema.
- Portal mostra fotos, cronograma resumido e aprovacoes permitidas.
- Cliente aprova/rejeita item e a resposta aparece na area interna.
- Mensagens ficam restritas ao canal do portal.
- Nenhum dado financeiro interno aparece no payload ou na UI publica.
- Token revogado perde acesso imediatamente.
- Build, lint e testes existentes continuam passando apos implementacao.

## 10. Dependencias

- Depende de `orgs`, `org_members`, `obras`, `atividades`, `documentos` e bucket `documentos`.
- Depende de Edge Functions para acesso publico seguro por token.
- Deve evitar a tabela SFlow `clientes`; usar `clientes_portal`.
- Se o modulo OS estiver pronto, pode usar OS para resumo operacional mais preciso.
- Se o modulo Contratos/Medicoes estiver pronto, pode expor apenas aprovacoes de escolha do cliente, nunca valores internos.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido (MVP)

- Migration: `supabase/migrations/20260606220000_prd_portal_cliente_tables.sql` (3 tabelas + indices + RLS)
- Edge Function: `portal-client-bootstrap` — valida token, retorna dashboard filtrado
- Edge Function: `portal-client-approve-item` — cliente aprova/rejeita itens pendentes
- Edge Function: `portal-client-send-message` — cliente envia mensagem com rate limit
- Edge Function: `portal-client-final-report` — relatorio HTML sem dados financeiros
- Edge Function: `portal-client-refresh-token` — interno: revogar/regenerar/expirar token
- Rota publica: `/portal/:token` → `PortalClientePublico.tsx`
- Rota interna: `/app/clientes-portal` → `ClientesPortal.tsx` (protegida: Presidente, Administrador, Gerente)
- Hook: `src/hooks/useClientesPortal.ts` (React Query, org-bound, todas as mutations)
- Teste smoke: `scripts/prd-portal-cliente-smoke.spec.ts`

### 11.2 Pendente / proximo ciclo

- Integracao com modulo OS (resumo operacional mais preciso)
- Integracao com modulo Contratos/Medicoes (aprovacoes de escolha do cliente)
- Geracao de PDF real (atualmente retorna HTML; PDF requer integracao com puppeteer/playwright edge function)
- Preview do que o cliente ve na tela interna

## 12. Edge Functions complementares

Edge Functions criadas para o módulo:

| Função | Arquivo | Função |
|---|---|---|
| portal-client-bootstrap | `supabase/functions/portal-client-bootstrap/` | Bootstrap público via token |
| portal-client-approve-item | `supabase/functions/portal-client-approve-item/` | Cliente aprova/rejeita |
| portal-client-send-message | `supabase/functions/portal-client-send-message/` | Mensagem do cliente com rate limit |
| portal-client-final-report | `supabase/functions/portal-client-final-report/` | Relatório PDF (HTML base) |
| portal-client-refresh-token | `supabase/functions/portal-client-refresh-token/` | Revogar/regenerar token (interno) |
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Notificações centralizadas |

Todas seguem padrão Deno com CORS via _shared/cors.ts.

RPCs SQL complementares:
- `obter_portal_token_valido(p_token_hash)` — valida token sem expor hash
- `obrar_mensagens_nao_lidas_portal(p_portal_id)` — contagem de mensagens

## 13. Pendente para produção

- Gerar PDF real com Puppeteer/Playwright (atualmente HTML)
- Configurar credenciais de envio (WhatsApp/E-mail) no Supabase Secrets
- Homologar com dados reais de obra
- Testes de carga no rate limit das Edge Functions públicas
