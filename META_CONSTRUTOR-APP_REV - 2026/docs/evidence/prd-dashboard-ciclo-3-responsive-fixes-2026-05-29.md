# Evidencia - PRD_DASHBOARD Ciclo 3 - Correcoes Responsivas - 2026-05-29

## Escopo executado

- Corrigido clipping do `ActivityCalendarModern` quando a sidebar esta expandida.
- Alterado o breakpoint interno do calendario de `xl` para `2xl`, evitando grid largo dentro de coluna estreita.
- Adicionados `min-w-0` nos containers do calendario e da grade secundaria do dashboard.
- Botao `Mais` preservado no menu expandido com topo da sidebar mais compacto.
- Topo da sidebar alinhado entre estado expandido e recolhido usando altura unica de `h-16`.
- Botao de menu movido para o topo da sidebar, no lugar onde a marca estava.
- Marca textual `Meta Construtor` movida para o header, no lugar do botao de menu em desktop/tablet.
- Tipografia de `Meta` reestilizada com fonte serifada, inclinacao e sublinhado laranja.
- Smoke autenticado passou a verificar que `Mais` permanece visivel em sidebar expandida e que o card do calendario nao gera overflow interno.

## Validacao local

- `npm.cmd run build`: passou.
- `curl.exe -I http://127.0.0.1:5173/home`: HTTP 200.
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "/app/dashboard renders authenticated"`: 6 passed em 320, 390, 768, 1024, 1440 e 1920.
- `npx.cmd playwright test scripts/prd-layout-smoke.spec.ts --grep "/home"`: 4 passed.

## Deploy Vercel

- Comando: `npx.cmd vercel deploy --prod --yes`.
- Deployment: `dpl_ABPKB84zg3n1Nqo5LyYZBuurXjEa`.
- URL de deploy: `https://meta-construtor-app-rev-2026-2kijx0sv4.vercel.app`.
- Alias de producao: `https://www.metaconstrutor.app.br`.
- `npx.cmd vercel inspect https://meta-construtor-app-rev-2026-2kijx0sv4.vercel.app`: status `Ready`, target `production`.
- `curl.exe -I https://www.metaconstrutor.app.br/home`: HTTP 200.
- `curl.exe -I https://www.metaconstrutor.app.br/app/dashboard`: HTTP 200.
