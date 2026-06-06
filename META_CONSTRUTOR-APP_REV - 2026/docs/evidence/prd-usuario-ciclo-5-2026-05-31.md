# PRD_USUARIO - Ciclo 5 - Checklists

Data: 2026-05-31
Executor: Codex
Ambiente: local `http://127.0.0.1:5173`
Script: `scripts/prd-usuario-ciclo5-checklist-smoke.mjs`

## Escopo validado

- Login autenticado com usuario temporario e organizacao temporaria.
- Criacao de obra seedada e visivel por RLS para o usuario autenticado.
- Criacao de checklist a partir de template padrao.
- Vinculo do checklist com obra real no backend.
- Responsavel selecionado a partir de membro ativo da organizacao, usando `auth.users.id`.
- Listagem e busca textual do checklist criado.
- Abertura do detalhe por rota dinamica `/app/checklist/:id`.
- Marcacao de item como concluido com persistencia em `checklist_items`.
- Observacao de item com persistencia em `checklist_items.observacoes`.
- Upload de evidencia/anexo de item com persistencia em `documentos` e storage.
- Reload da pagina preservando item, observacao e anexo.
- Limpeza dos dados temporarios apos cada execucao.

## Execucoes responsivas

| Dispositivo | Viewport | Run ID | Resultado |
| --- | --- | --- | --- |
| PC | 1440x900 | `1780245480475` | Passou, sem erros de console ou rede |
| Tablet | 820x1180 | `1780245508800` | Passou, sem erros de console ou rede |
| Mobile | 390x844 | `1780245538598` | Passou, sem erros de console ou rede |

## Comandos executados

```powershell
$env:DEVICE_NAME='PC'; $env:VIEWPORT_WIDTH='1440'; $env:VIEWPORT_HEIGHT='900'; node scripts/prd-usuario-ciclo5-checklist-smoke.mjs
$env:DEVICE_NAME='Tablet'; $env:VIEWPORT_WIDTH='820'; $env:VIEWPORT_HEIGHT='1180'; node scripts/prd-usuario-ciclo5-checklist-smoke.mjs
$env:DEVICE_NAME='Mobile'; $env:VIEWPORT_WIDTH='390'; $env:VIEWPORT_HEIGHT='844'; node scripts/prd-usuario-ciclo5-checklist-smoke.mjs
npm.cmd run build
```

## Correcoes realizadas

- Corrigido o preenchimento de responsavel de checklists para usar membros ativos da organizacao, evitando gravar `equipes.id` em `checklists.responsavel_id`.
- Corrigida a listagem/estatistica de responsaveis de checklists para usar os mesmos membros ativos da organizacao.
- Corrigido DOM invalido no card de checklist, removendo `p/div/p` dentro de `CardDescription`.
- Estabilizado smoke de checklist com retry em selects e alvo fixado pelo item do template.

## Build

`npm.cmd run build` passou com sucesso.

Avisos restantes do build:

- `color-adjust` depreciado em CSS de print existente.
- Aviso de chunking por import dinamico/estatico do cliente Supabase existente.

## Pendencias de P0.6 que permanecem abertas

- Criar checklist do zero.
- Preencher estados alem de concluido, como conforme/nao conforme/nao aplicavel, se suportados pela regra atual.
- Editar checklist em aberto.
- Finalizar checklist.
- Aprovar checklist com papel autorizado.
- Reprovar ou reabrir checklist quando disponivel.
- Filtros completos por obra, status, responsavel e periodo.
- PDF/exportacao de checklist.
- Bloqueio de acoes para papel sem permissao.
