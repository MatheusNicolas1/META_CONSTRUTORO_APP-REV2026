# PRD_PROXIMOS_PASSOS — Meta Construtor

Data de criação: 2026-08-28
Produto: Meta Construtor Web
Status: diretriz de próximos passos
Objetivo: consolidar o estado atual (a partir do `PRD_MESTRE.md`), recomendar MCPs e skills que aceleram o desenvolvimento (pesquisa via Firecrawl + catálogo Hermes) e ditar o roadmap priorizado.

> Regra de continuidade herdada do `PRD_MESTRE.md`: **concluído com evidência vira baseline; aberto continua aberto.** Antes de reabrir diagnóstico, recriar requisito ou desfazer decisão anterior, consultar o PRD de origem correspondente.

---

## 1. Estado atual consolidado (baseline do PRD_MESTRE)

| Frente | Fonte | Estado |
| --- | --- | --- |
| Release pública, Supabase, Vercel, RDO, Stripe, LGPD, segurança | `PRD.md` | Concluído p/ itens automatizáveis; pendências manuais abertas |
| Layout, responsividade, PWA, PDFs, rotas | `docs/PRD_LAYOUT.md` | Concluído p/ cobertura automatizável (70 testes Playwright) |
| Dados reais × mocks/ações falsas | `PRD_falso.md` | 100% — FALSO-055/056 fechados 31/07 (37 validado, 10 removido…) |
| Admin, analytics, marketing, governança | `PRD_ADMIN.md` | Parcial (P0/P1/P2 técnico inicial validado) |
| SEO e páginas públicas | `PRD_SEO.md` | Fundação técnica ok; reestrutura visual aberta |
| Páginas públicas V2 (Gemini) | `docs/PRD_PUBLICAS_V2_GEMINI.md` | Implementado (5 páginas em `src/pages-gemini/`, deploy Production) |
| Páginas públicas After Effects/Remotion | `docs/PRD_PUBLICAS_AFTER_EFFECTS_REMOTION.md` | Fase 1 ok; Fase 2 (Remotion) planejada |
| Cupons/descontos + Stripe | `PRD_CUPOM.md` | P0/P1/P2 resolvidos (31/07–07/08); resta P3 + fix decimal Stripe não commitado |
| Homologação do usuário | `PRD_USUARIO.md` | Parcial em execução |
| Integração VPS + n8n + WhatsApp + Site | `PRD_INTEGRACAO_VPS_N8N_WHATSAPP.md` | Etapas 1-3 ok; **4-5 aguardam VPS + chaves WhatsApp** |
| Dashboard principal (inspirado Canva) | `PRD_DASHBOARD.md` | Planejado |
| Lixeira / soft delete | `PRD_LIXEIRA.md` | Planejado |
| Agrupamento RDO por dia/nicho | `PRD_AGENDAS_RDO.md` + `PRD_NICHOS_RDO.md` | Em elaboração |
| Módulos implementados (contratos, OS, DDS, fluxo caixa, portal cliente, ERP) | `docs/PRD_*.md 2026-05-31` | Implementados |
| Deploy Vercel | `PRD_DEPLOY_VERCEL.md` + `docs/PRD_DIAGNOSTICO_DEPLOY_VERCEL.md` | Em diagnóstico (deploys UNKNOWN; branch master sem package.json no HEAD b349e1b) |

**Stack confirmada (`package.json` / `README.md`):** React 18 + Vite + TypeScript · Supabase (Auth/Postgres/Storage/Edge Functions) · Stripe · Vercel · Sentry · Resend · n8n + WhatsApp Business · Tailwind + shadcn/Radix/Ark · Remotion · PostHog + GA4 + OpenTelemetry · Playwright (70 testes) · Prisma.

---

## 2. MCPs e skills recomendados (resultado da pesquisa)

### 2.1 Já configurado (nesta sessão)

| MCP | Estado | Uso no projeto |
| --- | --- | --- |
| **firecrawl** | ✅ enabled (27 tools) | Pesquisa web, scraping, extração de conteúdo e monitoramento (já usado em `.firecrawl/`) |

### 2.2 Catálogo Hermes — instalar (alta prioridade)

Instalar com `hermes mcp install <name>`.

| MCP | Prioridade | Justificativa (frente que acelera) |
| --- | --- | --- |
| **supabase** | 🔴 Crítico | DB, auth, storage e Edge Functions. Verificar schema real, aplicar migrations e auditar drift — alinha com `PRD.md` §4.1 e com `PRD_CUPOM`. |
| **stripe** | 🔴 Crítico | Checkout, assinaturas e cupons — alinha com `PRD_CUPOM` (gaps P0/P1/P2) e `PRD_PAGAMENTO`. |
| **n8n** | 🔴 Crítico | Inspecionar/criar workflows de automação — alinha com `PRD_INTEGRACAO_VPS_N8N_WHATSAPP` (etapas 4-5). |
| **vercel** | 🟠 Importante | Deploys, logs e projetos — resolve `PRD_DEPLOY_VERCEL` (deploys UNKNOWN travados). |
| **sentry** | 🟠 Importante | Issues e erros de frontend (já há `@sentry/react`) — suporte ao ciclo de release. |
| **figma** | 🟡 Opcional | Contexto de design — `PRD_DASHBOARD` (inspirado Canva) e reestrutura visual. |
| **linear** | 🟡 Opcional | Gestão de tarefas/roadmap do time. |
| **notion** | 🟡 Opcional | Documentação e decisões. |

### 2.3 MCPs externos (opcional, via `hermes mcp add`)

| MCP | Comando sugerido | Uso |
| --- | --- | --- |
| **Playwright MCP** (Microsoft) | `hermes mcp add playwright --command npx --args -y @playwright/mcp@latest` | Automação/E2E por IA — amplia os 70 testes Playwright existentes. |
| **GitHub MCP** (oficial) | `hermes mcp add github --url https://api.githubcopilot.com/mcp --auth header` | PRs, issues e code review. |

### 2.4 Skills

- **Supabase Agent Skills** (oficial): `github.com/supabase/agent-skills` — skills de Supabase para Claude Code/Cursor/Cline/Copilot (o projeto já usa `.cursor/`, `codex-tmp/` e `codex-supabase-deploy-payment/`).
- **Stripe agent skills** (oficial): `npx skills add https://docs.stripe.com`.
- **Skills Hermes já disponíveis** (sem instalação): `software-development/*` (systematic-debugging, test-driven-development, plan, requesting-code-review, spike), `github/*` (github-pr-workflow, github-code-review, github-issues), `research/*`, `productivity/*` (docx, pdf, xlsx).

---

## 3. Roadmap priorizado — próximos passos

### P0 — Bloqueadores e correções urgentes

1. ~~**FALSO-055 (P1 reaberto)**~~ ✅ **CONCLUÍDO 31/07/2026** — métricas hardcoded e pricing fictício (FALSO-055/056) removidos de `pages-gemini/`, páginas principais, blog e SEO; deployado e verificado em produção (commits `f7b85ad`/`d993098`).
2. ~~**Cupons P0/P1/P2**~~ ✅ **CONCLUÍDO 07/08/2026** — Admin CRUD + validação no checkout + sincronização Stripe resolvidos (commits `404f76b`→`0504969`). Restam P3 (otimizações) + fix decimal Stripe ainda não commitado.
3. **Deploy Vercel** — **AINDA ABERTO.** Causa raiz confirmada: a raiz do repo git não tem `package.json` (o app vive na subpasta `META_CONSTRUTOR-APP_REV - 2026/`). Corrigir *Root Directory* no projeto Vercel (ou mover o app para a raiz) e fazer deploy fresco. → `vercel` MCP.

### P1 — Em andamento

4. **VPS + n8n + WhatsApp (etapas 4-5)** — aguarda provisionamento do VPS e chaves do WhatsApp Business API. → `n8n` MCP.
5. **Homologação do usuário** — recuperação de senha, MFA, avatar, perfil completo, checklists e fluxos P1/P2 (`PRD_USUARIO`). → `playwright` MCP + skills de teste.
6. **Admin/analytics** — filtros globais (período/plano/role/campanha/origem/rota/org), instrumentar CTAs + signup/login + checkout + cupom, validar `/preco`, `/checkout` e `/criar-conta` sem erros de console, e garantir ausência de PII em eventos. → `supabase` MCP.
7. **Páginas públicas — Remotion (Fase 2)** — renderizar as 5 compositions planejadas (marketing). *(Opcional/estética.)*

### P2 — Planejado

8. **Dashboard principal** — inspirado no Canva, mantendo `SidebarProvider`/`SidebarTrigger`, acessibilidade e PWA; sem dados fictícios. → `figma` MCP para shape/layout.
9. **Lixeira / soft delete (30 dias)** — verificar schema real (`deleted_at`, `deleted_by`, policies) antes de implementar. → `supabase` MCP.
10. **SEO — prerender + reestrutura visual** das páginas públicas, preservando canonical `www.metaconstrutor.app.br`.
11. **Agrupamento RDO por dia/nicho** — concluir `PRD_AGENDAS_RDO` + `PRD_NICHOS_RDO` (8 nichos baseados nos módulos reais).

---

## 4. Como instalar os MCPs recomendados

```bash
# Catálogo (prioritários)
hermes mcp install supabase
hermes mcp install stripe
hermes mcp install n8n
hermes mcp install vercel
hermes mcp install sentry

# Opcionais
hermes mcp install figma
hermes mcp install linear

# Externos (se necessário)
hermes mcp add playwright --command npx --args -y @playwright/mcp@latest
hermes mcp add github --url https://api.githubcopilot.com/mcp --auth header
```

Após instalar, validar conexão: `hermes mcp test <name>`. *Nota: tools de MCP novo só carregam em sessão nova (sem hot-reload).*

---

## 5. Regras de continuidade (herdadas do `PRD_MESTRE`)

- **Antes de reabrir** qualquer frente, consultar o PRD de origem (roteamento na §5 do `PRD_MESTRE`).
- **Persistência real:** Supabase Storage bucket `documentos` + tabela `public.documentos`; UI com estado local não é persistência.
- **Multi-tenant:** `org_id` é a chave de isolamento; RLS/policies/Edge Functions devem preservar organização, papel e autoria.
- **Sem dados fictícios:** ausência de dado = estado vazio honesto; funcionalidade sem backend = desabilitada/indisponível com erro claro.
- **RDO:** contrato vivo usa `criado_por_id`; estados canônicos `DRAFT → SUBMITTED → APPROVED → REJECTED`.
- **Gates de release:** `npm run lint` && `npm run test` && `npm run build` antes de publicar; validar rotas públicas com HTTP 200.
