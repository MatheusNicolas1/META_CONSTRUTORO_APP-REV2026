# Operacao Meta Construtor

Ultima atualizacao: 2026-05-22

Este documento descreve como retomar operacao, release, Edge Functions e migrations sem depender do historico da conversa.

## Ambientes

- Producao web: `https://www.metaconstrutor.app.br`
- Vercel project: `meta-construtor-app-rev-2026`
- Supabase project ref: `bgdvlhttyjeuprrfxgun`
- Sentry project: `meta-construtor-web`
- Stripe webhook ativo: `https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/stripe-webhook`

## Variaveis obrigatorias de producao

### Vercel production

Listar:

```powershell
npx vercel env ls production
```

Obrigatorias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ENVIRONMENT`
- `VITE_APP_VERSION`
- `VITE_STRIPE_PUBLISHABLE_KEY`

Opcionais, dependendo de features ativas:

- `VITE_N8N_WEBHOOK_URL`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_ENABLE_ACTIVITY_REALTIME`

Adicionar ou atualizar sem imprimir valor no terminal:

```powershell
npx vercel env add NOME_DA_VARIAVEL production
npx vercel env rm NOME_DA_VARIAVEL production --yes
```

### Supabase Edge Functions

Listar:

```powershell
npx supabase secrets list
```

Obrigatorias para backend:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Obrigatorias para pagamentos:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Obrigatorias para e-mail de RDO:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Opcionais, dependendo de integracoes ativas:

- `APP_VERSION`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`

Adicionar ou atualizar:

```powershell
npx supabase secrets set NOME_DA_VARIAVEL="valor"
```

## Validacao antes de release

```powershell
npm run lint
npm run test
npm run build
npx vercel env ls production
npx supabase secrets list
```

O build deve passar. Warnings conhecidos em 2026-05-22:

- `color-adjust` depreciado em CSS.
- Import dinamico/estatico do cliente Supabase no `AuditLogger`.

## Deploy do frontend

```powershell
npx vercel deploy --prod --yes
```

Depois, verificar o alias de producao:

```powershell
npx vercel ls --scope meta-construtors-projects
```

Validar manualmente:

- `/home`
- `/login`
- `/app/dashboard`
- `/checkout?plan=basic`
- `/checkout/success`
- `/checkout/cancel`

## Deploy de Edge Functions

Deploy individual:

```powershell
npx supabase functions deploy nome-da-funcao --use-api
```

Deploy de funcoes criticas em lote:

```powershell
npx supabase functions deploy send-contact send-feedback --use-api
npx supabase functions deploy approve-rdo update-rdo-status --use-api
npx supabase functions deploy send-email-rdo send-rdo-email --use-api
npx supabase functions deploy generate-rdo-pdf --use-api
npx supabase functions deploy create-checkout-session create-subscription create-portal-session stripe-webhook --use-api
```

Validar logs no Supabase Dashboard depois do deploy.

## Migrations Supabase com seguranca

Regra: nao rodar `db push --include-all` quando existir drift ou historico divergente.

Fluxo recomendado:

1. Fazer backup manual no Supabase Dashboard ou dump controlado.
2. Registrar evidencia em `docs/evidence/`.
3. Criar nova migration pontual. Nao editar migrations antigas ja aplicadas.
4. Testar localmente quando possivel:

```powershell
npx supabase migration up --local
npx supabase db reset --local
```

5. Aplicar remotamente de forma pontual:

```powershell
npx supabase db query --linked --file supabase/migrations/NOME_DA_MIGRATION.sql
```

6. Registrar a migration se aplicada manualmente:

```powershell
npx supabase migration repair --linked --status applied VERSAO
```

7. Validar schema remoto com consultas de leitura e atualizar `PRD.md`.

## Smoke de producao minimo

- Landing carrega.
- Login/cadastro por e-mail funciona.
- Obra cria e edita.
- RDO cria como `DRAFT`, envia para `SUBMITTED`, aprova/rejeita e gera PDF.
- RDO aprovado permite envio por e-mail.
- Feedback autenticado envia com sucesso.
- Relatorio exporta PDF sem filename `NaN`.
- Checkout cria sessao Stripe.
- Sentry recebe evento controlado.

## Evidencias

Salvar evidencias em `docs/evidence/` com data no nome. Nao salvar dumps de banco, tokens, secrets ou dados pessoais reais.
