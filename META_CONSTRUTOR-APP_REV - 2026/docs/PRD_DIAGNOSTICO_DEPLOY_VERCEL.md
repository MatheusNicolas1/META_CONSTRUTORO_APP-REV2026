# PRD_DIAGNOSTICO_DEPLOY_VERCEL

**Data:** 2026-06-13  
**Produto:** Meta Construtor Web  
**Status:** EM DIAGNÓSTICO  
**Objetivo:** Identificar a causa raiz dos deploys UNKNOWN na Vercel e corrigir o pipeline de deploy.

---

## 1. Diagnóstico — Causa Raiz

### 1.1 O Problema

Mais de 20 deploys Vercel retornaram status UNKNOWN com o erro:

```
npm error Could not read package.json: Error: ENOENT: open '/vercel/path0/package.json'
npm error The `npm ci` command can only install with an existing package-lock.json
```

O build falha porque **não existem package.json nem package-lock.json no commit HEAD do branch que a Vercel clona**.

### 1.2 Repositórios Envolvidos

O projeto tem **duas árvores git conflitantes** e um **segundo repositório desconectado**:

| Repositório | Branch | Conteúdo |
|---|---|---|
| `META_CONSTRUTORO_APP-REV2026.git` | `main` (remota) | Código fonte completo (145+ commits) ✅ |
| `META_CONSTRUTORO_APP-REV2026.git` | `master` | **SEM package.json ❌** — commit b349e1b |
| `Meta-construtor-aplicativo.git` | `main` | Projeto Android nativo (build.gradle.kts) — outro app |

### 1.3 Árvore Divergente

O branch **local `master`** (onde o usuário trabalha) e o branch **remoto `master`** (que a Vercel clona) têm o mesmo HEAD: b349e1b.

```
commit b349e1b - chore: ajustar installCommand para npm ci --prefer-offline
```

Esse commit contém apenas arquivos de config/doc (PRDs, .gitignore, .env.example) — **não contém package.json, package-lock.json, src/, public/, nem nenhum arquivo do app Next.js**.

O branch **remoto `main`** (origin/main) tem os fontes corretos, com 5 commits iniciais (incluindo "Initial commit" com a base do projeto).

### 1.4 Causa Raiz Confirmada

A Vercel está configurada para clonar o branch `master` do repositório `META_CONSTRUTORO_APP-REV2026`. Esse branch, no commit HEAD, **não tem os arquivos necessários para o build**. O erro `ENOENT: package.json` é consequência direta.

O segundo repositório (`Meta-construtor-aplicativo`) é um **projeto Android** separado — não interfere no deploy web.

---

## 2. Solução Proposta

### 2.1 Restaurar os fontes no branch master (recomendada)

Os fontes existem **localmente** no branch `master` (package.json, src/, etc.). O problema é que o commit HEAD (b349e1b) foi um ajuste quebrado que não incluiu os arquivos. Solução:

```bash
# Os arquivos já estão no working directory — basta commitar novamente
git add -A
git commit -m "fix: restaurar package.json e fontes no HEAD — Vercel clona master"
git push origin master
```

### 2.2 Após o push

1. Aguardar ~2 minutos para o deploy automático no Vercel
2. Verificar status no Dashboard ou via `npx vercel list`
3. Confirmar que o build passou com exit 0

### 2.3 Se falhar novamente

1. **Limpar cache Vercel:** Dashboard → Settings → Git → Clear Build Cache → Clear
2. Fazer um commit trigger (arquivo `.cachebuster` vazio)
3. Verificar Framework Preset no Dashboard: deve estar como **Other** (já configurado)
4. Verificar se o Node Version é 22.x (já configurado)

---

## 3. Critérios de Sucesso

- [ ] `git show HEAD:package.json` retorna conteúdo válido após o push
- [ ] Deploy Vercel passa com exit 0
- [ ] `www.metaconstrutor.app.br` reflete o código mais recente
- [ ] Novos deploys não aparecem como UNKNOWN

---

## 4. Risco e Rollback

- **Site atual no ar:** ✅ `www.metaconstrutor.app.br` responde HTTP 200 com deploy anterior
- **Rollback:** Vercel Dashboard → Deployments → ⋮ ao lado do último deployment Production → Promote to Production
- **Se o build quebrar com erro diferente:** diagnosticar antes de tentar novamente

---

## 5. Registro de Evidências

| Evidência | Status |
|---|---|
| `git show HEAD:package.json` → ENOENT | ✅ Confirmado |
| `git show HEAD:package-lock.json` → ENOENT | ✅ Confirmado |
| `git ls-remote origin master` → b349e1b | ✅ Confirmado |
| `git ls-remote origin main` → 61ac78f (fontes presentes) | ✅ Confirmado |
| `git ls-tree -r novo-repo/main` — só Android | ✅ Confirmado |
| Build local `npm run build` passa | ✅ Confirmado |
| `www.metaconstrutor.app.br` responde HTTP 200 | ✅ Confirmado |

---

*Documento de diagnóstico gerado em 2026-06-13. Causa raiz: branch master sem package.json no commit HEAD.*
