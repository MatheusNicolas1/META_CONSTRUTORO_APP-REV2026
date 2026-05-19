# Evidencia - Supabase migration repair

Data: 2026-05-14
Projeto Supabase vinculado: `bgdvlhttyjeuprrfxgun` (`Meta_Construtor-App`)

## Objetivo

Resolver ou documentar o drift restante de migrations apos a reconciliacao pontual do schema remoto.

## Historico remoto consultado

Comando:

```powershell
npx supabase db query --linked -o table "select * from supabase_migrations.schema_migrations order by version;"
```

Observacao: a saida completa contem a coluna `statements` e e muito grande. Para validacao pontual posterior, foi consultado:

```sql
select version, name
from supabase_migrations.schema_migrations
where version in (
  '20260513170000',
  '20260511123000',
  '20260506022601',
  '20260506014345',
  '20260504212312',
  '20260504061453'
)
order by version;
```

Resultado:

```text
20260504061453 | prd5_reports_integrations
20260504212312 | prd5_homolog_shared_org_roles
20260506014345 | feedbacks_mvp
20260506022601 | fix_google_oauth_signup
20260511123000 | fix_billing_schema_columns
20260513170000 | reconcile_remote_schema
```

## Repair executado

O CLI atual usa a sintaxe:

```powershell
npx supabase migration repair <version> --status applied --linked
```

Foram marcadas como `applied` as versoes que o `migration list --linked` listava como locais sem remoto, incluindo as versoes antigas e as recentes ate `20260513170000`.

Resultado relevante:

```text
Finished supabase migration repair.
Repaired migration history: [20260513170000] => applied
```

O repair altera somente a tabela de historico de migrations. Nenhum SQL de schema foi aplicado por esse comando.

## Validacao apos repair

Comando:

```powershell
npx supabase migration list --linked
```

Resultado: o drift grande foi eliminado, mas permaneceram inconsistencias residuais causadas por problemas locais de versionamento:

- `20260215_full_restore_plans.sql` usa versao curta `20260215`.
- Existem dois arquivos locais com a mesma versao `20260216120000`:
  - `20260216120000_add_subscription_price_id.sql`
  - `20260216120000_fix_plans_final.sql`

Consulta remota:

```sql
select version, name, created_by
from supabase_migrations.schema_migrations
where version in ('20260215','20260216120000')
order by version, name;
```

Resultado:

```text
20260215       | full_restore_plans        | NULL
20260216120000 | add_subscription_price_id | NULL
```

## Dry-run final

Comando:

```powershell
npx supabase db push --linked --dry-run
```

Resultado:

```text
Remote migration versions not found in local migrations directory.
try repairing the migration history table:
supabase migration repair --status reverted 20260215
```

## Decisao

Status final de P0.1: **schema remoto resolvido; drift residual aceito e documentado**.

Motivo:

- O schema remoto critico ja foi reconciliado e validado.
- O repair possivel foi executado.
- O drift restante vem de nomes/versoes locais problematicos, nao de uma falha funcional confirmada no schema remoto.
- Resolver esse residual exigiria mexer em migration historica local ou reverter historico remoto de `20260215`, o que pode criar mais risco do que beneficio neste momento.

## Risco residual

Um futuro `supabase db push --linked` ainda pode bloquear enquanto `20260215_full_restore_plans.sql` e a duplicidade `20260216120000` nao forem saneados.

Antes de usar `db push` em producao novamente, deve-se fazer uma tarefa especifica para normalizar o historico local de migrations.

## Proximo passo

Seguir para P0.2 (lint), mantendo este drift residual documentado.
