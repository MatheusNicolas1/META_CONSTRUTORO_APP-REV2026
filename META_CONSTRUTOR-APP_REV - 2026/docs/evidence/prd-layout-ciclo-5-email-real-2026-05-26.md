# Evidencia - PRD_LAYOUT Ciclo 5 - Teste de e-mail real

Data: 2026-05-26  
Status: PRD_LAYOUT validado; entrega real de e-mail bloqueada por configuracao do provedor.

## Escopo

- Validar Docker/local serve das Edge Functions.
- Deployar `invite-member` e `accept-invite` no Supabase remoto.
- Testar envio real para `eng.mnicolas@gmail.com`.
- Continuar regressao automatizada do `PRD_LAYOUT`.

## Edge Functions

Comandos:

```powershell
npx supabase functions serve --no-verify-jwt --env-file .env
npx supabase functions deploy invite-member accept-invite --project-ref bgdvlhttyjeuprrfxgun --use-api
npx supabase functions deploy invite-member --project-ref bgdvlhttyjeuprrfxgun --use-api
```

Resultados:

- Docker Desktop disponivel.
- `functions serve` iniciou Edge Runtime local em `http://127.0.0.1:54321/functions/v1/<function-name>`.
- O serve local usa variaveis reservadas locais de Supabase; por isso nao prova entrega real em Gmail remoto.
- Deploy remoto concluido para `invite-member` e `accept-invite`.

## Teste de envio real

Destino solicitado:

```text
eng.mnicolas@gmail.com
```

Resultado da chamada remota:

- `invite-member` retornou HTTP 200.
- Membership temporario foi criado como `Colaborador`.
- Registro temporario em `equipes` foi criado.
- Limpeza confirmou `0` organizacoes temporarias `QA Convite Email*` restantes.
- Limpeza confirmou `0` registros temporarios em `equipes` para `eng.mnicolas@gmail.com`.

Bloqueio de entrega:

```text
Resend: 403 validation_error
You can only send testing emails to your own email address (matheusnicolas.org@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains,
and change the from address to an email using this domain.
```

Fallback:

```text
Supabase magic link: 500 unexpected_failure
Error sending magic link email
```

Conclusao:

- O endpoint remoto de convite executa a regra de negocio e limpa corretamente os dados temporarios.
- O e-mail real para `eng.mnicolas@gmail.com` nao foi entregue por bloqueio externo de configuracao de e-mail.
- Proxima acao necessaria: verificar dominio/remetente no Resend ou corrigir SMTP/Auth Email do Supabase.

## Regressao PRD_LAYOUT

Comando:

```powershell
npx playwright test scripts/prd-layout-smoke.spec.ts scripts/prd-layout-auth-smoke.spec.ts scripts/prd-layout-invite-rdo-smoke.spec.ts --reporter=list
```

Resultado:

- 56/56 testes passaram.
- Cobertura: rotas publicas, rotas autenticadas prioritarias, detalhes dinamicos de obra/RDO, persistencia de tema e jornada convite/RDO.

## Build

Comando:

```powershell
npm run build
```

Resultado:

- Sucesso.
- Avisos conhecidos mantidos: `color-adjust` depreciado e import dinamico/estatico do cliente Supabase.

## Pendencias

- Configurar envio real para destinatarios externos no Resend ou no Supabase Auth.
- Reexecutar envio para `eng.mnicolas@gmail.com` apos configuracao.
- Validar clique real em `Aprovar RDO` e `Rejeitar RDO`.
- Validar PWA standalone.
- Gerar e inspecionar PDFs reais com dados completos.
