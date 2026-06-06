# Evidencia PRD_LAYOUT - Ciclo 7 - PDF de RDO resiliente

Data: 2026-05-26  
Status: concluido para download real de PDF de RDO.

## Problema analisado

A funcao `generate-rdo-pdf` dependia diretamente de `https://demo.gotenberg.dev/forms/chromium/convert/html`. O endpoint demo retornava `500 Internal Server Error` ate para HTML minimo, fazendo o app exibir falha ao baixar PDF.

## Correcao aplicada

- `supabase/functions/generate-rdo-pdf/index.ts` agora aceita `GOTENBERG_URL` ou `GOTENBERG_ENDPOINT` por secret de Edge Function.
- A URL demo continua apenas como tentativa padrao quando nenhum secret esta configurado.
- Se Gotenberg falhar, a Edge Function gera um PDF textual A4 com `pdf-lib`, preservando o conteudo textual do relatorio e retornando `application/pdf` em vez de JSON/500.
- O smoke com `PRD_LAYOUT_VALIDATE_PDF=1` valida o clique pela UI e uma chamada direta autenticada, conferindo `content-type`, `content-disposition` e tamanho real do corpo.
- A funcao `generate-rdo-pdf` foi implantada remotamente no projeto `bgdvlhttyjeuprrfxgun`.

## Comandos executados

```powershell
npx supabase functions deploy generate-rdo-pdf --project-ref bgdvlhttyjeuprrfxgun --use-api
```

Resultado:

```text
Deployed Functions on project bgdvlhttyjeuprrfxgun: generate-rdo-pdf
```

```powershell
$env:PRD_LAYOUT_VALIDATE_PDF='1'; npx playwright test scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

```text
2 passed (32.2s)
```

```powershell
npm run build
```

Resultado:

```text
built in 20.98s
```

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

```text
56 passed (1.3m)
```

## Observacao tecnica

O fallback corrige o bloqueio operacional de download e evita erro ao usuario. Para manter a fidelidade visual completa do HTML do RDO, ainda e recomendado configurar um Gotenberg proprio e estavel via `GOTENBERG_URL`.
