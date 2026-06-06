# PRD_ADMIN - P4 detalhe de usuario com ultimos logins

Data: 2026-06-03

## Escopo executado

- `src/components/admin/AdminUsers.tsx` passou a carregar ultimos eventos de login no modal de detalhe do usuario.
- A consulta usa `analytics_events` filtrada por `user_id` e eventos `auth.user_identified` / `auth.login`.
- O componente nao consulta `auth.users` no cliente e nao depende de chave privilegiada para expor historico de login.
- A UI mostra apenas evento, origem, data e `session_id` truncado; nao renderiza `properties` brutas, e-mail, telefone, CPF/CNPJ ou endereco a partir de analytics.

## Contrato funcional

- O detalhe de usuario agora cobre perfil, orgs, roles, plano, creditos, risco, timeline de eventos, ultimos logins, auditoria administrativa, indicacoes, codigo/bonus de indicacao e eventos de cupom/campanha vinculados ao `user_id`.
- O evento `auth.user_identified` ja e emitido por `setAnalyticsSession` quando o usuario autenticado e identificado na sessao.
- `auth.login` foi mantido na consulta como compatibilidade futura caso o app passe a emitir um evento de login explicito.

## Validacao

- `npx.cmd eslint src/components/admin/AdminUsers.tsx`: passou.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens fechados

- P4: `Adicionar detalhe de usuario`.
- Criterio de aceite: `O detalhe do usuario mostra timeline de eventos sem expor PII em analytics`.
- Criterio de governanca: `Eventos de analytics nao gravam e-mail, telefone, CPF/CNPJ ou endereco`.
