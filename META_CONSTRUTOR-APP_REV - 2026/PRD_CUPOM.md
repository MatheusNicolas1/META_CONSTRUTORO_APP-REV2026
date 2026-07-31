# PRD_CUPOM - Sistema de Cupons e Descontos no Stripe

Data de criação: 2026-07-14
Produto: Meta Construtor Web
Status: diagnóstico + implementação parcial executada
Escopo principal: validar, auditar e completar o sistema de cupons promocionais com integração real ao Stripe — desde a criação no Admin até a aplicação no checkout e rastreamento de uso.

## 1. Resumo executivo

O Meta Construtor já possui um sistema de cupons funcional em produção, com:

- **Tabela `coupons`** no Supabase com suporte a `discount_type` (`percent`/`fixed`) e `discount_value`
- **Admin UI** (`AdminCoupons.tsx`) com CRUD completo, KPIs de uso e auditoria
- **Edge Function `create-checkout-session`** com validação de cupom real contra Stripe
- **Frontend de Checkout** com campo `coupon_code` e validação Zod

No entanto, a auditoria revelou **gaps críticos**:

| Gap | Severidade |
| --- | --- |
| `create-enterprise-checkout` ignora `coupon_code` — cupom nunca chega ao Stripe em planos Enterprise | 🔴 P0 |
| RPC `increment_coupon_usage` não está nas migrations — pode não existir no banco remoto | 🔴 P0 |
| `create-subscription` e `change-subscription` não aceitam `discounts` — upgrades/renewals perdem desconto | 🟡 P1 |
| Webhook Stripe não processa eventos de coupon/discount | 🟡 P1 |
| Falta tracking de analytics para `coupon_applied` no frontend | 🟢 P2 |
| `discount_percentage` é coluna legada — a lógica moderna usa `discount_type` + `discount_value` | 🟢 P3 |

Resultado esperado:

- [ ] Cupom funcional em TODOS os fluxos de pagamento (checkout regular, enterprise, subscription, change)
- [ ] RPC `increment_coupon_usage` confirmada no banco ou criada via migration
- [ ] Webhook Stripe processa eventos de discount/coupon para manter consistência
- [ ] Tracking de analytics registra aplicação de cupom
- [ ] Stripe Coupons reais sendo criados sincronizadamente com cupons do banco local

## 2. Objetivo do produto

O sistema de cupons deve permitir:

- [ ] Admin criar cupons com tipo (percentual ou fixo), valor, validade e limite de uso
- [ ] Usuário aplicar cupom no checkout via código textual
- [ ] Stripe processar o desconto real na sessão de checkout
- [ ] Uso do cupom ser contabilizado e bloqueado ao atingir o limite
- [ ] Upgrade/downgrade preservar ou remover desconto conforme regra de negócio
- [ ] Renovação (subscription renewal) respeitar o cupom original
- [ ] Visibilidade no Admin: KPIs de uso, conversão por cupom, receita com desconto

## 3. Fora do escopo

- [ ] Cupons gerados automaticamente por triggers (ex: aniversário de cadastro)
- [ ] Cashback em créditos na plataforma
- [ ] Desconto progressivo por tempo de assinatura
- [ ] Integração com programa de afiliados (coberto no PRD_AFILIADOS.md)
- [ ] Trial grátis (já implementado em `create-subscription` com `trial_period_days`)

## 4. Diagnóstico atual do código

### 4.1 Tabela `coupons` no Supabase

Migration `20251124175145_.sql`:
```sql
CREATE TABLE public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER,          -- legado (percentual)
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

Migration `20260207202446_remote_commit.sql` ADICIONOU (evolução):
```sql
ALTER TABLE public.coupons ADD COLUMN discount_type TEXT;
ALTER TABLE public.coupons ADD COLUMN discount_value NUMERIC;
ALTER TABLE public.coupons ALTER COLUMN discount_percentage DROP NOT NULL;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_type_check
    CHECK (discount_type = ANY (ARRAY['percent'::text, 'fixed'::text]));
```

**Schema atual efetivo**: `code`, `discount_type` (percent|fixed), `discount_value` (NUMERIC), `discount_percentage` (legado, nullable), `valid_until`, `is_active`, `usage_limit`, `times_used`, `created_by`, `created_at`, `updated_at`.

### 4.2 `AdminCoupons.tsx` — CRUD de cupons

- [x] Listagem com KPIs: total ativos, total usos, eventos de cupom, conversão
- [x] Criação: código, tipo (percent/fixed dropdown), valor numérico, validade (date picker), limite de uso
- [x] Ativar/desativar toggle
- [x] Deletar com confirmação (AlertDialog)
- [x] Auditoria em `admin_audit_logs`
- [x] Filtros globais de campanha/origem

**Evidência validada**: `src/components/admin/AdminCoupons.tsx` — 487+ linhas, CRUD funcional.

### 4.3 `create-checkout-session` — Fluxo de cupom (checkout regular)

Arquivo: `supabase/functions/create-checkout-session/index.ts`

Funções implementadas:

```
validateCoupon(code: string)
  → busca coupon no Supabase por code
  → verifica is_active = true
  → verifica valid_until > now()
  → verifica usage_limit > times_used (se usage_limit definido)
  → retorna coupon row ou throw

ensureStripeCoupon(coupon: CouponRow)
  → cria Stripe Coupon via API:
    - percent: stripe.coupons.create({ percent_off: valor, duration: 'once' })
    - fixed:   stripe.coupons.create({ amount_off: valor * 100, currency: 'brl', duration: 'once' })
  → retorna Stripe Coupon ID

incrementCouponUsage(couponId: string)
  → chama RPC increment_coupon_usage(coupon_id)
  → NOT FOUND nas migrations — PENDENTE
```

Payload enviado ao Stripe:
```typescript
discounts: [{ coupon: stripeCoupon.id }]
```

**✅ Fluxo de checkout regular com cupom: FUNCIONAL** (desde que RPC exista no banco remoto).

### 4.4 `create-enterprise-checkout` — ❌ NÃO SUPORTA CUPOM

Arquivo: `supabase/functions/create-enterprise-checkout/index.ts`

```typescript
interface CreateEnterpriseCheckoutRequest {
  user_id: string;
  price_id: string;
  enterprise_plan_id: string;
  success_url?: string;
  cancel_url?: string;
  locale?: string;
  coupon_code?: string;   // ← RECEBE mas NUNCA USA
}
```

A interface aceita `coupon_code`, porém:
- ❌ `validateCoupon()` não é chamada
- ❌ `ensureStripeCoupon()` não é chamada
- ❌ `incrementCouponUsage()` não é chamada
- ❌ `discounts` não é passado ao `stripe.checkout.sessions.create()`

**🔴 P0 — Qualquer cupom aplicado em plano Enterprise é IGNORADO.**

### 4.5 `create-subscription` e `change-subscription` — sem cupom

- `create-subscription`: suporta `trial_period_days` mas não aceita `discounts` no `stripe.subscriptions.create()`
- `change-subscription`: altera plano com proration, mas não passa `discounts`

**🟡 P1 — Upgrade, downgrade e subscriptions diretas perdem o desconto.**

### 4.6 `stripe-webhook` — sem eventos de cupom

Eventos processados atualmente:
- `checkout.session.completed` ✅
- `customer.subscription.updated` ✅
- `customer.subscription.deleted` ✅
- `invoice.paid` ✅
- `invoice.payment_failed` ✅

Eventos NÃO processados:
- `customer.discount.created` ❌
- `customer.discount.updated` ❌
- `customer.discount.deleted` ❌
- `checkout.session.expired` ❌ (reverter times_used)

**🟡 P1 — O webhook não reage a mudanças de desconto, podendo dessincronizar `times_used`.**

### 4.7 RPC `increment_coupon_usage` — ausente das migrations

A EF `create-checkout-session` chama:
```typescript
const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: coupon.id });
```

Busca exaustiva em todas as migrations SQL: **não encontrada**.

Pode ter sido criada manualmente no dashboard do Supabase ou via console SQL sem migration registrada.

**🔴 P0 — Se a RPC não existir no banco remoto, `incrementCouponUsage()` lança erro e o checkout pode falhar silenciosamente.**

### 4.8 Frontend Checkout

- `Checkout.tsx` envia `coupon_code` via `formData?.coupon_code` no corpo da requisição
- `CheckoutForm.tsx` tem campo `coupon_code` com validação Zod (`z.string().optional().or(z.literal(""))`)
- ❌ Sem tracking de analytics (evento `coupon_applied` ou similar)
- ❌ Sem feedback visual de erro do cupom (cupom inválido/expirado) antes do submit

### 4.9 Tabelas relacionadas

- `analytics_events` com event `marketing.coupon_applied` (planejado em PRD_ADMIN mas não confirmado no código)
- `admin_audit_logs` com ações de criação/ativação/exclusão de cupons (✅ implementado em AdminCoupons)

## 5. Contratos técnicos transversais

### 5.1 Stripe Coupon vs Coupon do banco local

| Aspecto | Stripe Coupon | Tabela `coupons` |
| --- | --- | --- |
| Criação | Automática via `ensureStripeCoupon()` na EF | Manual via Admin UI |
| Ciclo de vida | Apenas durante a sessão de checkout | Persistente no banco |
| Validação | Stripe valida na sessão | `validateCoupon()` na EF |
| unique_per_account | Stripe: `coupon.id` reutilizável | Código UNIQUE por coupon |
| Duração | `duration: 'once'` (aplicado uma vez) | `usage_limit` define máximo de usos |

⚠️ **Problema**: `ensureStripeCoupon()` cria um novo Stripe Coupon a cada chamada. Se o mesmo cupom for usado 100 vezes, serão 100 Stripe Coupons diferentes. Stripe não tem limite documentado, mas é ineficiente. Solução futura: reutilizar Stripe Coupon ID na tabela `coupons` com campo `stripe_coupon_id`.

### 5.2 Fluxo completo de aplicação de cupom

```
Usuário → digita código no CheckoutForm
  → Submit → formData.coupon_code enviado à EF
    → validateCoupon(code):
        - SELECT * FROM coupons WHERE code = $1
        - is_active? valid_until > now? usage_limit > times_used?
    → ensureStripeCoupon(coupon):
        - Cria Stripe Coupon via API
    → stripe.checkout.sessions.create({
        discounts: [{ coupon: stripeCoupon.id }]
      })
    → incrementCouponUsage(coupon.id):
        - RPC: UPDATE coupons SET times_used = times_used + 1 WHERE id = $1
```

### 5.3 Stripe API

- `stripe.coupons.create({ percent_off, duration: 'once' })` para percentual
- `stripe.coupons.create({ amount_off, currency: 'brl', duration: 'once' })` para fixo
- `stripe.checkout.sessions.create({ ..., discounts: [{ coupon: id }] })`
- `stripe.subscriptions.create({ ..., discounts: [{ coupon: id }] })`
- `stripe.subscriptions.update(id, { ..., discounts: [{ coupon: id }] })`

### 5.4 Regras de negócio

- Cupom expirado (`valid_until < now()`) → rejeitar com erro claro
- Cupom esgotado (`times_used >= usage_limit`) → rejeitar com erro claro
- Cupom desativado (`is_active = false`) → rejeitar com erro claro
- Cupom percentual com `discount_value > 100` → rejeitar (desconto > 100%)
- Cupom fixo com `discount_value > preço_do_plano` → Stripe aceita (vira $0), mas documentar como comportamente esperado
- Ao aplicar cupom em subscription existente, o desconto vale apenas para a próxima invoice
- Ao trocar de plano, o desconto do cupom original é perdido (Stripe não reaplica automaticamente)

## 6. Pendências identificadas (gaps) e plano de ação

### 🔴 P0 — Implementação imediata

#### P0.1 — Adicionar cupom ao `create-enterprise-checkout`

**Problema**: EF ignora `coupon_code` mesmo recebendo o parâmetro.

**Ação**:
1. Copiar lógica de `validateCoupon()`, `ensureStripeCoupon()` e `incrementCouponUsage()` do `create-checkout-session`
2. Adicionar `discounts: [{ coupon: stripeCoupon.id }]` ao `stripe.checkout.sessions.create()`

**Arquivo**: `supabase/functions/create-enterprise-checkout/index.ts`

---

#### P0.2 — Verificar/Recriar RPC `increment_coupon_usage`

**Problema**: RPC não encontrada nas migrations — pode ou não existir no banco remoto.

**Ação**:
1. Verificar no Supabase remoto se a RPC existe: `SELECT proname FROM pg_proc WHERE proname = 'increment_coupon_usage'`
2. Se não existir, criar migration:
```sql
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.coupons
  SET times_used = times_used + 1, updated_at = now()
  WHERE id = coupon_id;
END;
$$;
```

**Arquivo**: `supabase/migrations/20260714000000_increment_coupon_usage.sql`

---

### 🟡 P1 — Prioridade alta

#### P1.1 — Adicionar cupom a `create-subscription` e `change-subscription`

**Problema**: Subscriptions criadas ou alteradas via Edge Functions não aceitam `discounts`.

**Ação**:
- `create-subscription`: adicionar parâmetro `coupon_code` opcional e lógica de validação + `discounts` no `stripe.subscriptions.create()`
- `change-subscription`: adicionar parâmetro `coupon_code` opcional e `discounts` no `stripe.subscriptions.update()`

**Arquivos**:
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/change-subscription/index.ts`

---

#### P1.2 — Adicionar eventos de cupom no webhook Stripe

**Problema**: Webhook não processa eventos de discount, podendo dessincronizar estado.

**Ação**:
Adicionar handlers para:
- `checkout.session.expired` → reverter `times_used` do cupom (decrementar)
- `customer.discount.created` → registrar em analytics
- `customer.discount.deleted` → registrar em analytics

**Arquivo**: `supabase/functions/stripe-webhook/index.ts`

---

### 🟢 P2 — Prioridade média

#### P2.1 — Tracking de analytics para cupom

**Problema**: Nenhum evento de analytics é disparado quando cupom é aplicado.

**Ação**:
- Adicionar `analytics_events.insert({ event: 'marketing.coupon_applied', properties: { coupon_code, discount_type, discount_value, plan } })` na EF após validação bem-sucedida
- Adicionar `marketing.coupon_rejected` quando cupom é rejeitado (com motivo)

---

#### P2.2 — Feedback visual de erro no frontend

**Problema**: Erro de cupom inválido só aparece após submit, sem feedback visual inline.

**Ação**:
- Adicionar estado de loading/enquanto valida
- Exibir toast ou mensagem inline para: cupom inválido, expirado, esgotado
- Validar formato antes de enviar à EF (regex: alfanumérico, 3-20 chars)

---

### 🔵 P3 — Prioridade baixa / melhoria contínua

#### P3.1 — Reutilizar Stripe Coupon ID

**Problema**: `ensureStripeCoupon()` cria novo Stripe Coupon a cada request.

**Ação**:
- Adicionar coluna `stripe_coupon_id TEXT` na tabela `coupons`
- Alterar `ensureStripeCoupon()` para verificar se `stripe_coupon_id` já existe antes de criar novo
- Se existir, reutilizar o Stripe Coupon existente

---

#### P3.2 — Limpeza de coluna legada

- `discount_percentage` pode ser removida após confirmação de que ninguém usa
- Validar antes: verificar queries no código que referenciam `discount_percentage`

---

#### P3.3 — Histórico de cupons por usuário

- Criar tabela `coupon_usage_history` ou registrar em `analytics_events`
- Permitir Admin ver: quais usuários usaram quais cupons, data, plano, valor do desconto

## 7. Quando retomar esta tarefa

- **P0 imediato**: criar RPC `increment_coupon_usage` e corrigir `create-enterprise-checkout`
- **P1 seguinte**: adicionar cupom em `create-subscription`, `change-subscription` e webhook
- **P2 posterior**: analytics e feedback visual
- **P3 contínuo**: otimizações e coluna legada

Sempre que mexer em checkout, fluxo de pagamento ou webhook Stripe, consultar este PRD antes de alterar a lógica de cupons.

## 8. Próxima manutenção deste PRD

Atualizar este arquivo quando:

- [ ] P0 for resolvido e validado em produção
- [ ] P1 for resolvido
- [ ] Um novo gap for descoberto (ex: RPC realmente não existe no remoto)
- [ ] Stripe mudar API de coupons/discounts

Ao atualizar, manter a regra: concluído com evidencia vira baseline; aberto continua aberto.
