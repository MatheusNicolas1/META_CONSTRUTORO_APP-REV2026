# Evidencia - RDO: e-mail apenas apos aprovacao

Data: 2026-05-21

## Escopo validado

- Botao `Enviar por E-mail` fica oculto em RDO `DRAFT`.
- Botoes `Aprovar RDO` e `Rejeitar RDO` aparecem para perfil `Administrador` quando o RDO nao esta aprovado.
- Botao `Enviar por E-mail` aparece em RDO `APPROVED`.
- Botoes `Aprovar RDO` e `Rejeitar RDO` ficam ocultos em RDO `APPROVED`.
- Edge Function nova `send-email-rdo` aceita `rdo_id`, `emails[]` e `motivo`.
- Edge Function antiga `send-rdo-email` tambem foi protegida para bloquear envio de RDO nao aprovado.

## Deploys

- Supabase Functions: `send-email-rdo`, `send-rdo-email`, `approve-rdo`, `update-rdo-status`.
- Vercel production: `dpl_AndqegNN3GwMkbgoDNVFsM5k7YJ8`.
- Dominio validado: `https://www.metaconstrutor.app.br`.

## Validacao local

- `npm run lint`: passou com `0 errors` e warnings existentes.
- `npm run build`: passou.

## Validacao em producao

### RDO antes da aprovacao

RDO: `f880af81-e9bb-465a-a6ab-a3b3723daffe`

Resultado DOM:

```json
{
  "hasDraft": true,
  "hasApprove": true,
  "hasReject": true,
  "hasEmail": false
}
```

Prints:

- `C:/Users/nicol/AppData/Local/Temp/rdo-before-approval-email-hidden.png`
- `C:/Users/nicol/AppData/Local/Temp/rdo-before-approval-actions.png`

### RDO aprovado

RDO: `239178fe-b8a1-45ed-b029-4effe0e11668`

Resultado DOM:

```json
{
  "hasApproved": true,
  "hasApprove": false,
  "hasReject": false,
  "hasEmail": true
}
```

Print:

- `C:/Users/nicol/AppData/Local/Temp/rdo-after-approval-email-visible.png`

### Edge Function `send-email-rdo`

Teste direto autenticado:

```json
{
  "draft": {
    "status": 409,
    "ok": false,
    "code": "INVALID_STATUS"
  },
  "approved": {
    "status": 200,
    "ok": true,
    "success": true,
    "email_id": "[present]"
  }
}
```

## Observacao

Validacao visual foi feita com usuario QA `Administrador`. A regra de usuario comum fica coberta no codigo por `canApprove = ['Administrador', 'Gerente', 'Presidente'].includes(role)`, mas nao houve login separado com usuario comum nesta rodada.
