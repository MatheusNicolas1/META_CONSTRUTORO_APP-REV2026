# PRD_USUARIO - Ciclo 3 Atividades

Data: 2026-06-04

## Escopo

Validar `/app/atividades` com dados reais temporarios, organizacao isolada e Supabase remoto.

## Ambiente

- App local: `http://127.0.0.1:5187`.
- Backend: Supabase remoto `bgdvlhttyjeuprrfxgun`.
- Script: `scripts/prd-usuario-ciclo3-atividades-busca-lixeira-smoke.mjs`.
- Viewports: PC `1440x900`, tablet `820x1180`, mobile `390x844`.
- Run ID aprovado: `1780587340107`.

## Correcoes aplicadas

- `src/pages/Atividades.tsx`: filtros estruturados por obra, status, prioridade, responsavel e periodo; busca por texto; acao de edicao; acao de Lixeira.
- `src/hooks/useActivitiesSupabase.ts`: leitura por organizacao com join de obra, filtros remotos, update por org e soft-delete via RPC `soft_delete_atividade`.
- `src/components/NovaAtividadeModal.tsx`: criacao passa a persistir status e prioridade informados no formulario.
- `supabase/migrations/20260604121500_prd_usuario_atividades_soft_delete_rls.sql`: registra o contrato RLS/RPC para soft-delete de atividades mantendo itens excluidos fora da leitura normal.
- Remoto: RPC `public.soft_delete_atividade(uuid)` aplicado e validado via API autenticada.

## Resultado do smoke

- API `soft_delete_atividade`: persistiu `deleted_at`.
- PC, tablet e mobile:
  - lista inicial de atividades carregou dados reais;
  - busca por titulo passou;
  - busca por categoria passou;
  - busca por status passou;
  - filtro por obra passou;
  - filtro por status passou;
  - filtro por prioridade passou;
  - filtro por responsavel passou;
  - filtro por periodo passou;
  - exclusao pela UI moveu atividade para Lixeira com `deleted_at`, `deleted_by` e `delete_origin`;
  - item excluido saiu da lista apos reload/filtro.
- PC, tablet e mobile:
  - edicao persistiu `status=concluida` e `prioridade=media`.

## Saida final

- `consoleErrors`: vazio nos tres viewports.
- `failedResponses`: vazio nos tres viewports.
- Cleanup: atividades, obras, org_credits, subscriptions, plans, org_members, orgs, user/profile/settings/roles.

## Validacoes finais

- `node --check scripts/prd-usuario-ciclo3-atividades-busca-lixeira-smoke.mjs`: passou.
- `npx.cmd tsc -p tsconfig.app.json --noEmit`: passou.
- `npm.cmd run build`: passou; postbuild prerenderizou 18 rotas publicas.

## Observacoes de seguranca

- Durante consulta remota via Supabase CLI, o advisor retornou alerta critico informando RLS desabilitado em `public.audit_logs`. Nao foi alterado neste ciclo por estar fora do escopo de P0.4; deve entrar em ciclo proprio de seguranca/RLS.

## Pendencias restantes

- Data final de atividade segue pendente porque `public.atividades` possui apenas o campo `data` para agendamento.
- Validacao de calendario/dashboard/relatorio de atividades ainda nao foi executada neste smoke; a tela validada foi a lista `/app/atividades`.
