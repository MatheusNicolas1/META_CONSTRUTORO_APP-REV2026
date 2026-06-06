# PRD automated recheck - 2026-05-25

## Contexto

Revalidacao automatizavel do `PRD.md`, mantendo para depois as pendencias que exigem acao manual/controlada:

- Google OAuth final em producao, se divulgado.
- Redefinicao de senha por link real de e-mail.
- Pagamento Stripe real controlado.
- Troca de plano e cancelamento com assinatura ativa/trialing.
- Validacao separada com usuario comum para confirmar regra visual de RDO.

## Vercel

Comando:

```bash
npx vercel inspect dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r
```

Resultado:

- Deployment: `dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r`
- Status: `Ready`
- Target: `production`
- URL: `https://meta-construtor-app-rev-2026-j7igi8q9i.vercel.app`
- Aliases:
  - `https://www.metaconstrutor.app.br`
  - `https://metaconstrutor.app.br`

## Supabase

Comando:

```bash
npx supabase migration list --linked
```

Resultado:

- Sem drift novo nas migrations recentes de maio.
- `20260519130000`, `20260519173000`, `20260521014938` e `20260521235034` aparecem em `Local` e `Remote`.
- Permanece somente drift residual antigo ja aceito/documentado:
  - versao remota curta `20260215`;
  - duplicidade local `20260216120000`;
  - arquivo local `fix_permissions.sql` ignorado pelo CLI por nao seguir o padrao `<timestamp>_name.sql`.

Consulta remota de schema:

```sql
select
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='integrations') as has_integrations,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='feedbacks') as has_feedbacks,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='analytics_events') as has_analytics_events,
  exists (select 1 from information_schema.views where table_schema='public' and table_name='financeiro_consolidado') as has_financeiro_consolidado,
  exists (select 1 from information_schema.views where table_schema='public' and table_name='cronograma_vs_realizado') as has_cronograma_vs_realizado,
  exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='company_address') as has_company_address,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_org_plan_limits') as has_get_org_plan_limits,
  exists (select 1 from pg_trigger where tgname='trigger_enforce_max_users' and tgenabled='O') as has_active_user_limit_trigger;
```

Resultado:

- Todos os campos retornaram `true`.

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

## Rotas publicas

Comando:

```bash
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" <url>
```

Resultado:

| Rota | Status | Content-Type |
| --- | --- | --- |
| `/home` | 200 | `text/html; charset=utf-8` |
| `/login` | 200 | `text/html; charset=utf-8` |
| `/criar-conta` | 200 | `text/html; charset=utf-8` |
| `/preco` | 200 | `text/html; charset=utf-8` |
| `/checkout?plan=basic` | 200 | `text/html; charset=utf-8` |
| `/checkout/success` | 200 | `text/html; charset=utf-8` |
| `/checkout/cancel` | 200 | `text/html; charset=utf-8` |
| `/contato` | 200 | `text/html; charset=utf-8` |
| `/legal/privacidade` | 200 | `text/html; charset=utf-8` |
| `/legal/termos` | 200 | `text/html; charset=utf-8` |
| `/legal/cookies` | 200 | `text/html; charset=utf-8` |
| `/legal/lgpd` | 200 | `text/html; charset=utf-8` |

## Validacao local

Comandos:

```bash
npm run lint
npm run test
npm run build
```

Resultados:

- `npm run lint`: passou com `0 errors` e `34 warnings` preexistentes.
- `npm run test`: passou com `8` arquivos e `27` testes.
- `npm run build`: passou; maior chunk segue abaixo de 500 kB (`index-D_Uzi6F7.js` com `405.13 kB`).
- Warnings nao bloqueantes permanecem: `color-adjust` depreciado e import dinamico/estatico do cliente Supabase.

## Status

- Nenhuma nova correcao automatizavel foi necessaria.
- Nenhuma pendencia manual foi marcada como concluida.
- PRD atualizado com a revalidacao de 2026-05-25.
