# PRD_ADMIN - P4 suspensao e reativacao de usuario

Data: 2026-06-02

## Escopo executado

- `src/components/admin/AdminUsers.tsx` usa a Edge Function `suspend-user` para suspender e reativar usuarios.
- O payload envia `action: "suspend"` ou `action: "unsuspend"`.
- A UI exige motivo em textarea antes de confirmar a acao.
- O backend registra auditoria como `SUSPEND_USER` ou `UNSUSPEND_USER` em `admin_audit_logs`.

## Contrato backend validado

- `supabase/functions/suspend-user/index.ts` aceita `action?: "suspend" | "unsuspend"`.
- A funcao altera o status de acesso e grava auditoria administrativa.

## Validacao

- `npx.cmd eslint src/components/admin/AdminUsers.tsx` passou na rodada original.
- `npx.cmd tsc --noEmit --pretty false` passou apos os incrementos admin de 2026-06-02.

## Observacao

Este arquivo de evidencia foi recriado porque o artefato local estava corrompido por bytes nulos durante a validacao do PRD_ADMIN.
