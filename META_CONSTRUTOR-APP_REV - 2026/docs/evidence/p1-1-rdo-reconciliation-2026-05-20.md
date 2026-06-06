# P1.1 - Reconciliacao do fluxo de RDO

Data/hora: 2026-05-20 23:05 -03:00

## Objetivo

Corrigir o bloqueio No-Go de RDO identificado no smoke de producao: o app criava RDO com `status='DRAFT'`, mas o remoto aceitava apenas os estados legados em portugues no constraint `rdos_status_check`.

## Schema remoto

Estado antes:

```text
rdos_status_check = status IN ('Em elaboracao', 'Aguardando aprovacao', 'Aprovado', 'Rejeitado')
status existentes = 23 x 'Em elaboracao', 1 x 'Aprovado'
colunas novas ausentes = approved_by, approved_at, rejection_reason
```

Migration criada:

```text
supabase/migrations/20260521014938_reconcile_rdos_status_approval.sql
```

Primeira aplicacao falhou porque a normalizacao para `DRAFT` ocorreu antes de remover a constraint antiga. A migration foi corrigida para:

1. adicionar colunas novas se ausentes;
2. copiar dados dos campos legados;
3. remover `rdos_status_check`;
4. normalizar estados legados para `DRAFT/SUBMITTED/APPROVED/REJECTED`;
5. recriar `rdos_status_check` com os quatro estados canonicos;
6. definir default `status='DRAFT'`.

Comando aplicado no remoto:

```powershell
npx supabase db query --linked --file supabase\migrations\20260521014938_reconcile_rdos_status_approval.sql
npx supabase migration repair --linked --status applied 20260521014938
```

Validacao remota apos aplicacao:

```text
status existentes = 23 x DRAFT, 1 x APPROVED
status default = 'DRAFT'::text
rdos_status_check = status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')
colunas presentes = approved_by, approved_at, rejection_reason
```

Observacao: `npx supabase migration up --local` continua bloqueado por drift antigo `20260215`, ja conhecido e fora do escopo desta correcao. Por isso a alteracao foi aplicada de forma pontual no remoto.

## Edge Functions

Funcoes implantadas:

```powershell
npx supabase functions deploy approve-rdo update-rdo-status --use-api
```

Mudancas principais:

- `approve-rdo` agora executa a aprovacao/rejeicao diretamente.
- Aceita `rdo_id`, `action='approve'|'reject'` e `rejection_reason`.
- Exige `rejection_reason` em rejeicao.
- Exige usuario autenticado e role `Presidente`, `Administrador` ou `Gerente`.
- Exige RDO em `SUBMITTED` para aprovar/rejeitar.
- Atualiza campos canonicos e legados: `approved_by`, `approved_at`, `rejection_reason`, `aprovado_por_id`, `data_aprovacao`, `motivo_rejeicao`.
- Cria notificacao para o criador do RDO.
- `update-rdo-status` foi alinhada para nao gravar estados legados que violariam a nova constraint.

## Frontend

Arquivos atualizados:

- `src/types/rdo.ts`
- `src/types/supabase-rdo.ts`
- `src/integrations/supabase/types.ts`
- `src/pages/RDO.tsx`
- `src/pages/RDOVisualizar.tsx`
- `src/components/rdo/RDOApprovalSection.tsx`
- `src/hooks/useUserPermissions.ts`

Comportamento:

- Criacao segue usando `DRAFT`.
- Envio para aprovacao segue usando `SUBMITTED`.
- Visualizacao normaliza estados legados e canonicos.
- Aprovador ve acoes quando o status esta `SUBMITTED`.
- Rejeicao exige motivo e mostra o motivo no RDO rejeitado.
- Exportacao continua liberada para `APPROVED`/`Aprovado`.

## Testes executados

Build:

```powershell
npm run build
```

Resultado: sucesso. Warnings existentes de Vite sobre CSS/chunk size/import dinamico.

Lint:

```powershell
npm run lint
```

Resultado: `0 errors`, `34 warnings` existentes de hooks/fast refresh.

Teste funcional remoto com usuario QA:

```text
usuario = qa.prd.p1.1.1779307585003@example.com
user_id = 397e6fed-1587-4eb0-9fb1-12ab4cfd74ff
org_id = bd596524-4d53-49b1-9bc7-17efa2ee295d
role = Administrador
obra_id = 2bb2da5d-2f7e-446e-aff4-c695d1884706
```

Resultados:

```json
{
  "approved_rdo": {
    "id": "239178fe-b8a1-45ed-b029-4effe0e11668",
    "initial_status": "SUBMITTED",
    "final_status": "APPROVED",
    "approved_by": "397e6fed-1587-4eb0-9fb1-12ab4cfd74ff",
    "legacy_fields_synced": true
  },
  "rejected_rdo": {
    "id": "e2f8a06f-8345-4745-815d-961ab9893418",
    "initial_status": "SUBMITTED",
    "final_status": "REJECTED",
    "rejection_reason": "QA rejeicao obrigatoria 1779328782464",
    "legacy_fields_synced": true
  },
  "notifications": [
    "RDO aprovado",
    "RDO rejeitado"
  ]
}
```

Evidencia visual:

```text
C:\Users\nicol\AppData\Local\Temp\meta-construtor-rdo-rejected-flow-2026-05-20.png
```

## Decisao

O bloqueio de RDO foi resolvido no schema remoto, nas Edge Functions e no frontend local. O frontend nao foi redeployado para a Vercel nesta etapa para evitar publicar outras alteracoes locais nao relacionadas presentes no workspace.

Proxima acao recomendada:

1. Revisar diffs locais.
2. Fazer deploy de frontend quando o conjunto de alteracoes a publicar estiver controlado.
3. Retomar P1.1 a partir de PDF/envio/listagem de RDO ou dos proximos checks pendentes.
