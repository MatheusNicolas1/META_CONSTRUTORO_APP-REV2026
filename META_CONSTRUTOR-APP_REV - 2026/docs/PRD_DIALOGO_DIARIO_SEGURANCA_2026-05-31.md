# PRD_DIALOGO_DIARIO_SEGURANCA - Dialogo Diario de Seguranca (DDS)

Data de criacao: 2026-05-31
Produto: Meta Construtor Web
Status: implementacao parcial (database + edge functions concluidos)
Origem: Prompt Mestre de novas funcionalidades
Modulo: Dialogo Diario de Seguranca

## 1. Objetivo

Criar um diario de seguranca com sugestao de temas baseada no segmento da empresa, riscos comuns, normas NR aplicaveis e historico de acidentes/ocorrencias registrados.

O modulo deve diferenciar seguranca operacional de campo da pagina atual de seguranca/auditoria do sistema.

## 2. Escopo

### 2.1 Incluido

- Cadastro do perfil de seguranca da empresa: segmento, riscos comuns e normas NR aplicaveis.
- Sugestao de tema ao iniciar DDS com base em perfil, segmento e ocorrencias recentes.
- Registro de DDS com data, obra, participantes, assinaturas digitais, tema, descricao e fotos.
- Acompanhamento mensal de DDS realizados e meta de cumprimento.
- Exportacao de relatorio mensal de seguranca.
- Uso de ocorrencias de RDO quando existirem dados em `rdos.detalhes`.

### 2.2 Fora de escopo

- CAT/eSocial.
- Controle completo de EPI/estoque.
- Gestao de treinamentos obrigatorios.
- Assinatura digital juridica avancada com ICP-Brasil.

## 3. Regras de negocio

- Cada organizacao deve possuir no maximo um perfil ativo em `perfil_empresa_seguranca`.
- O segmento define um conjunto inicial de riscos e normas NR sugeridas.
- A sugestao de tema deve considerar ocorrencias recentes em RDO, especialmente acidentes, materiais em falta e problemas reportados.
- Um DDS pode ser vinculado a uma obra ou ser geral da empresa.
- Participantes podem ser usuarios do sistema ou participantes externos cadastrados por nome/funcao.
- Assinatura digital deve registrar nome, hash/metadata, data/hora, IP quando aplicavel e usuario criador.
- Meta padrao inicial: 1 DDS por dia util por organizacao, configuravel.
- Relatorio mensal deve listar DDS realizados, ausencias, temas, participantes e evidencias.
- Nenhum tema sugerido pode ser apresentado como dado real sem origem registrada em `sugestoes_temas`.

## 4. Tabelas

### 4.1 Tabelas novas

`perfil_empresa_seguranca`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio e unico |
| `segmento` | text | ex: `construcao_civil`, `mineracao`, `industrial` |
| `riscos_comuns` | text[] | default vazio |
| `normas_nr` | text[] | ex: `NR-18`, `NR-35` |
| `meta_dds_mensal` | integer | opcional |
| `meta_dds_dia_util` | boolean | default `true` |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `updated_by` | uuid FK `auth.users(id)` | opcional |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`dds_registros`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | opcional |
| `sugestao_id` | uuid FK `sugestoes_temas(id)` | opcional |
| `data` | date | obrigatorio |
| `tema` | text | obrigatorio |
| `descricao` | text | obrigatorio |
| `status` | text | `rascunho`, `realizado`, `cancelado` |
| `fotos` | jsonb | paths ou documentos vinculados |
| `created_by` | uuid FK `auth.users(id)` | obrigatorio |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | trigger padrao |

`dds_participantes`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `dds_id` | uuid FK `dds_registros(id)` | cascade |
| `user_id` | uuid FK `auth.users(id)` | opcional |
| `nome` | text | obrigatorio |
| `funcao` | text | opcional |
| `assinatura_path` | text | opcional |
| `assinatura_hash` | text | opcional |
| `signed_at` | timestamptz | opcional |
| `created_at` | timestamptz | default `now()` |

`sugestoes_temas`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK `orgs(id)` | obrigatorio |
| `obra_id` | uuid FK `obras(id)` | opcional |
| `segmento` | text | opcional |
| `tema` | text | obrigatorio |
| `motivo` | text | explicacao da sugestao |
| `prioridade` | text | `baixa`, `media`, `alta` |
| `origem` | text | `perfil`, `rdo`, `manual`, `sistema` |
| `ocorrencias_count` | integer | default `0` |
| `periodo_inicio` | date | opcional |
| `periodo_fim` | date | opcional |
| `payload` | jsonb | evidencias da sugestao |
| `gerado_at` | timestamptz | default `now()` |

### 4.2 Indices

- `idx_perfil_seg_org` unico em `(org_id)`.
- `idx_dds_registros_org_data` em `(org_id, data desc)`.
- `idx_dds_registros_org_obra_data` em `(org_id, obra_id, data desc)`.
- `idx_dds_participantes_dds` em `(dds_id)`.
- `idx_sugestoes_temas_org_gerado` em `(org_id, gerado_at desc)`.

### 4.3 RLS

- `SELECT`: membros ativos da org.
- `INSERT`: membros ativos da org; se a tela limitar por role, manter tambem validacao no frontend.
- `UPDATE`: criador do registro enquanto `rascunho`, ou `Presidente`, `Administrador`, `Gerente`.
- `DELETE`: somente gestores; para registros realizados, preferir cancelamento/soft delete.
- Participantes podem ser inseridos por quem cria o DDS; update de assinatura deve validar `dds_id` e `org_id`.

### 4.4 Validacao de compatibilidade Supabase

Validado contra migrations locais em 2026-05-31.

- Existe rota/pagina `/app/seguranca`, mas ela usa auditoria/seguranca do sistema. O DDS deve usar rota nova (`/app/dds`) ou submodulo claro para nao confundir seguranca operacional com auditoria.
- `public.rdos` possui `detalhes jsonb` e historico do frontend grava acidentes e problemas em detalhes; isso pode alimentar sugestoes de DDS.
- `public.obras` existe e permite vincular DDS por obra.
- `public.documentos` e bucket `documentos` existem para fotos e assinaturas.
- Nao foram encontradas tabelas `perfil_empresa_seguranca`, `dds_registros`, `dds_participantes` ou `sugestoes_temas`; sem conflito nominal nas migrations locais.
- Como houve drift anterior no contrato de RDO, antes da implementacao deve ser feita leitura do schema remoto para confirmar `rdos.detalhes` e campos de ocorrencias usados na sugestao.

## 5. Endpoints e Edge Functions

- `suggest-dds-theme`: calcula sugestoes com base em perfil, segmento e ocorrencias recentes.
- `generate-dds-monthly-report`: gera PDF mensal de seguranca.
- `sign-dds-participant`: opcional, registra assinatura digital com hash e metadados.
- CRUD de perfil e DDS pode usar Supabase client com RLS.
- Upload de fotos/assinaturas deve usar bucket `documentos` com path contendo `org_id`/`dds_id`.

## 6. Telas e UX

- Rota recomendada: `/app/dds`.
- Aba `Perfil de seguranca`: segmento, riscos comuns, NRs e metas.
- Aba `Novo DDS`: sugestao automatica, tema, descricao, obra, fotos e participantes.
- Tela mobile para coleta de assinaturas em campo.
- Aba `Historico`: filtros por obra, periodo, tema, status e participante.
- Aba `Indicadores`: DDS realizados no mes, meta, aderencia e temas recorrentes.
- Exportacao de relatorio mensal.

## 7. Hooks, queryKeys e integracao frontend

- Criar `src/hooks/useDDS.ts`.
- Query keys:
  - `['dds-profile', orgId]`
  - `['dds-registros', orgId, filters]`
  - `['dds-registro', orgId, ddsId]`
  - `['dds-sugestoes', orgId, obraId]`
  - `['dds-metas', orgId, periodo]`
- Mutations devem invalidar apenas a org ativa.
- Estados vazios devem informar que nao existem DDS/ocorrencias suficientes, sem exemplos falsos.

## 8. Testes

- Unitarios para calculo de meta mensal.
- Unitarios para sugestao com e sem ocorrencias recentes.
- Teste de assinatura de participante e persistencia.
- Testes RLS com duas organizacoes.
- Playwright mobile para registrar DDS com participante e foto.
- Teste de exportacao do relatorio mensal.
- Regressao garantindo que `/app/seguranca` atual nao foi quebrada.

## 9. Criterios de aceite

- Administrador configura perfil de seguranca da empresa.
- Sistema sugere tema com motivo rastreavel.
- Encarregado registra DDS no celular com participantes e assinatura.
- Fotos/assinaturas persistem apos reload.
- Indicador mensal calcula realizados vs meta.
- PDF mensal lista DDS, participantes, temas e evidencias.
- Dados ficam isolados por `org_id`.
- Build, lint e testes existentes continuam passando apos implementacao.

## 10. Dependencias

- Depende de `orgs`, `org_members`, `obras`, `rdos`, `documentos` e bucket `documentos`.
- Depende do contrato real de `rdos.detalhes` para sugestoes baseadas em ocorrencias.
- Nao depende de Fluxo de Caixa, Contratos, Portal do Cliente ou ERP.
- Pode receber evidencias do modulo OS quando OS bloqueadas/problemas de campo estiverem prontos.
- Deve preservar a pagina atual de seguranca/auditoria, sem trocar seu significado.

## 11. Status de implementacao

Ultima atualizacao: 2026-06-06

### 11.1 Concluido

- Migration: `supabase/migrations/20260606233000_prd_dds_tables.sql` (4 tabelas + indices + RLS)
- Hook: `src/hooks/useDDS.ts` (React Query org-bound com perfil, registros, sugestoes, indicadores)
- Pagina: `src/pages/DDS.tsx` (`/app/dds` com 4 abas: Perfil, Novo DDS, Historico, Indicadores)
- Rota: `/app/dds` (protegida, sem conflito com `/app/seguranca`)

## 12. Edge Functions complementares

| Função | Arquivo | Função |
|---|---|---|
| sugerir-tema-dds | `supabase/functions/sugerir-tema-dds/` | Sugestão de temas por segmento |
| indicadores-mensais-dds | `supabase/functions/indicadores-mensais-dds/` | Indicadores mensais consolidados |
| notificar-eventos-modulos | `supabase/functions/notificar-eventos-modulos/` | Lembretes de DDS pendente |

RPCs SQL:
- `obter_sequencia_dds(p_org_id, p_ano)` — próximo número sequencial
- `obter_indicadores_dds_mensal(p_org_id, p_mes, p_ano)` — indicadores agregados

## 13. Pendente para produção
- Biblioteca expandida de temas
- Relatório mensal de segurança exportável
