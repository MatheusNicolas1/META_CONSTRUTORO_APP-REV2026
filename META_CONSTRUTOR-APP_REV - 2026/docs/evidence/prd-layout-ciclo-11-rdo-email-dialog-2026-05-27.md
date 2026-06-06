# Evidencia PRD_LAYOUT - Ciclo 11 - Dialog de e-mail do RDO

Data: 2026-05-27  
Status: concluido.

## Escopo executado

- Fechamento automatizado de P2 para RDO e relatorios.
- Validacao da UI de envio de RDO por e-mail sem finalizar a configuracao real do provedor transacional.
- Viewports cobertos no fluxo convite/RDO:
  - `390x844`
  - `1440x900`

## Arquivo alterado

```text
scripts/prd-layout-invite-rdo-smoke.spec.ts
```

## Comportamento validado

- Administrador cadastra/convida colaborador existente como `Colaborador`.
- Colaborador cria RDO.
- Administrador aprova o RDO no mobile.
- RDO aprovado exibe a acao `Enviar por E-mail`.
- Dialog `Enviar RDO por e-mail` abre no viewport `390x844`.
- Dialog fica dentro da viewport horizontal e vertical.
- Campo de destinatarios aceita multiplos e-mails separados por ponto e virgula.
- Mensagem opcional e enviada no payload.
- Edge Function `send-email-rdo` foi mockada, sem envio real.
- Administrador rejeita RDO no desktop e a persistencia Supabase continua validada.

## Comandos executados

```powershell
npx playwright test scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

```text
2 passed (30.5s)
```

Regressao consolidada:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts scripts/prd-layout-pwa-smoke.spec.ts scripts/prd-layout-route-inventory-smoke.spec.ts --reporter=list
```

Resultado:

```text
70 passed (2.0m)
```

## Observacao

O envio real de e-mail permanece fora do aceite desta etapa por decisao do usuario e por depender de provedor transacional/Supabase Auth. Esta evidencia cobre layout, interacao e contrato de payload da UI.
