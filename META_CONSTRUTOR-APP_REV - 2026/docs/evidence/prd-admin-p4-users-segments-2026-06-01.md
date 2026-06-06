# PRD_ADMIN - Evidencia P4 usuarios, segmentos e drill-down

Data: 2026-06-01

## Escopo executado

- Reestruturado `src/components/admin/AdminUsers.tsx` para trabalhar com segmentos de usuarios e drill-down.
- Removido enriquecimento N+1 por linha; a tela agora consulta em lote:
  - `admin_users_view`;
  - `admin_user_segments_view`;
  - `admin_churn_risk_view`;
  - `user_credits`;
  - `org_members`;
  - `subscriptions`.
- Adicionados KPIs de usuarios no recorte, ativos 7 dias, usuarios em risco e pagantes/trial.
- Adicionados filtros locais por plano, role, atividade, risco e status, combinados aos filtros globais do Admin.
- Adicionado detalhe de usuario com:
  - perfil;
  - plano;
  - roles;
  - creditos;
  - risco;
  - orgs vinculadas;
  - timeline recente de eventos;
  - auditoria administrativa recente.
- Mantidas acoes administrativas de alterar plano, alterar creditos e suspender usuario.
- Exportacao de CSV por segmento agora respeita limite de 500 linhas e registra `EXPORT_USERS_SEGMENT` em `admin_audit_logs`.

## Validacoes executadas

```powershell
npx.cmd tsc --noEmit --pretty false
```

Resultado: passou sem erros.

```powershell
npx.cmd eslint src/components/admin/AdminUsers.tsx
```

Resultado: passou sem erros ou warnings no arquivo tocado.

```powershell
npm.cmd run build
```

Resultado: passou; `tsc -b`, `vite build`, sitemap e prerender de 15 rotas publicas concluidos. Warnings restantes sao os ja existentes de CSS deprecated e import dinamico/estatico do Supabase.

## Pendencias remanescentes

- Validar com sessao real de admin a renderizacao da aba Usuarios contra o Supabase remoto.
- Adicionar fluxo de reativacao de usuario quando houver contrato seguro equivalente ao `suspend-user`.
- Adicionar cupons/referrals no detalhe de usuario quando houver relacao confiavel entre cupom/referral e `user_id`.
- Validar exportacao em runtime e confirmar registro em `admin_audit_logs`.
