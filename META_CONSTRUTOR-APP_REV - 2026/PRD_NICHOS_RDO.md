# PRD_NICHOS_RDO — Nichos de Atividades para Agrupamento de RDOs

**Data de criação:** 2026-06-10
**Produto:** Meta Construtor Web  
**Status:** EM ELABORAÇÃO  
**Objetivo:** Definir os nichos (categorias de agrupamento) para o sistema de Diário de RDO, baseados exclusivamente nas atividades reais gerenciadas pelo SaaS Meta Construtor — extraídas do código-fonte, schemas, hooks e PRDs existentes.

---

## 1. FUNDAMENTAÇÃO — Nichos Baseados no Código Real

Diferente de nichos genéricos de construção civil (Fundação, Estrutura, Alvenaria, etc.), os nichos do Meta Construtor devem refletir **as atividades que o sistema realmente gerencia**.

### 1.1 O que o RDO captura hoje (do schema `rdoSchema.ts` + `useRDOs.ts`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `atividadesRealizadas[].categoria` | string | Categoria da atividade (ex: Serviço, Estrutura) |
| `atividadesRealizadas[].status` | enum | Iniciada, Em Andamento, Concluída |
| `equipesPresentes[].funcao` | string | Função do colaborador |
| `equipamentosUtilizados[].categoria` | string | Categoria do equipamento |
| `equipamentosQuebrados` | array | Ocorrências com equipamentos |
| `acidentes[].gravidade` | enum | Leve, Moderado, Grave |
| `materiaisFalta[].impactoProducao` | enum | Baixo, Médio, Alto |
| `estoqueMateriais` | array | Controle de estoque no RDO |
| `condicoes_climaticas` | jsonb | Clima do dia |
| `servicos_terceiros` | jsonb | Serviços de terceiros |

### 1.2 Módulos que o SaaS realmente entrega (hooks + páginas + PRDs)

| Módulo | Hook/Página | O que faz |
|--------|-------------|-----------|
| **Obras** | `useObraDetails`, `ObraDetalhes.tsx` | Cadastro, progresso, status, cronograma |
| **RDO / Atividades** | `useRDOs`, `rdo_atividades` | Registro diário de atividades + extras |
| **SST / DDS** | `useDDS`, `DDS.tsx` | Diálogo Diário de Segurança, perfil |
| **Ordens de Serviço** | `useOrdensServico` | OS com prioridade, status, responsável |
| **Contratos e Medições** | `useContratosMedicoes` | Contratos, medições, boletins, aditivos |
| **Fluxo de Caixa** | `useFluxoCaixa` | Previsão x Realizado, Curva ABC |
| **Equipamentos** | `useEquipamentos` | Cadastro, status (Ativo/Manutenção) |
| **Colaboradores** | `useEquipesSupabase` | Cadastro, funções |
| **Portal do Cliente** | `useClientesPortal` | Aprovações, mensagens, fotos |
| **Integração ERP** | `useIntegracaoERP` | Sienge, Totvs, SAP, Omie |
| **Documentos** | `useDocuments` | Upload/gestão por obra |

---

## 2. NICHOS DEFINITIVOS

### Os 8 Nichos do Meta Construtor

Baseado nos módulos reais + campos do RDO, estes são os nichos que organizam **tudo que pode ser registrado num RDO**:

| # | Nome | Slug | Cor | Ícone | Módulos Relacionados | O que agrupa |
|---|------|------|-----|-------|----------------------|--------------|
| 1 | **Execução de Obra** | execucao-obra | `#3b82f6` (azul) | `HardHat` | Obras, Atividades (rdo_atividades) | Atividades realizadas na obra (serviço, estrutura, alvenaria, acabamento, instalações), progresso físico, % concluído |
| 2 | **Segurança do Trabalho** | seguranca-trabalho | `#ef4444` (vermelho) | `Shield` | SST/DDS, Acidentes | DDS do dia, acidentes (leve/moderado/grave), ocorrências de segurança, equipamentos quebrados com risco, paralisação por segurança |
| 3 | **Ordens e Serviços** | ordens-servicos | `#f97316` (laranja) | `ClipboardList` | Ordens de Serviço, Atividades Extras | OS em execução no dia, atividades extras (imprevistos), serviços de terceiros |
| 4 | **Equipes e Mão de Obra** | equipes-mao-obra | `#8b5cf6` (roxo) | `Users` | Colaboradores, Equipes no RDO | Equipes presentes, horas trabalhadas, horas ociosas, funções, absenteísmo, produtividade |
| 5 | **Equipamentos e Máquinas** | equipamentos-maquinas | `#f59e0b` (âmbar) | `Wrench` | Equipamentos | Equipamentos utilizados, horas de uso, manutenções, quebras, paradas, impacto na produção |
| 6 | **Materiais e Estoque** | materiais-estoque | `#10b981` (verde) | `Package` | (dados do RDO: materiaisFalta + estoqueMateriais) | Materiais em falta (com impacto), estoque atual, alertas de mínimo, recebimento de materiais |
| 7 | **Financeiro e Contratos** | financeiro-contratos | `#06b6d4` (ciano) | `DollarSign` | Fluxo de Caixa, Contratos/Medições, ERP | Medições, boletins, notas fiscais, aditivos, fluxo de caixa do dia, integração com ERP |
| 8 | **Documentos e Cliente** | documentos-cliente | `#ec4899` (rosa) | `FileText` | Documentos, Portal do Cliente | Documentos anexados ao RDO (fotos, relatórios), aprovações de cliente, mensagens do portal |

### Mapa de Correspondência: Nicho → Campos do RDO

```typescript
// Como cada nicho mapeia para os dados do RDO existente
const NICHO_RDO_MAPPING = {
  'execucao-obra': {
    sources: ['atividadesRealizadas', 'atividadesExtras', 'condicoesClimaticas'],
    filter: (atv) => !atv.is_extra, // atividades regulares
    ocorrencias: ['materiaisFalta?impacto=Alto'], // só o que impacta execução
  },
  'seguranca-trabalho': {
    sources: ['acidentes', 'equipamentosQuebrados', 'dds_do_dia'],
    filter: (item) => item.gravidade || item.issueType === 'safety',
    ocorrencias: ['acidentes', 'equipamentosQuebrados'],
  },
  'ordens-servicos': {
    sources: ['atividadesExtras', 'servicosTerceiros', 'ordens_servico_vinculadas'],
    filter: (atv) => atv.is_extra === true,
    ocorrencias: ['atividadesExtras'],
  },
  'equipes-mao-obra': {
    sources: ['equipesPresentes', 'equipeOciosa', 'tempoOcioso'],
    ocorrencias: ['equipeOciosa'], // equipe ociosa = ocorrência
  },
  'equipamentos-maquinas': {
    sources: ['equipamentosUtilizados', 'equipamentosQuebrados'],
    filter: (eq) => eq.issueType !== 'occurrence', // só equipment
    ocorrencias: ['equipamentosQuebrados', 'causouOciosidade'],
  },
  'materiais-estoque': {
    sources: ['materiaisFalta', 'estoqueMateriais'],
    ocorrencias: ['materiaisFalta?impacto=Alto|Médio'],
  },
  'financeiro-contratos': {
    sources: ['medicoes_do_dia', 'notas_fiscais', 'fluxo_caixa_diario'],
    ocorrencias: ['materiaisFalta?impacto=Financeiro'],
    // integração futura: buscar medições e boletins do dia via módulo de contratos
  },
  'documentos-cliente': {
    sources: ['files', 'fotos', 'aprovacoes_pendentes'],
    ocorrencias: ['aprovacoes_pendentes'],
  },
};
```

### Por que esses nichos e não os genéricos?

| Nicho Genérico (antigo) | Nicho Real (novo) | Motivo |
|---|---|---|
| Segurança | Segurança do Trabalho | O sistema tem módulo DDS + campo `acidentes` no RDO — é sobre SST, não "segurança patrimonial" |
| Fábrica | ❌ REMOVIDO | O sistema não gerencia fábrica. Obras não tem "fábrica" — substituído por `Execução de Obra` |
| Obra | Execução de Obra | Mais específico: são as atividades físicas da obra (serviço, estrutura, acabamento) |
| Almoxarifado | Materiais e Estoque | O RDO já captura `materiaisFalta` e `estoqueMateriais` — nome mais descritivo |
| Financeiro | Financeiro e Contratos | Inclui contratos/medições (módulo real) + fluxo de caixa |
| Administrativo | ❌ REMOVIDO | Módulo administrativo existe (PRD_ADMIN) mas é para settings do sistema, não para RDO diário |
| Qualidade | ❌ REMOVIDO | Sistema não tem módulo de qualidade implementado |
| Meio Ambiente | ❌ REMOVIDO | Sistema não tem módulo ambiental — quando tiver, vira nicho |
| (novo) | Ordens e Serviços | Módulo real `useOrdensServico` + atividades extras no RDO |
| (novo) | Equipes e Mão de Obra | Dados de equipe já estão no RDO (`equipesPresentes`, `funcao`, `horasTrabalho`) |
| (novo) | Equipamentos e Máquinas | Módulo `useEquipamentos` + `equipamentosUtilizados` + `equipamentosQuebrados` |
| (novo) | Documentos e Cliente | Portal do Cliente + documentos anexados |

---

## 3. REGRAS DE NEGÓCIO

| # | Regra | Descrição |
|---|-------|-----------|
| R01 | Nicho obrigatório | Todo RDO criado deve ter um nicho selecionado. O usuário escolhe no formulário. |
| R02 | Um RDO = um nicho | Cada RDO pertence a exatamente um nicho. Se o dia teve atividades de múltiplos nichos, são RDOs separados. |
| R03 | Nichos configuráveis por org | Cada organização pode ativar/desativar nichos, criar nichos personalizados e reordenar. |
| R04 | Nichos default são fixos | Os 8 nichos da seção 2 são criados automaticamente para toda nova organização. Não podem ser renomeados (slug fixo), mas podem ser desativados. |
| R05 | Nichos personalizados | Organizações podem criar nichos adicionais além dos 8 defaults. Estes podem ser editados e excluídos. |
| R06 | Agrupamento automático | RDOs do mesmo dia + mesma org são agrupados automaticamente no container `rdo_agendas`. |
| R07 | Resumo por nicho | Extrai apenas RDOs daquele nicho na data e sintetiza. |
| R08 | Resumo geral | Consolida todos os nichos do dia hierarquicamente. |
| R09 | Status mínimo | Apenas RDOs com status `SUBMITTED` ou `APPROVED` entram nos resumos. |
| R10 | Multi-tenant | Tudo isolado por `org_id`. |

---

## 4. TABELAS E MIGRATION

### Migration: `20260610000001_rdo_nichos_reais.sql`

```sql
-- 1. Tabela de nichos (por organização)
CREATE TABLE public.rdo_nichos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    descricao TEXT,
    cor TEXT NOT NULL DEFAULT '#6366f1',
    icone TEXT NOT NULL DEFAULT 'Folder',
    is_default BOOLEAN NOT NULL DEFAULT false, -- true = nicho padrão (não pode renomear)
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- 2. Adicionar nicho_id na tabela rdos
ALTER TABLE public.rdos
ADD COLUMN nicho_id UUID REFERENCES public.rdo_nichos(id);

-- 3. Índices
CREATE INDEX idx_rdos_data_nicho ON public.rdos(data, nicho_id)
    WHERE status IN ('SUBMITTED', 'APPROVED');
CREATE INDEX idx_rdos_data_org ON public.rdos(org_id, data)
    WHERE status IN ('SUBMITTED', 'APPROVED');

-- 4. Função seed dos 8 nichos default
CREATE OR REPLACE FUNCTION public.seed_default_nichos(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.rdo_nichos (org_id, nome, slug, descricao, cor, icone, is_default, ordem) VALUES
        (p_org_id, 'Execução de Obra',        'execucao-obra',        'Atividades físicas da obra: serviços, estrutura, acabamento, instalações',        '#3b82f6', 'HardHat',        true, 1),
        (p_org_id, 'Segurança do Trabalho',    'seguranca-trabalho',   'SST, DDS, acidentes, ocorrências de segurança',                                   '#ef4444', 'Shield',         true, 2),
        (p_org_id, 'Ordens e Serviços',        'ordens-servicos',      'Ordens de serviço em execução, atividades extras, serviços de terceiros',          '#f97316', 'ClipboardList',  true, 3),
        (p_org_id, 'Equipes e Mão de Obra',    'equipes-mao-obra',     'Equipes presentes, horas trabalhadas, ociosidade, produtividade',                   '#8b5cf6', 'Users',          true, 4),
        (p_org_id, 'Equipamentos e Máquinas',  'equipamentos-maquinas','Equipamentos utilizados, manutenções, quebras, horas de uso',                       '#f59e0b', 'Wrench',         true, 5),
        (p_org_id, 'Materiais e Estoque',      'materiais-estoque',    'Materiais em falta, estoque atual, alertas de mínimo',                              '#10b981', 'Package',        true, 6),
        (p_org_id, 'Financeiro e Contratos',   'financeiro-contratos', 'Medições, boletins, fluxo de caixa, contratos, notas fiscais',                      '#06b6d4', 'DollarSign',     true, 7),
        (p_org_id, 'Documentos e Cliente',     'documentos-cliente',   'Documentos anexados, fotos, aprovações de cliente, mensagens do portal',             '#ec4899', 'FileText',       true, 8);
END;
$$;

-- 5. Trigger: seed automático ao criar organização
CREATE OR REPLACE FUNCTION public.auto_seed_nichos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.seed_default_nichos(NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_seed_nichos
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_seed_nichos();

-- 6. Trigger: auto-assign agenda ao criar RDO
CREATE OR REPLACE FUNCTION public.auto_assign_agenda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agenda_id UUID;
BEGIN
    -- Busca ou cria a agenda do dia para esta org
    INSERT INTO public.rdo_agendas (org_id, data, titulo, criado_por_id)
    VALUES (NEW.org_id, NEW.data, 'Diário de Bordo - ' || TO_CHAR(NEW.data, 'DD/MM/YYYY'), NEW.criado_por_id)
    ON CONFLICT (org_id, data) DO NOTHING
    RETURNING id INTO v_agenda_id;

    -- Se não criou (já existia), busca existente
    IF v_agenda_id IS NULL THEN
        SELECT id INTO v_agenda_id
        FROM public.rdo_agendas
        WHERE org_id = NEW.org_id AND data = NEW.data;
    END IF;

    NEW.agenda_id := v_agenda_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_agenda
BEFORE INSERT ON public.rdos
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_agenda();

-- 7. RLS: rdo_nichos
ALTER TABLE public.rdo_nichos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver nichos da própria org"
ON public.rdo_nichos FOR SELECT
TO authenticated
USING (org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins podem gerenciar nichos da própria org"
ON public.rdo_nichos FOR INSERT
TO authenticated
WITH CHECK (
    org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid())
    AND (SELECT role FROM public.organization_members WHERE user_id = auth.uid() AND org_id = rdo_nichos.org_id) = 'admin'
);

CREATE POLICY "Admins podem atualizar nichos da própria org"
ON public.rdo_nichos FOR UPDATE
TO authenticated
USING (org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins podem desativar nichos da própria org"
ON public.rdo_nichos FOR DELETE
TO authenticated
USING (
    org_id = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = auth.uid())
    AND is_default = false -- só permite excluir nichos personalizados
);
```

---

## 5. EDGE FUNCTIONS

### 5.1 EF `resumo-diario-nicho`

**Endpoint:** `POST /resumo-diario-nicho`

**Payload:**
```json
{
  "org_id": "uuid",
  "data": "2026-06-10",
  "nicho_slug": "seguranca-trabalho"
}
```

**Lógica de síntese por nicho:**

| Nicho | Fontes de dados | Indicadores-chave | Ocorrências |
|-------|-----------------|-------------------|-------------|
| `execucao-obra` | `rdo_atividades` (regulares) | Total atividades, % concluído médio, novas frentes | Atividades paradas, % muito baixo |
| `seguranca-trabalho` | `acidentes`, `equipamentosQuebrados` | Qtd acidentes, gravidade máxima, DDS realizado | Acidentes graves, paralisação |
| `ordens-servicos` | `atividadesExtras`, `servicos_terceiros` | Qtd OS vinculadas, serviços extras | OS vencidas, pendências |
| `equipes-mao-obra` | `equipesPresentes`, `equipeOciosa` | Total colaboradores, horas totais, % ociosidade | Equipe ociosa, absenteísmo |
| `equipamentos-maquinas` | `equipamentosUtilizados`, `equipamentosQuebrados` | Total equipamentos, horas de uso | Quebras, paradas |
| `materiais-estoque` | `materiaisFalta`, `estoqueMateriais` | Itens em falta, itens abaixo do mínimo | Falta crítica (impacto Alto) |
| `financeiro-contratos` | `medicoes`, `fluxo_caixa` | Medições do dia, notas emitidas | Pendências financeiras |
| `documentos-cliente` | `fotos`, `documentos`, `aprovacoes` | Documentos anexados, aprovações pendentes | Aprovações vencendo |

**Status geral:** calculado com base na pior ocorrência:
- `NORMAL` = nenhuma ocorrência
- `ATENÇÃO` = 1 ocorrência leve/média
- `ALERTA` = 2+ ocorrências ou 1 grave
- `CRÍTICO` = acidente grave, paralisação, ou 3+ ocorrências

### 5.2 EF `resumo-diario-geral`

**Endpoint:** `POST /resumo-diario-geral`

Mesma lógica do PRD_AGENDAS_RDO original, mas usando os slugs dos novos nichos (seção 2). A função itera por todos os nichos ativos da org que têm RDOs na data e consolida.

---

## 6. FRONTEND

### 6.1 Seletor de Nicho (RDONichoSelect)

Componente dropdown que carrega `rdo_nichos` da org (apenas ativos). Deve ser adicionado ao formulário de criação/edição de RDO (`RDONewForm.tsx`):

```tsx
// Comportamento:
// - Padrão: primeiro nicho da lista (normalmente "Execução de Obra")
// - Dropdown com nome + cor (bolinha colorida) + ícone
// - Carrega via useRDONichos()
// - Campo obrigatório (validação Zod)
```

### 6.2 Badge de Nicho (RDOExpandableCard)

No card de RDO, exibir badge com a cor do nicho:

```tsx
// Exemplo visual:
// [● Execução de Obra] RDO #001 - 10/06/2026
//   Atividades: 5 | Equipes: 3 | Status: SUBMITTED
```

### 6.3 Página Diário (RDOAgendaPage)

A aba de cada nicho dentro do dia usa `rdo_nichos.cor` como cor do header/tab.

### 6.4 Gerenciamento de Nichos (AdminNichosPage)

Os 8 nichos default aparecem com cadeado (não podem ser renomeados nem excluídos, apenas desativados). Nichos personalizados têm CRUD completo.

---

## 7. HOOKS

### `useRDONichos`

```typescript
interface RDONicho {
  id: string;
  org_id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor: string;
  icone: string;
  is_default: boolean;
  ativo: boolean;
  ordem: number;
}

useRDONichos(): {
  nichos: RDONicho[];
  nichosAtivos: RDONicho[];  // filtered
  isLoading: boolean;
  createNicho: (data) => void;
  updateNicho: (id, data) => void;
  deactivateNicho: (id) => void;
}
```

### `useRDOAgenda` (atualizado)

Agrupa RDOs por nicho usando `nicho_id` em vez de slug genérico. O mapping entre nicho e seus dados é feito pelo backend (EF).

---

## 8. COMPATIBILIDADE COM RDOs EXISTENTES

RDOs criados **antes** da migration terão `nicho_id = NULL`. Tratamento:

1. Na UI: exibir badge "Sem Nicho" (cor cinza) para RDOs antigos
2. No agrupamento: RDOs sem nicho vão para um grupo "Não Classificado"
3. **Ação pós-migration (opcional)**: script one-time para classificar RDOs antigos baseado na `obra_id`:
   - Se obra_id existe → assign `execucao-obra`
   - Se tem acidentes → assign `seguranca-trabalho`
   - Caso contrário → `execucao-obra` (default)

```sql
-- Script opcional de backfill
UPDATE public.rdos
SET nicho_id = (
    SELECT id FROM public.rdo_nichos
    WHERE org_id = rdos.org_id AND slug = 'execucao-obra'
    LIMIT 1
)
WHERE nicho_id IS NULL;
```

---

## 9. EVIDÊNCIAS DE IMPLEMENTAÇÃO (pós-deploy)

### 9.1 Schema
- [ ] Migration `20260610000001_rdo_nichos_reais.sql` aplicada
- [ ] Tabela `rdo_nichos` criada com RLS
- [ ] Seed automático funcionando (nova org → 8 nichos)
- [ ] Trigger `auto_assign_agenda` funcionando
- [ ] Coluna `nicho_id` em `rdos` com FK

### 9.2 Edge Functions
- [ ] `resumo-diario-nicho` deployada — testar com cada slug
- [ ] `resumo-diario-geral` deployada — testar consolidação

### 9.3 Frontend
- [ ] Seletor de nicho no formulário de RDO
- [ ] Badge de nicho nos cards de RDO
- [ ] Agrupamento por nicho na página Diário
- [ ] Aba de resumo por nicho com indicadores visuais
- [ ] Modal de resumo geral funcionando
- [ ] Página admin de nichos (8 defaults + personalizados)

### 9.4 Build
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros

---

## 10. ARQUIVOS CRIADOS/MODIFICADOS

### Migrations
| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260610000001_rdo_nichos_reais.sql` | Criação `rdo_nichos`, alter `rdos.nicho_id`, triggers, seed, RLS |

### Edge Functions
| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/resumo-diario-nicho/index.ts` | Resumo por data + nicho (lógica mapeada por slug) |
| `supabase/functions/resumo-diario-geral/index.ts` | Resumo geral do dia |

### Frontend
| Arquivo | Descrição | Tipo |
|---------|-----------|------|
| `src/pages/RDOAgendaPage.tsx` | Página principal do diário de RDO | Novo |
| `src/components/rdo/RDOAgendaCard.tsx` | Card de dia com expansão por nicho | Novo |
| `src/components/rdo/RDOAgendaNichoTab.tsx` | Aba de nicho dentro do dia | Novo |
| `src/components/rdo/RDOResumoModal.tsx` | Modal de resumo (geral ou nicho) | Novo |
| `src/components/rdo/RDONichoSelect.tsx` | Seletor de nicho para formulários | Novo |
| `src/hooks/useRDOAgenda.ts` | Hook para buscar dados agrupados | Novo |
| `src/hooks/useRDONichos.ts` | Hook para CRUD de nichos | Novo |
| `src/pages/admin/AdminNichosPage.tsx` | Página admin de gerenciamento de nichos | Novo |
| `src/components/rdo/RDONewForm.tsx` | Adicionar campo nicho + validação | Modificado |
| `src/components/rdo/RDOExpandableCard.tsx` | Exibir badge de nicho com cor | Modificado |
| `src/App.tsx` | Adicionar rotas `/app/rdo/diario` e `/app/admin/nichos` | Modificado |

### Documentação
| Arquivo | Descrição |
|---------|-----------|
| `PRD_NICHOS_RDO.md` | Este documento |

---

## 11. ROTA DE RETOMADA

Quando este PRD for retomado:
1. Executar migration no Supabase remoto
2. Verificar seed automático dos nichos na org atual
3. Criar hooks `useRDONichos` e `useRDOAgenda`
4. Desenvolver EFs `resumo-diario-nicho` e `resumo-diario-geral`
5. Desenvolver componentes frontend (seletor, badge, agenda, resumo)
6. Modificar `RDONewForm` e `RDOExpandableCard`
7. Criar página admin de nichos
8. Adicionar rotas
9. Build + deploy
