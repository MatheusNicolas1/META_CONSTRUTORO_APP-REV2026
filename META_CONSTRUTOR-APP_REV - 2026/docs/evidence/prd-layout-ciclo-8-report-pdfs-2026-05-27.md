# Evidencia PRD_LAYOUT - Ciclo 8 - PDFs genericos de relatorios

Data: 2026-05-27  
Status: concluido.

## Escopo executado

- Validacao direta da Edge Function `generate-rdo-pdf` para relatorios genericos.
- Payloads completos validados:
  - `FINANCEIRO`
  - `CRONOGRAMA`
  - `DESPESAS`
  - `OBRA`
- Cada payload incluiu tabelas, metricas, textos longos e valores formatados para cobrir risco de truncamento, filename invalido e resposta que nao fosse PDF.

## Arquivo criado

```text
scripts/prd-layout-report-pdf-smoke.spec.ts
```

O smoke cria usuario temporario, autentica com Supabase Auth, chama a Edge Function remota com token real e remove o usuario ao final.

## Comandos executados

```powershell
npx playwright test scripts/prd-layout-report-pdf-smoke.spec.ts --reporter=list
```

Resultado:

```text
1 passed (9.4s)
```

```powershell
npm run build
```

Resultado:

```text
built in 14.86s
```

Primeira regressao completa:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts --reporter=list
```

Resultado:

```text
Falhou por ERR_CONNECTION_REFUSED em http://127.0.0.1:5173, pois o servidor Vite local nao estava ativo.
O teste remoto de PDF passou nessa rodada.
```

Servidor local iniciado:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Regressao completa apos subir Vite:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts --reporter=list
```

Resultado:

```text
57 passed (1.2m)
```

## Criterios verificados

- `status === 200`.
- `content-type` contem `application/pdf`.
- `content-disposition` contem filename `.PDF`.
- Filename nao contem `NaN`.
- Corpo do PDF maior que 1KB.

## Observacao

Esta validacao garante que a Edge Function nao retorna HTML/JSON/erro para relatorios genericos. A fidelidade visual completa do HTML/A4 ainda deve ser reforcada com um Gotenberg dedicado via `GOTENBERG_URL`.
