# Release checklist

Ultima atualizacao: 2026-05-22

Use este checklist antes de divulgar uma nova versao publica do Meta Construtor.

## 1. Codigo

- [ ] Revisar `git status --short`.
- [ ] Confirmar que nao ha `.env*`, dumps, prints sensiveis ou artefatos temporarios staged.
- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run test`.
- [ ] Rodar `npm run build`.
- [ ] Confirmar que o build nao mostra chunk acima de 500 kB.

## 2. Ambiente

- [ ] Rodar `npx vercel env ls production`.
- [ ] Confirmar `VITE_SUPABASE_URL`.
- [ ] Confirmar `VITE_SUPABASE_ANON_KEY`.
- [ ] Confirmar `VITE_SENTRY_DSN`.
- [ ] Confirmar `VITE_SENTRY_ENVIRONMENT`.
- [ ] Confirmar `VITE_APP_VERSION`.
- [ ] Confirmar `VITE_STRIPE_PUBLISHABLE_KEY`.
- [ ] Rodar `npx supabase secrets list`.
- [ ] Confirmar `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Confirmar `STRIPE_SECRET_KEY`.
- [ ] Confirmar `STRIPE_WEBHOOK_SECRET`.
- [ ] Confirmar `RESEND_API_KEY`.
- [ ] Confirmar `RESEND_FROM_EMAIL`.

## 3. Banco e Edge Functions

- [ ] Confirmar que nao ha migration critica pendente sem backup.
- [ ] Se houver migration, seguir `docs/OPERATIONS.md`.
- [ ] Confirmar Edge Functions criticas publicadas:
  - [ ] `send-contact`
  - [ ] `send-feedback`
  - [ ] `approve-rdo`
  - [ ] `update-rdo-status`
  - [ ] `send-email-rdo`
  - [ ] `generate-rdo-pdf`
  - [ ] `create-checkout-session`
  - [ ] `create-subscription`
  - [ ] `create-portal-session`
  - [ ] `stripe-webhook`

## 4. Deploy

- [ ] Rodar `npx vercel deploy --prod --yes`.
- [ ] Confirmar que o deploy esta `Ready`.
- [ ] Confirmar alias `https://www.metaconstrutor.app.br`.
- [ ] Registrar deployment id em `PRD.md` ou `docs/evidence/`.

## 5. Smoke de producao

- [ ] `/home` carrega.
- [ ] `/login` carrega.
- [ ] Login por e-mail funciona.
- [ ] Cadastro por e-mail funciona, se liberado.
- [ ] Obra cria e edita.
- [ ] RDO cria como `DRAFT`.
- [ ] RDO envia para aprovacao como `SUBMITTED`.
- [ ] RDO aprova e rejeita com perfil permitido.
- [ ] RDO aprovado gera PDF.
- [ ] RDO aprovado envia e-mail.
- [ ] Feedback autenticado envia.
- [ ] Relatorio exporta PDF com filename valido.
- [ ] Checkout cria sessao Stripe.
- [ ] Portal Stripe abre para cliente habilitado.
- [ ] Sentry recebe evento controlado.
- [ ] Sem erro de CSP para Sentry/Supabase/Stripe.

## 6. Itens que exigem validacao manual ou ambiente dedicado

- [ ] Concluir Google OAuth com conta Google real.
- [ ] Concluir redefinicao de senha pelo link recebido por e-mail.
- [ ] Fazer pagamento Stripe controlado.
- [ ] Validar troca/cancelamento de plano com assinatura ativa ou trialing.

## 7. No-go imediato

Nao divulgar se qualquer item abaixo ocorrer:

- Build falha.
- Testes falham.
- Login/cadastro quebra.
- Criacao de obra quebra.
- RDO nao cria, nao envia, nao aprova ou nao gera PDF.
- Dados vazam entre organizacoes.
- Checkout divulgado nao abre sessao Stripe.
- Sentry nao recebe erros de frontend.
- Migration remota foi aplicada sem backup/evidencia.
