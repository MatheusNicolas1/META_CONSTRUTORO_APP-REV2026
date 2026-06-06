# P2.2 - Cobertura de testes

Data: 2026-05-22

## Escopo

Adicionar cobertura automatizada para fluxos de maior risco citados no PRD:

- Auth principal
- RDO/status
- Feedback
- Relatorios/exportacao

## Testes existentes considerados

- `src/pages/__tests__/auth-flow.test.tsx`
  - Login tradicional.
  - Inicio de OAuth Google.
  - Criacao de conta com dados validos.
  - Inicio de OAuth Google na criacao de conta.

## Testes adicionados

- `src/utils/__tests__/rdoStatus.test.ts`
  - Garante labels canonicos de status `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`.
  - Garante cores distintas dos badges do fluxo de aprovacao.

- `src/utils/__tests__/feedback.test.ts`
  - Garante que o payload enviado para `send-feedback` converte `rating` para numero.
  - Garante que `rating` vazio segue como `undefined`.

- `src/hooks/__tests__/useReportPdfDownload.test.ts`
  - Garante uso do filename retornado pela Edge Function.
  - Garante fallback de filename sem acentos e com data estavel.
  - Garante envio de `generatedAt` em ISO quando ausente.
  - Garante preservacao de `generatedAt` explicito.

## Codigo ajustado para testabilidade

- Criado `src/utils/feedback.ts` com `buildFeedbackRequestBody`.
- `src/pages/Feedback.tsx` passou a usar `buildFeedbackRequestBody`.
- `src/hooks/useReportPdfDownload.ts` passou a exportar helpers puros:
  - `getFilenameFromDisposition`
  - `fallbackFilename`
  - `buildReportPdfRequestBody`

Os ajustes sao extrações puras e mantem o comportamento existente.

## Validacoes

Comando:

```powershell
npm run test
```

Resultado:

```text
Test Files  8 passed (8)
Tests       27 passed (27)
```

Comando:

```powershell
npm run build
```

Resultado:

- Build concluido com sucesso.
- Sem warning de chunk acima de 500 kB.
- Warnings nao bloqueantes restantes:
  - `color-adjust` depreciado.
  - Import dinamico/estatico do cliente Supabase no `AuditLogger`.

Comando:

```powershell
npm run lint
```

Resultado:

```text
0 errors, 34 warnings
```

As warnings sao preexistentes e nao foram introduzidas pelos testes adicionados.

## Testes manuais nao automatizados

- Conclusao real de Google OAuth: depende de autenticacao manual em conta Google.
- Redefinicao de senha pelo link recebido por e-mail: depende de caixa de e-mail real.
- Pagamento real, troca de plano e cancelamento: dependem de assinatura ativa/trialing controlada no Stripe.
- Fluxos visuais completos com download real em navegador: parte foi validada por Edge Function/HTTP e browser, mas alguns eventos de download nao sao suportados pelo navegador interno.

## Status

- P2.2 concluido.
- `npm run test`, `npm run build` e `npm run lint` passaram.
