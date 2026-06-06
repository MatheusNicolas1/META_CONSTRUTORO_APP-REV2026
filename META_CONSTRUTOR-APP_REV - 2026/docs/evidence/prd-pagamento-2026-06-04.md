# Evidencia PRD_PAGAMENTO - 2026-06-04

## Escopo

- Continuacao da execucao do `PRD_PAGAMENTO.md`.
- Validacao sem cobranca real.
- Foco do ciclo:
  - planos pagos `basic`, `professional` e `master`;
  - ciclos `monthly` e `yearly`;
  - permissao anonima segura em `analytics_events`;
  - persistencia frontend de eventos publicos permitidos.

## Stripe Checkout sem cartao

Smoke programatico com usuarios descartaveis, sessao Supabase anonima e chamada a `functions/v1/create-checkout-session`.

Resultado:

| Plano | Ciclo | Resultado |
| --- | --- | --- |
| `basic` | `monthly` | `checkout.stripe.com`, `c/pay` |
| `basic` | `yearly` | `checkout.stripe.com`, `c/pay` |
| `professional` | `monthly` | `checkout.stripe.com`, `c/pay` |
| `professional` | `yearly` | `checkout.stripe.com`, `c/pay` |
| `master` | `monthly` | `checkout.stripe.com`, `c/pay` |
| `master` | `yearly` | `checkout.stripe.com`, `c/pay` |

Observacao:

- Nenhum dado de cartao foi informado.
- Nenhuma cobranca real foi executada.
- O teste valida Auth + Edge Function + Stripe Checkout Session; nao fecha webhook de pagamento.

## Planos no banco remoto

`node scripts/check_plans.mjs` confirmou:

```text
basic: price_1Spd6ICHfNdO9jxNRYj10lkA / price_1SpdABCHfNdO9jxNzVu49NDP
professional: price_1Spd7HCHfNdO9jxN3PKJJdyv / price_1Spd9UCHfNdO9jxNMXy1MQs4
master: price_1Spd7xCHfNdO9jxNiUbb0PKG / price_1Spd8ZCHfNdO9jxNIcxjZJBm
```

Tambem existe `prd-prints-campaign` sem `price_id`; nao foi usado no smoke de checkout.

## Price IDs na Stripe

Consulta direta na API da Stripe confirmou que os seis `price_id` usados por `basic`, `professional` e `master` existem e estao ativos:

| Price ID | Status | Moeda | Valor | Intervalo | Product |
| --- | --- | --- | --- | --- | --- |
| `price_1Spd6ICHfNdO9jxNRYj10lkA` | ativo | BRL | 12990 | month | `prod_TnDXfTGqvS2gV1` |
| `price_1SpdABCHfNdO9jxNzVu49NDP` | ativo | BRL | 124704 | year | `prod_TnDXfTGqvS2gV1` |
| `price_1Spd7HCHfNdO9jxN3PKJJdyv` | ativo | BRL | 19990 | month | `prod_TnDY0YHpWZtTm1` |
| `price_1Spd9UCHfNdO9jxNMXy1MQs4` | ativo | BRL | 191904 | year | `prod_TnDY0YHpWZtTm1` |
| `price_1Spd7xCHfNdO9jxNiUbb0PKG` | ativo | BRL | 49990 | month | `prod_TnDZmsZmtV3C88` |
| `price_1Spd8ZCHfNdO9jxNIcxjZJBm` | ativo | BRL | 479904 | year | `prod_TnDZmsZmtV3C88` |

Conclusao:

- `price_id` inexistente, inativo ou divergente nao e a causa do bloqueio observado no botao de pagamento.

## Analytics anonimo

Antes da correcao:

```json
{
  "allowed": {
    "status": 401,
    "error": "permission denied for table analytics_events"
  }
}
```

SQL aplicado no remoto:

- `alter table public.analytics_events enable row level security;`
- `grant insert on table public.analytics_events to anon;`
- recriacao da policy `analytics_events_anon_insert_public`;
- `notify pgrst, 'reload schema';`

Confirmacao do SQL:

```json
{
  "anon_can_insert": true,
  "rls_enabled": true
}
```

Validacao via Supabase anon key, sem `select()`:

```json
{
  "allowed": {
    "status": 201,
    "ok": true,
    "error": null
  },
  "denied": {
    "status": 401,
    "ok": false,
    "error": "new row violates row-level security policy for table \"analytics_events\""
  }
}
```

Conclusao:

- Evento publico anonimo permitido grava em `analytics_events`.
- Evento anonimo tentando enviar `org_id` continua bloqueado por RLS.
- Evento anonimo tentando enviar `user_id` continua bloqueado por RLS.
- Nao foi concedido `select` anonimo.

## Frontend analytics

Correcao aplicada:

- `src/integrations/analytics.ts`: eventos publicos permitidos agora persistem no Supabase sem `user_id`, `org_id` ou `role`.
- Allowlist frontend: `app.public_page_viewed`, `marketing.*`, `auth.*`, `billing.*`.
- Eventos autenticados com `org_id` preservam o fluxo existente.

Teste novo:

- `src/integrations/__tests__/analytics.test.ts`.

Validacao:

- `npx vitest run src/integrations/__tests__/analytics.test.ts`: passou.
- `npm run test`: 19 arquivos, 62 testes passaram.
- `npm run lint`: passou com 31 warnings preexistentes/nao bloqueantes.
- `npm run build`: passou com postbuild/prerender.

## Deploy

- Deploy Vercel producao: `dpl_4rwMc7RHVx83dXEXcBmDD5uNPbRk`.
- URL: `https://meta-construtor-app-rev-2026-772xh1khy.vercel.app`.
- Alias atualizado: `https://www.metaconstrutor.app.br`.
- `vercel inspect`: status `Ready`.
- Smoke HTTP `/checkout?plan=professional&billing=monthly`: `200 text/html`.
- Smoke HTTP `/preco`: `200 text/html`.

## Browser smoke pos-deploy

Ferramenta:

- Browser MCP usado inicialmente para abrir `/checkout`, mas `Page.captureScreenshot` excedeu timeout e a sessao do Browser permaneceu autenticada ao tentar isolar `/criar-conta`.
- Fallback executado com Playwright Chromium em contextos limpos/isolados.

Resultado de rotas publicas:

| Rota | URL final | Titulo | Resultado |
| --- | --- | --- | --- |
| `/preco` | `https://www.metaconstrutor.app.br/preco` | `Planos e precos | Meta Construtor` | sem overlay, sem console relevante, sem page error |
| `/checkout?plan=basic&billing=monthly` | `https://www.metaconstrutor.app.br/checkout?plan=basic&billing=monthly` | `Finalizar assinatura | Meta Construtor` | sem overlay, sem console relevante, sem page error |
| `/criar-conta` | `https://www.metaconstrutor.app.br/criar-conta` | `Criar conta | Meta Construtor` | sem overlay, sem console relevante, sem page error |
| `/contato` | `https://www.metaconstrutor.app.br/contato` | `Contato - Meta Construtor | Fale Conosco` | sem overlay, sem console relevante, sem page error |

Interacao de checkout:

- Rota: `/checkout?plan=master&billing=monthly`.
- Usuario descartavel: `codex.playwright.payment.master.1780608189374@example.com`.
- Botao `Continuar para Pagamento`: redirecionou para `checkout.stripe.com`.
- Pagina Stripe exibiu `Meta Construtor` e conteudo do plano.
- Nenhum dado de cartao foi informado.
- Nenhuma cobranca real foi executada.

Avisos observados:

- `[OrgContext] Usuario sem organizacoes ativas`: transitorio antes da base de org ser confirmada para o usuario recem-criado; nao bloqueou o checkout.
- Avisos de preload da pagina Stripe: emitidos no dominio `checkout.stripe.com`; nao bloquearam o pagamento hospedado.

Artefatos:

- `docs/evidence/prd-pagamento-browser-smoke-2026-06-04.json`.
- `docs/evidence/prd-pagamento-browser-checkout-basic-2026-06-04.png`.
- `docs/evidence/prd-pagamento-browser-stripe-master-2026-06-04.png`.

## Foundation de usuario para billing

Falha encontrada neste ciclo:

- Um usuario descartavel criado pelo checkout chegou ao Auth e recebeu `org_members`, mas ficou sem `profiles`, `user_roles`, `user_settings` e `user_credits`.
- Como `create-checkout-session` atualizava `profiles.stripe_customer_id` com `update(...).eq("id", user.id)`, a operacao virava no-op quando o perfil nao existia.
- Isso deixava usuarios vindos de rotas diferentes dependentes do trigger remoto, reproduzindo o bloqueio em conta existente ou em signup parcial.

Correcao aplicada:

- Novo helper: `supabase/functions/_shared/billing-user-foundation.ts`.
- `create-checkout-session` agora chama `ensureBillingUserFoundation` antes da Stripe.
- `create-subscription` tambem chama o mesmo helper para manter a rota legada sem o mesmo erro.
- O helper cria/repara, de forma idempotente:
  - `profiles`;
  - `user_roles`;
  - `user_settings`;
  - `user_credits`;
  - `orgs`;
  - `org_members`;
  - `profiles.stripe_customer_id`.
- CPF/telefone informados sao gravados quando unicos. Se ja pertencem a outro perfil, o checkout nao aborta por colisao de indice unico.

Deploy Supabase:

```text
npx supabase functions deploy create-checkout-session create-subscription --project-ref bgdvlhttyjeuprrfxgun --use-api
Deployed Functions on project bgdvlhttyjeuprrfxgun: create-checkout-session, create-subscription
```

Validacao com usuario descartavel do browser smoke:

```json
{
  "email": "codex.playwright.payment.master.1780608189374@example.com",
  "hasProfile": true,
  "hasStripeCustomer": true,
  "orgMembers": [{ "role": "Administrador", "status": "active" }],
  "userRoles": ["Administrador"],
  "userSettingsCount": 1,
  "userCredits": [{ "credits_balance": 7, "plan_type": "free" }]
}
```

Observacao:

- O browser smoke reutilizou CPF/telefone fixos de testes anteriores; por isso esses campos foram ignorados por colisao segura.

Validacao direta com CPF/telefone unicos:

```json
{
  "email": "codex.edge.payment.foundation.1780608287191@example.com",
  "checkoutHost": "checkout.stripe.com",
  "checkoutUrlCreated": true,
  "hasProfile": true,
  "hasStripeCustomer": true,
  "phonePersisted": true,
  "cpfPersisted": true,
  "companyPersisted": true,
  "orgMembers": [{ "role": "Administrador", "status": "active" }],
  "userRoles": ["Administrador"],
  "userSettingsCount": 1,
  "userCredits": [{ "credits_balance": 50, "plan_type": "free" }]
}
```

Artefato:

- `docs/evidence/prd-pagamento-edge-foundation-smoke-2026-06-04.json`.

## Validacao pos-correcao

- `npm run test`: passou.
- Resultado: 19 arquivos, 62 testes.
- `npm run build`: passou, incluindo postbuild e prerender de 18 rotas publicas.
- Avisos do build: `color-adjust` depreciado e aviso de chunk por import dinamico/estatico de `src/integrations/supabase/client.ts`; nao bloquearam o build.
- `deno --version`: indisponivel no ambiente local, portanto a validacao de bundle das Edge Functions foi feita pelo deploy da Supabase CLI com `--use-api`.

## Pendencias

- Validar compra controlada/autorizada para fechar `checkout.session.completed`, `invoice.payment_succeeded`, `subscriptions` e `profiles`.
- Validar Billing Portal em assinatura ativa/controlada.
- Reexecutar smoke de navegador antes de nova publicacao relevante.
