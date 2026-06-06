# PRD_USUARIO - Ciclo 5 Complementar - Checklists

Data: 2026-06-01
Executor: Codex
Ambiente: local `http://127.0.0.1:5173`
Script: `scripts/prd-usuario-ciclo5-checklist-complementar-smoke.mjs`

## Escopo validado

- Login com Administrador e Colaborador temporarios.
- Organizacao, creditos, assinatura, obra e membros seedados com isolamento por `org_id`.
- Criacao de checklist do zero com dois itens manuais.
- Responsavel do checklist resolvido a partir dos membros da organizacao.
- Busca textual e filtro de categoria na listagem.
- Edicao de checklist em aberto com persistencia de titulo/descricao.
- Alteracao de status de item para `Não conforme` e `Não aplicável`.
- Progresso de checklist fechando 100% ao considerar estados terminais.
- Finalizacao de checklist para `Em Andamento`.
- Exportacao PDF acionando `generate-checklist-pdf` com resposta simulada, sem entrega externa real.
- Aprovacao com assinatura digital via `approve-checklist` interceptada e persistida no backend.
- Reabertura limpando assinatura e retornando para `Rascunho`.
- Reprovacao alterando status para `Pendente`.
- Colaborador sem permissao bloqueado no detalhe restrito do checklist.
- Limpeza dos dados temporarios ao fim de cada execucao.

## Execucoes responsivas

| Dispositivo | Viewport | Run ID | Resultado |
| --- | --- | --- | --- |
| PC | 1440x900 | `1780364921203` | Passou, sem erros de console ou rede |
| Tablet | 820x1180 | `1780364981566` | Passou, sem erros de console ou rede |
| Mobile | 390x844 | `1780364981548` | Passou, sem erros de console ou rede |

## Comandos executados

```powershell
$env:DEVICE_NAME='PC'; $env:VIEWPORT_WIDTH='1440'; $env:VIEWPORT_HEIGHT='900'; node scripts/prd-usuario-ciclo5-checklist-complementar-smoke.mjs
$env:DEVICE_NAME='Tablet'; $env:VIEWPORT_WIDTH='820'; $env:VIEWPORT_HEIGHT='1180'; node scripts/prd-usuario-ciclo5-checklist-complementar-smoke.mjs
$env:DEVICE_NAME='Mobile'; $env:VIEWPORT_WIDTH='390'; $env:VIEWPORT_HEIGHT='844'; node scripts/prd-usuario-ciclo5-checklist-complementar-smoke.mjs
npm.cmd run build
```

## Correcoes realizadas

- Reuso do formulario de checklist para edicao.
- Criacao de mutation `updateChecklist` com sincronizacao de itens.
- Criacao de mutation `updateChecklistStatus` para finalizar, reabrir e reprovar.
- Inclusao de status `Não conforme` no tipo de item e no fluxo de detalhe.
- Progress calculado por estados terminais: `Concluído`, `Não conforme`, `Não aplicável`.
- Guard/fallback de `activeOrgId` para evitar inserts com UUID vazio durante boot do contexto de organizacao.
- Fallback de responsavel do checklist para usuario autenticado quando a lista de membros ainda nao esta visivel.
- Acessibilidade de selects por `aria-label` para automacao estavel.
- Migração `20260602013807_allow_checklist_item_nao_conforme_status.sql` criada e DDL aplicada no Supabase remoto via `npx supabase@2.104.0 db query --linked --file ...`.

## Observacoes de banco

`supabase db push` pelo CLI global falhou por incompatibilidade com `db.major_version = 17`. O CLI atual via `npx supabase@2.104.0` conectou, mas `db push` encontrou historico remoto ausente local (`20260215`). Para nao misturar reparo de historico com a correcao funcional, a DDL desta migracao foi aplicada por `db query --linked` e o arquivo de migracao ficou versionado no repo.

## Build

`npm.cmd run build` passou com sucesso.

Avisos restantes do build:

- `color-adjust` depreciado em CSS de print existente.
- Aviso de chunking por import dinamico/estatico do cliente Supabase existente.

## Pendencias de P0.6 que permanecem abertas

- Filtros completos por obra, status, responsavel e periodo.
- Validacao de envio real de e-mail de checklist permanece fora do escopo obrigatorio.
