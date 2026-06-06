# Evidencia PRD_LAYOUT - Ciclo 6 - Aprovacao/Rejeicao RDO e PDF

Data: 2026-05-26  
Status: concluido para aprovacao/rejeicao; PDF bloqueado por conversor externo.

## Escopo executado

- Etapa de recebimento real do e-mail para `eng.mnicolas@gmail.com` pausada por decisao do usuario, considerando dependencia do plano/configuracao de envio Supabase/Resend.
- Smoke `scripts/prd-layout-invite-rdo-smoke.spec.ts` ampliado para clicar em `Aprovar RDO` e `Rejeitar RDO`.
- Fluxo com login real alternando administrador e colaborador.
- Validacao em `390x844`: colaborador cria RDO; administrador aprova pela UI; Supabase persiste `APPROVED`, `approved_by` e `aprovado_por_id`.
- Validacao em `1440x900`: colaborador cria RDO; administrador rejeita pela UI com motivo; Supabase persiste `REJECTED`, `rejection_reason` e `motivo_rejeicao`.
- PDF testado com flag explicita; Edge Function respondeu 500 porque o conversor externo `https://demo.gotenberg.dev` retornou erro.

## Comandos executados

```powershell
npx playwright test scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

```text
2 passed (33.4s)
```

```powershell
npm run build
```

Resultado:

```text
built in 20.04s
```

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

```text
56 passed (1.2m)
```

## Falha controlada de PDF

Teste via UI com `PRD_LAYOUT_VALIDATE_PDF=1`:

```text
generate-rdo-pdf respondeu 500
{"error":"Falha ao converter HTML para PDF: 500 - Internal Server Error"}
```

Teste minimo direto contra o mesmo conversor:

```text
POST https://demo.gotenberg.dev/forms/chromium/convert/html
500 text/plain; charset=UTF-8
Internal Server Error
```

Conclusao: a pendencia atual de PDF esta isolada no conversor externo demo. O smoke principal permanece passando sem depender desse servico instavel.
