# PRD_DASHBOARD - Ciclo 1

Data: 2026-05-29  
Escopo: Fases 0 a 4 do `PRD_DASHBOARD.md`.

## Implementacao

- Assets copiados para `public/brand/meta-construtor-logo.png` e `public/brand/meta-construtor-icon.png`.
- `src/components/Logo.tsx` passou a renderizar a logo real em variantes `full` e `icon`, com `object-contain`.
- `src/components/AppSidebar.tsx` foi adaptado para navegacao inspirada no Canva:
  - logo no topo;
  - botao principal "Criar";
  - estado expandido com labels;
  - estado recolhido com icones e tooltips;
  - rodape com Configuracoes.
- `src/components/OptimizedLayout.tsx` libera largura total para `/app/dashboard` e remove a busca duplicada do header nessa rota.
- `src/components/GlobalSearch.tsx` agora aceita largura/texto customizados e modo expandido no mobile.
- `src/components/OptimizedDashboard.tsx` foi reorganizado em:
  - hero com busca protagonista;
  - acoes rapidas;
  - metricas em faixa;
  - recentes visuais com dados reais de `useRecentObras` e `useRecentRDOs`;
  - calendario e proximos passos.

## Validacao

- `npm.cmd run build`: passou.
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "/app/dashboard renders authenticated"`: 3/3 passou.
  - `mobile-390`
  - `tablet-768`
  - `desktop-1440`
- `npx.cmd playwright test scripts/prd-layout-auth-smoke.spec.ts --grep "theme toggle persists"`: 1/1 passou.
- `npx.cmd playwright test scripts/prd-layout-pwa-smoke.spec.ts --grep "PWA standalone mobile"`: 1/1 passou.

## Evidencias visuais

- `docs/evidence/prd-dashboard-desktop-expanded-2026-05-29.png`
- `docs/evidence/prd-dashboard-desktop-collapsed-2026-05-29.png`
- `docs/evidence/prd-dashboard-mobile-390-2026-05-29.png`

## Observacoes

- Figma/Canva MCP foram dispensados neste ciclo porque os prints anexados e o codigo atual foram suficientes para orientar a implementacao.
- A captura autenticada usou usuario QA temporario criado via Supabase Admin e removido ao final.
- A primeira tentativa de seed de RDO temporario falhou por constraint de `rdos.periodo`; a evidencia visual foi recapturada usando obra real temporaria, suficiente para validar metricas e recentes no dashboard.
