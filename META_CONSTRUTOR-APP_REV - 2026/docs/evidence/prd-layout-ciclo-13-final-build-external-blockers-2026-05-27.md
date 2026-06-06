# Evidencia PRD_LAYOUT - Ciclo 13 - Build final e bloqueios externos

Data: 2026-05-27  
Status: concluido.

## Escopo executado

- Validacao final local apos os ciclos 10, 11 e 12.
- Verificacao de disponibilidade local para Gotenberg via Docker.
- Build de producao.

## Comandos executados

```powershell
docker --version
```

Resultado:

```text
Docker version 29.1.3, build f52814d
```

```powershell
docker ps --format "{{.Names}} {{.Image}} {{.Ports}}"
```

Resultado:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

```powershell
npm run build
```

Resultado:

```text
✓ built in 16.73s
```

## Observacoes

- O Docker CLI esta instalado, mas o daemon Docker Desktop nao estava acessivel nesta sessao.
- Sem daemon ativo, nao foi possivel subir um container Gotenberg local para smoke de HTML/A4.
- Mesmo com daemon ativo, a Edge Function remota da Supabase precisaria de um `GOTENBERG_URL` publico e estavel, nao um `localhost` da maquina local.
- O build passou com os avisos ja conhecidos:
  - `color-adjust` depreciado, recomendado `print-color-adjust`.
  - import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

## Pendencias externas

- Configurar `GOTENBERG_URL` apontando para um conversor publico/estavel.
- Configurar provedor transacional e reexecutar envio real para `eng.mnicolas@gmail.com`, etapa pausada por decisao do usuario.
