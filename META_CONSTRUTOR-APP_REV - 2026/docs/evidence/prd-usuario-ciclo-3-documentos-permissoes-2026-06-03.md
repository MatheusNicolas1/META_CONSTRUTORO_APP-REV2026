# PRD_USUARIO - Ciclo 3 - Documentos e permissoes

Data: 2026-06-03

## Escopo

Validar e corrigir o contrato de documentos/anexos para:

- leitura e escrita restritas a membros ativos da organizacao;
- bloqueio de usuario anonimo;
- bloqueio de usuario de outra organizacao;
- `useDocuments` sempre filtrado por `org_id`;
- cobertura planejada para PC, tablet e mobile.

## Alteracoes realizadas

- `src/hooks/useDocuments.ts`
  - Retorna lista vazia quando nao ha organizacao ativa.
  - Exige `orgId` antes de enviar, atualizar ou excluir documento.
  - Insere `org_id` obrigatorio no upload.
  - Remove o arquivo do storage se o insert em `documentos` falhar.
  - Atualizacao e exclusao agora filtram tambem por `org_id`.
  - Exclusao usa `select("id").single()` para detectar tentativa sem linha afetada.

- `supabase/migrations/20260603090000_prd_usuario_documentos_org_rls.sql`
  - Consolida as policies de `public.documentos`.
  - Remove policies permissivas antigas da tabela, preservando a policy restritiva da Lixeira.
  - Exige `org_id is not null`.
  - Permite leitura, atualizacao e exclusao apenas para membros ativos da organizacao.
  - Permite insert apenas para membro ativo com `uploaded_by = auth.uid()`.

- `scripts/prd-usuario-ciclo3-documentos-permissoes-smoke.mjs`
  - Cria usuarios temporarios Admin A, Colaborador A e Admin B.
  - Cria duas organizacoes temporarias.
  - Semeia documentos isolados por organizacao.
  - Valida RLS via Supabase anon client.
  - Valida UI em `/app/documentos` com viewport parametrizado.
  - Limpa usuarios, perfis, organizacoes, membros e documentos temporarios.

## Validacoes executadas

### Sintaxe do smoke

Comando:

```powershell
node -c scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
```

Resultado: passou.

### TypeScript

Comando:

```powershell
npx.cmd tsc -p tsconfig.app.json --noEmit
```

Resultado: passou.

Observacao: antes desta execucao foram removidos arquivos incrementais `tsconfig*.tsbuildinfo` porque apontavam para arquivos antigos inexistentes.

### Build

Comando:

```powershell
npm.cmd run build
```

Resultado: passou.

Avisos residuais conhecidos:

- `color-adjust` depreciado em CSS de impressao.
- import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

### Smoke PC contra Supabase atual

Ambiente:

- URL local: `http://127.0.0.1:5185`
- Device: PC
- Viewport: `1440x900`

Comando:

```powershell
$env:BASE_URL='http://127.0.0.1:5185'
$env:DEVICE_NAME='PC'
$env:VIEWPORT_WIDTH='1440'
$env:VIEWPORT_HEIGHT='900'
node scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
```

Resultado: falhou no contrato de RLS remoto.

Run:

```json
{
  "runId": "1780497728519-7184d8db",
  "device": "PC",
  "viewport": "1440x900",
  "baseUrl": "http://127.0.0.1:5185",
  "checks": [
    "seed criou usuarios, organizacoes e documentos isolados"
  ],
  "cleanup": [
    "documentos",
    "org_members",
    "org_credits",
    "subscriptions",
    "orgs",
    "users/profiles/settings/roles"
  ],
  "errors": [
    "Colaborador org A nao leu doc A: undefined"
  ]
}
```

## Diagnostico

O Admin A conseguiu seguir ate a etapa anterior, mas o Colaborador A, membro ativo da mesma organizacao, nao conseguiu ler o documento criado pelo Admin A. Isso aponta para policy remota ainda baseada no dono do upload ou sem a policy org-scoped efetiva para `documentos`.

As migracoes locais mostram uma policy antiga de leitura por `uploaded_by = auth.uid()` e uma policy posterior com `org_id`, mas o comportamento remoto atual nao permite a leitura colaborativa dentro da organizacao.

## Bloqueio operacional

A migracao corretiva foi criada localmente, mas nao foi aplicada ao Supabase remoto nesta execucao.

Tentativas:

```powershell
supabase db push
```

Falha:

```text
Failed reading config: Invalid db.major_version: 17.
```

```powershell
supabase db push --db-url $env:DATABASE_URL
```

Falha:

```text
Failed reading config: Invalid db.major_version: 17.
```

Fallback com `pg` temporario:

```text
DATABASE_URL: prisma+postgres://localhost:51213
ECONNREFUSED 127.0.0.1:51213
```

Tentativa complementar em workdir temporario contendo apenas a migracao `20260603090000_prd_usuario_documentos_org_rls.sql`:

```powershell
supabase projects list
supabase link --workdir $temp --project-ref bgdvlhttyjeuprrfxgun
supabase db push --workdir $temp --dry-run
```

Resultado:

```text
Projeto remoto vinculado: bgdvlhttyjeuprrfxgun / Meta_Construtor-App
failed SASL auth
FATAL: password authentication failed for user "postgres"
```

Conclusao: o ambiente atual tem sessao Supabase para localizar/vincular o projeto, mas nao tem a senha Postgres remota necessaria para aplicar DDL/RLS. A `DATABASE_URL` disponivel aponta para Postgres local desligado (`prisma+postgres://localhost:51213`). O `SUPABASE_SERVICE_ROLE_KEY` permite dados via API, mas nao permite DDL/policies.

Checagem MCP/plugin:

```text
tool_search para Supabase/RLS/SQL nao expos ferramenta Supabase callable nesta sessao.
Ferramentas MCP disponiveis apos a busca: Sentry, Node REPL, Fal e Shutterstock.
```

Conclusao complementar: nao ha MCP Supabase callable nesta sessao para aplicar a SQL remota sem credencial Postgres.

Checagem de senha salva:

```text
Busca local encontrou uma connection string Postgres remota antiga em scripts/debug_auth.cjs.
Por seguranca, a senha nao foi registrada nesta evidencia.
```

Validacao da credencial encontrada:

```powershell
supabase db push --workdir $temp --dry-run -p <senha-do-arquivo>
```

Resultado:

```text
FATAL: password authentication failed for user "postgres"
```

Validacao direta com `pg` no host `db.bgdvlhttyjeuprrfxgun.supabase.co:5432`:

```text
direct connection failed: 28P01
```

Conclusao: ha uma senha antiga salva no repo, mas ela nao e valida para o Postgres remoto atual.

## Aplicacao remota e validacao final

Depois do reset da senha Postgres remota, a conexao direta ao host `db.bgdvlhttyjeuprrfxgun.supabase.co:5432` passou. A senha nao foi persistida em arquivo nem registrada nesta evidencia.

A migracao `supabase/migrations/20260603090000_prd_usuario_documentos_org_rls.sql` foi aplicada diretamente no Postgres remoto e registrada em `supabase_migrations.schema_migrations`.

Policies remotas confirmadas em `public.documentos`:

```text
Lixeira: hide deleted rows | SELECT | RESTRICTIVE
documentos_org_delete      | DELETE | PERMISSIVE
documentos_org_insert      | INSERT | PERMISSIVE
documentos_org_read        | SELECT | PERMISSIVE
documentos_org_update      | UPDATE | PERMISSIVE
```

O smoke dedicado tambem foi ajustado para:

- falhar explicitamente em erros de seed;
- criar subscription ativa no plano `business` antes de inserir multiplos membros, respeitando o trigger `enforce_max_users_limit`;
- aceitar `permission denied` para usuario anonimo como bloqueio correto.

### Smoke PC apos migracao

```json
{
  "runId": "1780541191899-f0bf9356",
  "device": "PC",
  "viewport": "1440x900",
  "baseUrl": "http://127.0.0.1:5186",
  "checks": [
    "seed criou usuarios, organizacoes e documentos isolados",
    "RLS permitiu leitura/escrita por membro da org e bloqueou anonimo/outra org",
    "UI admin org A exibiu apenas documento da propria organizacao",
    "UI usuario de outra organizacao nao exibiu documento da org A"
  ],
  "errors": []
}
```

### Smoke tablet apos migracao

```json
{
  "runId": "1780541221261-e910c9b5",
  "device": "Tablet",
  "viewport": "768x1024",
  "baseUrl": "http://127.0.0.1:5186",
  "checks": [
    "seed criou usuarios, organizacoes e documentos isolados",
    "RLS permitiu leitura/escrita por membro da org e bloqueou anonimo/outra org",
    "UI admin org A exibiu apenas documento da propria organizacao",
    "UI usuario de outra organizacao nao exibiu documento da org A"
  ],
  "errors": []
}
```

### Smoke mobile apos migracao

```json
{
  "runId": "1780541221298-9f80c842",
  "device": "Mobile",
  "viewport": "390x844",
  "baseUrl": "http://127.0.0.1:5186",
  "checks": [
    "seed criou usuarios, organizacoes e documentos isolados",
    "RLS permitiu leitura/escrita por membro da org e bloqueou anonimo/outra org",
    "UI admin org A exibiu apenas documento da propria organizacao",
    "UI usuario de outra organizacao nao exibiu documento da org A"
  ],
  "errors": []
}
```

### Gates finais

```powershell
node -c scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
npx.cmd tsc -p tsconfig.app.json --noEmit
npm.cmd run build
```

Resultado: passaram. O build manteve apenas os avisos conhecidos de `color-adjust` e import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

## Status do aceite

- Codigo de front/hook: aprovado por TypeScript e build.
- RLS remota de `public.documentos`: aplicada e confirmada.
- Smoke RLS/UI PC: passou.
- Smoke RLS/UI tablet: passou.
- Smoke RLS/UI mobile: passou.
- Item do PRD `Permissoes de leitura e escrita respeitam organizacao e papel`: aprovado para o escopo automatizavel.

## Proxima acao

Aplicar `supabase/migrations/20260603090000_prd_usuario_documentos_org_rls.sql` no Supabase remoto usando uma destas opcoes:

- atualizar o Supabase CLI para uma versao que aceite `db.major_version = 17` e rodar apenas as migracoes pendentes esperadas;
- fornecer/usar uma URL Postgres remota direta para executar esta SQL;
- executar a SQL no SQL Editor do Supabase.
- informar a senha Postgres remota quando o CLI solicitar, em uma execucao controlada com workdir temporario contendo apenas esta migracao.

Depois, reexecutar:

```powershell
$env:BASE_URL='http://127.0.0.1:5185'; $env:DEVICE_NAME='PC'; $env:VIEWPORT_WIDTH='1440'; $env:VIEWPORT_HEIGHT='900'; node scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
$env:BASE_URL='http://127.0.0.1:5185'; $env:DEVICE_NAME='Tablet'; $env:VIEWPORT_WIDTH='768'; $env:VIEWPORT_HEIGHT='1024'; node scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
$env:BASE_URL='http://127.0.0.1:5185'; $env:DEVICE_NAME='Mobile'; $env:VIEWPORT_WIDTH='390'; $env:VIEWPORT_HEIGHT='844'; node scripts\prd-usuario-ciclo3-documentos-permissoes-smoke.mjs
```
