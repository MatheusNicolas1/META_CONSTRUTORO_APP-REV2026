# Evidencia PRD_PAGAMENTO - 2026-06-05

## Escopo

- Continuacao da execucao do `PRD_PAGAMENTO.md`.
- Validacao sem cobranca real.
- Foco do ciclo:
  - remover senha temporaria fixa do signup do checkout;
  - sanitizar mensagens de erro exibidas ao usuario;
  - confirmar retorno para `/preco`;
  - validar `basic`, `professional` e `master` em browser anonimo ate Stripe Checkout.

## Correcao aplicada

Arquivos:

- `src/pages/Checkout.tsx`
- `src/utils/checkoutErrors.ts`
- `src/utils/__tests__/checkoutErrors.test.ts`

Mudancas:

- `Checkout.tsx` nao usa mais fallback `TemporaryPass123!`.
- Para usuario anonimo, a senha precisa vir do formulario antes de chamar `supabase.auth.signUp`.
- Erros tecnicos de Stripe, sessao, plano, organizacao ou confirmacao de e-mail passam por `getCheckoutErrorFeedback`.
- Toasts exibem mensagens seguras em portugues, sem vazar detalhes internos.
- Erro de assinatura ativa redireciona para `/app/planos`.
- A tela de checkout exibe o link `Voltar aos planos`, apontando para `/preco`.

## Validacao automatizada

Testes focados:

```text
npx vitest run src/utils/__tests__/checkoutErrors.test.ts src/components/pricing/__tests__/CheckoutForm.test.tsx
Test Files  2 passed (2)
Tests       5 passed (5)
```

Suite completa:

```text
npm run test
Test Files  20 passed (20)
Tests       66 passed (66)
```

Lint:

```text
npm run lint
31 warnings, 0 errors
```

Observacao:

- Os warnings sao os mesmos padroes nao bloqueantes ja presentes: dependencias de hooks e `react-refresh/only-export-components`.

Build local:

```text
npm run build
Prerendered 18 public route HTML files.
```

Avisos de build:

- `color-adjust` depreciado.
- Aviso Vite sobre import dinamico/estatico de `src/integrations/supabase/client.ts`.
- Nenhum deles bloqueou a build.

## Deploy

Deploy Vercel:

```text
npx vercel --prod --yes
Production: https://meta-construtor-app-rev-2026-3dmegkx3e.vercel.app
Aliased: https://www.metaconstrutor.app.br
```

Inspect:

```text
dpl_6a8Qmivxtnt2DkTNBFAMEHGShoQi
status: Ready
aliases: https://www.metaconstrutor.app.br, https://metaconstrutor.app.br
```

## Browser smoke em producao

Script:

- `codex-tmp/prd-pagamento-browser-all-plans-2026-06-05.mjs`

Artefato:

- `docs/evidence/prd-pagamento-browser-all-plans-2026-06-05.json`

Resultado:

| Plano | Ciclo | Checkout renderizado | Voltar aos planos | Stripe | Console relevante | Page errors |
| --- | --- | --- | --- | --- | --- | --- |
| `basic` | `monthly` | sim | sim | `checkout.stripe.com` | 0 | 0 |
| `professional` | `monthly` | sim | sim | `checkout.stripe.com` | 0 | 0 |
| `master` | `monthly` | sim | sim | `checkout.stripe.com` | 0 | 0 |

Usuarios descartaveis:

- `codex.payment.basic.17806604874750@example.com`
- `codex.payment.professional.17806604996711@example.com`
- `codex.payment.master.17806605099102@example.com`

Limite da validacao:

- Nenhum dado de cartao foi informado.
- Nenhuma cobranca real foi executada.
- O teste valida formulario, signup, Edge Function, criacao de Checkout Session e redirecionamento para Stripe.

## PRD

Itens fechados neste ciclo:

- `Nao usar senha temporaria fixa em producao`.
- `Toasts em portugues com causa acionavel`.
- `Loading nao fica preso`.
- `Usuario pode voltar para /preco`.
- `Falha Stripe mostra mensagem segura sem vazar detalhes tecnicos`.
- `/checkout?plan=basic`, `/checkout?plan=professional` e `/checkout?plan=master` passam do formulario para pagamento em browser anonimo valido.
- `Exibir erro claro se email precisa ser confirmado`.
- `Recriar clientSecret ao mudar ciclo mensal/anual`: nao se aplica ao fluxo publico atual, que usa Checkout Session hospedado.
- `Evitar multiplas assinaturas incompletas`: o fluxo publico atual nao cria assinatura direta antes da Stripe; ele cria Checkout Session hospedada e bloqueia assinatura ativa existente.

Pendencias restantes:

- Compra controlada/autorizada para validar `checkout.session.completed`, `invoice.payment_succeeded`, `subscriptions` e `profiles`.
- Billing Portal com assinatura ativa/controlada para troca/cancelamento.
- Qualquer ajuste de CSP so deve ser feito se houver erro real sem extensao/ad blocker.
