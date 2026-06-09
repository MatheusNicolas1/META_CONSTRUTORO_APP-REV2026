# Status das Chaves de API — Serviços Externos

> **Data da verificação:** 2026-06-07
> **Projeto:** Meta Construtor App
> **Supabase Project Ref:** `bgdvlhttyjeuprrfxgun`

---

## 1. Resend (E-mail Transacional)

| Item | Status | Observação |
|------|--------|------------|
| `RESEND_API_KEY` no Supabase | ✅ **Configurado** | Definido via `supabase secrets set` |
| `RESEND_FROM_EMAIL` no Supabase | ✅ **Configurado** | `onboarding@resend.dev` |
| `RESEND_API_KEY` no `.env` local | ✅ **Estruturado** | Valor mascarado por segurança; real está no Supabase |
| `RESEND_FROM_EMAIL` no `.env` local | ✅ **Configurado** | `onboarding@resend.dev` |
| Edge Functions que usam: | ✅ | `send-test`, `send-rdo-email`, `send-email-rdo`, `send-campaign`, `send-campaign-now`, `send-contact`, `send-checklist-email`, `invite-member` |

**Observação:** Para envio em produção com domínio próprio, configurar domínio verificado no Resend e alterar `RESEND_FROM_EMAIL`.

---

## 2. Stripe (Pagamentos)

| Item | Status | Observação |
|------|--------|------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` no `.env` | ✅ **Configurado** | `pk_live_...` (live key) |
| `STRIPE_SECRET_KEY` no Supabase | ✅ **Configurado** | Definido via `supabase secrets set` |
| `STRIPE_SECRET_KEY` no `.env` local | ✅ **Estruturado** | Valor armazenado nos secrets do Supabase |
| `STRIPE_WEBHOOK_SECRET` no Supabase | ✅ **Configurado** | Presente nos secrets |
| Edge Functions que usam: | ✅ | `create-checkout-session`, `stripe-webhook`, `create-subscription`, `change-subscription`, `cancel-subscription`, `create-portal-session` |

**Observação:** Publishable key é `pk_live_` (produção). Secret key está segura apenas no Supabase Secrets, não exposta ao frontend.

---

## 3. ElevenLabs (Áudio / TTS)

| Item | Status | Observação |
|------|--------|------------|
| `ELEVENLABS_API_KEY` no Supabase | ✅ **Configurado** | Definido via `supabase secrets set` |
| `ELEVENLABS_API_KEY` no `.env` local | ✅ **Estruturado** | Valor armazenado nos secrets do Supabase |
| Edge Functions que usam: | ✅ | `send-audio-summary` |

**Observação:** ElevenLabs é usado para geração de resumos em áudio de RDOs/DDS.

---

## 4. Gotenberg (Conversão HTML → PDF)

| Item | Status | Observação |
|------|--------|------------|
| `GOTENBERG_URL` no Supabase | ✅ **Configurado** | `http://demo.gotenberg.dev` |
| `GOTENBERG_URL` no `.env` local | ✅ **Configurado** | `http://demo.gotenberg.dev` |
| Edge Functions que usam: | ✅ | `generate-rdo-pdf`, `generate-checklist-pdf` |

**Observação:** URL atual é `demo.gotenberg.dev` (temporária/teste). Para produção, recomenda-se self-host Gotenberg via Docker (`gotenberg/gotenberg:8`) e apontar para URL própria.

---

## 5. Supabase Secrets — Sumário Geral

```
NAME                      | STATUS
---------------------------|--------
RESEND_API_KEY            | ✅ Configurado
RESEND_FROM_EMAIL         | ✅ Configurado
RESEND_WEBHOOK_SECRET     | ✅ Configurado
ELEVENLABS_API_KEY        | ✅ Configurado
GOTENBERG_URL             | ✅ Configurado
STRIPE_SECRET_KEY         | ✅ Configurado
STRIPE_WEBHOOK_SECRET     | ✅ Configurado
APP_URL                   | ✅ Configurado
POSTHOG_API_KEY           | ✅ Configurado
POSTHOG_HOST              | ✅ Configurado
SUPABASE_URL              | ✅ Configurado
SUPABASE_ANON_KEY         | ✅ Configurado
SUPABASE_SERVICE_ROLE_KEY | ✅ Configurado
SUPABASE_DB_URL           | ✅ Configurado
```

---

## 6. Build

| Item | Status |
|------|--------|
| `npm run build` | ✅ **Passou** (12.52s, 22 rotas prerenderizadas) |
| TypeScript errors | ⚠️ 3 erros pré-existentes (`PublicNav`, `PublicFooter`, `PublicLayout`) — não relacionados às chaves |
| CSS deprecation warning | ⚠️ `color-adjust` → `print-color-adjust` (conhecido, inofensivo) |

---

## 7. Pendências

| Prioridade | Item | Ação |
|-----------|------|------|
| Baixa | Domínio próprio Resend | Verificar domínio no Resend e alterar `RESEND_FROM_EMAIL` |
| Média | Gotenberg self-host | Substituir `demo.gotenberg.dev` por instância própria em produção |
| Baixa | Erros TS: PublicNav/PublicFooter/PublicLayout | Corrigir módulos ausentes em `src/components/public/index.tsx` |
