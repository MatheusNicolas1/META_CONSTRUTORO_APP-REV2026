# P0.4 - Monitoramento Sentry

Data: 2026-05-19, atualizado em 2026-05-20
Status: variaveis de producao cadastradas, redeploy concluido e evento confirmado no Sentry; alerta JS pendente por falta de ferramenta MCP para alert rules

## Comandos executados

```powershell
npx vercel env ls production
npm run lint
npm run build
$env:DSN='https://588d5dbe6f98fee9354d02c7fe85cecf@o4511422743576576.ingest.us.sentry.io/4511422750130176'; $env:DSN | npx vercel env add VITE_SENTRY_DSN production
'production' | npx vercel env add VITE_SENTRY_ENVIRONMENT production
'v1.0.1-release-candidate' | npx vercel env add VITE_APP_VERSION production
npx vercel env ls production
npx vercel --prod --yes
npx vercel env rm VITE_SENTRY_DSN production --yes
<dsn-confirmado-via-mcp> | npx vercel env add VITE_SENTRY_DSN production
npx vercel --prod --yes
```

## Resultado

- `npx vercel env ls production`: Vercel respondeu que nao ha variaveis de ambiente cadastradas para `meta-construtors-projects/meta-construtor-app-rev-2026` em `production`.
- `.env.example`: `VITE_SENTRY_DSN` existe, mas esta vazio por ser template.
- `.env` e `.env.local`: nao possuem `VITE_SENTRY_DSN`.
- Codigo: Sentry ja era inicializado quando `VITE_SENTRY_DSN` existe.
- `@sentry/react@8.55.0` confirmado instalado no repositorio.
- Vercel `production`: `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` e `VITE_APP_VERSION` cadastradas e listadas como `Encrypted`.
- Vercel `production`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` tambem precisaram ser cadastradas; sem elas o primeiro redeploy limpo carregou sem Supabase e a aplicacao apresentou `supabaseUrl is required`.
- MCP Sentry conectado em 2026-05-20 e autenticado como `Matheus (matheusnicolas.org@gmail.com)`.
- Projeto Sentry renomeado para `meta-construtor-web` com slug `meta-construtor-web`.
- DSN usado em producao foi substituido pelo DSN confirmado no projeto `meta-construtor-web` (`projectId=4511422758256640`).
- Ajuste aplicado: inicializacao centralizada em `src/integrations/sentry.ts`, com `sendDefaultPii: false`, Session Replay sem captura de texto (`maskAllText`) e sem midia (`blockAllMedia`), e redacao de campos sensiveis antes do envio.
- Ajuste adicional: criado teste controlado por console com `window.__META_SENTRY_TEST__()`, que envia `captureException(new Error('Meta Construtor Sentry validation error'))`.
- O snippet do onboarding da Sentry nao foi aplicado literalmente porque `sendDefaultPii: true` contraria a decisao de privacidade do projeto. A opcao `enableLogs` tambem nao compila com `@sentry/react@8.55.0` (`BrowserOptions` nao reconhece essa propriedade).

## Validacao local

- `npm run lint`: passou com `0 errors` e `34 warnings` conhecidos.
- `npm run build`: passou.
- Vercel build remoto: passou.
- Deployment final: `dpl_6NkNA6y5i8MdF4mJKUs2DzNJGBGg`.
- URL de producao final: `https://meta-construtor-app-rev-2026-r5ii4p4tk.vercel.app`, aliased para `https://www.metaconstrutor.app.br`.
- Bundle publicado: contem DSN Sentry, DSN Supabase e `window.__META_SENTRY_TEST__`.
- Deployment final apos DSN corrigido: `dpl_GjhdCrEkX5HE69vLpGn1Mqnw8mE4`.
- URL de producao final apos DSN corrigido: `https://meta-construtor-app-rev-2026-j3i8kqzux.vercel.app`, aliased para `https://www.metaconstrutor.app.br`.
- Bundle publicado apos DSN corrigido: contem projectId Sentry `4511422758256640`, nao contem o projectId antigo `4511422750130176`, contem Supabase e contem `window.__META_SENTRY_TEST__`.
- Evento de validacao enviado para a ingestao Sentry com HTTP 200: `173d44f3a040f412a30e980cd912a2b5`.
- Evento confirmado via MCP Sentry: issue `META-CONSTRUTOR-WEB-2`, titulo `Error: Meta Construtor Sentry validation error`, projeto `meta-construtor-web`, timestamp `2026-05-20T17:43:47+00:00`.

## Bloqueio

Nao foi possivel criar a regra de alerta JS pela automacao atual: as ferramentas MCP Sentry disponiveis nesta sessao permitem consultar projetos/issues/eventos, mas nao expõem criacao/edicao de alert rules. O responsavel inicial definido para alertas e Matheus (`matheusnicolas.org@gmail.com`).

## Proxima acao

Criar manualmente no painel Sentry uma regra de alerta de erros JS para o projeto `meta-construtor-web`, enviando para Matheus (`matheusnicolas.org@gmail.com`). Depois validar recebimento do alerta e marcar P0.4 como concluido.
