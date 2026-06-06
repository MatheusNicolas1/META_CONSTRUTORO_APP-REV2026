# PRD_LAYOUT - Evidencia Ciclo 2

Data: 2026-05-26

## Objetivo

Validar rotas autenticadas prioritarias e persistencia de tema claro/escuro com sessao real de teste.

## Ambiente

- App local: `http://127.0.0.1:5173`
- Browser plugin: tentativa inicial falhou por runtime local com caminho ausente.
- Fallback usado: Playwright regular.
- Usuario: temporario, criado e removido automaticamente pelo teste.
- Dados temporarios: organizacao, obra e RDO criados para a sessao de QA.

## Comando

```powershell
npx playwright test "scripts/prd-layout-auth-smoke.spec.ts" --reporter=list
npx playwright test "scripts/prd-layout-smoke.spec.ts" "scripts/prd-layout-auth-smoke.spec.ts" --reporter=list
npm run build
```

## Resultado

- Smoke autenticado: 22 testes, 22 passaram.
- Smoke consolidado: 54 testes, 54 passaram.
- Build: primeira tentativa gerou bundle, mas encerrou com assercao nativa `UV_HANDLE_CLOSING`; retry passou com sucesso.
- Falharam: 0.

## Rotas autenticadas cobertas

- `/app/dashboard`
- `/app/rdo`
- `/app/rdo/novo`
- `/app/obras`
- `/app/obras/:id`
- `/app/rdo/:id/visualizar`
- `/app/rdo/:id/editar`
- `/app/relatorios`
- `/app/configuracoes`

## Viewports cobertas

- `390x844`
- `768x1024`
- `1440x900`

## Criterios verificados

- Login pela tela real de `/login`.
- Permanencia em rota autenticada, sem redirecionar para login.
- Abertura de rotas dinamicas com IDs reais temporarios.
- Ausencia de overflow horizontal no documento.
- Ausencia de erros de console relevantes.
- Tema `dark` persiste apos reload.
- Tema `light` persiste apos reload.

## Observacoes

O primeiro run do teste de tema revelou que toast/onboarding de primeira sessao podem interceptar clique no toggle. Para validar a persistencia de tema sem misturar fluxo de onboarding, o usuario temporario foi preparado com `has_seen_onboarding = true`.

## Pendencias

- Validar RDO aprovar/rejeitar.
- Validar PWA standalone e safe area.
- Gerar e inspecionar PDFs reais.
