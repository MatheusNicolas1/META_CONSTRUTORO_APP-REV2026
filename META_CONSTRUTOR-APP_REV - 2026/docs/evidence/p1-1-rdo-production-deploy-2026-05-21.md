# P1.1 - Deploy frontend controlado do fluxo de RDO

Data/hora: 2026-05-21 11:08 -03:00

## Objetivo

Publicar o frontend com a correcao do fluxo de RDO sem carregar todos os diffs locais presentes no workspace principal.

## Metodo

Foi criada uma worktree temporaria a partir do `HEAD` limpo `c33bdf7931d376a52ebc732a6cc5f2de6fc9a010` e copiados apenas os arquivos necessarios ao fluxo de RDO:

- `src/components/rdo/RDOApprovalSection.tsx`
- `src/hooks/useRDOs.ts`
- `src/hooks/useUserPermissions.ts`
- `src/hooks/useSuccessFeedback.ts`
- `src/integrations/supabase/types.ts`
- `src/pages/RDO.tsx`
- `src/pages/RDOVisualizar.tsx`
- `src/pages/Relatorios.tsx`
- `src/types/rdo.ts`
- `src/types/supabase-rdo.ts`

Observacao: `src/pages/Relatorios.tsx` precisou entrar no pacote porque ainda lia `created_by`; o tipo `RDOSupabase` agora usa `criado_por_id`, alinhado ao schema remoto.

## Validacao pre-deploy

Na worktree temporaria:

```powershell
npm ci
npm run build
npm run lint
```

Resultados:

- `npm ci`: sucesso. `npm audit` reportou vulnerabilidades herdadas do lockfile (`7 moderate`, `5 high`, `2 critical`), sem alteracao automatica nesta etapa.
- `npm run build`: sucesso.
- `npm run lint`: sucesso com `0 errors` e `33 warnings` conhecidos de hooks/fast refresh.

## Deploy

Comando:

```powershell
npx vercel --prod --yes
```

Resultado:

```text
deployment_id = dpl_AtJGzsqyWXFb7MjrJ8SCQmfbwcri
deployment_url = https://meta-construtor-app-rev-2026-9h5say5lj.vercel.app
alias = https://www.metaconstrutor.app.br
status = READY
created = 2026-05-21 11:05:56 -03:00
```

Validacao Vercel:

```powershell
npx vercel inspect meta-construtor-app-rev-2026-9h5say5lj.vercel.app
```

Retorno confirmou:

- `target = production`
- `status = Ready`
- aliases:
  - `https://www.metaconstrutor.app.br`
  - `https://metaconstrutor.app.br`
  - `https://meta-construtor-app-rev-2026.vercel.app`

## Validacao remota

HTTP publico:

```text
GET https://www.metaconstrutor.app.br/home => 200
```

Banco remoto para RDOs de QA:

```json
[
  {
    "id": "239178fe-b8a1-45ed-b029-4effe0e11668",
    "status": "APPROVED",
    "approved_by": "397e6fed-1587-4eb0-9fb1-12ab4cfd74ff",
    "approved_at": "2026-05-21 01:59:33.403+00",
    "rejection_reason": null
  },
  {
    "id": "e2f8a06f-8345-4745-815d-961ab9893418",
    "status": "REJECTED",
    "approved_by": "397e6fed-1587-4eb0-9fb1-12ab4cfd74ff",
    "approved_at": "2026-05-21 01:59:34.506+00",
    "rejection_reason": "QA rejeicao obrigatoria 1779328782464"
  }
]
```

Validacao visual por DOM autenticado em producao:

```text
url = https://www.metaconstrutor.app.br/app/rdo/e2f8a06f-8345-4745-815d-961ab9893418/visualizar
title = Meta Construtor
hasRejected = true
hasReason = true
```

Trecho confirmado no DOM:

```text
heading "RDO-2026-e2f8 Rejeitado"
paragraph: RDO Rejeitado
strong: "Motivo:"
text: QA rejeicao obrigatoria 1779328782464
```

Tentativa de screenshot:

- O Browser carregou a pagina e confirmou o DOM.
- A captura de imagem falhou com timeout em `Page.captureScreenshot`.
- Evidencia visual local anterior do mesmo fluxo permanece em `C:\Users\nicol\AppData\Local\Temp\meta-construtor-rdo-rejected-flow-2026-05-20.png`.

## Decisao

Deploy frontend controlado concluido. O bloqueio de RDO esta resolvido em producao para schema, backend e interface publicada.
