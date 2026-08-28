# SISTEMA_GESTAO_MULTIAGENTE — Empresa 2 (PMO)

Data de ativação: 2026-08-28
Modelo: **Empresa 2** (gestão/PMO/PO) governa a **Empresa 1** (execução técnica). Fonte de verdade absoluta: `PRD_MESTRE.md`.

## Regra de ouro

1. O **PRD_MESTRE** define O QUE deve existir.
2. A **Empresa 2** define QUANDO e EM QUE ORDEM será construído.
3. A **Empresa 1** define COMO implementar tecnicamente.
4. O **QA** verifica SE realmente funciona.
5. A **Empresa 2** decide SE a atividade pode ser considerada **DONE**.

## Papéis da Empresa 2

| Papel | Responsabilidade |
|---|---|
| Product Manager | Interpretar o PRD, identificar lacunas e prioridade estratégica |
| Technical Planner | Complexidade, dependências, riscos, dividir tarefas grandes |
| Task Architect | Requisito → tarefa específica, verificável e escopada |
| Priority | P0/P1/P2/P3 = Impacto + Urgência + Dependências + Risco + Valor |
| Scheduler | Decidir quando despachar (dinâmico) |
| Supervisor | Acompanhar progresso, status, evidências e bloqueios |
| Auditor | Verificar conformidade com o PRD, sem regressão, aceite cumprido |

## Ciclo de vida da tarefa

```
BACKLOG → READY → IN_EXECUTION → IMPLEMENTED → VALIDATING → DONE
                                        └────────────→ QA_FAILED → nova task de correção
```

`IMPLEMENTED` (Empresa 1 afirma que terminou) **≠** `DONE` (Empresa 2 validou contra o PRD).

## Board — BACKLOG EXECUTÁVEL (inicial, derivado do PRD_MESTRE)

| TASK | Atividade | Fonte | Prior. | Compl. | Deps | Status |
|---|---|---|---|---|---|---|
| TASK-001 | Deploy Vercel: package.json no HEAD do master | PRD_DEPLOY_VERCEL | P0 | M | — | IMPLEMENTADO (a33bb2a) — mas revelou causa real: `rootDirectory: null` |
| TASK-002 | Deploy Vercel: setar `rootDirectory = "META_CONSTRUTOR-APP_REV - 2026"` + deploy fresco | PRD_DEPLOY_VERCEL | P0 | S | — | READY (requer dashboard Vercel ou token) |
| TASK-003 | FALSO-055: corrigir métricas hardcoded em `pages-gemini/` | PRD_falso | P1 | M | — | DONE (build ✓; nova onda além do fix 07/31; não-commitado, aguarda deploy) |
| TASK-004 | Cupons P0: Admin CRUD + validação no checkout | PRD_CUPOM | P0 | L | schema/Stripe | DONE (git 404f76b "P0 resolvido") — validar QA |
| TASK-005 | Cupons P1/P2: sync Stripe + testes e2e | PRD_CUPOM | P1 | M | TASK-004 | DONE (git 2f48710 P1, e91dbb0/0504969 P2) — validar QA |
| TASK-006 | Admin: filtros globais (período/plano/role/campanha/origem/rota/org) | PRD_ADMIN | P1 | M | — | BACKLOG |
| TASK-007 | Admin: instrumentar CTAs + signup/login + checkout + cupom | PRD_ADMIN | P1 | M | — | BACKLOG |
| TASK-008 | Homologação usuário (pendências P1: senha, MFA, avatar, perfil, checklists) | PRD_USUARIO | P1 | L | — | BACKLOG |
| TASK-009 | Dashboard principal inspirado no Canva | PRD_DASHBOARD | P2 | L | — | BACKLOG |
| TASK-010 | Lixeira / soft delete (30 dias) | PRD_LIXEIRA | P2 | L | schema | BACKLOG |
| TASK-011 | SEO: prerender + reestrutura visual pública | PRD_SEO | P2 | M | — | BACKLOG |
| TASK-012 | Agrupamento RDO por dia/nicho | PRD_AGENDAS_RDO | P2 | M | — | BACKLOG |
| TASK-013 | VPS + n8n + WhatsApp (Fases 4-5) | PRD_INTEGRACAO_VPS_N8N_WHATSAPP | Bloqueante | XL | usuário | BLOQUEADO (usuário) |
| TASK-014 | Fix 2 erros de lint pré-existentes (`no-useless-escape` em `supabase/functions/whatsapp-integration/index.ts`) | PRD.md (gates) | P1 | XS | — | BACKLOG |
| TASK-015 | Prevenção: lint/CI que bloqueie claims numéricas/social-proof sem fonte (padrão recorrente FALSO-036→055→056) | PRD_falso | P2 | M | — | BACKLOG |

## Regras de entrega

- **Just-in-time**: enviar só quando há capacidade/dependência liberada; nunca despejar o backlog.
- **Lotes pequenos**; **WIP** limitado (priorizar conclusão).
- **Janela de monitoramento** (não é prazo): XS 5min · S 10min · M 15-20min · L/XL 30min+.
- **Layout**: tarefa funcional não justifica redesenho de UI; alterar só o previsto no requisito.

## Formato de feedback (QA_FAILED)

```
TASK | STATUS=QA_FAILED | PROBLEMA | REQUISITO VIOLADO | COMPORTAMENTO ESPERADO |
COMPORTAMENTO ATUAL | CAUSA PROVÁVEL | CORREÇÃO SOLICITADA | LAYOUT A PRESERVAR |
CRITÉRIO DE ACEITE | NOVA VALIDAÇÃO (obrigatória)
```

## Mapeamento Hermes

- **Empresa 2** = orquestrador (agente principal) exercendo os papéis acima.
- **Empresa 1** = `delegate_task` (subagentes **leaf**), `goal` + `context` completos em pt-BR.
- "DONE" exige evidência recuperável (lint/test/build, URL/ID, output) — nunca auto-relato.
- Áreas disjuntas em paralelo; **git/deploy sempre sequencial e isolado**.
