# PRD_ORDEM_SERVICO - Ordem de Servico (OS)

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Ordem de Servico

## 1. Objetivo

Transformar atividades planejadas em ordens de servico executaveis pelo encarregado no celular, com status operacional, anexos, checklists obrigatorios, fotos, problemas e solicitacoes de materiais.

O modulo deve servir como base para experiencia mobile/PWA sem substituir o modulo atual de Atividades.

## 2. Escopo

### 2.1 Incluido

- Criacao de OS a partir de uma atividade existente ou de forma manual.
- Campos de OS: descricao, responsavel, obra, data limite, prioridade, anexos e checklists obrigatorios.
- Fluxo mobile para marcar inicio/fim, adicionar fotos, reportar problemas e solicitar materiais.
- Acompanhamento em tempo real ou por refetch de status: `Pendente`, `Em andamento`, `Concluida`, `Bloqueada`.
- Historico de logs da OS.
- Notificacao automatica quando OS vence, muda de status ou e aprovada.

### 2.2 Fora de escopo

- Planejamento completo de cronograma.
- App nativo separado; o MVP deve usar PWA responsivo.
- Compra automatica de materiais.
- Integracao com ERP.

## 3. Regras de negocio

- Toda OS deve ter `org_id` e `obra_id`.
- Uma OS pode nascer de `atividades.id`, mas tambem pode ser criada manualmente.
- Quando criada a partir de atividade, a OS deve manter snapshot da descricao para preservar historico.
- Status permitido: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `BLOQUEADA`, `CANCELADA`, `APROVADA`.
- Apenas responsavel da OS, `Gerente`, `Administrador` ou `Presidente` podem iniciar/finalizar.
- Bloqueio exige motivo e pode gerar solicitacao de material.
- Checklist marcado como obrigatorio deve estar concluido antes de finalizar a OS.
- Fotos e documentos devem persistir no bucket `documentos` e/ou na tabela `documentos`.
- Toda mudanca de status deve gravar log imutavel em `os_logs`.

## 4. Tabelas

### 4.1 Tabelas novas

`ordens_servico`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `atividade_id` | uuid FK `atividades(id)` | opcional |
| `numero` | text | unico por `org_id` |
| `titulo` | text | obrigatorio |
| `descricao` | text | obrigatorio |
| `responsavel_user_id` | uuid FK `auth.users(id)` | opcional |
| `responsavel_nome` | text | snapshot/fallback |
| `data_limite` | date | obrigatorio |
| `prioridade` | text | `baixa`, `media`, `alta`, `critica` |
| `status` | text | status canonico da OS |
| `motivo_bloqueio` | text | obrigatorio se bloqueada |
| `started_at` | timestamptz | opcional |
| `finished_at` | timestamptz | opcional |
| `approved_by` | uuid FK `auth.users(id)` | opcional |
| `approved_at` | timestamptz | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`os_checklists`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `os_id` | uuid FK `ordens_servico(id)` | cascade |
| `checklist_id` | uuid FK `checklists(id)` | opcional |
| `titulo` | text | snapshot |
| `obrigatorio` | boolean | default `true` |
| `status` | text | `pendente`, `concluido`, `dispensado` |
| `completed_by` | uuid FK `auth.users(id)` | opcional |
| `completed_at` | timestamptz | opcional |

`os_anexos`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `os_id` | uuid FK `ordens_servico(id)` | cascade |
| `documento_id` | uuid FK `documentos(id)` | opcional |
| `tipo` | text | `projeto`, `foto`, `problema`, `material`, `outro` |
| `storage_path` | text | caminho no bucket `documentos` |
| `nome_arquivo` | text | snapshot |
| `uploaded_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |

`os_logs`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `os_id` | uuid FK `ordens_servico(id)` | cascade |
| `event_type` | text | `created`, `status_changed`, `problem_reported`, `material_requested`, `approved` |
| `status_from` | text | opcional |
| `status_to` | text | opcional |
| `payload` | jsonb | detalhes do evento |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_os_org_obra_status` em `(org_id, obra_id, status)`.
- `idx_os_org_responsavel_status` em `(org_id, responsavel_user_id, status)`.
- `idx_os_atividade_id` em `(atividade_id)` quando nao nulo.
- `idx_os_logs_os_created_at` em `(os_id, created_at desc)`.
- `idx_os_anexos_os_tipo` em `(os_id, tipo)`.

### 4.3 RLS

- `SELECT`: membros da organizacao podem visualizar OS da org.
- `INSERT`: `Presidente`, `Administrador` e `Gerente`.
- `UPDATE`: responsavel da OS pode atualizar status operacional; gestores podem atualizar todos os campos permitidos.
- `DELETE`: somente `Presidente` e `Administrador`, preferindo soft delete se aplicavel.
- `os_logs` deve permitir insert pelos atores autorizados e nao permitir update/delete pelo frontend.
- Anexos devem validar `org_id` e `os_id` em todas as policies.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- `public.atividades` existe com `org_id`, `obra_id`, `titulo`, `descricao`, `data`, `status`, `prioridade`, `categoria`, `unidade_medida` e `quantidade_prevista`.
- `public.checklists` e `public.checklist_items` existem e foram alinhados para `org_id`.
- `public.documentos` existe e o bucket `documentos` e o padrao atual para anexos reais.
- `public.notifications` existe e recebeu `org_id` em migrations posteriores.
- Nao foi encontrada tabela `ordens_servico`, `os_checklists`, `os_anexos` ou `os_logs`; sem conflito nominal nas migrations locais.
- A tabela `atividades` usa status em minusculo (`agendada`, `em_andamento`, `concluida`, `cancelada`). OS deve manter status proprio e mapear atividade apenas quando necessario.

## 5. Endpoints e Edge Functions

- `approve-os`: opcional, aprova OS concluida e grava `approved_by/approved_at`.
- `notify-os-due`: opcional, rotina para OS vencidas.
- `request-os-material`: opcional, centraliza solicitacoes de materiais e notificacoes.
- CRUD basico pode ser via Supabase client com RLS.
- Upload de anexos deve usar bucket `documentos` e gravar metadados em `os_anexos` e/ou `documentos`.

## 6. Telas e UX

- Rota recomendada: `/app/ordens-servico`.
- Acesso contextual em `/app/atividades` para criar OS a partir de atividade.
- Acesso contextual em `/app/obras/:id` para OS da obra.
- Lista Kanban ou tabela por status: Pendente, Em andamento, Bloqueada, Concluida, Aprovada.
- Tela mobile focada no encarregado, com botoes grandes para iniciar, pausar/bloquear, concluir, anexar foto e solicitar material.
- Detalhe da OS com timeline de logs e anexos.
- Dialog de bloqueio exigindo motivo.
- Indicadores de vencimento e SLA.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useOrdensServico.ts`.
- Query keys:
  - `['ordens-servico', orgId, filters]`
  - `['ordem-servico', orgId, osId]`
  - `['os-logs', orgId, osId]`
  - `['os-checklists', orgId, osId]`
- Mutations devem invalidar `dashboard-stats`, OS por obra e OS por responsavel quando aplicavel.
- O app deve usar `useRequireOrg` e nunca consultar OS sem `orgId`.
- Realtime pode ser adicionado depois; MVP pode usar refetch e invalidacao.

## 8. Testes

- Unitarios para transicoes de status permitidas.
- Unitarios para bloqueio de conclusao quando checklist obrigatorio esta pendente.
- Testes RLS com responsavel, gerente e usuario de outra org.
- Teste de criacao a partir de atividade.
- Teste de upload de foto/anexo no bucket `documentos`.
- Playwright mobile em `/app/ordens-servico` validando iniciar, bloquear e concluir.
- Regressao em `/app/atividades` para garantir que a criacao de OS nao quebra atividades atuais.

## 9. Criterios de aceite

- Usuario cria OS manual e OS a partir de atividade existente.
- Encarregado acessa no mobile, inicia, anexa foto, reporta problema e conclui.
- Supervisor ve status atualizado e timeline de logs.
- OS nao conclui se checklist obrigatorio estiver pendente.
- OS vencida aparece em alerta e gera notificacao.
- Dados ficam isolados por `org_id`.
- Nenhum anexo fica apenas em estado local.
- Build, lint e testes existentes continuam passando apos implementacao.

## 10. Dependencias

- Depende de `orgs`, `org_members`, `obras`, `atividades`, `checklists`, `documentos` e `notifications`.
- Depende do PWA/responsividade ja existente para experiencia mobile.
- Nao depende de Fluxo de Caixa para o MVP.
- Pode alimentar DDS e Portal do Cliente posteriormente com status de execucao e evidencias de campo.
- Deve ser implementado antes do Portal do Cliente para disponibilizar progresso operacional confiavel.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido

- Migration: `supabase/migrations/20260606230000_prd_ordem_servico_tables.sql` (4 tabelas + indices + RLS)
- Hook: `src/hooks/useOrdensServico.ts` (React Query org-bound com createOS e updateStatus)
- Pagina: `src/pages/OrdensServico.tsx` (`/app/ordens-servico`)
- Rota: `/app/ordens-servico` (protegida)

### 11.2 Pendente

- Edge Functions: approve-os, notify-os-due, request-os-material

## 12. Edge Functions complementares

| Função | Arquivo | Função |
|---|---|---|
| ordem-servico-approve | `supabase/functions/ordem-servico-approve/` | Aprovação/rejeição de OS |
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Lembretes de OS vencendo |

RPCs SQL:
- `obter_os_pendentes_aprovacao(p_org_id)` — OS aguardando aprovação
- `obter_relatorio_os_mensal(p_org_id, p_mes, p_ano)` — estatísticas mensais

## 13. Pendente para produção
- Template de checklist vinculado por tipo de OS
- Notificação push para OS urgentes
- Integração com atividades existentes
