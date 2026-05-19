# Release Notes v1.0.0 MVP

Data: 2026-05-06

## Funcionalidades principais

- RDO: criar, revisar, aprovar e baixar PDF.
- Relatorios: acompanhamento operacional e exportacao.
- Checklist: controle de execucao e aprovacao.
- CRUD: obras, equipes, equipamentos, fornecedores, documentos e despesas.
- Contato: envio de mensagens do site.
- Feedback: envio autenticado por `/app/feedback`.
- Monitoramento: Sentry habilitado por `VITE_SENTRY_DSN`.
- Analytics: PostHog opcional e eventos internos em `analytics_events`.

## Primeiros usuarios

1. Acesse `/login` e entre com seu usuario autorizado.
2. Abra `/app/rdo` e use `Novo RDO` para registrar o diario.
3. Preencha obra, atividades, equipe, equipamentos e observacoes.
4. Envie o RDO para aprovacao.
5. Um usuario com perfil Administrador, Gerente ou Presidente deve revisar e aprovar.
6. Baixe o PDF do RDO aprovado em `/app/rdo/:id/visualizar`.
7. Envie feedback pelo menu de usuario em `Enviar feedback`.

## Documentacao

- PRD5: `docs/PRD5.md`
- Relatorio final PRD5: `docs/RELATORIO_FINAL_CONFORMIDADE_PRD5.md`
- Checklist de release: `docs/RELEASE_CHECKLIST.md`
- Runbook de incidentes: `docs/RUNBOOK_INCIDENT_RESPONSE.md`
- Documentacao no app: `/documentacao`
