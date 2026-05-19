# Evidencia - Bloqueio no backup remoto Supabase

Data: 2026-05-12
Projeto Supabase vinculado: `bgdvlhttyjeuprrfxgun` (`Meta_Construtor-App`)

## Objetivo

Executar backup remoto antes de qualquer mudanca no Supabase, conforme P0.1 do `PRD.md`.

## Comandos executados

```powershell
npx supabase db dump --help
npx supabase migration list --linked
npx supabase db dump --linked --file .release-backups\supabase-remote-schema-bgdvlhttyjeuprrfxgun-2026-05-12-1053.sql
npx supabase db dump --linked --data-only --use-copy --file .release-backups\supabase-remote-data-bgdvlhttyjeuprrfxgun-2026-05-12-1053.sql
Get-Command pg_dump -ErrorAction SilentlyContinue
```

## Resultado

O backup pelo Supabase CLI falhou antes de gerar conteudo porque o ambiente local nao possui Docker Desktop ativo.

Erro relevante:

```text
failed to inspect docker image
Docker Desktop is a prerequisite for local development.
```

Tambem foi verificado que `pg_dump` nao esta disponivel no PATH local, entao nao houve fallback local para gerar backup remoto sem Docker.

Os arquivos de dump criados pela tentativa falha tinham 0 bytes e foram removidos.

## Mudancas remotas

Nenhuma mudanca foi executada no banco remoto.
Nenhuma migration foi aplicada.
Nenhum repair de historico foi executado.

## Decisao

Execucao pausada antes de qualquer alteracao no Supabase remoto.

Para continuar P0.1, uma das opcoes abaixo deve ser concluida primeiro:

- criar backup manual pelo Supabase Dashboard em Database > Backups;
- iniciar Docker Desktop e repetir `npx supabase db dump --linked`;
- instalar `pg_dump` localmente e gerar dump remoto via credenciais seguras;
- usar outro ambiente confiavel com Supabase CLI/Docker/pg_dump disponivel.

## Status

`P0.1` permanece bloqueado por ausencia de backup remoto.

## Nova tentativa em 2026-05-12 11:55 -03:00

O usuario solicitou nova tentativa.

Comandos executados:

```powershell
docker version
npx supabase db dump --linked --file .release-backups\supabase-remote-schema-bgdvlhttyjeuprrfxgun-2026-05-12-1155.sql
npx supabase db dump --linked --data-only --use-copy --file .release-backups\supabase-remote-data-bgdvlhttyjeuprrfxgun-2026-05-12-1155.sql
Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden
docker info
```

Resultado:

- `docker version` identificou o client Docker, mas o daemon retornou erro 500 no pipe `dockerDesktopLinuxEngine`.
- `supabase db dump` falhou novamente ao inspecionar a imagem `public.ecr.aws/supabase/postgres:17.6.1.003`.
- Docker Desktop foi iniciado/reacionado em segundo plano.
- `docker info` ficou sem resposta ate timeout.
- Os arquivos de dump gerados pela tentativa tinham 0 bytes e foram removidos.

Erro relevante:

```text
request returned 500 Internal Server Error for API route ... dockerDesktopLinuxEngine
```

Conclusao da nova tentativa:

O ambiente ainda nao consegue gerar backup via Supabase CLI porque o Docker Desktop Linux Engine nao esta saudavel. Nenhuma mudanca remota foi feita.
