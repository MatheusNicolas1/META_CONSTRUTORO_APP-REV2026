# P2.1 - Performance, bundle e cache

Data: 2026-05-22

## Escopo

Validar o ajuste de bundle/code splitting, o carregamento mobile e o comportamento de cache/service worker em producao.

## Alteracao aplicada

- `vite.config.ts` recebeu `manualChunks` para separar dependencias pesadas em grupos de vendor:
  - `vendor-react`
  - `vendor-supabase`
  - `vendor-query`
  - `vendor-payments`
  - `vendor-observability`
  - `vendor-motion`
  - `vendor-charts`
  - `vendor-date`
  - `vendor-ui`
  - `vendor-analytics`
  - `vendor-phone`
  - `vendor-forms`
  - `vendor-dnd`

## Build local

Comando:

```powershell
npm run build
```

Resultado:

- Build concluido com sucesso.
- O warning anterior de chunk acima de 500 kB nao apareceu mais.
- Maiores chunks no build local:
  - `assets/index-CM5Yhska.js`: 405.13 kB, gzip 114.33 kB
  - `assets/vendor-charts-B5h86aGM.js`: 375.97 kB, gzip 103.70 kB
  - `assets/vendor-ui-D3fikJcS.js`: 236.98 kB, gzip 65.41 kB
  - `assets/vendor-analytics-BviG2wOP.js`: 175.76 kB, gzip 57.26 kB
  - `assets/vendor-supabase-BVTISH4i.js`: 173.57 kB, gzip 45.70 kB

Avisos restantes:

- CSS: `color-adjust` depreciado; nao bloqueia execucao.
- Vite: `src/integrations/supabase/client.ts` e importado dinamicamente pelo `AuditLogger`, mas tambem e importado estaticamente em outros pontos; isso nao bloqueia o build nem reintroduz chunk acima de 500 kB.

## Deploy de producao

Comando:

```powershell
npx vercel deploy --prod --yes
```

Resultado:

- Deployment: `dpl_CBokmAALUZz1qFR1nGwE6p7UetVZ`
- Dominio: `https://www.metaconstrutor.app.br`
- Build da Vercel tambem concluiu sem warning de chunk acima de 500 kB.

## Validacao mobile

Comando:

```powershell
npx playwright screenshot --browser=chromium --viewport-size=414,896 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" --wait-for-timeout=5000 https://www.metaconstrutor.app.br/home docs/evidence/p2-1-home-mobile-2026-05-22.png
```

Resultado:

- Pagina `/home` carregou em viewport mobile.
- Evidencia visual: `docs/evidence/p2-1-home-mobile-2026-05-22.png`.

Observacao:

- O preset `--device="iPhone 11"` tentou usar WebKit, que nao esta instalado no ambiente local do Playwright. A validacao foi refeita com Chromium e viewport/user-agent mobile.

## Cache e service worker

Comando:

```powershell
node -e "<script de fetch para /home e /checkout?plan=basic>"
```

Resultado:

```json
[
  {
    "url": "https://www.metaconstrutor.app.br/home",
    "html": {
      "status": 200,
      "cacheControl": "public, max-age=0, must-revalidate",
      "contentType": "text/html; charset=utf-8"
    },
    "scripts": ["index-B4NEFKpZ.js"],
    "firstAsset": {
      "url": "https://www.metaconstrutor.app.br/assets/index-B4NEFKpZ.js",
      "status": 200,
      "cacheControl": "public, max-age=0, must-revalidate",
      "contentType": "application/javascript; charset=utf-8"
    },
    "hasServiceWorkerRegistration": false
  },
  {
    "url": "https://www.metaconstrutor.app.br/checkout?plan=basic",
    "html": {
      "status": 200,
      "cacheControl": "public, max-age=0, must-revalidate",
      "contentType": "text/html; charset=utf-8"
    },
    "scripts": ["index-B4NEFKpZ.js"],
    "firstAsset": {
      "url": "https://www.metaconstrutor.app.br/assets/index-B4NEFKpZ.js",
      "status": 200,
      "cacheControl": "public, max-age=0, must-revalidate",
      "contentType": "application/javascript; charset=utf-8"
    },
    "hasServiceWorkerRegistration": false
  }
]
```

Verificacao de codigo:

```powershell
rg -n "serviceWorker|register\(|unregister\(|vite-plugin-pwa|workbox|ServiceWorkerManager" src package.json vite.config.ts public
```

Resultado:

- Nao ha plugin PWA/workbox configurado.
- `ServiceWorkerManager` apenas remove registros existentes via `registration.unregister()`.
- HTML publico nao contem chamada de registro de service worker.

## Status

- P2.1 concluido.
- Sem evidencia de service worker mantendo versao antiga.
- Sem warning de chunk acima de 500 kB apos code splitting.
