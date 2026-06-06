# Resend - Envio de RDO por e-mail

Data: 2026-05-21

## Objetivo

Conectar o Meta Construtor ao Resend para habilitar o botao `Enviar por Email` na tela de visualizacao de RDO.

## Implementacao

- Secret cadastrado no Supabase:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL=onboarding@resend.dev`
  - `APP_URL=https://www.metaconstrutor.app.br`
- Edge Function criada e publicada:
  - `send-rdo-email`
  - JWT obrigatorio
  - Valida usuario autenticado
  - Valida membership ativa na organizacao do RDO
  - Envia e-mail via Resend API
- Frontend atualizado:
  - `src/pages/RDOVisualizar.tsx`
  - Botao `Enviar por Email` abre modal
  - Modal aceita destinatarios e mensagem opcional
  - Envio chama `/functions/v1/send-rdo-email`

## Deploys

- Supabase Function:
  - `npx supabase functions deploy send-rdo-email --use-api`
  - Projeto: `bgdvlhttyjeuprrfxgun`
- Frontend Vercel controlado por worktree limpa:
  - Deployment ID: `dpl_GHKCgvQAS29szevauoCuaMhbhBBx`
  - URL: `https://meta-construtor-app-rev-2026-p846bjuoo.vercel.app`
  - Alias: `https://www.metaconstrutor.app.br`

## Validacao

### Teste direto da Edge Function

- Usuario QA: `qa.prd.p1.1.1779307585003@example.com`
- RDO: `f880af81-e9bb-465a-a6ab-a3b3723daffe`
- Destinatario: `matheusnicolas.org@gmail.com`
- Resultado:
  - HTTP `200`
  - `success: true`
  - `email_id: d1578ad4-3ac8-4d11-a21f-0dc450f7cd3e`

### Teste pela UI em producao

URL validada:

- `https://www.metaconstrutor.app.br/app/rdo/f880af81-e9bb-465a-a6ab-a3b3723daffe/visualizar`

DOM observado:

- `RDO-2026-f880`
- `Rascunho`
- Botao `Enviar por Email`
- Modal `Enviar RDO por e-mail`
- Campo `Destinatarios`
- Campo `Mensagem opcional`

Resultado apos enviar:

- Toast/feedback: `RDO enviado por e-mail`
- Logs do navegador: sem erros recentes.

## Observacoes

- A chave do Resend nao foi gravada no repositorio.
- O remetente esta em `onboarding@resend.dev`, conforme instrucao inicial. Para envio de producao com dominio proprio, configurar dominio verificado no Resend e alterar `RESEND_FROM_EMAIL`.
- Este item corrige o bloqueio do botao `Enviar por Email`; o bloqueio separado de `Enviar RDO para aprovacao` continua pendente na UI.
