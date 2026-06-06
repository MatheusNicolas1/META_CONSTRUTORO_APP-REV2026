# PRD_LAYOUT - Ciclo 16 - Rechecagem final automatizada

Data: 2026-05-28

## Objetivo

Executar a rodada final automatizavel do `PRD_LAYOUT.md` depois da validacao local da Edge Function com Gotenberg, mantendo fora do escopo a configuracao de envio real de e-mail.

## Execucao

- Servidor Vite iniciado em `http://127.0.0.1:5173`.
- `npm.cmd run build` executado com sucesso.
- Regressao consolidada executada fora do sandbox:
  - `npx.cmd playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts scripts/prd-layout-report-pdf-smoke.spec.ts scripts/prd-layout-pwa-smoke.spec.ts scripts/prd-layout-route-inventory-smoke.spec.ts --reporter=list`

## Resultado

- Build: aprovado.
- Regressao consolidada: `69/70` passaram na execucao em lote.
- Falha em lote: um caso autenticado de `/app/dashboard` em `mobile-390` capturou `TypeError: Failed to fetch` vindo de `supabase.auth.getUser`.
- Rerun do smoke autenticado completo: `20/22` passaram; as falhas mudaram para `/app/dashboard` e `/app/obras` em `desktop-1440`, com o mesmo erro intermitente de `supabase.auth.getUser`.
- Reruns isolados dos casos que falharam:
  - `desktop-1440.*dashboard`: `1/1` passou.
  - `desktop-1440.*obras`: `1/1` passou.

## Leitura tecnica

Nao foi identificada regressao de layout/overflow nas rotas cobertas. O erro observado e intermitente, aparece em rotas diferentes entre execucoes e desaparece em rerun isolado, apontando para instabilidade momentanea de fetch/Auth durante reload autenticado em ambiente de teste, nao para quebra responsiva.

## Pendencias remanescentes

- Configurar `GOTENBERG_URL` remoto/publico em Supabase Secrets para fidelidade HTML/A4 em producao.
- Configurar provedor transacional e reexecutar envio real para `eng.mnicolas@gmail.com`, etapa pausada por decisao do usuario.
