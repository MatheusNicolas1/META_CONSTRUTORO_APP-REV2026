# PRD_ADMIN - P5 validacao de exportacao e auditoria

Data: 2026-06-03

## Escopo executado

- Extraido contrato de exportacao de usuarios para `src/components/admin/adminUsersExport.ts`.
- `src/components/admin/AdminUsers.tsx` continua exportando o segmento atual, mas agora usa helpers testaveis para:
  - gerar CSV;
  - limitar exportacao a 500 usuarios;
  - montar `details` da auditoria `EXPORT_USERS_SEGMENT`.
- Criado `src/components/admin/__tests__/adminUsersExport.test.ts`.

## Contrato validado

- CSV possui colunas esperadas: `id,nome,email,empresa,plano,roles,atividade,risco,orgs,ultimo_evento`.
- Valores com aspas sao escapados corretamente.
- Roles e organizacoes sao serializados como lista legivel.
- Payload de auditoria inclui:
  - `exported_count`;
  - `total_filtered`;
  - `limit: 500`;
  - filtros locais e globais usados na exportacao.

## Validacao

- `npx.cmd vitest run src/components/admin/__tests__/adminUsersExport.test.ts` passou com 1 arquivo e 3 testes.
- `npx.cmd eslint src/components/admin/AdminUsers.tsx src/components/admin/adminUsersExport.ts src/components/admin/__tests__/adminUsersExport.test.ts` passou.
- `npx.cmd tsc --noEmit --pretty false` passou.
- `npm.cmd run build` passou. Warnings remanescentes: CSS `color-adjust` deprecated e aviso Vite sobre import dinamico/estatico do cliente Supabase.

## Status PRD

Item P5 `Validar exportacao e trilha em admin_audit_logs` marcado como concluido.
