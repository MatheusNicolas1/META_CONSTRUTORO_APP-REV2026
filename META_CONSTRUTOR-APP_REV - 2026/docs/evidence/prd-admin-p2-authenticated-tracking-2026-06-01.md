# PRD_ADMIN - Evidencia P2 tracking autenticado e ativacao

Data: 2026-06-01

## Escopo executado

- Criado `src/utils/authenticatedAnalytics.ts` para:
  - canonicalizar rotas autenticadas;
  - substituir IDs dinamicos por `:id`;
  - gerar `route_name` estavel;
  - sanitizar labels de interacao antes de eventos de clique.
- Atualizado `src/hooks/useUserInteraction.ts` para:
  - registrar page views autenticados com `canonical_path` e `route_name`;
  - capturar cliques globais em `button`, `a`, `[role="button"]`, `[role="menuitem"]` e `[data-analytics-id]`;
  - persistir cliques em `user_interactions`;
  - emitir `app.authenticated_click` via analytics.
- Atualizado `src/components/Onboarding.tsx` para emitir:
  - `onboarding.started`;
  - `onboarding.step_advanced`;
  - `onboarding.step_back`;
  - `onboarding.completed`;
  - `onboarding.skipped`.
- Atualizado `src/hooks/useRDOs.ts` para emitir `activation.first_rdo_created` quando o usuario cria seu primeiro RDO na organizacao ativa.
- Criado `src/utils/__tests__/authenticatedAnalytics.test.ts` cobrindo canonicalizacao de rotas e redacao de labels com PII.

## Validacoes executadas

```powershell
npm.cmd test -- src/utils/__tests__/authenticatedAnalytics.test.ts src/utils/__tests__/analyticsPrivacy.test.ts
```

Resultado: passou, 2 arquivos e 6 testes.

```powershell
npx.cmd tsc --noEmit --pretty false
```

Resultado: passou sem erros.

```powershell
npx.cmd eslint src/utils/authenticatedAnalytics.ts src/utils/__tests__/authenticatedAnalytics.test.ts src/hooks/useUserInteraction.ts src/components/Onboarding.tsx src/hooks/useRDOs.ts src/integrations/analytics.ts
```

Resultado: passou sem erros ou warnings nos arquivos tocados.

```powershell
npm.cmd run build
```

Resultado: passou; `tsc -b`, `vite build`, sitemap e prerender de 15 rotas publicas concluidos. Warnings restantes sao os ja existentes de CSS deprecated e import dinamico/estatico do Supabase.

## Pendencias remanescentes

- Validar fluxo real autenticado com usuario comum e admin autorizado.
- Validar no Supabase remoto a chegada de `app.route_viewed`, `app.authenticated_click`, `onboarding.*` e `activation.first_rdo_created`.
- Reestruturar `AdminUsers` para segmentos e drill-down.
