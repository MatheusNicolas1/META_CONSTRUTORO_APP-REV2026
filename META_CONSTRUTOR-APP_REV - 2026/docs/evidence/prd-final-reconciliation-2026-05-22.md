# PRD final reconciliation - 2026-05-22

## Contexto

Execucao feita apos P2.3 e smoke final de producao. Objetivo: continuar o `PRD.md` apenas com acoes automatizaveis, sem depender de validacoes manuais do usuario.

## Comandos executados

### Supabase migrations

Comando:

```bash
npx supabase migration list --linked
```

Resultado inicial:

- `20260519130000` existia localmente e nao estava marcada no remoto.
- `20260519173000` existia localmente e nao estava marcada no remoto.
- Drift residual antigo permaneceu apenas em:
  - versao remota curta `20260215`;
  - duplicidade local `20260216120000`;
  - arquivo local `fix_permissions.sql` ignorado pelo CLI por nao seguir o padrao `<timestamp>_name.sql`.

### Validacao de schema remoto

Consultas:

```sql
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'company_address'
) as has_company_address;
```

Resultado:

- `has_company_address = true`.

Consulta de dependencias de limite de plano:

```sql
select exists (
  select 1
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_org_plan_limits'
) as has_get_org_plan_limits;
```

Resultado antes da correcao:

- `has_get_org_plan_limits = false`.

## Correcao aplicada

Aplicacao pontual, sem `db push --include-all`:

1. Reaplicado o SQL idempotente de `supabase/migrations/20260209150000_enforce_plan_limits_triggers.sql` para restaurar:
   - `public.get_org_plan_limits(uuid)`;
   - `public.enforce_max_users_limit()`;
   - `public.enforce_max_obras_limit()`;
   - triggers `trigger_enforce_max_users` e `trigger_enforce_max_obras`.
2. Aplicado o SQL de `supabase/migrations/20260519173000_enforce_invited_member_plan_limits.sql` para incluir membros `invited` no limite de usuarios.
3. Historico reparado:

```bash
npx supabase migration repair --linked --status applied 20260519130000
npx supabase migration repair --linked --status applied 20260519173000
```

Observacao: a primeira tentativa do segundo repair falhou por autenticacao transitoria do CLI quando executada em paralelo; o mesmo comando repetido isoladamente passou.

## Validacao posterior

Comando:

```bash
npx supabase migration list --linked
```

Resultado:

- `20260519130000` agora aparece em `Local` e `Remote`.
- `20260519173000` agora aparece em `Local` e `Remote`.
- Permanece apenas o drift residual antigo ja aceito/documentado: `20260215` curto e duplicidade local `20260216120000`.

Consulta final:

```sql
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'company_address'
  ) as has_company_address,
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_org_plan_limits'
  ) as has_get_org_plan_limits,
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'enforce_max_users_limit'
  ) as has_enforce_max_users_limit,
  exists (
    select 1 from pg_trigger
    where tgname = 'trigger_enforce_max_users'
      and tgenabled = 'O'
  ) as has_active_user_limit_trigger,
  exists (
    select 1 from pg_trigger
    where tgname = 'trigger_enforce_max_obras'
      and tgenabled = 'O'
  ) as has_active_obras_limit_trigger;
```

Resultado:

- `has_company_address = true`
- `has_get_org_plan_limits = true`
- `has_enforce_max_users_limit = true`
- `has_active_user_limit_trigger = true`
- `has_active_obras_limit_trigger = true`

### Supabase Edge Functions

Comando:

```bash
npx supabase functions list --output json
```

Funcoes criticas confirmadas como `ACTIVE`:

- `create-checkout-session`
- `create-portal-session`
- `stripe-webhook`
- `webhook-stripe`
- `create-subscription`
- `change-subscription`
- `cancel-subscription`
- `approve-rdo`
- `update-rdo-status`
- `generate-rdo-pdf`
- `send-rdo-email`
- `send-email-rdo`
- `send-contact`
- `send-feedback`
- `export-my-data`
- `delete-account`

### Vercel

Comando:

```bash
npx vercel inspect dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r
```

Resultado registrado:

- Status: `Ready`
- Target: `production`
- Alias principal: `https://www.metaconstrutor.app.br`

## Pendencias nao automatizaveis restantes

- Google OAuth em producao, se divulgado.
- Redefinicao de senha por link real de e-mail.
- Pagamento Stripe real controlado.
- Troca de plano e cancelamento usando assinatura ativa/trialing.
- Validacao com usuario comum separado para confirmar ausencia dos botoes de aprovacao do RDO.

## Validacao local final

Comandos:

```bash
npm run lint
npm run test
```

Resultados:

- `npm run lint`: passou com `0 errors` e `34 warnings` preexistentes.
- `npm run test`: passou com `8` arquivos e `27` testes.

## Status

- Acoes automatizaveis restantes executadas.
- Drift critico de migrations de maio removido.
- Drift residual antigo continua aceito/documentado.
- PRD atualizado com pendencias manuais separadas dos registros historicos ja superados.
