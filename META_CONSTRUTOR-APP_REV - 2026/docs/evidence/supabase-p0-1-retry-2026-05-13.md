# Evidencia - P0.1 Supabase retry

Data: 2026-05-13
Projeto Supabase vinculado: `bgdvlhttyjeuprrfxgun` (`Meta_Construtor-App`)

## Resultado executivo

Status: **bloqueado antes de aplicar migrations**.

O backup remoto foi concluido com sucesso e as migrations remotas ausentes localmente foram recuperadas via `supabase migration fetch`. A aplicacao automatica das migrations locais foi interrompida porque o dry-run mostrou que o Supabase CLI tentaria aplicar dezenas de migrations antigas, incluindo migrations de fevereiro e marco que podem conflitar com o schema remoto atual.

Nenhuma migration foi aplicada no remoto.

## Backup remoto

Comandos:

```powershell
npx supabase db dump --linked --data-only --use-copy --file .release-backups\supabase-remote-data-bgdvlhttyjeuprrfxgun-2026-05-13-1638.sql
npx supabase db dump --linked --file .release-backups\supabase-remote-schema-bgdvlhttyjeuprrfxgun-2026-05-13-1640.sql
```

Arquivos gerados:

- `.release-backups/supabase-remote-data-bgdvlhttyjeuprrfxgun-2026-05-13-1638.sql` - 1.219.184 bytes.
- `.release-backups/supabase-remote-schema-bgdvlhttyjeuprrfxgun-2026-05-13-1640.sql` - 165.731 bytes.

Observacao: `.release-backups/` esta no `.gitignore` para evitar versionar dumps de banco.

## Migrations remotas ausentes localmente

Comando:

```powershell
npx supabase migration fetch --linked
```

Arquivos recuperados:

- `20260225171535_security_hardening_storage_policies_and_constraints.sql`
- `20260225200732_create_missing_storage_buckets.sql`
- `20260226180001_fix_consume_credit_for_rdo_presidente_bypass.sql`
- `20260227124146_fix_trigger_consume_credit_for_rdo_role_column.sql`
- `20260228155615_create_rdo_notas.sql`
- `20260302005637_fix_rdo_notas_user_fk_clean.sql`
- `20260408025953_create_sflow_tables.sql`
- `20260423012932_add_org_id_to_missing_tables.sql`
- `20260427002050_add_detalhes_to_rdos.sql`
- `20260429222422_create_feedbacks_table.sql`
- `20260429222431_add_checklist_approval_columns.sql`
- `20260430000454_prd5_tables_audit_contact_feedback.sql`

Observacao importante: `migration fetch` tambem alterou arquivos antigos ja existentes em `supabase/migrations/`. Esses diffs precisam ser revisados antes de qualquer commit.

## Validacao do schema remoto

Consulta executada:

```sql
select c.relname as object_name,
       case c.relkind when 'r' then 'table' when 'v' then 'view' else c.relkind::text end as kind,
       c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public'
  and c.relname in (
    'integrations',
    'feedbacks',
    'analytics_events',
    'financeiro_consolidado',
    'cronograma_vs_realizado'
  )
order by c.relname;
```

Resultado observado:

- `feedbacks`: tabela existe, RLS ativo.
- `integrations`: tabela existe, RLS ativo.
- `financeiro_consolidado`: view existe com `security_invoker`.
- `cronograma_vs_realizado`: view existe com `security_invoker`.
- `analytics_events`: nao apareceu no resultado, indicando ausencia no schema remoto.

Policies observadas:

- `feedbacks`: policies apenas para `authenticated`.
- `integrations`: policies para `authenticated`, incluindo policies duplicadas com nomes diferentes.

Grants observados:

- `feedbacks`, `integrations`, `financeiro_consolidado` e `cronograma_vs_realizado` possuem grants amplos para `anon` e `authenticated`, incluindo privilegios alem de `SELECT`.
- Como `feedbacks` e `integrations` possuem RLS, o grant amplo para `anon` tende a ser bloqueado pelas policies, mas ainda e um estado excessivo para release.
- Para views, o grant amplo para `anon` e `authenticated` deve ser revisado. As views usam `security_invoker`, mas o privilegio de acesso deve ser minimizado.

## Dry-run de aplicacao

Comandos:

```powershell
npx supabase db push --linked --dry-run
npx supabase db push --linked --dry-run --include-all
```

Resultado:

O primeiro dry-run recusou aplicar porque ha migrations locais que seriam inseridas antes da ultima migration remota. O dry-run com `--include-all` listou 57 migrations que seriam aplicadas, incluindo migrations antigas de fevereiro/marco e as migrations recentes:

- `20260208220000_create_plans_table.sql` ate `20260304181000_credit_triggers.sql`
- `20260504061453_prd5_reports_integrations.sql`
- `20260504212312_prd5_homolog_shared_org_roles.sql`
- `20260506014345_feedbacks_mvp.sql`
- `20260506022601_fix_google_oauth_signup.sql`
- `20260511123000_fix_billing_schema_columns.sql`

## Decisao

Nao executar `db push --include-all` automaticamente.

Motivos:

- O schema remoto ja contem parte dos objetos das migrations de maio, apesar do historico remoto nao marcar essas migrations como aplicadas.
- `analytics_events` esta ausente no remoto e precisa de uma correcao direcionada.
- Grants remotos estao excessivos e precisam de hardening direcionado.
- Rodar 57 migrations antigas em producao pode causar conflitos, recriacoes, constraints duplicadas ou alteracoes indevidas.

## Proxima acao recomendada

Criar uma migration de reconciliacao pontual, depois de revisar:

- criar/harden `analytics_events`;
- ajustar grants de `feedbacks`, `integrations` e views para minimo necessario;
- remover/normalizar policies duplicadas em `integrations`, se confirmada redundancia;
- adicionar colunas de billing de `20260511123000` se ausentes;
- marcar como aplicadas via `supabase migration repair` somente as migrations cujo conteudo ja esta comprovadamente presente no schema remoto.

Essa proxima acao deve ser feita com SQL revisado, nao com `db push --include-all`.

## Reconciliacao pontual aplicada

Arquivo criado:

- `supabase/migrations/20260513170000_reconcile_remote_schema.sql`

Teste local:

```powershell
npx supabase migration up --local
```

Resultado: falhou antes de aplicar a nova migration por inconsistencia antiga no historico local (`20260215`). Para validar o SQL da migration, o script foi executado diretamente no Postgres local via container:

```powershell
Get-Content -Raw supabase\migrations\20260513170000_reconcile_remote_schema.sql |
  docker exec -i supabase_db_bgdvlhttyjeuprrfxgun psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

Resultado: sucesso apos ajustar grants com guards `to_regclass(...)`.

Aplicacao remota:

Nao foi usado `db push --include-all`. A reconciliacao foi aplicada por SQL direto via `npx supabase db query --linked`, um statement por vez.

Alteracoes aplicadas:

- `public.analytics_events` criada.
- RLS habilitado em `analytics_events`.
- Policies de SELECT/INSERT autenticado criadas em `analytics_events`.
- Colunas de billing adicionadas com `ADD COLUMN IF NOT EXISTS`.
- Indices de billing adicionados com `CREATE INDEX IF NOT EXISTS`.
- Grants de `anon` removidos dos objetos do schema public.
- Grants de `authenticated` minimizados para:
  - `analytics_events`: `SELECT`, `INSERT`.
  - `financeiro_consolidado`: `SELECT`.
  - `cronograma_vs_realizado`: `SELECT`.
  - `feedbacks`: `SELECT`, `INSERT`.
  - `integrations`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

Validacao remota:

```sql
select exists (
  select from information_schema.tables
  where table_schema='public' and table_name='analytics_events'
) as analytics_events_exists;
```

Resultado:

```text
analytics_events_exists = true
```

RLS:

```text
analytics_events = true
feedbacks = true
integrations = true
```

Grants finais observados:

```text
analytics_events        authenticated INSERT
analytics_events        authenticated SELECT
cronograma_vs_realizado authenticated SELECT
feedbacks               authenticated INSERT
feedbacks               authenticated SELECT
financeiro_consolidado  authenticated SELECT
integrations            authenticated DELETE
integrations            authenticated INSERT
integrations            authenticated SELECT
integrations            authenticated UPDATE
```

Teste anonimo REST:

```text
GET /rest/v1/analytics_events?select=id&limit=1
HTTP 401
permission denied for table analytics_events
```

## Status apos reconciliacao

Schema remoto dos pontos criticos: **reconciliado**.

Historico de migrations: **ainda possui drift**.

O comando `npx supabase migration list --linked` ainda mostra migrations locais sem correspondente remoto, incluindo a nova `20260513170000`, porque a aplicacao foi manual e nao registrada na tabela de migrations remota.

Nao foi executado `supabase migration repair`. Essa decisao deve ser feita separadamente, somente para migrations comprovadamente presentes no schema remoto.
