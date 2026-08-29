# Runbook de incidentes

Classificacao: interno/confidencial

Ultima atualizacao: 2026-08-29

## Objetivo

Orientar a resposta a incidentes de frontend, backend, banco, pagamentos, e-mail e dados pessoais no Meta Construtor.

## Ferramentas principais

- Sentry: projeto `meta-construtor-web`
- Vercel: projeto `meta-construtor-app-rev-2026`
- Supabase: projeto `bgdvlhttyjeuprrfxgun`
- Stripe: webhooks e assinaturas
- Resend: envio de e-mail de RDO
- Evidencias locais: `docs/evidence/`

## Severidade

| Severidade | Exemplo | Primeira resposta |
| --- | --- | --- |
| Critica | vazamento de dados, service role exposta, RLS quebrada, indisponibilidade total | conter em ate 1h, avisar responsaveis e preservar logs |
| Alta | login quebrado, checkout quebrado, Edge Function critica falhando, erro 5xx recorrente | corrigir ou rollback no mesmo dia |
| Media | erro isolado em fluxo secundario, degradacao parcial | registrar, priorizar e corrigir |
| Baixa | warning, erro visual sem perda funcional | registrar e agrupar para manutencao |

## Primeiros 15 minutos

1. Abrir Sentry e identificar projeto, issue, release e ambiente.
2. Conferir deploy ativo na Vercel.
3. Conferir logs da Edge Function ou do Supabase se o erro envolver backend.
4. Registrar evidencia com data/hora em `docs/evidence/`.
5. Classificar severidade.
6. Evitar apagar logs ou dados antes da coleta de evidencia.

## Triagem por origem

### Frontend

1. Verificar Sentry `meta-construtor-web`.
2. Verificar console/CSP no navegador.
3. Verificar deployment Vercel ativo:

```powershell
npx vercel ls --scope meta-construtors-projects
```

4. Reproduzir rota afetada.
5. Se a versao nova causou o incidente, fazer rollback pelo painel Vercel ou promover deploy anterior estavel.

### Supabase e banco

1. Verificar logs no Supabase Dashboard: API, Auth, Postgres e Edge Functions.
2. Confirmar se o erro esta ligado a RLS, schema ou migration.
3. Para RLS, consultar:

```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

4. Se houver risco de dados entre organizacoes, pausar divulgacao imediatamente.
5. Antes de qualquer correcao de schema remoto, fazer backup e seguir `docs/OPERATIONS.md`.

### Stripe

1. Verificar eventos no Dashboard Stripe.
2. Verificar endpoint ativo:
   `https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/stripe-webhook`
3. Verificar logs da Edge Function `stripe-webhook`.
4. Conferir secrets no Supabase sem revelar valores:

```powershell
npx supabase secrets list
```

5. Para pagamentos reais, nao criar ou cancelar assinaturas de clientes sem autorizacao operacional.

### Resend

1. Verificar logs das Edge Functions `send-email-rdo` e `send-rdo-email`.
2. Conferir `RESEND_API_KEY` e `RESEND_FROM_EMAIL` em Supabase secrets.
3. Confirmar que o RDO esta `APPROVED`, pois o envio por e-mail deve ser bloqueado para outros status.

## Contencao

- Desativar temporariamente botao/feature via deploy rapido se houver risco funcional.
- Revogar ou rotacionar secrets se houver exposicao.
- Fazer rollback de deploy se o erro foi introduzido no frontend.
- Corrigir RLS/migration apenas com backup e evidencia.
- Bloquear divulgacao publica ate validar o smoke minimo.

## Validacao de correcao

Rodar localmente:

```powershell
npm run lint
npm run test
npm run build
```

Validar em producao conforme impacto:

- rota publica afetada
- fluxo autenticado afetado
- Edge Function afetada
- Sentry sem novo erro equivalente apos correcao

## Registro minimo do incidente

Salvar em `docs/evidence/YYYY-MM-DD-incidente-<slug>.md`:

```text
Data/hora:
Severidade:
Origem:
Impacto:
Usuarios afetados:
Sistemas afetados:
Evidencia:
Acao de contencao:
Correcao aplicada:
Validacao:
Pendencias:
```

## Criterios LGPD

Se o incidente puder envolver dados pessoais:

1. Preservar logs e evidencias.
2. Estimar titulares afetados.
3. Identificar categorias de dados afetados.
4. Acionar responsavel legal/DPO.
5. Avaliar necessidade de comunicacao a ANPD e titulares.

## Checklist rapido

- [ ] Incidente registrado.
- [ ] Severidade definida.
- [ ] Sentry/Vercel/Supabase/Stripe/Resend conferidos conforme origem.
- [ ] Logs preservados.
- [ ] Contencao aplicada.
- [ ] Causa raiz identificada.
- [ ] Correcao validada com `lint`, `test` e `build`.
- [ ] Producao validada.
- [ ] Evidencia salva em `docs/evidence/`.
- [ ] `PRD.md` atualizado se o incidente afetar release.
