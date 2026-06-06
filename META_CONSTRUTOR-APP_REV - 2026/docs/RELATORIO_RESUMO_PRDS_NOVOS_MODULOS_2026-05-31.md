# RELATORIO_RESUMO_PRDS_NOVOS_MODULOS - Meta Construtor

Data de criacao: 2026-05-31
Status: pronto para revisao
Origem: Prompt Mestre de novas funcionalidades

## 1. Arquivos criados

| Ordem | Modulo | Arquivo |
| --- | --- | --- |
| 1 | Fluxo de Caixa e Curva ABC | `docs/PRD_FLUXO_CAIXA_CURVA_ABC_2026-05-31.md` |
| 2 | Ordem de Servico | `docs/PRD_ORDEM_SERVICO_2026-05-31.md` |
| 3 | Dialogo Diario de Seguranca | `docs/PRD_DIALOGO_DIARIO_SEGURANCA_2026-05-31.md` |
| 4 | Gestao de Contratos e Medicoes | `docs/PRD_GESTAO_CONTRATOS_MEDICOES_2026-05-31.md` |
| 5 | Portal do Cliente | `docs/PRD_PORTAL_CLIENTE_2026-05-31.md` |
| 6 | Integracao com ERP | `docs/PRD_INTEGRACAO_ERP_2026-05-31.md` |

## 2. Ordem de implementacao recomendada

1. Fluxo de Caixa e Curva ABC
   - Maior retorno comercial imediato.
   - Reaproveita `expenses` e `financeiro_consolidado`.
   - Pode evoluir depois com medicoes aprovadas.

2. Ordem de Servico
   - Base para operacao mobile/PWA.
   - Reaproveita `atividades`, `checklists`, `documentos` e `notifications`.
   - Gera evidencias de campo para Portal do Cliente e DDS.

3. Dialogo Diario de Seguranca (DDS)
   - Diferencial competitivo.
   - Pode usar ocorrencias existentes em `rdos.detalhes`.
   - Deve ficar separado da pagina atual de seguranca/auditoria.

4. Gestao de Contratos e Medicoes
   - Necessario para controle de fornecedores/prestadores e boletins.
   - Deve resolver conflito com a tabela SFlow `contratos`.
   - Alimenta Fluxo de Caixa e ERP.

5. Portal do Cliente
   - Depende de dados operacionais confiaveis para nao expor informacao interna.
   - Deve usar token/Edge Function e nao queries anonimas diretas.
   - Pode consumir OS, fotos, aprovacoes e resumo de atividades.

6. Integracao com ERP
   - Mais complexo e dependente de demanda externa.
   - Depende de gate de plano, seguranca de credenciais e contratos de API.
   - Deve consumir despesas, medicoes e fluxo financeiro quando esses modulos estiverem estabilizados.

## 3. Dependencias entre modulos

| Modulo | Dependencias fortes | Dependencias opcionais/futuras |
| --- | --- | --- |
| Fluxo de Caixa e Curva ABC | `orgs`, `org_members`, `obras`, `expenses`, `fornecedores` | Contratos/Medicoes para entradas e pagamentos planejados; ERP para sync |
| Ordem de Servico | `obras`, `atividades`, `checklists`, `documentos`, `notifications` | Portal do Cliente e DDS podem consumir evidencias da OS |
| DDS | `obras`, `rdos`, `documentos`, `org_members` | OS para problemas/bloqueios de campo |
| Gestao de Contratos e Medicoes | `obras`, `fornecedores`, `documentos`, roles da org | Fluxo de Caixa e ERP |
| Portal do Cliente | `obras`, `atividades`, `documentos`, Edge Functions por token | OS, Contratos/Medicoes e DDS para resumo/evidencias |
| Integracao ERP | `plans`, `subscriptions`, `expenses`, `org_members` | Contratos/Medicoes e Fluxo de Caixa |

## 4. Conflitos e cuidados de schema detectados

- `contratos` ja existe em `supabase/migrations/20260408025953_create_sflow_tables.sql`, sem `org_id` e com policy anon permissiva. O PRD de contratos propoe `obra_contratos` para evitar colisao.
- `clientes` tambem existe no mesmo bloco SFlow, sem `org_id` e com policy anon permissiva. O Portal do Cliente deve usar `clientes_portal`, nao `clientes`.
- `public.integrations` existe, mas o check constraint de `service` nao aceita ERPs. O PRD ERP propoe `integracao_erp_config`.
- `plans` possui `master`, `premium` e `business`; nao foi localizado slug `enterprise` nas migrations locais. O gate ERP precisa de decisao comercial para mapear Enterprise.
- `rdos` teve historico de drift. PRDs que dependem de ocorrencias/RDO devem verificar schema remoto antes da implementacao.
- Todas as novas tabelas devem usar `org_id`, RLS, helpers `is_org_member`/`has_org_role` e queryKeys com `orgId`.

## 5. Proximo passo recomendado

Revisar os seis PRDs e aprovar a ordem de implementacao. Apos aprovacao, iniciar pelo PRD_FLUXO_CAIXA_CURVA_ABC com uma migration independente, hooks React Query org-bound e validacao read-only do schema remoto antes de criar objetos de banco.

## 6. Status de implementacao (2026-06-06)

Todos os 6 modulos implementados com MVP:

| Modulo | Migration | Hook | Pagina | Rota | Status |
|---|---|---|---|---|---|
| Fluxo de Caixa | ✅ | ✅ useFluxoCaixa | ✅ FluxoCaixa | `/app/fluxo-caixa` | MVP |
| Ordem de Servico | ✅ | ✅ useOrdensServico | ✅ OrdensServico | `/app/ordens-servico` | MVP |
| DDS | ✅ | ✅ useDDS | ✅ DDS | `/app/dds` | MVP |
| Contratos/Medicoes | ✅ | ✅ useContratosMedicoes | ✅ Contratos | `/app/contratos` | MVP |
| Portal do Cliente | ✅ | ✅ useClientesPortal | ✅ PortalCliente + ClientesPortal | `/portal/:token`, `/app/clientes-portal` | MVP + Edge Functions |
| Integracao ERP | ✅ | ✅ useIntegracaoERP | ✅ IntegracaoERP | `/app/integracoes/erp` | MVP |

Pendente para todos: Edge Functions/RPCs complementares conforme cada PRD.
Layout do app nao foi alterado; novas funcionalidades estao em rotas isoladas.
