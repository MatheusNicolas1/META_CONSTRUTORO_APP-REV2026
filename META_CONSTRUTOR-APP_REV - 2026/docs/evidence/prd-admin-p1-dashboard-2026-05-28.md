# PRD_ADMIN P1 - reestruturacao inicial do Admin

Data: 2026-05-28
Escopo: continuacao da execucao do `PRD_ADMIN.md` apos P0.

## Alteracoes aplicadas

- `src/pages/AdminDashboard.tsx`
  - Troca da IA antiga por 12 abas: Visao geral, Aquisicao, Ativacao, Engajamento, Retencao, Receita, Usuarios, Organizacoes, Rotas, Campanhas, Saude e Auditoria.
  - `AdminOperationalMetrics` deixou de ser a primeira tela e passou a ficar em `Ativacao`.
  - `AdminManagers` foi movido para `Auditoria`, condicionado a permissao de gerenciamento.

- Novos componentes:
  - `src/components/admin/AdminMetricCard.tsx`
  - `src/components/admin/AdminOverviewMetrics.tsx`
  - `src/components/admin/AdminRoutesMetrics.tsx`
  - `src/components/admin/AdminRetentionMetrics.tsx`
  - `src/components/admin/AdminRevenueMetrics.tsx`
  - `src/components/admin/AdminOrganizationsMetrics.tsx`
  - `src/components/admin/AdminAuditLogs.tsx`

- `src/components/admin/AdminOperationalMetrics.tsx`
  - Reclassificado como `Ativacao e uso operacional`.
  - Obras, RDOs, colaboradores e equipamentos passam a ser tratados como sinal de ativacao/uso, nao como KPI principal do Admin.

## Fontes de dados usadas

- `admin_funnel_daily_view`
- `admin_route_metrics_view`
- `admin_user_segments_view`
- `admin_user_activity_summary_view`
- `subscriptions`
- `plans`
- `coupons`
- `orgs`
- `org_members`
- `admin_audit_logs`

## Validacao

```powershell
npm.cmd run build
```

Resultado:

- Build concluido com sucesso.
- Warnings residuais ja conhecidos: `color-adjust` deprecated e import dinamico/estatico misto de `src/integrations/supabase/client.ts`.

## Pendencias

- Criar filtros globais por periodo, plano, role, campanha, origem, rota e org.
- Instrumentar eventos anonimos/marketing no P2.
- Completar views especificas de org usage, campaign performance, checkout funnel e churn risk.
- Fazer validacao visual em navegador autenticado.
