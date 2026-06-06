# PRD_GESTAO_CONTRATOS_MEDICOES - Gestao de Contratos e Medicoes

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Gestao de Contratos e Medicoes

## 1. Objetivo

Controlar contratos com fornecedores e prestadores, gerenciar medicoes baseadas em percentual fisico e gerar boletins de medicao com fotos, itens medidos, assinaturas e historico de reajustes/aditivos.

## 2. Escopo

### 2.1 Incluido

- CRUD de contratos por obra, fornecedor, escopo, valor total, vigencia e anexos.
- Cadastro de itens contratados por unidade, quantidade e valor unitario.
- Cadastro de medicoes por percentual fisico, quantidade medida, valor faturado e data de referencia.
- Aprovacao de medicao em duas etapas: validacao de campo e aprovacao financeira.
- Geracao de boletim de medicao em PDF.
- Historico de aditivos, reajustes e anexos.
- Integracao futura com Fluxo de Caixa para previsao/realizado de recebimentos e pagamentos.

### 2.2 Fora de escopo

- Assinatura eletronica externa completa.
- Retencoes tributarias complexas.
- Integracao ERP no MVP.
- Gestao juridica completa do contrato.

## 3. Regras de negocio

- Todo contrato deve possuir `org_id`, `obra_id` e fornecedor/prestador.
- O nome `contratos` nao deve ser usado para a nova tabela sem resolver conflito de schema existente.
- O contrato deve possuir valor total aprovado e vigencia.
- Medicao nao pode ultrapassar 100% acumulado por item sem aditivo aprovado.
- Medicao passa por duas etapas:
  - Campo: encarregado/gerente valida execucao fisica.
  - Financeiro: gerente/admin aprova faturamento.
- Boletim PDF so pode ser emitido para medicao validada ou aprovada.
- Aditivo altera escopo, prazo ou valor e deve preservar historico.
- Fotos e anexos devem usar persistencia real em Storage/tabela `documentos`.

## 4. Tabelas

### 4.1 Tabelas novas

Por compatibilidade, este PRD propoe nomes especificos do dominio de obra, em vez de reutilizar `contratos`.

`obra_contratos`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
| `fornecedor_nome` | text | obrigatorio como snapshot |
| `numero` | text | unico por `org_id` |
| `escopo` | text | obrigatorio |
| `valor_total` | numeric(15,2) | maior que zero |
| `data_inicio` | date | obrigatorio |
| `data_fim` | date | opcional |
| `status` | text | `rascunho`, `ativo`, `suspenso`, `encerrado`, `cancelado` |
| `anexos` | jsonb | referencias auxiliares |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`contrato_itens`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `contrato_id` | uuid FK `obra_contratos(id)` | cascade |
| `descricao` | text | obrigatorio |
| `unidade` | text | obrigatorio |
| `quantidade_total` | numeric(15,4) | maior que zero |
| `valor_unitario` | numeric(15,4) | maior ou igual a zero |
| `valor_total` | numeric(15,2) | calculado ou gravado |
| `ordem` | integer | opcional |

`medicoes_contrato`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `contrato_id` | uuid FK `obra_contratos(id)` | obrigatorio |
| `numero` | text | unico por contrato |
| `data_referencia` | date | obrigatorio |
| `percentual_executado` | numeric(8,4) | 0 a 100 |
| `valor_faturado` | numeric(15,2) | maior ou igual a zero |
| `status_campo` | text | `pendente`, `validada`, `rejeitada` |
| `validado_por` | uuid FK `auth.users(id)` | opcional |
| `validado_at` | timestamptz | opcional |
| `status_financeiro` | text | `pendente`, `aprovada`, `rejeitada` |
| `aprovado_por` | uuid FK `auth.users(id)` | opcional |
| `aprovado_at` | timestamptz | opcional |
| `motivo_rejeicao` | text | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |

`medicao_itens`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `medicao_id` | uuid FK `medicoes_contrato(id)` | cascade |
| `contrato_item_id` | uuid FK `contrato_itens(id)` | obrigatorio |
| `quantidade_medida` | numeric(15,4) | maior ou igual a zero |
| `percentual_item` | numeric(8,4) | 0 a 100 |
| `valor_medido` | numeric(15,2) | maior ou igual a zero |
| `observacoes` | text | opcional |

`boletins_medicao`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `medicao_id` | uuid FK `medicoes_contrato(id)` | obrigatorio |
| `numero` | text | unico por `org_id` |
| `pdf_path` | text | caminho no Storage |
| `assinaturas` | jsonb | aprovadores e responsaveis |
| `gerado_por` | uuid FK `auth.users(id)` | obrigatorio |
| `gerado_at` | timestamptz | default `now()` |

`aditivos_contrato`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `contrato_id` | uuid FK `obra_contratos(id)` | obrigatorio |
| `tipo` | text | `valor`, `prazo`, `escopo`, `reajuste` |
| `descricao` | text | obrigatorio |
| `valor_delta` | numeric(15,2) | opcional |
| `data_inicio_delta` | date | opcional |
| `data_fim_delta` | date | opcional |
| `status` | text | `rascunho`, `aprovado`, `cancelado` |
| `aprovado_por` | uuid FK `auth.users(id)` | opcional |
| `aprovado_at` | timestamptz | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_obra_contratos_org_obra_status` em `(org_id, obra_id, status)`.
- `idx_obra_contratos_fornecedor` em `(org_id, fornecedor_id)`.
- `idx_medicoes_contrato_status` em `(org_id, contrato_id, status_campo, status_financeiro)`.
- `idx_boletins_medicao_medicao` unico em `(medicao_id)`.
- `idx_aditivos_contrato_status` em `(org_id, contrato_id, status)`.

### 4.3 RLS

- `SELECT`: membros da organizacao.
- `INSERT/UPDATE` de contrato e aditivo: `Presidente`, `Administrador`, `Gerente`.
- Validacao de campo: responsavel operacional, `Gerente`, `Administrador` ou `Presidente`.
- Aprovacao financeira: `Gerente`, `Administrador` ou `Presidente`, com possibilidade de restringir a `Administrador` por configuracao futura.
- `DELETE`: somente `Presidente`/`Administrador`, preferindo cancelamento ou soft delete.
- Boletins emitidos devem ser imutaveis; nova emissao cria novo registro ou nova versao.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- Conflito detectado: `supabase/migrations/20260408025953_create_sflow_tables.sql` ja cria uma tabela `contratos` sem `org_id`, ligada a `projetos/propostas` do SFlow e com policy anon permissiva. Este PRD nao deve criar outra `contratos`.
- Decisao proposta: usar `obra_contratos` para contratos operacionais multi-tenant do Meta Construtor.
- `public.fornecedores`, `public.obras`, `public.documentos` e bucket `documentos` existem e devem ser usados como dependencias.
- `public.expenses` existe e pode receber despesa gerada por medicao aprovada em etapa futura.
- Nao foram encontradas tabelas `obra_contratos`, `medicoes_contrato`, `boletins_medicao` ou `aditivos_contrato`; sem conflito nominal com os nomes propostos.
- Antes da implementacao, revisar a tabela SFlow `contratos` e decidir se ela sera mantida isolada, migrada ou depreciada.

## 5. Endpoints e Edge Functions

- `generate-boletim-medicao-pdf`: gera PDF do boletim com itens, fotos e assinaturas.
- `approve-medicao-campo`: opcional, registra validacao de campo.
- `approve-medicao-financeiro`: opcional, registra aprovacao financeira e eventos financeiros.
- `create-medicao-cashflow-entry`: opcional, integra com Fluxo de Caixa quando aprovado.
- CRUD basico pode usar Supabase client com RLS, mas aprovacoes devem preferir Edge Function/RPC para validar transicoes.

## 6. Telas e UX

- Rota recomendada: `/app/contratos`.
- Aba `Contratos`: lista, filtros por obra, fornecedor, status e vigencia.
- Tela de contrato: dados gerais, itens contratados, anexos, medicoes, aditivos e historico.
- Fluxo de nova medicao com itens, percentual executado, fotos e observacoes.
- Painel de aprovacao em duas etapas.
- Acao `Gerar boletim PDF`.
- Atalho na obra: `/app/obras/:id` deve mostrar contratos e medicoes da obra.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useContratosMedicoes.ts`.
- Query keys:
  - `['obra-contratos', orgId, filters]`
  - `['obra-contrato', orgId, contratoId]`
  - `['medicoes-contrato', orgId, contratoId]`
  - `['boletins-medicao', orgId, medicaoId]`
  - `['aditivos-contrato', orgId, contratoId]`
- Mutations devem invalidar contratos por obra e dashboard financeiro quando aplicavel.
- Nao usar mocks de boletim ou assinatura; se PDF falhar, mostrar erro real.

## 8. Testes

- Unitarios para acumulado de medicao por item e limite de 100%.
- Unitarios para transicao de status campo/financeiro.
- Testes RLS entre organizacoes.
- Teste de conflito de nome garantindo que migrations novas nao criem `public.contratos`.
- Playwright para criar contrato, item, medicao e aprovar em duas etapas.
- Teste de PDF do boletim.
- Regressao em fornecedores, documentos e relatorios.

## 9. Criterios de aceite

- Usuario cria contrato vinculado a obra e fornecedor.
- Usuario cadastra itens mediveis e registra medicao por quantidade/percentual.
- Encarregado valida campo e gerente aprova financeiro em etapas separadas.
- Sistema bloqueia medicao acumulada acima de 100% sem aditivo aprovado.
- Boletim PDF e gerado com itens, fotos e assinaturas.
- Aditivo altera historico sem sobrescrever dados anteriores.
- Dados ficam isolados por `org_id`.
- Build, lint e testes existentes continuam passando apos implementacao.

## 10. Dependencias

- Depende de `orgs`, `org_members`, `obras`, `fornecedores`, `documentos` e bucket `documentos`.
- Depende da decisao sobre a tabela SFlow `contratos`; ate la, usar `obra_contratos`.
- Pode se integrar ao PRD_FLUXO_CAIXA_CURVA_ABC para gerar previsoes/realizados.
- Deve ser implementado antes do PRD_PORTAL_CLIENTE se aprovacoes de escolhas/boletins forem exibidas ao cliente.
- Deve ser implementado antes do PRD_INTEGRACAO_ERP se medicoes aprovadas forem sincronizadas com ERP.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido

- Migration: `supabase/migrations/20260606234500_prd_contratos_medicoes_tables.sql` (6 tabelas: obra_contratos, contrato_itens, medicoes_contrato, medicao_itens, boletins_medicao, aditivos_contrato)
- Hook: `src/hooks/useContratosMedicoes.ts` (React Query com contratos, itens, medicoes, boletins, aditivos, aprovacao campo/financeiro)
- Pagina: `src/pages/Contratos.tsx` (`/app/contratos` com lista, detalhe, medicoes e aditivos)
- Rota: `/app/contratos` (protegida: Presidente, Administrador, Gerente)

## 12. Edge Functions complementares

| Função | Arquivo | Função |
|---|---|---|
| calcular-medicao | `supabase/functions/calcular-medicao/` | Calcula valor apurado da medição |
| medicao-approve-flow | `supabase/functions/medicao-approve-flow/` | Fluxo de aprovação campo → financeiro |
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Notificações de aprovação pendente |

RPCs SQL:
- `obter_resumo_contrato(p_org_id, p_contrato_id)` — resumo com saldo a medir
- `obter_medicoes_pendentes_aprovacao(p_org_id, p_nivel)` — medições por nível

## 13. Pendente para produção
- Reajuste automático por índice
- Geração de boletim PDF
- Aditivos com workflow de aprovação
