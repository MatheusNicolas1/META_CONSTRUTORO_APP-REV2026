# BUG-REG-001 — Regressão de testes em useSignUp (analytics) — RESOLVIDO

| | |
|---|---|
| **Data abertura** | 2026-08-29 |
| **Data resolução** | 2026-08-30 |
| **Resolvido por** | EMPRESA EXECUTIVA |
| **Severidade** | Alto (3 testes quebrados no fluxo de signup) |
| **Status** | ✅ RESOLVIDO — suite 107/107 verde |

## Sintoma

`npm run test` → **3 falhas** em `src/hooks/__tests__/useSignUp.test.tsx`:

1. "cria conta usando o redirect autenticado correto" — `expected false to be true`
2. "exibe erro generico quando o Supabase reporta email ja cadastrado" — `toastError` chamado com mensagem errada
3. "exibe erro generico quando cadastro duplicado nao gera perfil acessivel" — idem

## Causa raiz REAL (corrigida em 30/08 — a atribuição original estava errada)

> ⚠️ **Retificação:** a versão original deste relatório atribuía a regressão ao commit de auth `5833172` (Google OAuth PKCE). Investigação de causa raiz em 30/08 provou que a origem real é o **commit `970e98e` (TASK-016, analytics)**.

Cadeia completa:

1. Commit `970e98e feat(analytics)` (29/08) adicionou `track('auth.signup_started')` e `track('auth.signup_completed')` ao `useSignUp.ts`.
2. `track()` em `src/integrations/analytics.ts` classifica eventos `auth.*` como públicos (`isPublicAnalyticsEvent`, linhas 87-93) e, sem contexto autenticado, persiste via `supabase.from('analytics_events').insert(...)` (linhas 217-225).
3. O mock de `supabase` no teste (`vi.mock('@/integrations/supabase/client')`) expõe `from() → select → eq → maybeSingle` mas **não expõe `.insert`**.
4. `track()` lançava `TypeError: supabase.from(...).insert is not a function` → a exceção caía no `catch` do `signUp()` → retornava `false` e disparava `toastError` com a mensagem do TypeError em vez do erro genérico de signup.

Evidência do erro real capturado no teste:

```text
toastError recebeu:
"__vite_ssr_import_2__.supabase.from(...).insert is not a function"
(em vez de "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.")
```

## NÃO relacionado a (confirmado)

- Remoção da página 3D (bundle) — não toca auth nem analytics.
- Commit auth `5833172` (PKCE) — `useSignUp.ts` e o teste **não foram modificados** por ele (`git log` confirma: último commit no hook é `970e98e`).

## Correção aplicada (mínima, só no teste)

`src/hooks/__tests__/useSignUp.test.tsx`:

1. Adicionado `track: vi.fn()` ao `vi.hoisted(...)`.
2. Adicionado `vi.mock('@/integrations/analytics', () => ({ track: mocks.track }))` — isola o teste do efeito colateral de persistência do analytics.
3. Adicionado `mocks.track.mockReset()` no `beforeEach`.

**Nenhuma linha de produção alterada** — o código de produção (`useSignUp.ts`, `analytics.ts`) está correto; o teste é que não tinha sido atualizado quando o `track()` entrou no hook.

## Correção secundária no mesmo ciclo

`scripts/generate-v2-pages.mjs:196` — o commit `bcd04b4` (FALSO-057) inseriu crases literais dentro da template literal `BASE_CONTEXT`, quebrando o parse do arquivo (1 erro de lint). Escapadas as crases (`\`...\``). Lint voltou a 0 erros.

## Validação (evidências — 30/08)

| Gate | Resultado |
|---|---|
| `vitest run useSignUp.test.tsx` | ✅ 3/3 |
| `vitest run` (suite completa) | ✅ **107/107** (25 arquivos) — inclui os testes novos do agente de auth |
| `npm run lint` | ✅ **0 erros** (35 warnings pré-existentes inalterados) |
| `npm run build` | ✅ 1m14s, sitemap 93 rotas, prerender 120 rotas |

## Critério de aceite

- [x] Suite de testes 100% verde.

## Oportunidade identificada (fora de escopo — registrada, não implementada)

`track()` não deveria poder derrubar fluxos de negócio: hoje um erro síncrono dentro de `track()` (ex.: insert de persistência) se propaga para o `catch` do chamador (`useSignUp`). Recomendação: envolver a persistência do analytics em try/catch ou torná-la não-bloqueante, para que telemetria nunca quebre auth. Encaminhar à CRIAÇÃO/FISCAL para priorização.
