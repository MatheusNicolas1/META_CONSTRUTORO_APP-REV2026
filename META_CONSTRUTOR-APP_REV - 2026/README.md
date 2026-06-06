# Meta Construtor App Rev 2026

Aplicativo web para gestao de obras, RDOs, documentos, relatorios, feedback, assinaturas e rotinas operacionais da Meta Construtor.

## Stack

- React 18 + Vite
- TypeScript
- Supabase Auth, Postgres, Storage e Edge Functions
- Vercel para frontend
- Stripe para checkout/assinaturas
- Sentry para monitoramento de frontend
- Resend para envio de e-mails transacionais de RDO

## Requisitos locais

- Node.js 18+
- npm
- Supabase CLI autenticado e linkado ao projeto correto
- Vercel CLI autenticado no projeto correto

## Setup local

```powershell
npm install
Copy-Item .env.example .env
```

Preencha `.env` com valores de desenvolvimento. Nao versione `.env*`.

## Comandos principais

```powershell
npm run dev
npm run lint
npm run test
npm run build
npm run preview
```

## Release de producao

Antes de divulgar uma versao, execute:

```powershell
npm run lint
npm run test
npm run build
npx vercel env ls production
npx supabase secrets list
npx vercel deploy --prod --yes
```

Depois do deploy, validar pelo menos:

- `https://www.metaconstrutor.app.br/home`
- `https://www.metaconstrutor.app.br/login`
- `https://www.metaconstrutor.app.br/checkout?plan=basic`
- Login/cadastro por e-mail
- Criacao de obra
- Criacao, envio, aprovacao/rejeicao e PDF de RDO
- Feedback autenticado
- Exportacao de relatorio
- Sentry recebendo evento controlado

## Operacao

- Checklist de release: `docs/RELEASE_CHECKLIST.md`
- Operacao, variaveis e deploy: `docs/OPERATIONS.md`
- Runbook de incidente: `docs/RUNBOOK_INCIDENT_RESPONSE.md`
- Evidencias recentes: `docs/evidence/`
- Plano atual: `PRD.md`

## Regras importantes

- Nunca publicar segredos em arquivos versionados.
- `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente em backend, Edge Functions ou ambiente local de teste controlado.
- Migrations remotas devem ser aplicadas de forma controlada e documentada.
- Para schema remoto com drift, preferir migracao pontual ou `supabase db query --linked --file <arquivo.sql>` com backup/evidencia antes de qualquer mudanca.
