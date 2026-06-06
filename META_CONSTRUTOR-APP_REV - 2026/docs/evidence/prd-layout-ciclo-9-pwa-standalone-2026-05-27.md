# Evidencia PRD_LAYOUT - Ciclo 9 - PWA standalone

Data: 2026-05-27  
Status: concluido.

## Escopo executado

- Validacao do shell autenticado em modo PWA standalone mobile.
- Rotas verificadas:
  - `/app/dashboard`
  - `/app/rdo/novo`
- Viewport usado: `390x844`, mobile e touch.

## Arquivo criado

```text
scripts/prd-layout-pwa-smoke.spec.ts
```

O smoke cria usuario, organizacao, credito e obra temporarios com Supabase Service Role, forca `display-mode: standalone`, autentica pela UI e remove os dados ao final.

## Comandos executados

```powershell
npx playwright test scripts/prd-layout-pwa-smoke.spec.ts --reporter=list
```

Resultado:

```text
1 passed (5.1s)
```

Regressao consolidada:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts scripts/prd-layout-pwa-smoke.spec.ts --reporter=list
```

Resultado:

```text
58 passed (1.1m)
```

## Criterios verificados

- Header desktop oculto em PWA mobile.
- Sidebar desktop/mobile drawer ausente no shell standalone mobile.
- Bottom navigation visivel.
- Sem overflow horizontal no documento.
- `main` com padding inferior suficiente para a bottom navigation.
- Rolagem interna do `main` chega ao fim.
- Ultimo botao visivel permanece acima da bottom navigation.

## Observacao

Esta validacao cobre o layout standalone e a area segura do shell autenticado. A installabilidade/offline completa segue separada, porque o `ServiceWorkerManager` atual remove registrations de service workers antigos por decisao ja presente no app.
