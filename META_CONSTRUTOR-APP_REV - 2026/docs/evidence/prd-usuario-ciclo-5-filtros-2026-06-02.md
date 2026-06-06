# PRD_USUARIO - Ciclo 5 - Filtros de Checklists

Data: 2026-06-02
Executor: Codex
Ambiente: local `http://127.0.0.1:5173`
Script: `scripts/prd-usuario-ciclo5-checklist-filtros-smoke.mjs`

## Escopo validado

- Login com Administrador temporario.
- Organizacao, plano temporario de QA, assinatura, duas obras, membros e seis checklists seedados com isolamento por `org_id`.
- Listagem inicial exibindo registros concorrentes com diferencas controladas de obra, status, responsavel, periodo e categoria.
- Filtro por obra ocultando checklist de outra obra.
- Filtro por status ocultando checklist de status diferente.
- Filtro por responsavel ocultando checklist de outro responsavel.
- Filtro por periodo usando `data_vencimento` com `gte/lte`.
- Filtro por categoria preservado como regressao da cobertura anterior.
- Filtros combinados por obra, status, responsavel, categoria e periodo retornando apenas o checklist alvo.
- Limpeza dos dados temporarios ao fim de cada execucao.

## Execucoes responsivas

| Dispositivo | Viewport | Run ID | Resultado |
| --- | --- | --- | --- |
| PC | 1440x900 | `1780411476693` | Passou, sem erros de console ou rede |
| Tablet | 768x1024 | `1780411498253` | Passou, sem erros de console ou rede |
| Mobile | 390x844 | `1780411519493` | Passou, sem erros de console ou rede |

## Comandos executados

```powershell
npm.cmd run build
$env:DEVICE_NAME='PC'; $env:VIEWPORT_WIDTH='1440'; $env:VIEWPORT_HEIGHT='900'; node scripts/prd-usuario-ciclo5-checklist-filtros-smoke.mjs
$env:DEVICE_NAME='Tablet'; $env:VIEWPORT_WIDTH='768'; $env:VIEWPORT_HEIGHT='1024'; node scripts/prd-usuario-ciclo5-checklist-filtros-smoke.mjs
$env:DEVICE_NAME='Mobile'; $env:VIEWPORT_WIDTH='390'; $env:VIEWPORT_HEIGHT='844'; node scripts/prd-usuario-ciclo5-checklist-filtros-smoke.mjs
```

## Correcoes realizadas

- `useChecklist` agora aplica `dateRange.start` e `dateRange.end` em `data_vencimento`.
- `/app/checklist` passou a expor o filtro `Periodo do prazo` com campos de data inicial e final.
- Filtros de categoria, status, obra e responsavel receberam `aria-label` para automacao estavel.
- O estado `Limpar Filtros` passou a considerar periodo ativo.
- Criado smoke dedicado para filtros completos de checklist em PC, tablet e mobile.

## Observacoes de banco e setup

O smoke cria um plano temporario de QA com `max_obras` numerico e o remove no cleanup. Isso foi necessario porque a trigger legada `enforce_max_obras_limit` trata `max_obras = null` como limite indeterminado, apesar dos planos comerciais ativos usarem `null` para ilimitado.

## Build

`npm.cmd run build` passou com sucesso.

Avisos restantes do build:

- `color-adjust` depreciado em CSS de print existente.
- Aviso de chunking por import dinamico/estatico do cliente Supabase existente.

## Resultado

P0.6 de Checklists ficou concluido para o escopo automatizavel: criacao por template, criacao do zero, vinculo com obra, responsavel, itens, observacoes, anexos, reload, edicao, finalizacao, PDF simulado, aprovacao, reabertura, reprovacao, permissoes e filtros completos em PC/tablet/mobile.
