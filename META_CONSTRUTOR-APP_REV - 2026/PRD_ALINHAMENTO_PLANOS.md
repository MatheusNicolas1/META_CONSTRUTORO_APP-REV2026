# PRD_ALINHAMENTO_PLANOS — Gap entre páginas públicas, app e implementação backend

**Data de criação:** 2026-07-30  
**Produto:** Meta Construtor Web  
**Status:** Auditoria / Planejamento  
**Base mestra:** `PRD_MESTRE.md`

---

## 📋 Escopo

Auditar todas as fontes de informação de planos do Meta Construtor e identificar divergências entre:

| Fonte | Arquivo(s) |
|---|---|
| Página pública de preços (versão antiga) | `src/pages/Preco.tsx` |
| Página pública de preços (versão nova) | `src/pages-gemini/preco2.tsx` |
| Limites reais do plano (frontend) | `src/utils/planLimits.ts` |
| Permissões por função | `src/types/user.ts` |
| Limites no backend | `supabase/functions/_shared/guards.ts` |
| Componentes de alerta | `PlanLimitCard.tsx`, `CreditsDisplay.tsx` |
| Páginas com bloqueios internos | `Obras.tsx`, `Colaboradores.tsx`, `Equipes.tsx`, `RDO.tsx` |
| Banco de dados (plans) | Migration + tabela `plans` no Supabase |
| Créditos | `useCredits.ts`, `CreditsDisplay.tsx`, `org_credits`/`user_credits` triggers |

---

## 🚨 FASE 0 — DIAGNÓSTICO COMPLETO

### ❌ DIVERGÊNCIAS CRÍTICAS (P0 — impacto em conversão e confiança)

#### 1. Plano Free na página pública `Preco.tsx`

A página pública mais visitada — carregada em `/preco` — declara:

| Item | Página diz | Real (`planLimits.ts`) | Impacto |
|---|---|---|---|
| `features` card Free | **"5 membros na equipe"** | **1 usuário** | 🔴 MENTIRA — gera frustração e churn |
| Tabela comparativa | **"5"** usuários | **1** usuário | 🔴 MENTIRA |
| Tabela comparativa | **"Ilimitados"** RDOs | **7/mês** (créditos com reset mensal) | 🔴 MENTIRA — usuário descobre ao tentar criar o 8º RDO |
| FAQ | *"Preciso de cartão para o plano grátis? Não."* | ✅ OK (não pede cartão) | ✅ |

#### 2. Plano Free na página pública `preco2.tsx` (NOVA versão)

Carregada como rota alternativa `/preco2`:

| Item | Página diz | Real | Impacto |
|---|---|---|---|
| Card Grátis features | **"Até 3 usuários"** | **1 usuário** | 🔴 MENTIRA |
| Card Grátis features | **"RDO digital básico"** | 7/mês com créditos (não ilimitado) | 🟡 Omisso — não alerta sobre limite |
| Tabela Grátis | **"3"** usuários | **1** | 🔴 MENTIRA |
| Tabela Grátis | **"Básico"** RDO | Completo, mas com teto de 7/mês | 🟡 Enganoso |
| Não tem plano Básico | Só mostra Grátis, Profissional, Enterprise | Plano Básico existe no checkout e no app | 🟡 Perde vendas de entrada |

#### 3. Plano Básico — inconsistência de `maxObras`

| Fonte | Valor |
|---|---|
| `planLimits.ts` | `maxObras: 2` |
| Tabela `Preco.tsx` diz | "3" obras |
| Banco `plans` table | `max_obras: null` (ilimitado) |
| Página oficial `Preco.tsx` | Card Básico diz "3 obras ativas" |

**🔴 Três valores diferentes para o mesmo plano.** O usuário que assina Básico com expectativa de 3 obras pode ser travado em 2 (frontend) ou deixado sem trava (banco = null).

---

### 🟡 DIVERGÊNCIAS MÉDIAS (P1 — experiência do usuário)

#### 4. Bloqueios no app existem mas são só frontend

| Página | Usa PlanLimitCard? | Usa CreditsDisplay? | Guard backend ativo? |
|---|---|---|---|
| `Obras.tsx` | ✅ Sim | ✅ Sim | ❌ `requirePlanLimit` não é chamado por ninguém |
| `Colaboradores.tsx` | ✅ Sim | ❌ | ❌ |
| `Equipes.tsx` | ✅ Sim | ❌ | ❌ |
| `RDO.tsx` | ❌ (não tem bloqueio de limite de obra) | ✅ Sim (só créditos) | ❌ |

**Problema:** Um usuário malicioso (ou um bypass via API) pode criar quantas obras/convidar quantos membros quiser — o `requirePlanLimit` do `guards.ts` **nunca é invocado** por nenhuma Edge Function.

#### 5. Fluxo de convite de membro sem verificação de plano

O usuário Free consegue inserir o e-mail de um colaborador, mas o sistema de convite (`org_members` / `equipes`) não verifica `maxUsers`. O PlanLimitCard bloqueia visualmente, mas se o usuário consegue enviar o formulário, o backend aceita.

#### 6. CreditsDisplay só aparece em Obras e RDO

- `CreditsDisplay` está em `Obras.tsx` (linha 105) e `RDO.tsx` (linha 269)
- **Não aparece** na página Home, Dashboard, `NovoRDO.tsx` — usuário free pode criar RDO sem ver seu saldo

#### 7. CreditsDisplay diz "Entre em contato" em vez de "Faça upgrade"

```
⚠️ Créditos esgotados. Você atingiu o limite de RDOs gratuitos. **Entre em contato** para saber sobre os planos ilimitados.
```

Deveria direcionar para `/preco` com botão de upgrade — não "entre em contato". Perde conversão.

#### 8. "Presidente" bypassa todos os limites

Em `usePermissions.ts`:
```ts
const isAtLimit = !isPresidente && !limits.unlimitedObras && obrasCount >= limits.maxObras;
const isAtLimit = !isPresidente && !limits.unlimitedUsers && equipeCount >= limits.maxUsers;
```

Presidente **nunca** vê limite. Isso é intencional para o dono da conta, mas significa que se o dono tiver plano Free, ele mesmo pode criar obras ilimitadas (o frontend deixa). E se o backend não trava, passa.

---

### ✅ O QUE JÁ FUNCIONA CORRETAMENTE

| Funcionalidade | Status |
|---|---|
| `PlanLimitCard` em Obras, Colaboradores, Equipes | ✅ Mostra badge de usado/limite + botão "Ver planos" |
| `CreditsDisplay` em Obras e RDO | ✅ Mostra saldo de créditos, barra de progresso, aviso crítico |
| `usePermissions.ts` computa limites corretamente | ✅ Usa `planLimits.ts` como fonte de verdade |
| `usePlanLimits.ts` retorna limites por plan_type | ✅ Fallback free, override Presidente=ilimitado |
| `requirePlanLimit` em `guards.ts` | ✅ **Existe e está correto** — mas não é chamado |
| Trigger de créditos no banco | ✅ `org_credits` com reset mensal e consumo na criação de RDO |
| Checkout Stripe | ✅ Preços e slugs dos planos corretos |

---

## 🔍 MAPA COMPLETO DE TODAS AS FONTES DE VERDADE DE PLANO

### A. `src/utils/planLimits.ts` — **FONTE DE VERDADE DEFINITIVA**

| Plano | maxUsers | maxObras | maxCredits | unlimitedObras | unlimitedUsers |
|---|---|---|---|---|---|
| **free** | **1** | **1** | **7** | false | false |
| **basic** | 3 | **2** | 999999 | false | false |
| **professional** | 5 | 999999 | 999999 | true | false |
| **master** | 15 | 999999 | 999999 | true | false |
| **business** | 999999 | 999999 | 999999 | true | true |

### B. `supabase/functions/_shared/guards.ts` — back-end enforcement

Verifica `max_users` contra `org_members.status='active'` e `max_obras` contra `obras.org_id`.

👉 **Nunca chamado por nenhuma Edge Function real.**

### C. `supabase/migrations/` — banco

| Tabela | Função |
|---|---|
| `plans` | Slugs + `max_users`, `max_obras` — fallback quando não tem assinatura |
| `subscriptions` | Plano ativo do usuário (join com `plans`) |
| `org_credits` / `user_credits` | Saldo de créditos RDO, reset mensal, consumo |
| Trigger | Decrementa crédito ao criar RDO, bloqueia se saldo = 0 |

---

## 📋 AÇÕES NECESSÁRIAS

### 🔴 Fase 1 — Corrigir páginas públicas (HOJE)

1. **`Preco.tsx` (linha 49)**: Trocar `'5 membros na equipe'` → `'1 usuário'`
2. **`Preco.tsx` (tabela, linha 146)**: Trocar `free: '5'` → `free: '1'`
3. **`Preco.tsx` (tabela, linha 148)**: Trocar `free: 'Ilimitados'` → `free: '7/mês'`
4. **`Preco.tsx` (FAQ)**: Adicionar FAQ sobre créditos RDO
5. **`preco2.tsx` (linha 34)**: Trocar `'Até 3 usuários'` → `'1 usuário'`
6. **`preco2.tsx` (tabela, linha 80)**: Trocar `free: '3'` → `free: '1'`
7. **`preco2.tsx`**: Adicionar plano Básico nos cards (R$ 49/mês)
8. **`Preco.tsx` (tabela básico)**: Definir `basico: '2'` (ou decidir valor correto)
9. **`planLimits.ts` basic**: Decidir se `maxObras` é 2 ou 3 → alinhar com superbase `plans` table

### 🟡 Fase 2 — Conectar backend enforcement

1. **Criar Edge Function `accept-invite`**: Chamar `requirePlanLimit(supabase, orgId, 'max_users')` antes de inserir em `org_members`
2. **Criar Edge Function `create-obra`**: Chamar `requirePlanLimit(supabase, orgId, 'max_obras')` antes de inserir em `obras`
3. **Atualizar guard** ou criar novo para créditos RDO: `requireRDOCredit(supabase, userId)` — verificar saldo em `user_credits` antes de criar RDO
4. **Atualizar `useRDO.ts` ou `RDO.tsx`**: Chamar Edge Function `create-rdo` (ou verificar crédito via RPC) em vez de insert direto

### 🟢 Fase 3 — Melhorias de UX

1. **Mover `CreditsDisplay` para dentro do header do app** (visível globalmente, não só em Obras/RDO)
2. **Adicionar `CreditsDisplay` na página `NovoRDO.tsx`**
3. **Trocar texto "Entre em contato"** por "Faça upgrade" com link para `/preco` no `CreditsDisplay`
4. **Adicionar badge de plano no header**: Exibir "Free • 3/7 créditos" ao lado do avatar do usuário
5. **Adicionar modal de upgrade** quando o trigger de RDO bloquear: em vez de erro genérico, mostrar modal com upgrade link
6. **Adicionar `PlanLimitCard` na página `RDO.tsx`** para avisar quando limite de obras for atingido (já existe em Obras, mas não em RDO)

### 🔵 Fase 4 — Consistência de dados

1. **Alinhar `planLimits.ts` basic.maxObras com `Preco.tsx` tabela**: Se é 2 no frontend, corrigir tabela pública
2. **Alinhar banco `plans.slug='basic'.max_obras`**: Se é 2, não null — null no banco significa "ilimitado"
3. **Remover plano Básico do `Preco.tsx` se não for vendido** (ou adicionar card de fato)

---

## 📏 REGRAS DE NEGÓCIO DEFINITIVAS (após auditoria)

| Funcionalidade | Free | Básico | Profissional | Master | Enterprise |
|---|---|---|---|---|---|
| **Preço mensal** | R$ 0 | R$ 49 | R$ 79 / R$ 147* | R$ 347 | Custom |
| **Usuários** | **1** | 3 | 5 | 15 | Ilimitados |
| **Obras ativas** | **1** | **2** (ou 3 TBD) | Ilimitadas | Ilimitadas | Ilimitadas |
| **RDOs/mês** | **7** | Ilimitados | Ilimitados | Ilimitados | Ilimitados |
| **Checklists** | Simples | Simples | Inteligentes | Inteligentes | Custom |
| **Relatórios** | — | Básicos | Avançados | Avançados | Custom |
| **Dashboard Financeiro** | — | — | ✓ | ✓ | ✓ |
| **WhatsApp** | — | — | ✓ | ✓ | ✓ |
| **API/Webhooks** | — | — | — | ✓ | ✓ |
| **ERP / SAP** | — | — | — | ✓ | ✓ |
| **Suporte** | E-mail | E-mail | Chat 24h | Prioritário SLA 8h | Concierge |

> * O valor de R$ 79/mês é do `preco2.tsx`. O `Preco.tsx` diz R$ 147/mês para Profissional. **Decisão pendente.**

---

## 📂 ARQUIVOS AFETADOS

### Páginas públicas
- `C:\...\src\pages\Preco.tsx` — plano Free errado (5 membros, RDOs ilimitados)
- `C:\...\src\pages-gemini\preco2.tsx` — plano Free errado (3 usuários), sem Básico

### Frontend interno
- `C:\...\src\utils\planLimits.ts` — basic.maxObras=2 (precisa decisão)
- `C:\...\src\hooks\usePermissions.ts` — regras de permissão corretas ✅
- `C:\...\src\hooks\usePlanLimits.ts` — ok ✅
- `C:\...\src\components\PlanLimitCard.tsx` — ok ✅
- `C:\...\src\components\CreditsDisplay.tsx` — texto "Entre em contato" → upgrade
- `C:\...\src\pages\RDO.tsx` — falta PlanLimitCard (obra), CreditsDisplay já existe
- `C:\...\src\pages\NovoRDO.tsx` — falta CreditsDisplay

### Backend (Edge Functions)
- `C:\...\supabase\functions\_shared\guards.ts` — `requirePlanLimit` existe mas não é chamado
- `C:\...\supabase\functions\` — **criar** Edge Functions para: convite membro, criar obra, criar RDO com verificação de crédito

### Migrations / Banco
- `C:\...\supabase\migrations\20260304180000_create_credits_system.sql` — sistema de créditos ✅
- Tabela `plans` — `basic.max_obras` pode ser null (ilimitado) vs frontend diz 2 ou 3
- Tabela `free` — precisa confirmar se `max_users=1` e `max_obras=1`

---

## 📊 RESUMO DE ESFORÇO

| Fase | Tarefas | Estimativa |
|---|---|---|
| 🔴 1 — Páginas públicas | 9 edições de texto + 1 decisão | 1 hora |
| 🟡 2 — Backend enforcement | 3 Edge Functions + 1 RPC | 4-6 horas |
| 🟢 3 — UX | 6 melhorias frontend | 3-4 horas |
| 🔵 4 — Consistência | 3 alinhamentos + 1 decisão de negócio | 1 hora |
| **Total** | **~20 tarefas** | **~10-12 horas** |

---

## ✅ CHECKLIST DE VERIFICAÇÃO PÓS-IMPLANTAÇÃO

- [ ] `Preco.tsx` mostra "1 usuário" no Free
- [ ] `Preco.tsx` tabela Free = "1" usuário
- [ ] `Preco.tsx` tabela Free RDOs = "7/mês"
- [ ] `preco2.tsx` mostra "1 usuário" no Free
- [ ] `preco2.tsx` adiciona card Básico
- [ ] `planLimits.ts` basic.maxObras = valor decidido
- [ ] Banco `plans.basic.max_obras` = valor decidido
- [ ] Edge Function `accept-invite` chama `requirePlanLimit`
- [ ] Edge Function `create-obra` chama `requirePlanLimit`
- [ ] Edge Function/trigger `create-rdo` verifica crédito
- [ ] `CreditsDisplay` no header/NavBar
- [ ] `CreditsDisplay` em NovoRDO
- [ ] Texto de upgrade em CreditsDisplay
- [ ] Badge de plano no header
- [ ] Modal de upgrade ao bloquear RDO
- [ ] `PlanLimitCard` em RDO.tsx (limite de obras)

---

## 🧠 NOTAS ADICIONAIS

- O `PlanLimitCard` já redireciona para `/preco` — está correto
- O `CreditsDisplay` escuta `postgres_changes` em `user_credits` em tempo real — smart
- O `usePermissions.ts` já trata Presidente como bypass de limite — decisão mantida
- O `requirePlanLimit` em `guards.ts` precisa de `orgId` — certificar-se de que as Edge Functions recebem o orgId do JWT
- O plano **Básico** não aparece em nenhum card de `preco2.tsx` — possível perda de conversão (plano de entrada pago mais barato)
