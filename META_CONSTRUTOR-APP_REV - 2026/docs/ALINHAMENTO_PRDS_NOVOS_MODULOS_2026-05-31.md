# ALINHAMENTO: PRDs Novos Módulos vs Estado Atual do App
Data: 2026-05-31
Origem: PRDs e código existente
Restrição: nenhuma alteração de layout do app web até novo aviso.

## 1. Módulos PRD e ordem recomendada (segundo relatório)
1. Fluxo de Caixa e Curva ABC
2. Ordem de Serviço
3. Diálogo Diário de Segurança (DDS)
4. Gestão de Contratos e Medições
5. Portal do Cliente
6. Integração com ERP

## 2. Status atual do app (somente leitura)

### 2.1 Rotas registradas
- Rotas existentes: `/app/dashboard`, `/app/obras`, `/app/obras/:id`, `/app/rdo`, `/app/rdo/novo`, `/app/rdo/:id/visualizar`, `/app/rdo/:id/editar`, `/app/atividades`, `/app/checklist`, `/app/checklist/:id`, `/app/equipes`, `/app/colaboradores`, `/app/equipamentos`, `/app/mais`, `/app/documentos`, `/app/fornecedores`, `/app/despesas`, `/app/lixeira`, `/app/relatorios`, `/app/integracoes`, `/app/configuracoes`, `/app/perfil`, `/app/planos`, `/app/notificacoes`, `/app/feedback`, `/app/faq`, `/app/seguranca`, `/app/admin/dashboard`.
- Rotas novas (PRD) AUSENTES:
  - `/app/fluxo-caixa`
  - `/app/ordens-servico`
  - `/app/dds`
  - `/app/contratos`
  - `/app/clientes-portal`
  - `/app/integracoes/erp`
  - `/portal/:token`

### 2.2 Hooks/fluxo
- Nenhum hook dos novos módulos foi localizado:
  - `src/hooks/useFluxoCaixa.ts`
  - `src/hooks/useOrdensServico.ts`
  - `src/hooks/useDDS.ts`
  - `src/hooks/useContratosMedicoes.ts`
  - `src/hooks/useClientesPortal.ts`
  - `src/hooks/useIntegracaoERP.ts`

### 2.3 Schema
- Tabelas propostas não aparecem nas migrations listadas em `docs/` e `supabase/migrations/`.
- Conflitos sinalizados pelo relatório:
  - `public.contratos` (SFlow) vs `obra_contratos` (PRD).
  - `public.clientes` (SFlow) vs `clientes_portal` (PRD Portal).
  - `public.integrations` sem suporte a `service='erp'` → PRD propõe `integracao_erp_config`.

### 2.4 Testes
- Existem testes de smoke e unitários para módulos atuais (`src/**/__tests__/*` e `scripts/prd-*.spec.ts`).
- Não foram localizados testes de smoke/unidade para os 6 novos módulos.

### 2.5 Outros pontos
- DDS deve usar rota nova `/app/dds` e não `/app/seguranca`, que já é auditoria/segurança do sistema.
- Portal do Cliente exige rota pública `/portal/:token` fora do layout autenticado. Hoje só há rotas públicas de marketing/auth.
- Planos: PRDs citam gate `master` e `enterprise`, mas migrations atuais listam `master`, `premium`, `business`. Falta confirmação do slug `enterprise`.

## 3. Conflitos e cuidados sinalizados
1. Nomes de tabela SFlow (`contratos`, `clientes`, `integrations`).
2. RLS e helpers `is_org_member`/`has_org_role` devem ser respeitados por todas as novas entidades.
3. RDO pode ter drift; campo `rdos.detalhes` precisa de validação remota antes de usar em DDS.
4. Secret/credenciais ERP não podem ser expostas ao frontend; exige Edge Function.
5. Portal deve evitar queries anon diretas em tabelas protegidas (`expenses`, `obra_contratos`, `rdos`).

## 4. Pontos PRD vs código atual que merecem validação
- Tabelas base existem: `orgs`, `org_members`, `obras`, `expenses`, `fornecedores`, `atividades`, `checklists`, `documentos`, `notifications`.
- View `financeiro_consolidado` é referenciada; PRD Fluxo de Caixa diz para não quebrá-la.
- Rota `/app/integracoes` já existe; PRD ERP sugere usar `/app/integracoes/erp` como subrota.
- PWA/responsividade existente pode ser aproveitada para OS mobile.

## 5. Itens de alinhamento recomendados (sem mexer no layout atual)
1. Validar schema remoto antes de criar tabelas novas, principalmente `rdos.detalhes`.
2. Definir regra comercial do plano `enterprise` ou mapear ERP para planos existentes.
3. Preparar feature flags/rotas futuras para os 6 módulos sem expô-las ainda.
4. Garantir que qualquer novo arquivo use padrão org-bound e RLS do projeto.
5. Planejar migrations independentes por módulo, na ordem do relatório.

## 6. Próximo passo sugerido
Começar pelo PRD_FLUXO_CAIXA_CURVA_ABC com:
- criação isolada de migrations e validação remota read-only;
- hook `useFluxoCaixa.ts` e queries org-bound;
- smoke tests apenas do módulo novo, sem tocar telas existentes.
