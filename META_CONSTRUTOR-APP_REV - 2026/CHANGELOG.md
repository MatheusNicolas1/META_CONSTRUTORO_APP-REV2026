# Changelog

## v1.0.0-mvp - 2026-05-06

PRD5 concluido e MVP validado para lancamento inicial do Meta Construtor.

Escopo entregue:

- RDO: criacao, visualizacao, fluxo de aprovacao e geracao/download de PDF.
- Relatorios: visoes operacionais e exportacao para primeiros usuarios.
- Contato: fluxo publico de contato via `send-contact`.
- Checklist: checklist operacional com aprovacao via Edge Function.
- CRUD: obras, equipes, equipamentos, fornecedores, documentos, despesas e entidades principais do app.
- Monitoramento: Sentry inicializado quando `VITE_SENTRY_DSN` estiver configurado.
- Feedback: rota protegida `/app/feedback`, Edge Function `send-feedback` e migration da tabela `feedbacks`.
- Analytics basico: PostHog opcional via `VITE_POSTHOG_KEY` e tabela `analytics_events` para base interna.
