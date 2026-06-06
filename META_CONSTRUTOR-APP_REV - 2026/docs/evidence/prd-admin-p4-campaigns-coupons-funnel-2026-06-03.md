# PRD_ADMIN - P4 campanhas/cupons conectados ao funil

Data: 2026-06-03

## Escopo executado

- Atualizado `src/components/admin/AdminCoupons.tsx`.
- A aba `Campanhas` do painel admin agora combina:
  - CRUD de cupons em `coupons`;
  - KPIs de cupons ativos, usos, eventos de cupom, conversao de checkout e eventos por campanha;
  - tabela de campanhas/ref sources baseada em `admin_campaign_performance_view`;
  - funil diario baseado em `admin_funnel_daily_view`;
  - filtros globais de periodo, campanha e origem via `useAdminFilters`.

## Auditoria

As acoes administrativas de cupom agora registram `admin_audit_logs`:

- `CREATE_COUPON`
- `ACTIVATE_COUPON`
- `DEACTIVATE_COUPON`
- `DELETE_COUPON`

Os detalhes incluem `coupon_id`, `coupon_code` e `source: "admin_campaigns_coupons"`.

## Contratos usados

- `coupons`
- `admin_campaign_performance_view`
- `admin_funnel_daily_view`
- `admin_audit_logs`

Nao houve DDL nem migration nesta rodada.

## Validacao

- `npx.cmd eslint src/components/admin/AdminCoupons.tsx` passou.
- `npx.cmd tsc --noEmit --pretty false` passou.
- `npm.cmd run build` passou. Warnings remanescentes: `color-adjust` deprecated em CSS e aviso Vite sobre import dinamico/estatico do cliente Supabase.
