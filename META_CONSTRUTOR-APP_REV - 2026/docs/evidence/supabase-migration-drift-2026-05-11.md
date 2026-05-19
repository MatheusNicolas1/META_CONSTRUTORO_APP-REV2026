# Evidencia - Supabase migration drift

Data: 2026-05-11
Projeto Supabase vinculado: `bgdvlhttyjeuprrfxgun` (`Meta_Construtor-App`)

## Comando executado

```powershell
npx supabase migration list --linked
```

## Resultado

O comando conectou no banco remoto e confirmou drift entre migrations locais e remotas.

### Migrations locais sem correspondente remoto

Ha muitas migrations locais sem correspondente remoto. O primeiro bloco ausente comeca em:

- `20260208220000`
- `20260208230000`
- `20260209110000`
- `20260209150000`
- `20260209180000`
- `20260209181000`
- `20260209182000`
- `20260209183000`
- `20260209190000`
- `20260209210000`
- `20260209220000`
- `20260209230000`
- `20260209231000`
- `20260209240000`
- `20260210000000`
- `20260210120000`
- `20260210130000`
- `20260210140000`
- `20260210160000`
- `20260210170000`
- `20260210173000`
- `20260211130000`
- `20260211150000`
- `20260211160000`
- `20260211170000`
- `20260212000000`
- `20260212000001`
- `20260213000000`
- `20260213135000`
- `20260213140000`
- `20260214001000`
- `20260214002000`
- `20260214003000`
- `20260214140000`
- `20260214143000`
- `20260214144500`
- `20260214150000`
- `20260214153000`
- `20260214160000`
- `20260215160000`
- `20260215180000`
- `20260215233000`
- `20260215`
- `20260216000000`
- `20260216120000`
- `20260216160000`
- `20260217234500`
- `20260218120000`
- `20260225001800`
- `20260304180000`
- `20260304181000`
- `20260504061453`
- `20260504212312`
- `20260506014345`
- `20260506022601`

### Migrations remotas sem correspondente local

O remoto tambem possui migrations sem arquivo local correspondente:

- `20260225171535`
- `20260225200732`
- `20260226180001`
- `20260227124146`
- `20260228155615`
- `20260302005637`
- `20260408025953`
- `20260423012932`
- `20260427002050`
- `20260429222422`
- `20260429222431`
- `20260430000454`

### Migrations recentes criticas ausentes no remoto

As migrations recentes citadas no PRD aparecem localmente, mas nao aparecem aplicadas no remoto:

- `20260504061453_prd5_reports_integrations.sql`
- `20260504212312_prd5_homolog_shared_org_roles.sql`
- `20260506014345_feedbacks_mvp.sql`
- `20260506022601_fix_google_oauth_signup.sql`

### Observacao adicional

O CLI informou:

```text
Skipping migration fix_permissions.sql... (file name must match pattern "<timestamp>_name.sql")
```

Esse arquivo local nao segue o padrao esperado de migration do Supabase e precisa ser classificado antes do release.

## Conclusao

Nao e seguro aplicar migrations pendentes automaticamente neste momento. O historico remoto e local divergiu em dois sentidos, entao a proxima etapa precisa ser uma reconciliacao controlada com backup remoto antes de qualquer mudanca.
