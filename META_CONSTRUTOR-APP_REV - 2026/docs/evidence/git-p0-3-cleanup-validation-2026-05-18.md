# Evidencia P0.3 - Limpeza do stage e validacoes

Data: 2026-05-18
Escopo: continuar P0.3 apos autorizacao para desstage controlado de artefatos locais.

## Comandos executados

```powershell
git restore --staged -- "META_CONSTRUTOR-APP_REV - 2026/.agent" "META_CONSTRUTOR-APP_REV - 2026/.playwright-cli" "META_CONSTRUTOR-APP_REV - 2026/output" "META_CONSTRUTOR-APP_REV - 2026/test-results" "META_CONSTRUTOR-APP_REV - 2026/screenshot_fail.png" "META_CONSTRUTOR-APP_REV - 2026/supabase/.temp" "META_CONSTRUTOR-APP_REV - 2026/tsconfig.app.tsbuildinfo" "META_CONSTRUTOR-APP_REV - 2026 (2).zip" "meta-construtor-hub-main.zip" "meta_construtor-app.zip"
npm test
npm run lint
npm run build
```

## Resultado da limpeza do stage

- Artefatos locais claramente indevidos foram removidos do stage sem apagar arquivos do disco.
- Confirmado que o staged diff nao contem mais:
  - `.agent/`
  - `.playwright-cli/`
  - `output/`
  - `test-results/`
  - `screenshot_fail.png`
  - `supabase/.temp/`
  - `tsconfig.app.tsbuildinfo`
  - arquivos `.zip`

Estado Git apos limpeza e validacoes:

- Total de entradas no status: 225.
- Entradas staged: 154.
- Entradas com mudanca unstaged: 95.
- Entradas untracked: 22.
- Arquivos `MM`: 24.

Arquivos `MM` ainda exigem reconciliacao entre stage e working tree antes de commit/tag:

- `.gitignore`
- `package-lock.json`
- `package.json`
- `src/components/NovaObraForm.tsx`
- `src/components/PerformanceOptimizedApp.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/landing/FooterSection.tsx`
- `src/components/landing/LandingNavigation.tsx`
- `src/components/landing/ModernFeaturesSection.tsx`
- `src/components/profile/SubscriptionTab.tsx`
- `src/hooks/useChecklist.ts`
- `src/hooks/useObraDetails.ts`
- `src/hooks/useObras.ts`
- `src/hooks/useRDOs.ts`
- `src/pages/Checklist.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/Contato.tsx`
- `src/pages/CriarConta.tsx`
- `src/pages/Login.tsx`
- `src/pages/ObraDetalhes.tsx`
- `src/security/RBACMatrix.ts`
- `src/types/obra.ts`
- `supabase/config.toml`
- `supabase/functions/create-subscription/index.ts`

## Validacoes

Primeira execucao de `npm test` falhou em 2 testes de OAuth porque `Login` e `CriarConta` enviavam `redirectTo` sem o parametro `next`.

Correcao aplicada:

- `src/pages/Login.tsx`: `redirectTo` passou a usar `getAuthCallbackUrl()`.
- `src/pages/CriarConta.tsx`: `redirectTo` passou a usar `getAuthCallbackUrl()`.

Validacoes finais:

```text
npm test
Test Files 3 passed (3)
Tests 10 passed (10)

npm run lint
33 problems (0 errors, 33 warnings)

npm run build
built in 13.53s
```

Warnings restantes:

- Lint: os 33 warnings ja documentados na P0.2.
- Build: `color-adjust` depreciado, import dinamico/estatico misto do cliente Supabase e chunks acima de 500 kB.

## Bloqueio restante

Commit/tag de release ainda nao devem ser criados.

Motivo: ainda existem 154 entradas staged e 24 arquivos `MM`. Um commit agora poderia registrar uma versao parcialmente staged que nao corresponde ao working tree validado. O proximo passo e revisar os 24 arquivos `MM` e decidir se o conteudo atual deve ser re-stageado ou separado em commits.
