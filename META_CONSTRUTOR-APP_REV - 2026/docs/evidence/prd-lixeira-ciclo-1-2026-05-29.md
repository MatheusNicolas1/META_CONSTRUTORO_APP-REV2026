# PRD_LIXEIRA - Ciclo 1

Data: 2026-05-29

## Escopo executado

- Validacao remota somente leitura do schema das tabelas alvo.
- Inventario de exclusoes diretas no frontend e Edge Functions.
- Criacao da migration local `20260529034950_prd_lixeira_soft_delete_foundation.sql`.
- Implementacao local da rota `/app/lixeira`, hook `useLixeira`, menu lateral e UI responsiva.
- Conversao local para soft delete em obras, documentos, RDOs, checklists e atividades.
- Preservacao de arquivos de documentos no Storage durante exclusao reversivel.
- Filtro `deleted_at is null` nas listagens principais alteradas.

## Evidencias tecnicas

### Schema remoto

Comando:

```powershell
npx.cmd supabase db query --linked -o json "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('obras','expenses','despesas','documentos','rdos','checklists','atividades','equipamentos','equipes','fornecedores') and column_name in ('id','org_id','deleted_at','deleted_by','delete_reason','delete_origin','purge_at','nome','titulo','title','created_at','updated_at') order by table_name, column_name;"
```

Resultado resumido:

- As tabelas alvo existem no schema remoto.
- `expenses` existe; `despesas` nao apareceu na consulta.
- `deleted_at`, `deleted_by`, `delete_reason`, `delete_origin` e `purge_at` nao apareceram nas tabelas consultadas.
- Isso confirma que a migration antiga local de soft delete nao pode ser assumida como aplicada no remoto.

### Policies remotas

Comando:

```powershell
npx.cmd supabase db query --linked -o json "select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' and tablename in ('obras','expenses','documentos','rdos','checklists','atividades','equipamentos','equipes','fornecedores') order by tablename, policyname;"
```

Resultado resumido:

- Existem policies por organizacao/papel nos modulos principais.
- A implementacao local manteve restauracao e exclusao definitiva sujeitas as policies de `UPDATE` e `DELETE` ja existentes.
- As policies SELECT remotas ainda nao foram reescritas para bloquear linhas com `deleted_at`; por isso este item permanece aberto no PRD.

### Build

Comando:

```powershell
npm.cmd run build
```

Resultado:

- Build concluido com sucesso.
- `tsc -b` passou.
- `vite build` passou.
- Avisos existentes: `color-adjust` depreciado e aviso de import dinamico/estatico de `supabase/client.ts`.

### Lint

Comando:

```powershell
npm.cmd run lint
```

Resultado:

- Concluiu com exit code 0.
- Foram reportados 34 warnings preexistentes de hooks/fast-refresh, sem erros.

### Testes

Comando:

```powershell
npm.cmd run test
```

Resultado:

- 8 arquivos de teste passaram.
- 27 testes passaram.

### Supabase lint remoto

Comando:

```powershell
npx.cmd supabase db lint --linked --schema public --fail-on error
```

Resultado:

- Falhou por erro preexistente em `public.check_and_grant_achievements`: valor invalido para enum `obra_status` com `"Concluida"` acentuado.
- Tambem reportou warnings em `public.create_default_user`.
- O erro nao foi introduzido por este ciclo, mas bloqueia marcar lint remoto como validado.

### Migration list

Comando:

```powershell
npx.cmd supabase migration list --linked
```

Resultado:

- Bloqueado por falta de `SUPABASE_DB_PASSWORD` para conexao direta.
- As consultas `db query --linked` funcionaram via Management API.

### Rota protegida

Comando:

```powershell
Playwright headless em `http://127.0.0.1:5173/app/lixeira`
```

Resultado:

- Desktop 1366x768: rota protegida redirecionou usuario anonimo para `/login` apos carregamento.
- Mobile 390x844: rota protegida redirecionou usuario anonimo para `/login`.
- Capturas:
  - `docs/evidence/prd-lixeira-route-desktop-2026-05-29.png`
  - `docs/evidence/prd-lixeira-route-mobile-2026-05-29.png`

## Pendencias abertas

- Aplicar a migration no ambiente remoto ou local de teste antes de validar fluxos autenticados.
- Reescrever ou complementar RLS para garantir que linhas com `deleted_at` nao vazem em consultas diretas fora da UI.
- Validar restauracao real com usuario autenticado.
- Validar exclusao definitiva real e remocao de arquivos do Storage.
- Criar expurgo automatico apos 30 dias.
- Integrar demais modulos com exclusoes diretas fora do primeiro ciclo.
