# PRD_FLUXO_CAIXA_CURVA_ABC - Fluxo de Caixa e Curva ABC

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Fluxo de Caixa e Curva ABC

## 1. Objetivo

Permitir que a construtora preveja entradas e saidas financeiras por obra ao longo do tempo, compare planejado vs realizado e visualize a Curva ABC financeira para identificar desvios relevantes antes que virem estouro de caixa.

O modulo deve aproveitar o Controle de Despesas existente como fonte de realizado quando possivel, sem duplicar informacao financeira ja persistida em `public.expenses`.

## 2. Escopo

### 2.1 Incluido

- Cadastro de previsao de desembolso por obra, data, categoria, fornecedor e valor.
- Cadastro de previsao de recebimento por obra, medicao aprovada, aditivo ou lancamento manual.
- Consolidacao de realizado a partir de despesas aprovadas e lancamentos financeiros manuais.
- Geracao de Curva ABC com percentual financeiro planejado vs realizado por periodo, categoria e obra.
- Alertas configuraveis quando o realizado ultrapassar o planejado em mais de X%.
- Graficos interativos de linha, barras empilhadas e distribuicao por categoria.
- Exportacao em PDF/CSV usando o padrao atual da central de relatorios.

### 2.2 Fora de escopo

- Integracao bancaria direta.
- Emissao fiscal.
- Contabilidade completa ou conciliacao contabil.
- Sincronizacao com ERP, que fica no PRD de Integracao ERP.

## 3. Regras de negocio

- Todo registro deve possuir `org_id` obrigatorio e respeitar a organizacao ativa.
- Previsoes de saida podem ser cadastradas manualmente ou derivadas de contrato, OS, compra ou despesa prevista.
- Previsoes de entrada podem ser cadastradas manualmente ou derivadas de medicao aprovada/aditivo quando o modulo de Contratos estiver pronto.
- Lancamentos realizados de despesa devem priorizar `public.expenses` como fonte canonica.
- Lancamentos realizados manuais devem registrar origem, usuario criador e justificativa.
- Curva ABC deve calcular acumulado planejado, acumulado realizado, percentual realizado, percentual planejado e desvio percentual.
- O limite de alerta deve ser configuravel por obra e ter default inicial de 10%.
- Alertas devem ser gerados apenas para desvios confirmados por dados persistidos, sem dados ficticios.
- Usuarios `Presidente`, `Administrador` e `Gerente` podem criar e aprovar ajustes financeiros; `Colaborador` pode visualizar apenas se permitido pelas regras atuais de role.

## 4. Tabelas

### 4.1 Tabelas novas

`fluxo_caixa_previsao`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `tipo` | text | `entrada` ou `saida` |
| `origem` | text | `manual`, `despesa`, `medicao`, `aditivo`, `outro` |
| `categoria` | text | compatibilizar com `expenses.cost_category` para saidas |
| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
| `fornecedor_nome` | text | snapshot para fornecedores externos |
| `descricao` | text | obrigatorio |
| `data_prevista` | date | obrigatorio |
| `valor_previsto` | numeric(15,2) | maior que zero |
| `status` | text | `planejado`, `confirmado`, `cancelado`, `realizado` |
| `alerta_percentual` | numeric(6,2) | override por lancamento |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `updated_by` | uuid FK `auth.users(id)` | opcional |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`fluxo_caixa_realizado`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `previsao_id` | uuid FK `fluxo_caixa_previsao(id)` | opcional |
| `expense_id` | uuid FK `expenses(id)` | opcional, para saidas reais |
| `medicao_id` | uuid | opcional, FK futura para medicoes |
| `tipo` | text | `entrada` ou `saida` |
| `categoria` | text | obrigatorio |
| `fornecedor_id` | uuid FK `fornecedores(id)` | opcional |
| `data_realizada` | date | obrigatorio |
| `valor_realizado` | numeric(15,2) | maior que zero |
| `origem` | text | `manual`, `expense`, `medicao`, `erp` |
| `external_ref` | text | opcional |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |

`curva_abc_log`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | obrigatorio |
| `competencia` | date | primeiro dia do mes |
| `base_planejada` | numeric(15,2) | acumulado planejado |
| `base_realizada` | numeric(15,2) | acumulado realizado |
| `percentual_planejado` | numeric(8,4) | 0 a 100 |
| `percentual_realizado` | numeric(8,4) | 0 a 100 |
| `desvio_percentual` | numeric(8,4) | realizado - planejado |
| `limite_alerta_percentual` | numeric(6,2) | limite aplicado |
| `status` | text | `ok`, `alerta`, `critico` |
| `snapshot` | jsonb | dados do calculo |
| `gerado_por` | uuid FK `auth.users(id)` | opcional |
| `generated_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_fluxo_previsao_org_obra_data` em `(org_id, obra_id, data_prevista)`.
- `idx_fluxo_previsao_org_tipo_status` em `(org_id, tipo, status)`.
- `idx_fluxo_realizado_org_obra_data` em `(org_id, obra_id, data_realizada)`.
- `idx_fluxo_realizado_expense_id` unico parcial quando `expense_id is not null`.
- `idx_curva_abc_org_obra_competencia` em `(org_id, obra_id, competencia desc)`.

### 4.3 RLS

- Habilitar RLS em todas as tabelas novas.
- `SELECT`: `public.is_org_member(org_id)`.
- `INSERT`: `public.has_org_role(org_id, array['Presidente','Administrador','Gerente']::public.app_role[])`.
- `UPDATE`: mesmo criterio de insert, com `WITH CHECK` por `org_id`.
- `DELETE`: somente `Presidente` e `Administrador`; preferir soft delete se o modulo Lixeira estiver aprovado.
- Edge Functions que recalculam curva devem usar service role apenas para a organizacao recebida e validar membership antes de executar.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- `public.orgs`, `public.org_members`, `public.is_org_member` e `public.has_org_role` existem e devem ser a base de multi-tenancy.
- `public.expenses` existe e possui `org_id`, `obra_id`, `cost_category`, `supplier_name`, `amount`, `date_of_expense` e `approval_status`; o realizado financeiro de saida deve reutilizar essa fonte.
- A view `public.financeiro_consolidado` ja consolida `expenses` por `org_id`, `obra_id`, periodo e categoria; o novo modulo pode criar views complementares, mas nao deve quebrar essa view.
- `public.fornecedores` e `public.obras` ja existem com `org_id`.
- Nao foi encontrada tabela existente com nomes `fluxo_caixa_previsao`, `fluxo_caixa_realizado` ou `curva_abc_log`; sem conflito nominal nas migrations locais.
- Ha historico de drift em Supabase neste projeto. Antes da implementacao, executar verificacao read-only do schema remoto para confirmar colunas atuais de `expenses`, `obras` e `fornecedores`.

## 5. Endpoints e Edge Functions

- `recalculate-cashflow-abc`: recebe `org_id`, `obra_id`, periodo inicial/final e grava snapshot em `curva_abc_log`.
- `send-cashflow-alerts`: opcional, envia notificacoes quando `desvio_percentual` superar o limite configurado.
- `export-cashflow-report`: opcional, gera PDF/CSV seguindo o padrao dos relatorios atuais.
- Frontend pode operar CRUD via Supabase client quando RLS for suficiente; calculos consolidados devem ficar em RPC/view ou Edge Function para evitar divergencia no cliente.

## 6. Telas e UX

- Rota recomendada: `/app/fluxo-caixa`.
- Acesso tambem pela aba financeira de `/app/obras/:id`.
- Visao principal com filtros por obra, periodo, tipo, categoria, fornecedor e status.
- Cards de resumo: saldo previsto, saldo realizado, desvio total, proximo alerta.
- Grafico de linha para acumulado planejado vs realizado.
- Barras empilhadas por categoria e mes.
- Tabela editavel de previsoes com acao de converter em realizado manual.
- Painel de alertas com severidade `ok`, `alerta` e `critico`.
- Exportacao pela central de relatorios em `/app/relatorios`.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useFluxoCaixa.ts` com React Query.
- Query keys obrigatoriamente org-bound:
  - `['fluxo-caixa-previsoes', orgId, obraId, filters]`
  - `['fluxo-caixa-realizado', orgId, obraId, filters]`
  - `['curva-abc', orgId, obraId, competencia]`
  - `['cashflow-alerts', orgId, obraId]`
- Mutations devem invalidar apenas keys da organizacao ativa.
- Evitar arrays mockados; estados vazios devem informar ausencia real de lancamentos.
- Usar `recharts`, que ja existe no projeto, para graficos.

## 8. Testes

- Unitarios para calculo de acumulado, percentual e desvio da Curva ABC.
- Unitarios para regra de alerta configuravel por obra.
- Testes de hooks garantindo queryKeys com `orgId`.
- Testes de RLS com dois usuarios de organizacoes diferentes.
- Smoke Playwright em desktop e mobile para `/app/fluxo-caixa`.
- Teste de regressao em `/app/despesas` para garantir que o modulo nao alterou aprovacao de despesas existente.
- Teste de exportacao PDF/CSV se a funcao de relatorio entrar no MVP.

## 9. Criterios de aceite

- O usuario cria previsao de saida e entrada vinculadas a uma obra.
- Despesas aprovadas aparecem como realizado sem duplicacao manual obrigatoria.
- A Curva ABC mostra planejado vs realizado por periodo com desvio calculado.
- Alerta e gerado quando o limite configurado e ultrapassado.
- Dados de uma organizacao nao aparecem para usuarios de outra organizacao.
- Reload da pagina preserva filtros basicos e dados persistidos.
- Build, lint e testes existentes continuam passando apos implementacao.
- Relatorio exportado nao usa dados ficticios.

## 10. Dependencias

- Depende das tabelas existentes `orgs`, `org_members`, `obras`, `expenses` e `fornecedores`.
- Depende dos helpers RLS `is_org_member` e `has_org_role`.
- Nao depende dos outros cinco novos modulos para o MVP.
- Recebe ganho funcional posterior do PRD_GESTAO_CONTRATOS_MEDICOES, pois medicoes aprovadas poderao gerar previsoes/realizados de entrada.
- Integra com PRD_INTEGRACAO_ERP apenas depois que ERP for aprovado, para enviar/receber eventos financeiros.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido (MVP)

- Migration: `supabase/migrations/20260606223000_prd_fluxo_caixa_tables.sql` (3 tabelas + indices + RLS)
- Hook: `src/hooks/useFluxoCaixa.ts` (React Query org-bound com saldo, previsoes, realizado, curva ABC)
- Pagina: `src/pages/FluxoCaixa.tsx` (`/app/fluxo-caixa`)
- Rota: `/fluxo-caixa/*` (legacy) e `/app/fluxo-caixa` (protegida)

### 11.2 Pendente

- Edge Function `recalculate-cashflow-abc` para snapshots automaticos da curva

## 12. Edge Functions complementares

| Função | Arquivo | Finalidade |
|---|---|---|
| calcular-receitas-previstas | `supabase/functions/calcular-receitas-previstas/` | Agrupa entradas previstas + contratos ativos |
| consolidar-fluxo-caixa | `supabase/functions/consolidar-fluxo-caixa/` | Saldo inicial, previsto x realizado mensal |
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Alertas de saldo baixo e lembretes |

RPCs SQL:
- `obter_saldo_acumulado_mes(p_org_id, p_data)` — saldo acumulado
- `obter_curva_abc(p_org_id, p_data_inicio, p_data_fim)` — classificação A/B/C por fornecedor

## 13. Pendente para produção

- Integração com Contratos para gerar previsões automáticas de entrada
- Gráfico de Curva ABC na página
- Exportar relatório mensal em PDF
