# PLANO_SUBAGENTES_LANCAMENTO — Meta Construtor

Data: 2026-08-28
Objetivo: estruturar sub-agentes (`delegate_task`) para executar as atividades cruciais do lançamento, com paralelização segura e verificação por evidência (não por auto-relato).

## 1. Princípios

- 1 atividade = 1 sub-agente **leaf**, com `goal` + `context` completos (o sub-agente não conhece esta conversa e **não** pode perguntar ao usuário).
- "Feito" = **evidência objetiva** (lint/test/build passando, output verificado, URL/ID recuperável), nunca apenas a afirmação do agente.
- Áreas de arquivo disjuntas rodam em paralelo; qualquer coisa que mexe em git/deploy roda **antes** (ver §5).

## 2. Atividades cruciais (roadmap → sub-agente)

| # | Atividade | Fonte | Prior. | Agente |
|---|---|---|---|---|
| 1 | Corrigir métricas hardcoded em `pages-gemini/` (FALSO-055) | `PRD_falso.md` | P0 | A |
| 2 | Corrigir deploys UNKNOWN (master sem `package.json` no HEAD `b349e1b`) | `PRD_DEPLOY_VERCEL.md` | P0 | B |
| 3 | Implementar cupons (gaps P0/P1/P2 + sync Stripe) | `PRD_CUPOM.md` | P0 | C |
| 4 | Filtros globais + instrumentar CTAs (Admin/analytics) | `PRD_ADMIN.md` | P1 | D |
| 5 | Homologação do usuário (pendências P1) | `PRD_USUARIO.md` | P1 | E |
| 6 | Dashboard inspirado no Canva | `PRD_DASHBOARD.md` | P2 | F |
| 7 | Lixeira / soft delete (30 dias) | `PRD_LIXEIRA.md` | P2 | G |
| 8 | SEO: prerender + reestrutura visual pública | `PRD_SEO.md` | P2 | H |
| 9 | VPS + n8n + WhatsApp (Fases 4-5) | `PRD_INTEGRACAO_VPS_N8N_WHATSAPP.md` | Bloqueante | ❌ **usuário** |

## 3. Ondas de execução

- **Wave 0 (orquestrador):** `npm run lint` + `npm run test` + `npm run build` verdes e `git status` limpo antes de despachar qualquer agente.
- **Wave 1 (P0):** `B` **sozinho** (toca branch/deploy). Depois `A` + `C` **em paralelo**.
- **Wave 2 (P1):** `D` + `E` em paralelo.
- **Wave 3 (P2):** `F` + `G` + `H` em paralelo.

## 4. Especificação por sub-agente

### A — FALSO-055 (métricas hardcoded em `pages-gemini/`)
- **Goal:** Auditar `src/pages-gemini/` e substituir toda métrica/contador hardcoded por dado real (Supabase) ou estado vazio honesto.
- **Context:** `PRD_falso.md` §FALSO-055 (P1 reaberto 12/07). Regra do mestre: "sucesso visual sem persistência real é bug". MCPs disponíveis: `supabase` (consultar schema real), `firecrawl` (se precisar validar fonte externa).
- **Verificação:** `grep` por números mágicos em `pages-gemini/` zerado; `npm run lint && npm run build` verdes.

### B — Deploy Vercel (UNKNOWN)
- **Goal:** Diagnosticar e corrigir a causa raiz do deploy travado (branch master sem `package.json` no HEAD `b349e1b`), limpar cache e fazer deploy fresco em produção.
- **Context:** `PRD_DEPLOY_VERCEL.md` + `docs/PRD_DIAGNOSTICO_DEPLOY_VERCEL.md`. MCP `vercel` autorizado.
- **Verificação:** deploy Production OK; `https://www.metaconstrutor.app.br/home` HTTP 200.

### C — Cupons (Supabase + Stripe)
- **Goal:** Implementar os gaps P0/P1/P2: Admin CRUD de cupons, validação no checkout e sincronização com Stripe (`create-enterprise-checkout`).
- **Context:** `PRD_CUPOM.md`. MCPs `supabase` + `stripe` autorizados. Não criar mocks — validar contrato real.
- **Verificação:** `npm run lint && npm run test && npm run build`; e2e de aplicação de cupom no checkout.

### D — Admin/analytics
- **Goal:** Adicionar filtros globais (período/plano/role/campanha/origem/rota/org) e instrumentar CTAs públicos + signup/login + checkout + cupom em `analytics_events`.
- **Context:** `PRD_ADMIN.md` pendências. Preservar `analytics_events` como fonte canônica; evitar N+1.
- **Verificação:** eventos chegando em `analytics_events` (query real); ausência de PII.

### E — Homologação usuário
- **Goal:** Continuar a homologação do `PRD_USUARIO` nas pendências abertas (recuperação de senha, MFA, avatar, perfil completo, checklists), PC/tablet/mobile.
- **Context:** `PRD_USUARIO.md` §pendências. Reusar os smokes Playwright existentes (`scripts/prd-layout-*.spec.ts`).
- **Verificação:** novos specs Playwright passando; relatório de homologação atualizado no próprio PRD.

### F — Dashboard
- **Goal:** Construir o dashboard principal inspirado no Canva, preservando `SidebarProvider`/`SidebarTrigger`, acessibilidade e PWA, **sem dados fictícios**.
- **Context:** `PRD_DASHBOARD.md`. Verificar shape/layout antes de editar (regra do mestre §3.7).
- **Verificação:** desktop/sidebar-recolhida/tablet/mobile; build verde.

### G — Lixeira
- **Goal:** Implementar soft delete restauravel (30 dias) com auditoria, respeitando `org_id`/RLS.
- **Context:** `PRD_LIXEIRA.md`. **Antes de implementar**, verificar schema remoto real (`deleted_at`, `deleted_by`, policies) via MCP `supabase`.
- **Verificação:** exclusão vira soft delete; restauração funciona; expurgo respeita 30 dias.

### H — SEO prerender
- **Goal:** Prerender/HTML estático por rota pública + reestruturação visual das páginas públicas, preservando canonical `www.metaconstrutor.app.br`.
- **Context:** `PRD_SEO.md` pendências.
- **Verificação:** `sitemap.xml`/`robots.txt`/HTML de `/home` validados; build verde.

## 5. Gestão de conflitos (mesmo repositório)

- Todos os agentes editam o **mesmo repo**. Conflito só é seguro se as áreas forem disjuntas: A (pages-gemini), C (supabase/stripe/backend), D (admin), F (dashboard), G (lixeira), H (seo) — baixo overlap entre si.
- **`B` (deploy) toca branch/git → roda primeiro e isolado.** Nunca em paralelo com os demais.
- Se necessário, isolar com `git worktree` ou branch por feature e revisar o merge (skill `merge-reconciler`).
- O orquestrador **revisa cada resultado** (não confia no auto-relato) e só dá "concluído" com a evidência da §4.

## 6. Invocação (padrão)

```text
delegate_task(tasks=[
  {role: "leaf", goal: "<goal da §4>", context: "<context da §4 + stack + MCPs disponíveis>"},
  ...
])  # batch paralelo dentro da mesma wave
```

- Responder **em português (pt-BR)** nos sub-agentes.
- Reutilizar o roteamento do `PRD_MESTRE` §5 para não reabrir decisões já concluídas.
