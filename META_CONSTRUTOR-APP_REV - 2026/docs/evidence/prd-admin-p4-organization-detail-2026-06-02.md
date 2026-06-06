# PRD_ADMIN - P4 detalhe de organizacao

Data: 2026-06-02

## Escopo executado

- Recriado `src/components/admin/AdminOrganizationsMetrics.tsx` apos o arquivo local estar corrompido por bytes nulos.
- O componente lista organizacoes com:
  - plano e status de assinatura;
  - membros ativos e totais;
  - total de eventos;
  - ultimo uso.
- O modal de detalhe mostra:
  - KPIs de membros, eventos, visualizacoes e interacoes;
  - dados base da organizacao;
  - plano/status de assinatura;
  - membros e roles;
  - eventos recentes por `org_id`.

## Contratos consultados

- `orgs`
- `org_members`
- `profiles`
- `subscriptions`
- `plans`
- `admin_org_usage_summary_view`
- `analytics_events`

## Validacao

- `npx.cmd eslint src/components/admin/AdminUsers.tsx src/components/admin/AdminOrganizationsMetrics.tsx` passou.
- `npx.cmd tsc --noEmit --pretty false` passou.
- `npm.cmd run build` ficou bloqueado por erro fora do escopo admin em `src/components/NovaObraForm.tsx:319`.

## Observacao de integridade

Durante a validacao, alguns arquivos locais estavam preenchidos por bytes nulos. `AdminOrganizationsMetrics.tsx` era untracked e sem conteudo recuperavel, por isso foi reconstruido a partir do contrato do PRD e dos tipos atuais do Supabase.
