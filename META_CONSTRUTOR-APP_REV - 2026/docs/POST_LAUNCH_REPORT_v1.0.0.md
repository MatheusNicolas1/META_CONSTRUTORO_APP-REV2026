# Relatorio Final Pos-Lancamento v1.0.0 MVP

Data: 2026-05-06

## Evidencias

- Tag criada e enviada: `v1.0.0-mvp`.
- Changelog criado: `CHANGELOG.md`.
- Release notes criadas: `RELEASE_NOTES_v1.0.0.md`.
- Sentry: inicializacao presente em `src/bootstrap.tsx` e `src/main_entry.tsx`; `VITE_SENTRY_DSN` nao esta definido em `.env` nem `.env.local`.
- Alerta Sentry simulado: `docs/evidence/sentry-alert-v1.0.0-mvp.svg`.
- Feedback: tabela `feedbacks` definida em `supabase/migrations/20260506014345_feedbacks_mvp.sql`.
- Feedback API: Edge Function `supabase/functions/send-feedback/index.ts`.
- Link de feedback: menu de usuario mostra `Enviar feedback`.
- Analytics: PostHog opcional em `src/integrations/analytics.ts`; tabela `analytics_events` existe em migrations.

## Monitoramento Sentry

Regra operacional simulada:

- Condicao: erros JavaScript em frequencia maior que 1 por minuto.
- Ambiente: producao.
- Destino: email do time.
- Status: pronto para configurar no painel real assim que o DSN e o projeto Sentry forem fornecidos.

## Feedback dos usuarios

O fluxo de feedback agora passa pela Edge Function `send-feedback`, que valida usuario autenticado, rating de 1 a 5 e grava em `public.feedbacks`.

Campos garantidos pela migration:

- `user_id`
- `rating`
- `comment`
- `created_at`

Campos de compatibilidade com a UI atual:

- `titulo`
- `tipo`
- `mensagem`
- `nota_satisfacao`
- `status`
- `updated_at`
- `org_id`

## Analytics basico

PostHog esta preparado via variaveis `VITE_POSTHOG_KEY` e `VITE_POSTHOG_HOST`. Eventos encontrados no codigo atual:

- `product.rdo_created`
- `product.rdo_submitted`
- `product.obra_created`
- `product.obra_updated`
- `product.obra_deleted`
- `product.attachment_uploaded`

Eventos solicitados para padronizacao futura:

- `login_success`
- `rdo_created`
- `rdo_approved`
- `report_download`

## Pendencias operacionais

- Configurar `VITE_SENTRY_DSN` real em producao.
- Criar a regra real no painel do Sentry e cadastrar emails do time.
- Padronizar nomes de eventos se o painel precisar exatamente dos nomes sem prefixo `product.`.
