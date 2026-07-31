# PRD — Revisão de Interface Meta Construtor

> Documento oficial da iniciativa de refinamento visual e de UX do Meta Construtor
> Versão: 1.1 | Status: Em andamento

---

## 1. Objetivo

Elevar significativamente a experiência do usuário do Meta Construtor — um SaaS para gestão de obras — tornando a interface mais rápida visualmente, mais limpa, mais profissional e mais agradável, **preservando toda a lógica de negócio existente**.

---

## 2. Escopo

### Inclui
- ✅ Componentes compartilhados (EmptyState, AnimatedPage, SkeletonCard)
- ✅ Microinterações na Sidebar
- ✅ Simplificação de textos e títulos em TODAS as páginas
- ✅ Substituição de empty states inline por componente unificado
- ✅ Wrapper de animação entre páginas (AnimatedPage)
- ✅ Simplificação de AlertDialog de exclusão
- ✅ Remoção de emojis de toasts
- ✅ Verificação de build

### Não inclui
- Alteração de regras de negócio
- Alteração de autenticação
- Alteração de permissões
- Alteração de APIs ou banco de dados
- Novas funcionalidades

---

## 3. Problemas Identificados

| ID | Problema | Severidade | Status |
|---|---|---|---|
| P01 | EmptyState duplicado (inline em cada página vs componente) | Alta | ✅ |
| P02 | Navegação entre páginas sem transição visual | Alta | ✅ |
| P03 | Sidebar sem feedback visual (hover/click) | Alta | ✅ |
| P04 | Títulos verbosos ("Gestão de Obras" → "Obras") | Média | ✅ |
| P05 | Subtítulos com texto genérico e longo | Média | ✅ |
| P06 | AlertDialog de exclusão com descrição técnica ("Supabase") | Média | ✅ |
| P07 | Toasts com emoji em Configuracoes | Média | ✅ |
| P08 | EmptyStateEnhanced.tsx como duplicata | Baixa | ✅ |
| P09 | Falta de SkeletonCard padronizado | Média | ✅ |
| P10 | Diálogos de criação inconsistentes entre páginas | Média | ✅ |
| P11 | Páginas sem AnimatedPage | Alta | ✅ |
| P12 | SkeletonCard não integrado nas páginas CRUD | Média | ✅ |

---

## 4. Diretrizes de UX

- **Continuidade**: Toda navegação com fluidez (fade + slide)
- **Feedback visual**: Toda mudança de estado deve ter resposta visual
- **Simplicidade**: Cada elemento justifica sua existência
- **Velocidade percebida**: Animações leves, GPU-accelerated
- **Hierarquia**: Título → subtítulo → conteúdo → ações

## 5. Diretrizes de UI

- **Design minimalista**: Menos bordas, menos ícones, mais espaço negativo
- **Paleta**: Tailwind + gradient-construction, texto em card-foreground/muted-foreground
- **Ícones**: Lucide (sem emojis no sistema)
- **Componentização**: Todo padrão visual tem componente compartilhado

---

## 6. Estratégia de Animações

| Tipo | Implementação | Detalhes |
|---|---|---|
| Transição de página | `<AnimatedPage>` | fadeIn + slideUp, 200ms easeOut |
| Componentes ao montar | framer-motion `motion.div` | EmptyState fadeIn |
| Hover | CSS `hover:scale-*` | Sidebar + botões |
| Click | CSS `active:scale-95` | Botões de ação |

Regras: GPU-accelerated (opacity/transform), máx 300ms, sem distrações.

---

## 7. Plano de Execução

### Fase 1 — Componentes base (✅)
- [x] Unificar EmptyState (merge EmptyState + EmptyStateEnhanced)
- [x] Criar AnimatedPage com fadeIn + slideUp
- [x] Adicionar microinterações CSS na AppSidebar
- [x] Criar SkeletonCard + SkeletonTable

### Fase 2 — Páginas CRUD (✅)
- [x] Obras: título, subtítulo, empty state, AnimatedPage
- [x] Equipamentos: título, diálogo, empty state, AnimatedPage, AlertDialog
- [x] Fornecedores: empty state + AnimatedPage
- [x] Colaboradores: título, AnimatedPage, AlertDialog
- [x] Despesas: título + AnimatedPage
- [x] Checklist: título + AnimatedPage

### Fase 3 — Páginas restantes (✅)
- [x] RDO: AnimatedPage
- [x] Relatorios: AnimatedPage
- [x] Configuracoes: toasts sem emoji

### Fase 4 — Consolidação (✅)
- [x] Build sem erros
- [x] PRD_REVISAO_INTERFACE.md criado

### Fase 5 — SkeletonCard + Diálogos (✅)
| ### Fase 6 — Microinterações + Responsividade (✅)
|- [x] Button.tsx: active:scale-[0.97] + transition-all duration-150 (global)
|- [x] StatPill (Dashboard): hover:-translate-y-0.5 + hover:shadow-md
|- [x] QuickAction (Dashboard): hover:-translate-y-1 + hover:shadow-md
|- [x] RecentVisualCard (Dashboard): hover:-translate-y-1 + hover:shadow-lg
|- [x] Despesas metric cards: hover:-translate-y-0.5 + hover:shadow-md
|- [x] RDO search card: hover:shadow-md
|- [x] Obras cards: hover:-translate-y-0.5 + hover:shadow-md
|- [x] gradient-construction buttons: active:scale-[0.97]
|- [x] Despesas metric grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (responsivo)
|- [x] RDO filter grid: grid-cols-1 sm:grid-cols-2 md:grid-cols-4 (responsivo)
|- [x] Despesas Table: overflow-x-auto wrapper (mobile scroll)
|- [x] Build + Deploy (2x) no domínio metaconstrutor.app.br
|

- [x] Obras: SkeletonCard no loading (substitui LoadingSpinner)
- [x] Despesas: SkeletonTable no loading (substitui "Carregando...")
- [x] Fornecedores: título "Novo Fornecedor" + descrição simplificada
- [x] Colaboradores: título "Novo Colaborador" + descrição simplificada
- [x] NovaObraForm: descrição simplificada
- [x] ExpenseForm: descrição adicionada
- [x] RDONewForm: descrição simplificada
- [x] ChecklistForm: título "Novo Checklist" + descrição simplificada
- [x] Build sem erros
- [x] PRD_REVISAO_INTERFACE.md criado

---

## 8. Decisões Tomadas

1. **EmptyState unificado**: Substitui ambos EmptyState.tsx e EmptyStateEnhanced.tsx. LucideIcon + animação fadeIn.
2. **AnimatedPage**: Wrapper único. `useLocation()` como key. 200ms easeOut quartic.
3. **Sidebar**: CSS-only. `hover:scale-[1.02]`, `hover:translate-x-[2px]`. `transition-all duration-150`.
4. **Textos**: Prefixo "Gestão de" removido. Subtítulos com 2-4 palavras.
5. **SkeletonCard**: Duas variantes (card + table). `animate-pulse` nativo.
6. **AlertDialog**: Removidas descrições técnicas ("Supabase", "imediata revogação").
7. **Button global**: active:scale-[0.97] + transition-all duration-150 — microinteração aplicada a todos os botões.
8. **Hover cards**: translateY sutil (0.5–1px) + shadow-md/lg em cards de métricas e listagens.
9. **Responsividade**: Grids adaptativos para mobile (sm/md/lg breakpoints) + overflow-x-auto em tabelas.

---

## 9. Melhorias Implementadas

### Componentes
| Componente | Descrição | Linhas |
|---|---|---|
| EmptyState.tsx | Unificado (icon+title+description+action+fadeIn) | 52 |
| AnimatedPage.tsx | Transição fadeIn+slideUp entre páginas | 24 |
| SkeletonCard.tsx | SkeletonCard + SkeletonTable loading states | 73 |

### Páginas
| Página | Título Original | Novo Título | Alterações |
|---|---|---|---|
| Obras | Gestão de Obras | **Obras** | AnimatedPage + EmptyState + texto |
| Equipamentos | Gestão de Equipamentos | **Equipamentos** | AnimatedPage + EmptyState + AlertDialog + diálogo |
| Fornecedores | (mantido) | — | AnimatedPage + EmptyState |
| Colaboradores | Gestão de Colaboradores | **Colaboradores** | AnimatedPage + AlertDialog |
| Despesas | Gestão de Despesas | **Despesas** | AnimatedPage |
| Checklist | Gestão de Checklists | **Checklists** | AnimatedPage |
| RDO | — | — | AnimatedPage |
| Relatorios | — | — | AnimatedPage |
| Configuracoes | — | — | Toasts sem emoji |

---

## 10. Pendências

| Item | Prioridade | Esforço | Status | Obs |
|---|---|---|---|---|
| Padronizar cards de métricas entre páginas | Baixa | 2h | ✅ CONCLUÍDO (2026-07-31) | Criado `MetricCard` compartilhado (src/components/MetricCard.tsx); Dashboard (era StatPill local) e Despesas (era shadcn Card) padronizados nele. RDO sem cards de métricas — nada a padronizar |
| Aplicar animações em microinterações restantes | Média | 1h | ✅ VERIFICADO — já implementado | Button já tem `active:scale-[0.97]`; Dialog/AlertDialog/Sheet/Popover já têm fade/zoom/slide (`data-[state=open]:animate-in`) |
| Revisar responsividade das páginas refatoradas | Baixa | 1h | ✅ CONCLUÍDO (2026-07-31) | Forms 2-col → `grid-cols-1 sm:grid-cols-2` (Equipamentos/Fornecedores/Colaboradores); RDOExpandableCard header com flex-wrap + truncate; Despesas tabela com overflow-x-auto; Checklist tabs/actions/datapickers responsivos |

---

## 11. Critérios de Aceite

- [x] Build compila sem erros
- [x] Navegação entre páginas com AnimatedPage
- [x] Componentes refatorados com imports corretos (fix: AnimatedPage/SkeletonTable/EmptyState estavam faltando em Despesas/Checklist/Colaboradores/Fornecedores)
- [x] Sidebar com feedback visual
- [x] Empty states consistentes
- [x] Títulos simplificados
- [x] AlertDialog sem texto técnico
- [x] Toasts sem emoji
- [x] Sem regressões funcionais

---

## 12. Changelog

| Data | Versão | Descrição |
|---|---|---|
| 2026-07-30 | 1.0 | Documento inicial — Fases 1-4 completas |
| 2026-07-31 | 1.1 | Seção 10 concluída: MetricCard compartilhado (Dashboard+Despesas), animações verificadas, responsividade corrigida; fix imports faltantes |
