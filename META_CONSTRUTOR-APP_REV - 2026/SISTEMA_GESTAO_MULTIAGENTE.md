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

| TASK | Atividade | Fonte | Prior. | Status |
|---|---|---|---|---|
| TASK-001 | Deploy: package.json no HEAD + rootDirectory | PRD_DEPLOY_VERCEL | P0 | ✅ DONE (a33bb2a + rootDirectory) |
| TASK-002 | Deploy fresco produção | PRD_DEPLOY_VERCEL | P0 | ✅ DONE (usuário) |
| TASK-003 | FALSO-055: métricas hardcoded pages-gemini | PRD_falso | P1 | ✅ DONE (5667df5 + 0dc155e) |
| TASK-004 | Cupons P0 | PRD_CUPOM | P0 | ✅ DONE (404f76b) |
| TASK-005 | Cupons P1/P2 | PRD_CUPOM | P1 | ✅ DONE (2f48710..0504969 + dcd6a93) |
| TASK-006 | Admin: filtros globais (infra + 13 componentes) | PRD_ADMIN | P1 | ✅ DONE (0d836d8) |
| TASK-007 | Admin: CTAs/analytics | PRD_ADMIN | P1 | ✅ DONE (9e794f0) |
| TASK-008 | MFA + homologação usuário | PRD_USUARIO | P1 | ✅ DONE (7dc89ab) |
| TASK-009 | Dashboard Canva | PRD_DASHBOARD | P2 | ✅ DONE (5 ciclos, 2026-05-31) |
| TASK-010 | Lixeira soft delete | PRD_LIXEIRA | P2 | ✅ DONE (796eabb) |
| TASK-011 | SEO sitemap/prerender | PRD_SEO | P2 | ✅ DONE (e3e005a) |
| TASK-012 | RDO agrupamento dia/nicho + resumo via RPC Postgres + NumberTicker | PRD_AGENDAS_RDO | P2 | ✅ DONE (3a0afc1..70f1501) |
| TASK-013 | VPS + n8n + WhatsApp | PRD_INTEGRACAO_VPS_N8N_WHATSAPP | Bloqueante | ⏸️ PÓS-LANÇAMENTO (usuário adiou) |
| TASK-014 | Fix lint no-useless-escape | PRD.md | P1 | ✅ DONE (cc3a91b) |
| TASK-015 | Prevenção claims sem fonte | PRD_falso | P2 | ✅ DONE (6b98e97) |
| TASK-016 | Analytics eventos-padrão PostHog/GA4 | PLANO_LANCAMENTO P01#5 | P0 | ✅ DONE (970e98e; login/logout em AuthContext aguarda commit paralelo) |
| TASK-017 | Fix prerender: preço hardcoded na meta (SEO) | PLANO_LANCAMENTO P01#6 | P0 | ✅ DONE (481b9b8) |
| TASK-018 | Bundle: react-spline/physics já removidos; residual index 1,27MB (otimização) | PRD_AGENDAS_RDO pendência | P2 | ⬜ ABERTO (não-bloqueante) |
| TASK-019 | FALSO-057: preços desatualizados em generate-v2-pages.mjs | PRD_falso | P2 | ✅ DONE (bcd04b4) |
| TASK-020 | Google OAuth PKCE + "lembrar conta" | PLANO_LANCAMENTO P01#3 | P1 | 🔄 agente paralelo (5833172 + WIP) |

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
