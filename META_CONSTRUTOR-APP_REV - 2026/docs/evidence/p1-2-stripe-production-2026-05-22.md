# P1.2 - Stripe em producao

Data: 2026-05-22

## Objetivo

Validar a configuracao Stripe em producao sem expor segredos e sem concluir pagamento real.

## Resultado

- `VITE_STRIPE_PUBLISHABLE_KEY` estava ausente na Vercel production e foi cadastrado.
- `STRIPE_SECRET_KEY` estava presente nas Edge Functions.
- `STRIPE_WEBHOOK_SECRET` estava ausente nas Edge Functions e foi cadastrado apos criacao controlada do webhook.
- Webhook ativo final: `we_1TZkBrCHfNdO9jxNQur6Yq8o`.
- URL do webhook: `https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/stripe-webhook`.
- Eventos habilitados: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Duplicatas criadas durante reconciliacao foram desabilitadas.

## Comandos/validacoes executadas

- `npx vercel env ls production`
- `npx supabase secrets list`
- Consulta Stripe API para listar webhooks ativos.
- Criacao de webhook via Stripe API e registro de `STRIPE_WEBHOOK_SECRET` no Supabase.
- `npx supabase functions deploy create-checkout-session stripe-webhook`
- `npx supabase functions deploy create-portal-session`
- Smoke autenticado com usuario/organizacao descartaveis:
  - `create-checkout-session`: `200`, retornou `sessionId` e URL em `checkout.stripe.com`.
  - `create-subscription`: `200`, retornou `subscriptionId` e `clientSecret`; assinatura incompleta cancelada/removida apos teste.
  - `create-portal-session`: `200`, retornou URL em `billing.stripe.com`.
- Smoke assinado do webhook:
  - Evento `evt_codex_smoke_1779422170472` aceito com `200`.
  - Linha criada em `stripe_events` com `processed=true`, `error=null`.
  - Linha de smoke removida apos validacao.
- `npm run build`: passou.
- `npx vercel deploy --prod --yes`: deployment `dpl_7rVUVopZ5zfNJ9L5S8ufGa8PdqUv`, alias `https://www.metaconstrutor.app.br`.
- `GET /checkout?plan=basic`, `/checkout/success` e `/checkout/cancel`: `200`.
- Print salvo em `docs/evidence/p1-2-checkout-production-2026-05-22.png`.

## Limites / pendencias

- Fluxo completo com pagamento real nao foi concluido para evitar cobranca em chave live.
- Troca/cancelamento via funcoes do app nao foi validado porque exige assinatura ativa/trialing real.
- Atualizacao real de estado por webhook deve ser validada com uma compra controlada ou ambiente Stripe de teste dedicado.
