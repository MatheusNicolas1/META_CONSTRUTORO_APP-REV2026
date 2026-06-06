# P2.3 - Documentacao de operacao

Data: 2026-05-22

## Escopo

Atualizar documentacao para que outra pessoa consiga retomar release, operacao, deploy de Edge Functions e migrations com seguranca.

## Arquivos atualizados

- `README.md`
  - Stack do projeto.
  - Setup local.
  - Comandos reais de desenvolvimento, validacao e release.
  - Links para checklist, operacao, runbook, evidencias e PRD.

- `.env.example`
  - Variaveis publicas de frontend.
  - Variaveis backend-only para testes locais e Edge Functions.
  - Variaveis Stripe, Sentry, Resend e integracoes opcionais.
  - Aviso implicito por separacao: secrets nao devem ir para bundle frontend.

- `docs/OPERATIONS.md`
  - Ambientes e IDs operacionais.
  - Variaveis obrigatorias de producao na Vercel.
  - Secrets obrigatorios no Supabase.
  - Como validar release.
  - Como deployar frontend.
  - Como deployar Edge Functions.
  - Como aplicar migrations com seguranca.
  - Smoke minimo de producao.

- `docs/RELEASE_CHECKLIST.md`
  - Checklist atualizado para codigo, ambiente, banco, Edge Functions, deploy e smoke.
  - No-go imediato para release.

- `docs/RUNBOOK_INCIDENT_RESPONSE.md`
  - Runbook reescrito sem mojibake.
  - Sentry, Vercel, Supabase, Stripe e Resend como ferramentas principais.
  - Triagem por origem.
  - Contencao, validacao e registro minimo.
  - Criterios LGPD.

## Validacao

Comando:

```powershell
node <script de leitura UTF-8>
```

Resultado:

```text
README.md: ok
.env.example: ok
docs/OPERATIONS.md: ok
docs/RELEASE_CHECKLIST.md: ok
docs/RUNBOOK_INCIDENT_RESPONSE.md: ok
```

Validacao complementar:

- Scanner de mojibake em `src` para sequencias corrompidas comuns retornou `0` ocorrencias.
- Rotas legais de producao retornaram HTTP `200`:
  - `/legal/privacidade`
  - `/legal/termos`
  - `/legal/cookies`
  - `/legal/lgpd`

## Status

- P2.3 concluido.
- Documentacao operacional pronta para retomada por outra pessoa do time.
