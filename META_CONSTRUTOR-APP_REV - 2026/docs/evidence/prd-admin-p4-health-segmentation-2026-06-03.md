# PRD_ADMIN - Saude administrativa sem uptime ficticio

Data: 2026-06-03

## Escopo executado

- `src/components/admin/AdminHealthMetrics.tsx` foi reestruturado para diferenciar saude de Produto, Tracking e Operacao.
- A aba Saude nao exibe uptime estimado ou valor hardcoded.
- Produto valida leitura de `profiles` e `orgs`.
- Tracking valida leitura de `user_activity`, `user_interactions`, `analytics_events` e a ultima ingestao registrada em `analytics_events`.
- Operacao valida `admin_audit_logs` e invoca a Edge Function real `health-check`.
- `src/components/admin/adminHealth.ts` centraliza a agregacao de checks em helper testavel.

## Contrato funcional

- `health-check` e usado como sinal operacional sem chamar Edge Functions com efeitos colaterais, como checkout, convite ou suspensao de usuario.
- A resposta operacional mostra `status`, fila Stripe e erros Stripe quando retornados pela Edge Function.
- O refetch automatico foi reduzido para 5 minutos para evitar pressao desnecessaria em checks administrativos e rate limit da propria `health-check`.
- Sentry/log drain externo nao foi marcado como conectado porque nao ha contrato local configurado no repositorio para este PRD.

## Validacao

- `npx.cmd eslint src/components/admin/AdminHealthMetrics.tsx src/components/admin/adminHealth.ts src/components/admin/__tests__/adminHealth.test.ts`: passou.
- `npx.cmd vitest run src/components/admin/__tests__/adminHealth.test.ts`: passou com 1 arquivo e 3 testes.
- `npx.cmd tsc --noEmit --pretty false`: passou.
- `npm.cmd run build`: passou; permanecem apenas warnings conhecidos de `color-adjust` e import dinamico/estatico do Supabase.

## Itens fechados

- `AdminHealthMetrics` usava placeholder `uptime: 99.9`.
- `Remover uptime: 99.9 hardcoded`.
- `Usar Sentry/Supabase logs/health-check real quando disponivel`, no limite do `health-check` existente.
- `Diferenciar saude de produto, saude de tracking e saude operacional`.
