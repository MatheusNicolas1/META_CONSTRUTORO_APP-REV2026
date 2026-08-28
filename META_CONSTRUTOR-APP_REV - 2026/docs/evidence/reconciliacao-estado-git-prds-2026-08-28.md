# Reconciliação de estado — git × PRDs (2026-08-28)

**Agente:** Orquestrador Principal
**Escopo:** triar as mudanças não commitadas e alinhar `PRD_MESTRE.md` / `PRD_PROXIMOS_PASSOS.md` com o código real.
**HEAD:** `0504969` (último commit 2026-08-07)

---

## 1. Contexto

As fontes de verdade (`PRD_MESTRE.md`, `PRD_PROXIMOS_PASSOS.md` de 28/08) listavam como pendentes itens que o git já registrava como concluídos em 31/07–07/08. A reconciliação corrigiu os baselines e mapeou o trabalho ainda não commitado.

---

## 2. Triagem das 106 mudanças não commitadas (working tree)

| Categoria | Qtd | Itens | Ação recomendada |
| --- | --- | --- | --- |
| **Código de produto (pronto)** | 6 | `src/hooks/usePlans.ts`, `src/pages/Preco.tsx`, 4 Edge Functions (`change-subscription`, `create-checkout-session`, `create-enterprise-checkout`, `create-subscription`) | **Commit** |
| **Docs de 28/08** | 6 | `PRD_MESTRE.md` (mod.), `PRD_PROXIMOS_PASSOS.md`, `PLANO_SUBAGENTES_LANCAMENTO.md`, `SISTEMA_GESTAO_MULTIAGENTE.md`, `docs/PLANO_LANCAMENTO_MVP_PRIORIZADO.md`, `estrategia_divulgacao_organica.md` | **Commit** |
| **Prints (refresh)** | 30 | 15 `prints_layout/IMG_*.png` deletados + 15 `prints_layout/prints_mobile*.png` novos | **Commit** (substituição) |
| **Criativos de anúncio** | 4 | `Anúncio Instagram/Reels - Meta Construtor.html` + `anuncio_instagram/reels_*.png` | Commit (ou mover p/ assets) |
| **Artefatos de pesquisa** | 32 | `.firecrawl/*` (taxas, selfit, viral trends) | **.gitignore** |
| **Scripts auxiliares/teste** | 20 | `__*.py/mjs` (15), `codex-tmp/*` (2), `run_seed.py`, `upload_prints.py`, `upload_webp.py` | **.gitignore** ou pasta `scripts/` |
| **Temp / lixo** | 4 | `_nul`, `blogArticles.ts.new.article.json`, `tmp_article.txt`, `tools/lightrag/scripts/provider-probe.py` | **.gitignore** / remover |
| **Config/outros** | 4 | `supabase/.temp/*` (3, version), `fix_article.py` | .gitignore (`.temp`) |

> `git status --porcelain | wc -l` = 106. Deletados: 15 · Modificados: 10 · Não rastreados: 81.

### 2.1 Conteúdo dos diffs de código (não é WIP — é trabalho concluído)

- `usePlans.ts` — plano Master: `R$499,90→R$347,00` / anual `R$4.799,04→R$3.331,20` (~20% off).
- `Preco.tsx` — novo helper `getCheckoutUrl()` propaga `&billing=yearly|monthly` no CTA do card.
- 4 Edge Functions — mesmo fix: `percent_off` normalizado para `[0,100]` com ≤2 casas decimais, corrigindo erro Stripe *"Invalid decimal: 99.999999; must contain at maximum two decimal places"*.

---

## 3. Correções aplicadas aos PRDs

| Arquivo | Correção |
| --- | --- |
| `PRD_MESTRE.md` | `PRD_falso.md`: "1 aberto (FALSO-055)" → "FALSO-055/056 fechados 31/07" (97%→100%). `PRD_CUPOM.md`: "gaps identificados" → "P0/P1/P2 resolvidos". Nova entrada §7 de reconciliação. |
| `PRD_PROXIMOS_PASSOS.md` | Tabela de estado: FALSO-055 97%→100% fechado; Cupons "diagnóstico"→"resolvidos". Roadmap P0: FALSO-055 e Cupons marcados ✅ concluídos; Deploy Vercel mantido aberto com causa raiz corrigida. |
| `PRD_falso.md` | §8: adicionado "Fechado em 2026-07-31" (FALSO-055/056 corrigidos+deployados). |

---

## 4. Itens em aberto (baseline verdadeiro)

1. **Deploy Vercel (P0)** — a raiz do repo git não tem `package.json`; o app vive na subpasta `META_CONSTRUTOR-APP_REV - 2026/`. O Vercel precisa de *Root Directory* apontando para a subpasta (ou mover o app p/ raiz).
2. **Trabalho não commitado** — código pronto (preço Master + billing period + fix decimal Stripe) aguardando commit.
3. **Pendencias já conhecidas** — VPS+n8n+WhatsApp (etapas 4-5), homologação de usuário, admin/analytics, dashboard, lixeira, SEO prerender, agrupamento RDO.

---

## 5. Evidências

- `git log --oneline -14` — commits de cupom (P0/P1/P2) e FALSO-055/056 entre 31/07 e 07/08.
- `git diff -- src/hooks/usePlans.ts src/pages/Preco.tsx supabase/functions/*` — diffs concluídos.
- Verificação em `src/pages-gemini/`: ausência de métricas fictícias ("1.500 obras", "98%", "300 construtoras"); `Preco2.tsx` usa os 5 planos reais.
- `PRD_falso.md` §10 — FALSO-055/056 marcados "Corrigido (deploy)".
