# P0.4 - Monitoramento Sentry

Data: 2026-05-19
Status: bloqueado por credencial/projeto Sentry real ausente

## Comandos executados

```powershell
npx vercel env ls production
npm run lint
npm run build
```

## Resultado

- `npx vercel env ls production`: Vercel respondeu que nao ha variaveis de ambiente cadastradas para `meta-construtors-projects/meta-construtor-app-rev-2026` em `production`.
- `.env.example`: `VITE_SENTRY_DSN` existe, mas esta vazio por ser template.
- `.env` e `.env.local`: nao possuem `VITE_SENTRY_DSN`.
- Codigo: Sentry ja era inicializado quando `VITE_SENTRY_DSN` existe.
- Ajuste aplicado: inicializacao centralizada em `src/integrations/sentry.ts`, com `sendDefaultPii: false`, Session Replay sem captura de texto (`maskAllText`) e sem midia (`blockAllMedia`), e redacao de campos sensiveis antes do envio.

## Validacao local

- `npm run lint`: passou com `0 errors` e `33 warnings` conhecidos.
- `npm run build`: passou.

## Bloqueio

Nao foi possivel confirmar evento real no painel Sentry nem criar regra de alerta porque o projeto/DSN real do Sentry nao esta disponivel nesta sessao e a Vercel nao tem `VITE_SENTRY_DSN` configurado em producao.

## Proxima acao

Criar/confirmar projeto Sentry, obter o DSN publico do projeto frontend e cadastrar na Vercel:

```powershell
echo "<dsn-publico-sentry>" | npx vercel env add VITE_SENTRY_DSN production
echo "production" | npx vercel env add VITE_SENTRY_ENVIRONMENT production
echo "v1.0.1-release-candidate" | npx vercel env add VITE_APP_VERSION production
```

Depois, redeployar e validar um evento controlado no painel Sentry antes de divulgacao publica.
