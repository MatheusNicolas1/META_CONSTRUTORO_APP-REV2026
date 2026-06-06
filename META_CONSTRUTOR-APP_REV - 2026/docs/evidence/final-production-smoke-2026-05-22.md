# Smoke final de producao

Data: 2026-05-22

## Escopo

Validar tudo que pode ser executado sem intervencao manual do usuario apos fechamento de P2.1, P2.2 e P2.3.

## Validacao local

Comandos:

```powershell
npm run lint
npm run test
npm run build
```

Resultados:

- `npm run lint`: passou com `0 errors` e `34 warnings` preexistentes.
- `npm run test`: `8` arquivos e `27` testes passaram.
- `npm run build`: passou sem warning de chunk acima de 500 kB.
- Warnings nao bloqueantes restantes:
  - `color-adjust` depreciado.
  - Import dinamico/estatico do cliente Supabase no `AuditLogger`.

## Deploy

Comando:

```powershell
npx vercel deploy --prod --yes
```

Resultado:

- Deployment: `dpl_3nhMzNCzKbnCKSBCzW47Vow1dX7r`
- URL gerada: `https://meta-construtor-app-rev-2026-j7igi8q9i.vercel.app`
- Alias de producao: `https://www.metaconstrutor.app.br`
- Estado: `READY`
- Build remoto passou; sem warning de chunk acima de 500 kB.

## Rotas publicas validadas

Todas retornaram HTTP `200`, `content-type: text/html; charset=utf-8`, `cache-control: public, max-age=0, must-revalidate` e o bundle atual `index-MlBbRgm1.js`.

- `/home`
- `/login`
- `/criar-conta`
- `/preco`
- `/checkout?plan=basic`
- `/checkout/success`
- `/checkout/cancel`
- `/contato`
- `/legal/privacidade`
- `/legal/termos`
- `/legal/cookies`
- `/legal/lgpd`

## Evidencias visuais

- `docs/evidence/final-smoke-home-2026-05-22.png`
- `docs/evidence/final-smoke-checkout-mobile-2026-05-22.png`

## Pendencias que dependem de acao manual externa

- Concluir Google OAuth com conta Google real.
- Concluir redefinicao de senha pelo link recebido por e-mail.
- Fazer pagamento Stripe controlado.
- Validar troca/cancelamento de plano com assinatura ativa ou trialing.

## Status

Smoke publico automatizado aprovado. As pendencias restantes sao manuais ou dependem de estado comercial controlado no Stripe.
