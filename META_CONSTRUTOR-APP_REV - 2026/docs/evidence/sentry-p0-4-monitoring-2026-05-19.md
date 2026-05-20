# P0.4 - Monitoramento Sentry

Data: 2026-05-19, atualizado em 2026-05-20
Status: variaveis de producao cadastradas; validacao real pendente de redeploy seguro e evento no painel

## Comandos executados

```powershell
npx vercel env ls production
npm run lint
npm run build
$env:DSN='https://588d5dbe6f98fee9354d02c7fe85cecf@o4511422743576576.ingest.us.sentry.io/4511422750130176'; $env:DSN | npx vercel env add VITE_SENTRY_DSN production
'production' | npx vercel env add VITE_SENTRY_ENVIRONMENT production
'v1.0.1-release-candidate' | npx vercel env add VITE_APP_VERSION production
npx vercel env ls production
```

## Resultado

- `npx vercel env ls production`: Vercel respondeu que nao ha variaveis de ambiente cadastradas para `meta-construtors-projects/meta-construtor-app-rev-2026` em `production`.
- `.env.example`: `VITE_SENTRY_DSN` existe, mas esta vazio por ser template.
- `.env` e `.env.local`: nao possuem `VITE_SENTRY_DSN`.
- Codigo: Sentry ja era inicializado quando `VITE_SENTRY_DSN` existe.
- `@sentry/react@8.55.0` confirmado instalado no repositorio.
- Vercel `production`: `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` e `VITE_APP_VERSION` cadastradas e listadas como `Encrypted`.
- Ajuste aplicado: inicializacao centralizada em `src/integrations/sentry.ts`, com `sendDefaultPii: false`, Session Replay sem captura de texto (`maskAllText`) e sem midia (`blockAllMedia`), e redacao de campos sensiveis antes do envio.
- Ajuste adicional: criado teste controlado por console com `window.__META_SENTRY_TEST__()`, que envia `captureException(new Error('Meta Construtor Sentry validation error'))`.
- O snippet do onboarding da Sentry nao foi aplicado literalmente porque `sendDefaultPii: true` contraria a decisao de privacidade do projeto. A opcao `enableLogs` tambem nao compila com `@sentry/react@8.55.0` (`BrowserOptions` nao reconhece essa propriedade).

## Validacao local

- `npm run lint`: passou com `0 errors` e `34 warnings` conhecidos.
- `npm run build`: passou.

## Bloqueio

Nao foi feito redeploy de producao nesta etapa porque o working tree local contem varias alteracoes nao relacionadas. Rodar `npx vercel --prod` a partir deste diretório poderia publicar codigo fora do escopo da configuracao Sentry.

## Proxima acao

Proxima acao segura: fazer redeploy a partir de uma arvore limpa ou apos reconciliar as alteracoes locais. Depois abrir o site em producao, executar no console `window.__META_SENTRY_TEST__()` e confirmar o evento `Meta Construtor Sentry validation error` no painel Sentry.
