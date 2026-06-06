# PRD_LAYOUT - Ciclo 15 - Edge Function com Gotenberg local

Data: 2026-05-28

## Objetivo

Validar que a Edge Function `generate-rdo-pdf`, quando recebe `GOTENBERG_URL` no runtime local, chama um Gotenberg dedicado e retorna PDF gerado pelo Chromium em vez de cair no fallback `pdf-lib`.

## Execucao

- O binario global `supabase` foi descartado para este teste porque a CLI instalada (`2.20.12`) falhou ao ler `supabase/config.toml` com `Invalid db.major_version: 17`.
- A funcao foi servida com `npx supabase functions serve generate-rdo-pdf --no-verify-jwt --debug`.
- A primeira execucao com variavel de ambiente no processo pai nao propagou `GOTENBERG_URL` ao runtime da Edge Function; a chamada retornou PDF fallback com cerca de 2 KB e log `Gotenberg unavailable, using embedded PDF fallback: 500 - Internal Server Error`.
- A execucao final usou `--env-file` com `GOTENBERG_URL=http://host.docker.internal:3001`, que e o endereco correto para o runtime Docker acessar o servico exposto no host.
- Foi criado usuario temporario local via Auth Admin API, feito login por senha, chamada autenticada a `http://127.0.0.1:54321/functions/v1/generate-rdo-pdf` e remocao do usuario ao final.

## Resultado

- Endpoint da funcao: `200`.
- `content-type`: `application/pdf`.
- `content-disposition`: `attachment; filename="RELATORIO_GOTENBERG_LOCAL_2026-05-28.PDF"`.
- PDF gerado: `.tmp-prd-layout/generate-rdo-pdf-local-gotenberg-envfile.pdf`.
- Tamanho do PDF final: `60680` bytes.
- Log da Edge Function: `[generate-rdo-pdf] PDF generated through Gotenberg. Size: 60680 bytes`.
- Log do container Gotenberg: request `POST /forms/chromium/convert/html`, user agent `Deno/2.1.4 (variant; SupabaseEdgeRuntime/1.73.13)`, `status=200`, `bytes_in=8009`, `bytes_out=60680`.

## Conclusao

O contrato `generate-rdo-pdf -> GOTENBERG_URL -> /forms/chromium/convert/html` esta validado localmente com a Edge Function real. A pendencia restante nao e de codigo do contrato PDF, mas de infraestrutura: configurar um endpoint Gotenberg publico/estavel em Supabase Secrets para producao. Envio real de e-mail permanece fora desta execucao.
