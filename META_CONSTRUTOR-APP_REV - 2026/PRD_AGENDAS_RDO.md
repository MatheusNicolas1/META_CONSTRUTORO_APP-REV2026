# PRD_AGENDAS_RDO — Agrupamento de RDOs por Dia e Nicho com Resumo Inteligente

**Data de criação:** 2026-06-10
**Produto:** Meta Construtor Web
**Status:** EM IMPLEMENTAÇÃO (Módulo 01 — Backend concluído)
**Objetivo:** Implementar um sistema de agrupamento e sumarização de RDOs que organize os registros por **data** e **nicho** (baseado nos módulos reais do Meta Construtor), permitindo que o usuário solicite um resumo do dia filtrado por nicho específico ou um resumo geral consolidado.

🔄 **ATUALIZAÇÃO 2026-06-10:** Os nichos foram redefinidos com base na análise do código-fonte do sistema. Consulte `PRD_NICHOS_RDO.md` para a definição completa e detalhada dos 8 nichos baseados nos módulos reais. Este documento mantém a arquitetura geral do sistema de agendamento, mas os slugs e regras de nicho agora são governados pelo `PRD_NICHOS_RDO.md`.

---

## 1. VISÃO GERAL

Atualmente o Meta Construtor cria RDOs individuais vinculados a uma obra, com status, atividades, equipes e anexos. Cada RDO é independente — não existe agrupamento lógico entre RDOs do mesmo dia, nem categorização por área funcional (nicho).

Com o crescimento do número de usuários e obras, um mesmo dia pode gerar dezenas de RDOs produzidos por diferentes colaboradores em diferentes frentes. O usuário (engenheiro, gestor, presidente) precisa de uma visão **consolidada por dia** que organize o volume por **nicho** e ofereça **resumos inteligentes** — seja de um nicho específico ou geral.

| Exemplo prático:
- Dia 10/06/2026: 8 RDOs na obra "Edifício Comercial A"
- Nichos envolvidos: **Execução de Obra** (atividades físicas), **Segurança do Trabalho** (DDS, acidentes), **Equipes e Mão de Obra** (produtividade)
- Usuário quer: "Resumo do dia 10/06 para **Segurança**" → recebe apenas ocorrências de segurança
- Ou: "Resumo geral do dia 10/06" → recebe um resumo consolidado de todos os nichos

---

## 2. REGRAS DE NEGÓCIO

| Regra | Descrição | Status |
|-------|-----------|--------|
| REGRA 01 | Todo RDO criado deve ser atribuído a um **nicho** no momento da criação | EM ELABORAÇÃO |
| REGRA 02 | Nichos são configuráveis por organização (cada obra/org pode ter seus próprios nichos) | EM ELABORAÇÃO |
| REGRA 03 | Um RDO pode pertencer a **apenas um nicho** por vez | EM ELABORAÇÃO |
| REGRA 04 | O agrupamento por data é automático — RDOs do mesmo dia são consolidados num container "Diário" | EM ELABORAÇÃO |
| REGRA 05 | O resumo por nicho extrai apenas RDOs daquele nicho na data selecionada e sintetiza atividades, ocorrências e status | EM ELABORAÇÃO |
| REGRA 06 | O resumo geral consolida TODOS os nichos do dia em um único relatório hierárquico | EM ELABORAÇÃO |
| REGRA 07 | O resumo pode ser visualizado na tela, exportado como PDF ou enviado por e-mail | EM ELABORAÇÃO |
| REGRA 08 | Apenas RDOs com status **APPROVED** ou **SUBMITTED** entram nos resumos do dia (DRAFT e REJECTED ficam de fora) | EM ELABORAÇÃO |
| REGRA 09 | O resumo do dia respeita permissoes multi-tenant (org_id) — cada organização vê apenas seus RDOs | EM ELABORAÇÃO |
|| REGRA 10 | Nichos default do sistema: **EXECUÇÃO DE OBRA**, **SEGURANÇA DO TRABALHO**, **ORDENS E SERVIÇOS**, **EQUIPES E MÃO DE OBRA**, **EQUIPAMENTOS E MÁQUINAS**, **MATERIAIS E ESTOQUE**, **FINANCEIRO E CONTRATOS**, **DOCUMENTOS E CLIENTE** (consulte PRD_NICHOS_RDO.md) | EM ELABORAÇÃO |
| REGRA 11 | Organizações podem criar nichos personalizados além dos defaults | EM ELABORAÇÃO |

---

## 3. MÓDULOS A IMPLEMENTAR

### MÓDULO 01 — Modelagem de Nichos (Banco de Dados)

**O que faz:** Cria a entidade `rdo_nichos` e adiciona `nicho_id` à tabela `rdos`, permitindo que cada RDO seja classificado por área funcional.

**Tabelas:**

```sql
-- Tabela de nichos (por organização)
CREATE TABLE public.rdo_nichos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    descricao TEXT,
    cor TEXT NOT NULL DEFAULT '#6366f1', -- cor para identificar o nicho na UI
    icone TEXT DEFAULT 'Folder',
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, slug)
);

-- Adicionar coluna nicho_id na tabela rdos
ALTER TABLE public.rdos
ADD COLUMN nicho_id UUID REFERENCES public.rdo_nichos(id);

-- Índice para busca por data + nicho
CREATE INDEX idx_rdos_data_nicho ON public.rdos(data, nicho_id) WHERE status IN ('SUBMITTED', 'APPROVED');

-- Índice para busca por data + org
CREATE INDEX idx_rdos_data_org ON public.rdos(org_id, data) WHERE status IN ('SUBMITTED', 'APPROVED');
```

**Seed dos nichos default** (criados automaticamente para cada nova organização):

| Slug | Nome | Cor | Ícone |
|------|------|-----|-------|
| execucao-obra | Execução de Obra | #3b82f6 | HardHat |
| seguranca-trabalho | Segurança do Trabalho | #ef4444 | Shield |
| ordens-servicos | Ordens e Serviços | #f97316 | ClipboardList |
| equipes-mao-obra | Equipes e Mão de Obra | #8b5cf6 | Users |
| equipamentos-maquinas | Equipamentos e Máquinas | #f59e0b | Wrench |
| materiais-estoque | Materiais e Estoque | #10b981 | Package |
| financeiro-contratos | Financeiro e Contratos | #06b6d4 | DollarSign |
| documentos-cliente | Documentos e Cliente | #ec4899 | FileText |

**Políticas RLS:**

- `rdo_nichos`: SELECT para authenticated (mesma org), INSERT/UPDATE/DELETE para Administrador da org
- `rdos.nicho_id`: respeita as policies existentes de RDO

---

### MÓDULO 02 — Tabela de Agendas Diárias (Diário de Bordo)

**O que faz:** Cria uma entidade `rdo_agendas` que serve como "container do dia" — um registro por data+org que agrupa todos os RDOs daquele dia. Permite metadados do dia (resumo manual, clima geral, observações do gestor).

```sql
CREATE TABLE public.rdo_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    titulo TEXT,
    resumo_geral TEXT, -- resumo consolidado gerado automaticamente ou editado manualmente
    clima_geral TEXT, -- clima predominante do dia
    observacoes_gestor TEXT, -- observações livres do gestor
    criado_por_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, data)
);

-- Adicionar coluna agenda_id na tabela rdos
ALTER TABLE public.rdos
ADD COLUMN agenda_id UUID REFERENCES public.rdo_agendas(id);

CREATE INDEX idx_rdo_agendas_data_org ON public.rdo_agendas(org_id, data);
```

**Regra de negócio:** Ao criar um RDO, o sistema automaticamente:
1. Verifica se já existe uma `rdo_agendas` para aquela `org_id` + `data`
2. Se não existir, cria automaticamente
3. Associa o RDO à agenda encontrada/criada

---

### MÓDULO 03 — Edge Functions de Resumo

**O que faz:** Duas Edge Functions que processam os RDOs de um dia e geram resumos estruturados.

#### EF `resumo-diario-nicho`

**Endpoint:** `POST /resumo-diario-nicho`

**Payload:**
```json
{
  "org_id": "uuid",
  "data": "2026-06-10",
  "nicho_slug": "seguranca-trabalho"
}
```

**Retorno:**
```json
{
  "data": "2026-06-10",
  "nicho": "Segurança",
  "total_rdos": 3,
  "total_atividades": 12,
  "total_equipes": 4,
  "ocorrencias": [
    { "tipo": "acidente", "descricao": "Queda de andaime", "gravidade": "Leve" },
    { "tipo": "equipamento_quebrado", "descricao": "Guincho parado", "impacto": "Alto" }
  ],
  "materiais_em_falta": [
    { "nome": "Cimento CP-32", "prioridade": "Alta" }
  ],
  "resumo_texto": "No dia 10/06, o nicho Segurança registrou 3 RDOs com 12 atividades, ...",
  "colaboradores_envolvidos": ["João Silva", "Maria Santos"],
  "status_geral": "ATENÇÃO"
}
```

**Lógica de síntese:**
- Agrupa atividades de todos os RDOs do nicho na data
- Extrai ocorrências (acidentes, equipamentos quebrados)
- Extrai materiais em falta
- Calcula status geral com base em ocorrências críticas
- Gera resumo textual com linguagem natural

#### EF `resumo-diario-geral`

**Endpoint:** `POST /resumo-diario-geral`

**Payload:**
```json
{
  "org_id": "uuid",
  "data": "2026-06-10"
}
```

**Retorno:**
```json
{
  "data": "2026-06-10",
  "total_rdos": 15,
  "total_nichos": 4,
  "nichos": [
    {
      "nicho": "Segurança do Trabalho",
      "slug": "seguranca-trabalho",
      "total_rdos": 3,
      "ocorrencias_criticas": 1,
      "status": "ATENÇÃO",
      "resumo_curto": "3 RDOs, 1 acidente leve, equipamento parado"
    },
    {
      "nicho": "Execução de Obra",
      "slug": "execucao-obra",
      "total_rdos": 7,
      "ocorrencias_criticas": 0,
      "status": "NORMAL",
      "resumo_curto": "7 RDOs, 28 atividades, todas as frentes operando"
    },
    {
      "nicho": "Materiais e Estoque",
      "slug": "materiais-estoque",
      "total_rdos": 3,
      "ocorrencias_criticas": 2,
      "status": "ALERTA",
      "resumo_curto": "3 RDOs, 2 materiais em falta críticos"
    },
    {
      "nicho": "Financeiro e Contratos",
      "slug": "financeiro-contratos",
      "total_rdos": 2,
      "ocorrencias_criticas": 1,
      "status": "ALERTA",
      "resumo_curto": "2 RDOs, nota fiscal pendente"
    }
  ],
  "status_geral": "ATENÇÃO",
  "resumo_geral": "Resumo consolidado do dia 10/06..."
}
```

**Lógica de síntese:**
- Itera por todos os nichos com RDOs na data
- Chama internamente a lógica de `resumo-diario-nicho` para cada um
- Monta visão hierárquica: geral > nichos > RDOs
- Calcula status geral com base no pior status entre nichos
- Gera resumo textual consolidado

---

### MÓDULO 04 — Frontend: Página "Diário de RDO"

**O que faz:** Nova rota `/app/rdo/diario` que substitui a listagem plana de RDOs por uma visão agrupada por data, com expansão por nicho.

**Componentes:**

#### 01 — `RDOAgendaPage.tsx` (página principal)
- Calendário/linha do tempo de dias com RDOs
- Cada dia vira um card expandível "Agenda do Dia DD/MM"
- Dentro do card: abas por nicho + aba "Resumo Geral"
- Badge com total de RDOs e nichos ativos no dia
- Botão "Resumo do Dia" → abre modal com resumo geral ou por nicho
- Botão "Exportar Resumo" → PDF

#### 02 — `RDOAgendaCard.tsx`
- Card representando um dia
- Header: data formatada, total RDOs, total nichos, status geral (ícone + cor)
- Expansão revela os nichos com seus RDOs
- Botão "Ver Resumo" abre o resumo daquele dia

#### 03 — `RDOAgendaNichoTab.tsx`
- Aba de um nicho específico dentro do dia
- Lista os RDOs daquele nicho na data
- Cards compactos com status, atividades resumidas, ocorrências
- Botão "Resumo deste Nicho"

#### 04 — `RDOResumoModal.tsx`
- Modal que exibe o resumo gerado pela Edge Function
- Dois modos: "Geral" (todos nichos) ou "Nicho Específico"
- Apresentação hierárquica com indicadores visuais (status: NORMAL, ATENÇÃO, ALERTA, CRÍTICO)
- Ocorrências destacadas em cards coloridos
- Botões: Fechar, Exportar PDF, Enviar por E-mail

#### 05 — Seletor de Nicho no formulário de criação de RDO
- Campo obrigatório "Nicho" no `RDONewForm.tsx`
- Dropdown com nichos da organização
- Valor default: "Obra"

#### 06 — Atualização do `RDOExpandableCard.tsx`
- Exibir badge do nicho no card do RDO
- Cor do badge conforme configuração do nicho

---

### MÓDULO 05 — Gerenciamento de Nichos (Admin)

**O que faz:** Página administrativa para configurar nichos da organização.

- `Rota:` `/app/admin/nichos`
- Lista de nichos da organização com cor, ícone, ordem
- CRUD básico (criar, editar, reordenar, desativar)
- Não é possível excluir nicho que possui RDOs vinculados — apenas desativar
- Seed automático dos 8 nichos default ao criar organização (via trigger ou EF)

---

### MÓDULO 06 — Hook `useRDOAgenda`

**O que faz:** Hook React que substitui/orquestra a busca de RDOs agrupados.

```typescript
interface RDOAgendaData {
  data: string;          // "2026-06-10"
  agendaId: string;
  totalRDOs: number;
  nichos: {
    nicho: RDONichoSupabase;
    rdos: RDOSupabase[];
    resumo?: ResumoNicho;
  }[];
  resumoGeral?: ResumoGeral;
}

useRDOAgenda(options: {
  orgId: string;
  dataInicio?: string;
  dataFim?: string;
}): {
  agendas: RDOAgendaData[];
  isLoading: boolean;
  fetchResumoNicho: (data: string, nichoSlug: string) => Promise<ResumoNicho>;
  fetchResumoGeral: (data: string) => Promise<ResumoGeral>;
}
```

**Queries:**
- `['rdo-agendas', orgId, dataInicio, dataFim]` — busca agendas do período com RDOs agrupados
- Cache de resumos por 5 minutos (resumos são computacionalmente caros)
- **Importante:** manter compatibilidade com `useRDOs` existente — a página de listagem atual `/app/rdo` continua funcionando

---

### MÓDULO 07 — Nova Migration e Schema

**Migration:** `20260610000000_rdo_nichos_agendas.sql`

Conteúdo esperado:
1. `CREATE TABLE public.rdo_nichos`
2. `CREATE TABLE public.rdo_agendas`
3. `ALTER TABLE public.rdos ADD COLUMN nicho_id UUID REFERENCES public.rdo_nichos(id)`
4. `ALTER TABLE public.rdos ADD COLUMN agenda_id UUID REFERENCES public.rdo_agendas(id)`
5. Índices: `idx_rdos_data_nicho`, `idx_rdos_data_org`, `idx_rdo_agendas_data_org`
6. RLS policies para `rdo_nichos` e `rdo_agendas`
7. Trigger ou função `auto_assign_agenda()` que, ao inserir um RDO, encontra ou cria a agenda do dia
8. Seed function `seed_default_nichos(org_id)` chamada via trigger após criar organização

---

## 4. ARQUIVOS CRIADOS/MODIFICADOS

### Migrations
| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/20260610000000_rdo_nichos_agendas.sql` | Criação das tabelas `rdo_nichos`, `rdo_agendas`, alterações em `rdos`, índices, RLS, triggers |

### Edge Functions
| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/resumo-diario-nicho/index.ts` | Gera resumo por data + nicho |
| `supabase/functions/resumo-diario-geral/index.ts` | Gera resumo geral do dia |

### Frontend
| Arquivo | Descrição |
|---------|-----------|
| `src/pages/RDOAgendaPage.tsx` | Página principal do diário de RDO |
| `src/components/rdo/RDOAgendaCard.tsx` | Card de dia com expansão por nicho |
| `src/components/rdo/RDOAgendaNichoTab.tsx` | Aba de nicho dentro do dia |
| `src/components/rdo/RDOResumoModal.tsx` | Modal de resumo (geral ou por nicho) |
| `src/components/rdo/RDONichoSelect.tsx` | Seletor de nicho para formulários |
| `src/hooks/useRDOAgenda.ts` | Hook para buscar dados agrupados |
| `src/hooks/useRDONichos.ts` | Hook para CRUD de nichos |
| `src/pages/admin/AdminNichosPage.tsx` | Página admin de gerenciamento de nichos |
| `src/components/rdo/RDONewForm.tsx` | **MODIFICADO** — adicionar campo nicho |
| `src/components/rdo/RDOExpandableCard.tsx` | **MODIFICADO** — exibir badge de nicho |
| `src/App.tsx` | **MODIFICADO** — adicionar rotas `/app/rdo/diario` e `/app/admin/nichos` |

### Documentação
| Arquivo | Descrição |
|---------|-----------|
| `PRD_AGENDAS_RDO.md` | Este documento |

---

## 5. FLUXOS COMPLETOS

### Fluxo 01: Criação de RDO com Nicho

```
Usuário abre RDONewForm
  → Seleciona obra, período, clima, atividades, equipes...
  → NOVO: Seleciona "Nicho" (dropdown com nichos da org, default "Obra")
  → Submete
  → Sistema:
      1. Cria/recupera rdo_agendas para org_id + data
      2. Associa RDO à agenda
      3. Salva RDO com nicho_id
  → Confirmação visual com badge do nicho no card
```

### Fluxo 02: Visualização por Agenda Diária

```
Usuário acessa /app/rdo/diario
  → Página exibe timeline de dias com RDOs
  → Cada dia: card com data, total RDOs, total nichos, status geral
  → Usuário expande um dia
  → Abas: [Resumo Geral] [Execução de Obra] [Segurança do Trabalho] [Ordens e Serviços] [Equipes e Mão de Obra] [Equipamentos e Máquinas] [Materiais e Estoque] [Financeiro e Contratos] [Documentos e Cliente] ...
  → Cada aba de nicho: lista de RDOs daquele nicho na data
  → Aba "Resumo Geral": visão consolidada com indicadores por nicho
```

### Fluxo 03: Solicitação de Resumo

```
Opção A — Resumo por Nicho:
  Usuário: "Resumo do dia 10/06 para Segurança"
  → Sistema chama EF resumo-diario-nicho(org_id, data, "seguranca-trabalho")
  → Retorna: RDOs, atividades, ocorrências, materiais em falta, resumo textual
  → Exibe em RDOResumoModal (modo nicho)
  → Botões: Exportar PDF, Compartilhar

Opção B — Resumo Geral:
  Usuário: "Resumo do dia 10/06" ou "Resumo geral"
  → Sistema chama EF resumo-diario-geral(org_id, data)
  → Retorna: visão hierárquica com todos nichos + resumo consolidado
  → Exibe em RDOResumoModal (modo geral)
  → Botões: Exportar PDF, Compartilhar
```

### Fluxo 04: Gerenciamento de Nichos (Admin)

```
Usuário admin acessa /app/admin/nichos
  → Tabela com nichos da organização: nome, slug, cor, ícone, ordem, ativo
  → Ações: Editar, Reordenar (drag), Desativar
  → Botão: "Novo Nicho"
  → Formulário: nome, slug (auto-gen), descrição, cor (color picker), ícone (seletor)
  → Ao salvar: valida UNIQUE(org_id, slug)
  → Desativar: soft delete (não remove RDOs existentes)
```

---

## 6. STATUS DE IMPLEMENTAÇÃO

| Item | Status | Evidência |
|------|--------|-----------|
| Migration `rdo_nichos` | ✅ IMPLEMENTADO | `supabase/migrations/20260610000000_rdo_nichos_agendas.sql` + `supabase/migrations/20260610150000_rdo_nichos_complement.sql` |
| Migration `rdo_agendas` | ✅ IMPLEMENTADO | `supabase/migrations/20260610000000_rdo_nichos_agendas.sql` |
| Trigger `auto_assign_agenda` | ✅ IMPLEMENTADO | `supabase/migrations/20260610000000_rdo_nichos_agendas.sql` |
| Seed de nichos default | ✅ IMPLEMENTADO | `supabase/migrations/20260610000000_rdo_nichos_agendas.sql` + complemento com `is_default` |
| EF `resumo-diario-nicho` | Pendente | — |
| EF `resumo-diario-geral` | Pendente | — |
| Hook `useRDOAgenda` | Pendente | — |
| Hook `useRDONichos` | Pendente | — |
| Página `RDOAgendaPage` | Pendente | — |
| Componente `RDOAgendaCard` | Pendente | — |
| Componente `RDOAgendaNichoTab` | Pendente | — |
| Componente `RDOResumoModal` | Pendente | — |
| Componente `RDONichoSelect` | Pendente | — |
| Modificação `RDONewForm` (campo nicho) | Pendente | — |
| Modificação `RDOExpandableCard` (badge nicho) | Pendente | — |
| Página admin `AdminNichosPage` | Pendente | — |
| Rotas em `App.tsx` | Pendente | — |
| Build (lint + typecheck + build) | Pendente | — |

---

## 7. EVIDÊNCIAS FUNCIONAIS (PÓS-IMPLEMENTAÇÃO)

*Esta seção será preenchida após a implementação.*

### 7.1 Schema e Migrations
- [x] Migration aplicada no Supabase remoto
- [x] `rdo_nichos` criada com RLS
- [x] `rdo_agendas` criada com RLS
- [x] Colunas `nicho_id` e `agenda_id` adicionadas em `rdos`
- [x] Trigger `auto_assign_agenda` funcionando
- [x] Seed de nichos default criado para nova organização

### 7.2 Edge Functions
- [ ] `resumo-diario-nicho` deployada e respondendo
- [ ] `resumo-diario-geral` deployada e respondendo
- [ ] Teste manual: chamar EF com org_id + data + nicho
- [ ] Teste manual: chamar EF com org_id + data (geral)

### 7.3 Fluxo Completo
- [ ] Criar RDO com nicho → badge exibido no card
- [ ] RDO associado à agenda do dia automaticamente
- [ ] `/app/rdo/diario` exibe dias agrupados
- [ ] Expandir dia → abas por nicho funcionando
- [ ] Resumo por nicho → modal com dados corretos
- [ ] Resumo geral → modal com todos nichos
- [ ] Nichos configuráveis via `/app/admin/nichos`
- [ ] Exportar resumo como PDF
- [ ] Enviar resumo por e-mail

### 7.4 Build
- [ ] `npm run lint` sem erros
- [ ] `npm run build` concluído
- [ ] Rotas funcionando em produção

---

## 8. DEPLOY

- Projeto: Meta Construtor (Supabase + Vercel)
- Migration: `npx supabase db push --linked` ou aplicar migration manualmente
- Edge Functions: `npx supabase functions deploy resumo-diario-nicho` e `resumo-diario-geral`
- Frontend: Deploy Vercel (push para main)
- Variáveis de ambiente: nenhuma nova necessária (usa org_id da sessão)

---

## 9. PENDÊNCIAS

### Pendências (implementação)
- [ ] Criar migration SQL completa
- [ ] Implementar trigger `auto_assign_agenda`
- [ ] Implementar seed function de nichos default
- [ ] Implementar EF `resumo-diario-nicho`
- [ ] Implementar EF `resumo-diario-geral`
- [ ] Criar hook `useRDOAgenda`
- [ ] Criar hook `useRDONichos`
- [ ] Criar `RDOAgendaPage.tsx`
- [ ] Criar `RDOAgendaCard.tsx`
- [ ] Criar `RDOAgendaNichoTab.tsx`
- [ ] Criar `RDOResumoModal.tsx`
- [ ] Criar `RDONichoSelect.tsx`
- [ ] Modificar `RDONewForm.tsx` (adicionar campo nicho)
- [ ] Modificar `RDOExpandableCard.tsx` (badge nicho)
- [ ] Criar `AdminNichosPage.tsx`
- [ ] Adicionar rotas em `App.tsx`
- [ ] Build: lint + typecheck + build

### Pendências (manual)
- [ ] Validar migration no Supabase remoto
- [ ] Validar RLS policies de `rdo_nichos` e `rdo_agendas`
- [ ] Testar resumo com dados reais de RDO
- [ ] Verificar performance com muitos RDOs no mesmo dia (paginação?)
- [ ] Decidir se resumos serão gerados via IA (LLM) ou template estruturado
- [ ] Definir limite de RDOs por resumo (ex: no máximo 50 RDOs por nicho/dia)

---

## 10. VALIDAÇÃO FINAL

| # | Teste | Resultado |
|---|-------|-----------|
| 01 | Migration `rdo_nichos` e `rdo_agendas` aplicadas sem erro | Pendente |
| 02 | Coluna `nicho_id` adicionada em `rdos` | Pendente |
| 03 | Trigger `auto_assign_agenda` cria agenda automaticamente ao inserir RDO | Pendente |
| 04 | Nichos default aparecem para nova organização | Pendente |
| 05 | EF `resumo-diario-nicho` retorna estrutura correta | Pendente |
| 06 | EF `resumo-diario-geral` retorna estrutura correta | Pendente |
| 07 | Página `/app/rdo/diario` carrega e exibe dias agrupados | Pendente |
| 08 | Expansão de dia mostra abas por nicho | Pendente |
| 09 | Modal de resumo por nicho exibe dados corretos | Pendente |
| 10 | Modal de resumo geral exibe todos nichos | Pendente |
| 11 | Criação de RDO com nicho persiste e exibe badge | Pendente |
| 12 | Admin de nichos: criar, editar, reordenar, desativar | Pendente |
| 13 | RLS: usuário de org A não vê nichos da org B | Pendente |
| 14 | `npm run lint` passa | Pendente |
| 15 | `npm run build` conclui sem erros | Pendente |

---

## 11. ANEXOS

### Exemplo de uso real

**Cenário:** Edifício Comercial A, 10/06/2026

Colaboradores criam 8 RDOs:

| RDO | Nicho | Responsável | Atividades Principais |
|-----|-------|-------------|----------------------|
| RDO-001 | Execução de Obra | João (Encarregado) | Concretagem laje 3º andar, montagem forma |
| RDO-002 | Execução de Obra | Pedro (Pedreiro) | Alvenaria 2º andar, instalação vergalhões |
| RDO-003 | Segurança do Trabalho | Ana (Técnica) | DDS matinal, inspeção EPIs, ocorrência queda leve |
| RDO-004 | Materiais e Estoque | Carlos (Almoxarife) | Recebimento cimento, falta areia fina |
| RDO-005 | Equipamentos e Máquinas | Roberto (OP) | Operação betoneira, manutenção preventiva |
| RDO-006 | Ordens e Serviços | João (Encarregado) | Instalação elétrica 1º andar |
| RDO-007 | Financeiro e Contratos | Marina (Financeiro) | Medição boletim, NF pendente |
| RDO-008 | Segurança do Trabalho | Ana (Técnica) | Treinamento brigada, relatório inspeção |

**Resumo do nicho SEGURANÇA DO TRABALHO:**
> "No dia 10/06, o nicho Segurança do Trabalho registrou 2 RDOs. DDS matinal realizado com 12 colaboradores. Ocorrência: queda de andaime leve (sem afastamento). Inspeção de EPIs concluída com 3 não-conformidades. Treinamento de brigada realizado. Status geral: ATENÇÃO."

**Resumo GERAL do dia:**
> "Dia 10/06 — 8 RDOs em 6 nichos. Execução de Obra: 2 RDOs, concretagem e alvenaria avançando. Segurança do Trabalho: 2 RDOs, 1 ocorrência leve. Materiais e Estoque: 1 RDO, falta areia (reposição 12/06). Equipamentos e Máquinas: 1 RDO, operação normal. Ordens e Serviços: 1 RDO, instalação elétrica em andamento. Financeiro e Contratos: 1 RDO, NF pendente. Status geral do dia: ATENÇÃO (ocorrências de segurança e financeiro)."

### Sugestão de roteiro de implementação

1. Migration (tabelas + índices + triggers)
2. Seed de nichos default
3. EF `resumo-diario-nicho`
4. EF `resumo-diario-geral`
5. Hook `useRDOAgenda` + `useRDONichos`
6. Modificação `RDONewForm` (campo nicho)
7. Modificação `RDOExpandableCard` (badge)
8. Página `RDOAgendaPage` + componentes
9. Modal `RDOResumoModal`
10. Página admin `AdminNichosPage`
11. Rotas em `App.tsx`
12. Build + deploy
