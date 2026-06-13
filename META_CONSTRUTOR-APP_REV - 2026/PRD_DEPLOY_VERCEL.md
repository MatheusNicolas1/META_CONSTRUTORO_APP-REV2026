# PRD_DEPLOY_VERCEL — Diagnóstico de Deploys UNKNOWN na Vercel

Data de criação: 2026-06-13
Produto: Meta Construtor Web
Status: EM EXECUÇÃO
Objetivo: Diagnosticar e corrigir deploys Vercel travando em estado UNKNOWN — 20+ deploys consecutivos sem Duration, sem Ready, sem Error nas últimas 11h.

---

## 1. VISÃO GERAL

O projeto `meta-construtor-app-rev-2026` está impossibilitado de fazer deploys funcionais para produção. Desde ~02:00 AM de 13/06/2026, **todos os deploys (20+) ficam no estado UNKNOWN** — nunca atingem Ready nem Error, Duration permanece "?" e não existe log de build acessível via CLI.

O site de produção (`www.metaconstrutor.app.br`) continua no ar (HTTP 200) servindo o deploy anterior funcional, mas qualquer tentativa de atualização é bloqueada por esta condição.

Build local (`npm run build`) passa perfeitamente (22.7s, 5703 módulos, 72 rotas pré-renderizadas), confirmando que o problema **não é no código** — é no ambiente de build/CI da Vercel.

---

## 2. SINTOMAS VERIFICADOS

### 2.1 Deploys UNKNOWN em massa

| Quantidade | Período | Estado | Duration | 
|-----------|---------|--------|----------|
| 20+ deploys | Últimas 11h (desde ~02:00) | **UNKNOWN** | `?` (vazio) |
| 1 deploy (anterior) | Mais de 11h atrás | **Ready** (o que está no ar) | Funcional |

### 2.2 Comportamento detalhado

- `npx vercel list --prod` → 20 deploys consecutivos **UNKNOWN**, todos sem Duration
- `npx vercel list` → **Páginação de 20 UNKNOWN seguidos** — sem nenhum Ready ou Error no meio
- `npx vercel inspect <deployment-url>` → Retorna vazio ou "Cannot find deployment" para os UNKNOWN
- Nenhum log de build disponível — os deploys nunca chegam a iniciar o build
- Usuário: `metaconstrutor-1824` em todos os deploys

### 2.3 Build local passa

```bash
npm run build
# ✓ built in 22.70s
# Prerendered 72 public route HTML files.
```

Sem erros de TypeScript, sem erros de Vite, sem dependências faltando.

### 2.4 Configuração do projeto Vercel (verificada via CLI)

| Configuração | Valor | Status |
|-------------|-------|--------|
| Node.js Version | **22.x** | ✅ LTS, estável |
| Framework Preset | **Other** | ✅ Correto (não Vite — evita sobrescrita de config) |
| Build Command | `npm run build` | ✅ Correto |
| Output Directory | `dist` | ✅ Correto |
| Install Command | `npm ci --prefer-offline \|\| npm install` | ✅ Defensivo |
| Vercel.json | Tem `buildCommand`, `framework: null` | ✅ Alinhado |

### 2.5 Código local

- 4 arquivos modificados (não commitados): `scripts/prerender-public-routes.mjs`, `src/content/blogArticles.ts`, `vercel.json`, `insert_article.py`
- Git status limpo exceto pelas modificações acima
- **Nenhum commit fresco** nos deploys recentes — todos foram disparados como `vercel deploy --prod` sem git push

---

## 3. HIPÓTESES (ordenadas por probabilidade)

### H1 — [ALTA] Cache de build corrompido no servidor Vercel

**Evidências:**
- 20+ deploys UNKNOWN consecutivos sem Duration — exatamente o padrão documentado na skill `vercel-deploy` para cache corrompido
- Build local passa, build remoto nunca chega a começar
- Nenhum log de build disponível (nem Error log)
- Comportamento idêntico ao descrito em `build-fails-seconds-cache-corrupted.md`
- `vercel cache purge` via CLI **não é suficiente** — só o Dashboard resolve

**Ação necessária:** Clear Build Cache & Deploy pelo Dashboard Vercel.

### H2 — [MÉDIA] Plano Hobby exauriu limite de build mensal

**Evidências:**
- Plano Hobby tem limite de 6000 build minutes/mês
- Múltiplos deploys (20+ nas últimas 11h, mais os anteriores) podem ter exaurido o limite
- Sem error code porque o Vercel simplesmente não agenda o build

**Ação necessária:** Verificar billing/usage no Dashboard Vercel.

### H3 — [BAIXA] Instabilidade da plataforma Vercel

**Evidências:**
- Todos os UNKNOWN sem exceção — mesmo os mais antigos (11h) continuam UNKNOWN
- `https://www.vercel-status.com/` — verificar se há incidente reportado
- Nenhum deploy com erro — apenas UNKNOWN (diferente de build failing)

**Ação necessária:** Verificar status page da Vercel e aguardar se for incidente.

### H4 — [BAIXA] `.vercelignore` bloqueando rebuild

**Evidências:**
- Se `.vercelignore` contém `dist/` ou outros caminhos, o Vercel pode não detectar mudanças e ignorar o rebuild
- Deploys via git push podem ser silenciosamente ignorados

**Ação necessária:** Verificar conteúdo de `.vercelignore`.

---

## 4. MÓDULOS DE INVESTIGAÇÃO

### MÓDULO 01 — Diagnóstico via Dashboard Vercel

Acesso visual ao estado real do projeto, logs de build e cache.

**Passos:**
1. Acessar https://vercel.com/metaconstrutors-projects/meta-construtor-app-rev-2026
2. Verificar se há deploys visíveis com estado diferente de UNKNOWN
3. Verificar **Settings → Git → "Clear Build Cache & Deploy"** — esta é a ação correta
4. Verificar **Settings → General** para Node.js Version e Framework Preset
5. Verificar **Usage/Billing** para limite de minutos de build

**Importante:** Dashboard pode mostrar detalhes que o CLI não mostra (errorCode, errorMessage internos). Documentar o que aparecer.

### MÓDULO 02 — Limpeza de Cache e Novo Deploy

Após limpar cache no Dashboard:

**Estratégia preferida: git push (mais confiável que --prebuilt)**

```bash
git add -A
git commit -m "fix: deploy debug - clear cache & redeploy"
git push origin master
```

Isso força o Vercel a clonar o repositório fresco, sem cache local, e fazer build completo.

**Estratégia alternativa: deploy via Dashboard**
- Fazer upload manual do diretório pelo Dashboard
- Útil se o CLI continuar apresentando problemas

**Estratégia de contingência: deploy pré-buildado**
```bash
rm -rf .vercel/output dist
npm run build
npx vercel build --prod
vercel --prod --prebuilt
```

### MÓDULO 03 — Rollback Consciente (se precisar reverter)

Se o deploy funcional anterior cair e precisar de recuperação:

```bash
# Encontrar deploy funcional (mais antigo que 11h)
npx vercel list

# Reverter com alias (mais confiável que rollback)
npx vercel alias <deployment-url>.vercel.app www.metaconstrutor.app.br --scope meta-construtors-projects
```

### MÓDULO 04 — Verificação Pós-Correção

Após limpeza de cache e novo deploy:

```bash
# 1. Verificar estado do deploy
npx vercel list --prod

# 2. Verificar hashes dos bundles (confirmar que é o código novo)
curl -s https://www.metaconstrutor.app.br | grep -oP 'src="/assets/\K[^"]+' | sort

# 3. Verificar hashes do build local
ls dist/assets/*.js | grep -oP '[a-z]+-[A-Za-z0-9]+\.js$' | sort

# 4. Verificar console do navegador (sem erros)
browser_console()
```

---

## 5. REGRAS DE NEGÓCIO

| Regra | Descrição | Status |
|-------|-----------|--------|
| REGRA 01 | Build local precisa passar (exit 0) antes de qualquer tentativa de deploy | ✅ Verificado |
| REGRA 02 | Não fazer mais de 3 deploys consecutivos UNKNOWN sem mudar estratégia | ⚠️ Violado — 20+ tentativas |
| REGRA 03 | Preferir git push a `--prebuilt` quando histórico mostra UNKNOWN | 🔴 Aplicar |
| REGRA 04 | Após limpar cache no Dashboard, fazer deploy com commit fresco | 🔴 Aplicar |
| REGRA 05 | Após deploy, verificar hashes dos bundles para confirmar código novo no ar | 🔴 Aplicar |
| REGRA 06 | Não confiar em exit code do CLI (ECONNRESET, timeout) — verificar com `vercel list` | 🔴 Aplicar |
| REGRA 07 | Se git push + deploy continuar UNKNOWN, verificar billing da Vercel | 🔴 Aplicar |
| REGRA 08 | Verificar `.vercelignore` — se bloquear `dist/` ou fontes, remover | 🔴 Verificar |

---

## 6. DIAGNÓSTICO EXECUTADO

### 6.1 Estado do site de produção

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.metaconstrutor.app.br
# ✅ HTTP 200 — site no ar
```

### 6.2 Build local

```bash
npm run build
# ✅ Passou — 22.70s, 5703 módulos, 72 rotas pré-renderizadas
```

### 6.3 Deploys Vercel

```bash
npx vercel list --prod
# ❌ 20+ deploys UNKNOWN consecutivos
# ❌ Nenhum Ready ou Error nas últimas 11h
```

### 6.4 Configurações do projeto Vercel

```bash
npx vercel project inspect meta-construtor-app-rev-2026
# ✅ Framework Preset: Other
# ✅ Build Command: npm run build
# ✅ Node.js: 22.x
```

### 6.5 Mudanças não commitadas

```bash
git status --short
#  M scripts/prerender-public-routes.mjs
#  M src/content/blogArticles.ts
#  M vercel.json
# ?? insert_article.py
```

### 6.6 Conclusão do diagnóstico

**Causa mais provável:** Cache de build corrompido no servidor Vercel, agravado por múltiplas tentativas consecutivas de deploy (20+) que só pioram a situação.

**Fatores contribuintes:**
1. Múltiplos deploys consecutivos sem git push (todos via `vercel deploy --prod`)
2. Ausência de verificação de estado entre tentativas
3. Possível exaustão de build minutes do plano Hobby

---

## 7. PLANO DE AÇÃO (ordem de execução)

### PASSO 1 — Acessar Dashboard Vercel e Limpar Cache
- **Quem:** Usuário (Nicolas) — precisa de acesso ao navegador
- **O quê:** https://vercel.com → Project → Settings → Git → "Clear Build Cache & Deploy"
- **Por quê:** `vercel cache purge` via CLI não é suficiente

### PASSO 2 — Commit e Push (após limpeza de cache)
- **Quem:** Agente (Hermes)
- **O quê:** 
  1. Fazer git add + commit das alterações atuais
  2. `git push origin master`
  3. Monitorar deploy no CLI/Dashboard

### PASSO 3 — Verificar Resultado
- **Quem:** Agente (Hermes)
- **O quê:**
  1. `npx vercel list --prod` — confirmar status Ready
  2. Verificar hashes dos bundles (local vs produção)
  3. Testar URLs públicas com curl

### PASSO 4 — Se Ainda UNKNOWN
- **Quem:** Usuário (Nicolas)
- **O quê:**
  1. Verificar billing/usage no Dashboard Vercel
  2. Verificar https://www.vercel-status.com/
  3. Abrir ticket de suporte na Vercel se 5+ deploys UNKNOWN após limpeza de cache

---

## 8. ARQUIVOS RELEVANTES

| Arquivo | Descrição |
|---------|-----------|
| `vercel.json` | Configuração de deploy Vercel (framework, build, rewrites) |
| `package.json` | Scripts de build e dependências |
| `scripts/prerender-public-routes.mjs` | Script de pré-renderização (72 rotas) |
| `src/content/blogArticles.ts` | Conteúdo dos artigos do blog |
| `PRD_MESTRE.md` | Fonte mestre de decisões consolidadas |

---

## 9. PENDÊNCIAS

- [ ] Limpar cache de build no Dashboard Vercel (usuário)
- [ ] Fazer git commit + push das alterações atuais
- [ ] Verificar estado do deploy pós-limpeza
- [ ] Verificar billing/usage da Vercel
- [ ] Verificar `.vercelignore` se existir
- [ ] Verificar status page da Vercel
- [ ] Registrar solução como procedimento para futuros incidentes

---

## 10. VALIDAÇÃO FINAL

| # | Teste | Resultado |
|---|-------|-----------|
| 01 | Build local passa (`npm run build`) | ✅ Confirmado (22.70s, 72 rotas) |
| 02 | Site de produção responde HTTP 200 | ✅ Confirmado |
| 03 | Deploy mais recente aparece como **Ready** no `vercel list` | ❌ Pendente |
| 04 | Hashes dos bundles em produção correspondem ao build local | ❌ Pendente |
| 05 | Console do navegador sem erros de runtime | ❌ Pendente |
| 06 | Artigos/blog carregam sem erro | ❌ Pendente |

---

## 11. ANEXOS

### Comandos úteis para diagnóstico

```bash
# Listar deploys de produção
npx vercel list --prod

# Ver todas as configurações do projeto
npx vercel project inspect meta-construtor-app-rev-2026

# Limpar cache (via CLI — limitado)
npx vercel cache purge --yes --scope meta-construtors-projects

# Rollback consciente (via alias — não via rollback API)
npx vercel alias <deployment-url>.vercel.app www.metaconstrutor.app.br --scope meta-construtors-projects

# Verificar hashes dos bundles em produção
curl -s https://www.metaconstrutor.app.br | grep -oP 'src="/assets/\K[^"]+' | sort

# Verificar hashes do build local
ls dist/assets/*.js | grep -oP '[a-z]+-[A-Za-z0-9]+\.js$' | sort

# Verificar título de uma página específica
curl -s https://www.metaconstrutor.app.br/blog/diario-de-obra-app-online | grep -o '<title>[^<]*</title>'
```
