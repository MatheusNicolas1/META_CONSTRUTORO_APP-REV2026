# PRD_PAGAMENTO - Diagnostico e correcao do fluxo de pagamento

Data de criacao: 2026-05-29  
Produto: Meta Construtor Web  
Status: P0/P1 tecnico corrigido; validacao real/controlada ainda pendente  
Base mestre: `PRD_MESTRE.md`, `PRD.md`, `PRD_ADMIN.md`, `PRD_USUARIO.md`  
Objetivo: mapear, identificar, corrigir e validar os erros que impedem ou degradam a contratacao de planos pagos via Stripe.

## 1. Regra de continuidade

Este PRD deve ser atualizado em cada ciclo de correcao. Marcar como concluido somente o que tiver evidencia objetiva.

Baseline herdado do `PRD_MESTRE.md`:

- [x] `/checkout?plan=basic` ja era rota publica esperada.
- [x] Stripe em producao ja teve smoke tecnico sem pagamento real em 2026-05-22.
- [ ] Pagamento real completo, troca de plano e cancelamento continuam pendencias manuais/controladas.
- [x] `/preco`, `/checkout` e `/criar-conta` devem ser validados sem erros de console em modo anonimo.
- [ ] Se validacao nova contradisser PRD anterior, tratar como regressao ou drift de contexto.

## 2. Sintoma reportado

Na tentativa de contratar o plano, o checkout exibe o formulario de dados e o console mostra erros:

- `POST https://bgdvlhttyjeuprrfxgun.supabase.co/rest/v1/analytics_events 403 (Forbidden)`
- `POST https://r.stripe.com/b net::ERR_BLOCKED_BY_CLIENT`

Contexto visual do print:

- Rota de checkout com plano Basico anual.
- Botao visivel: `Continuar para Pagamento`.
- O usuario ainda esta antes da etapa de pagamento/cartao.

## 3. Evidencias coletadas em 2026-05-29

### 3.1 MCP Stripe

Consulta via MCP da Stripe:

- [x] Produtos Meta Construtor encontrados:
  - `prod_TnDXfTGqvS2gV1` - Plano Basico - App Meta Construtor
  - `prod_TnDY0YHpWZtTm1` - Plano Profissional - App Meta Construtor
  - `prod_TnDZmsZmtV3C88` - Plano Master - App Meta Construtor
  - `prod_TzIZ1YOK7HrpST` - Plano Premium - App Meta Construtor
- [x] Precos ativos em BRL encontrados:
  - Basico mensal: `price_1Spd6ICHfNdO9jxNRYj10lkA` - 12990
  - Basico anual: `price_1SpdABCHfNdO9jxNzVu49NDP` - 124704
  - Profissional mensal: `price_1Spd7HCHfNdO9jxN3PKJJdyv` - 19990
  - Profissional anual: `price_1Spd9UCHfNdO9jxNMXy1MQs4` - 191904
  - Master mensal: `price_1Spd7xCHfNdO9jxNiUbb0PKG` - 49990
  - Master anual: `price_1Spd8ZCHfNdO9jxNIcxjZJBm` - 479904
  - Premium mensal: `price_1T1JzYCHfNdO9jxNtf6YceHL` - 74990
  - Premium anual: `price_1T1JzcCHfNdO9jxNQNaRQtcD` - 719904
- [x] Existem PaymentIntents e Subscriptions recentes na Stripe com titulo `Subscription creation`, o que indica que a conta Stripe consegue criar assinaturas em alguns cenarios.
- [ ] O MCP nao retornou detalhe completo de logs/eventos da tentativa do usuario do print.

Limitacao encontrada:

- [ ] As ferramentas MCP de listagem direta retornaram `Unknown tool` para `list_prices`, `list_payment_intents` e `list_subscriptions`.
- [x] A ferramenta de busca do MCP funcionou e foi usada como fonte de validacao.

### 3.2 Banco/Supabase

Consulta controlada aos planos no banco remoto:

```text
free: null / null
basic: price_1Spd6ICHfNdO9jxNRYj10lkA / price_1SpdABCHfNdO9jxNzVu49NDP
professional: price_1Spd7HCHfNdO9jxN3PKJJdyv / price_1Spd9UCHfNdO9jxNMXy1MQs4
master: price_1Spd7xCHfNdO9jxNiUbb0PKG / price_1Spd8ZCHfNdO9jxNIcxjZJBm
business: null / null
```

Resultado:

- [x] Os `price_id` usados pelo banco para `basic`, `professional` e `master` batem com os precos ativos encontrados no MCP Stripe.
- [x] Nao ha evidencia atual de `price_id` inexistente como causa principal do bloqueio.

Teste anonimo controlado em `analytics_events`:

```json
{
  "status": 401,
  "ok": false,
  "error": {
    "code": "42501",
    "message": "permission denied for table analytics_events"
  }
}
```

Resultado:

- [x] O erro de console em `analytics_events` e reproduzivel fora do browser.
- [x] Existe drift/regressao entre o contrato esperado pelo `PRD_ADMIN.md` e o remoto atual: anonimo nao consegue inserir eventos publicos.
- [x] Corrigir no remoto o grant/policy de `analytics_events` e reativar a persistencia anonima permitida.

### 3.3 Codigo do checkout

Arquivos relevantes:

- `src/pages/Checkout.tsx`
- `src/components/pricing/CheckoutForm.tsx`
- `src/components/ui/checkout-dialog.tsx`
- `src/components/checkout/PaymentForm.tsx`
- `src/integrations/stripe/client.ts`
- `supabase/functions/create-subscription/index.ts`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `src/integrations/analytics.ts`
- `src/components/analytics/PublicMarketingTracker.tsx`

Observacoes:

- [x] Historico 2026-05-29: a rota `/checkout` usava `create-subscription` e Payment Element com `clientSecret`.
- [x] Estado atual: a rota `/checkout` usa o fluxo hospedado `create-checkout-session`.
- [x] `create-subscription` exige usuario e organizacao ativa em `org_members`.
- [x] Em fluxo anonimo, a pagina chama `supabase.auth.signUp` e depois chama `create-subscription`.
- [x] A UI e as Edge Functions agora validam/recuperam sessao JWT e base de usuario antes de chamar Stripe.
- [x] O modal com Payment Element foi removido do fluxo publico; `clientSecret` nao e usado na contratacao inicial atual.
- [x] O fluxo publico atual redireciona via Checkout Session com `success_url` contendo `{CHECKOUT_SESSION_ID}`.

## 4. Diagnostico atual

### P0 - Erro confirmado: analytics anonimo sem permissao

O erro `analytics_events 403/401` nao e uma falha da Stripe. E uma falha Supabase/RLS/grant.

Impacto:

- Polui o console em rotas publicas, inclusive checkout.
- Quebra requisito do `PRD_ADMIN.md` de validar paginas publicas sem erros de console.
- Pode confundir suporte/usuario durante compra.
- Nao deve, sozinho, bloquear Stripe se o fluxo de pagamento estiver correto, mas precisa ser corrigido.

Causa provavel:

- Migration local `20260528222800_prd_admin_marketing_attribution.sql` contem `grant insert on public.analytics_events to anon` e policy `analytics_events_anon_insert_public`, mas o remoto atual nao esta aceitando insert anonimo.
- Pode ser drift de migration, grant ausente, policy ausente, tabela recriada ou privilegio revogado depois da validacao anterior.

### P0 - Hipotese principal de bloqueio do botao: criacao de assinatura antes de contexto pronto

O botao `Continuar para Pagamento` depende de:

1. atualizar/criar usuario;
2. ter sessao autenticada valida para invocar Edge Function com `verify_jwt = true`;
3. ter `org_members` ativo para o usuario;
4. encontrar `plans.slug`;
5. criar customer/assinatura na Stripe;
6. retornar `clientSecret`;
7. carregar Stripe Elements.

Qualquer falha de 2 ou 3 impede abrir a etapa de pagamento.

Risco especifico:

- Em usuario anonimo recem-cadastrado, `signUp` pode nao entregar sessao valida se confirmacao de email estiver ativa ou se o estado de auth ainda nao foi hidratado.
- Mesmo com sessao, a organizacao criada por trigger precisa estar pronta antes da function consultar `org_members`.
- A function aceita `bodyUserId`, mas o deploy esta com `verify_jwt = true`; sem JWT valido a function nem deve ser tratada como publica.

### P1 - Stripe telemetry bloqueada pelo cliente

`r.stripe.com/b net::ERR_BLOCKED_BY_CLIENT` normalmente indica bloqueio por extensao/ad blocker/privacy do navegador contra telemetria da Stripe.

Impacto esperado:

- Nao deve impedir pagamento por si so.
- Deve ser validado em janela limpa/sem extensao e em HTTPS de producao.
- CSP atual permite `https://api.stripe.com`, `https://js.stripe.com` e frames Stripe, mas nao lista `https://r.stripe.com`. Se o navegador nao bloquear por extensao, pode haver warning/erro de CSP para telemetria. Isso deve ser avaliado como ruido, nao como dependencia critica.

## 5. Plano de correcao

### P0.1 - Reproduzir o clique em ambiente controlado

Checks:

- [x] Abrir `/checkout?plan=basic&billing=yearly` em browser anonimo limpo.
- [x] Preencher dados com usuario descartavel.
- [x] Clicar `Continuar para Pagamento`.
- [x] Capturar status de `create-checkout-session`.
- [x] Capturar payload de erro exibido no toast nos ciclos falhos.
- [x] Confirmar no MCP Stripe que o customer foi criado para a sessao hospedada.
- [x] Repetir com usuario autenticado que ja tenha `org_members` ativo.
- [x] Diferenciar falha de Auth/JWT, `org_members`, Stripe, CSP e analytics.

Criterio de aceite:

- [x] O erro bloqueante fica identificado com endpoint, status, mensagem e arquivo responsavel.

### P0.2 - Corrigir `analytics_events` anonimo

Opcao preferida:

- [x] Aplicar no remoto a policy/grant de insert anonimo ja prevista em `supabase/migrations/20260528222800_prd_admin_marketing_attribution.sql`.

SQL esperado:

```sql
grant insert on public.analytics_events to anon;

drop policy if exists "analytics_events_anon_insert_public" on public.analytics_events;

create policy "analytics_events_anon_insert_public"
on public.analytics_events
for insert
to anon
with check (
  user_id is null
  and org_id is null
  and source = 'frontend'
  and (
    event = 'app.public_page_viewed'
    or event like 'marketing.%'
    or event like 'auth.%'
    or event like 'billing.%'
  )
);
```

Validacao:

- [x] Insercao anonima controlada em `analytics_events` retorna `201/200`.
- [x] `/checkout?plan=basic` nao mostra erro de `analytics_events` no smoke final.
- [x] `/home`, `/preco`, `/criar-conta`, `/contato` continuam registrando eventos publicos permitidos.
- [x] Nenhum evento anonimo consegue inserir `org_id`.
- [x] Nenhum evento anonimo consegue inserir `user_id`.

Fallback se nao for possivel liberar insert anonimo direto:

- [x] Fallback de Edge Function publica para eventos anonimos nao foi necessario; grant/policy RLS anonimo com allowlist resolveu o fluxo atual.
- [x] Alterar `src/integrations/analytics.ts` para nao persistir evento autenticado sem `org_id`.
- [x] Manter PII fora do payload via `sanitizeAnalyticsProperties`.

### P0.3 - Corrigir fluxo de criacao de assinatura

Decisao tecnica a tomar:

Decisao registrada em 2026-05-31: usar Stripe Checkout hospedado via `create-checkout-session` para nova assinatura.

- [x] Opcao A rejeitada para contratacao publica inicial: manter Payment Element com `create-subscription`.
- [x] Opcao B: usar Stripe Checkout hospedado via `create-checkout-session` para nova assinatura.

Recomendacao inicial:

- Para assinatura SaaS recorrente, preferir Billing + Checkout Session hospedado para o primeiro pagamento, porque o app ja possui `create-checkout-session`, webhook e rotas success/cancel. Isso reduz superficie de erro no frontend e alinha com o fluxo validado em 2026-05-22.

Checks se seguir com Checkout Session:

- [x] Em `src/pages/Checkout.tsx`, apos dados validos, chamar `create-checkout-session`.
- [x] Redirecionar para `session.url`.
- [x] Remover ou isolar Payment Element do fluxo publico inicial.
- [x] Garantir `success_url` e `cancel_url` corretos.
- [x] Preservar `plan`, `billing`, `user_id`, `org_id` e `plan_id` em metadata.
- [ ] Confirmar webhook `checkout.session.completed` atualiza `subscriptions` e `profiles`.

Checks se manter Payment Element:

- [x] Garantir sessao autenticada antes de invocar `create-subscription`.
- [x] Aguardar/validar `org_members` ativo apos signup.
- [x] Exibir erro claro se email precisa ser confirmado.
- [x] Recriar `clientSecret` ao mudar ciclo mensal/anual nao se aplica ao fluxo publico atual com Checkout Session hospedado.
- [x] Evitar criar multiplas assinaturas incompletas em cliques repetidos no fluxo publico atual: `/checkout` nao cria assinatura direta antes da Stripe; cria Checkout Session hospedada e bloqueia assinatura ativa existente.

### P0.4 - Garantir criacao de conta + organizacao antes do pagamento

Checks:

- [x] Validar que o checkout cria ou repara `profiles`, `orgs`, `org_members`, `user_roles`, `user_settings` e `user_credits` antes de chamar Stripe.
- [x] No checkout anonimo, bloquear prosseguimento se nao houver sessao.
- [x] Validar que `org_members.role` e aceito por `create-subscription` (`Presidente` ou `Administrador`).
- [x] Tratar caso de conta ja existente com CTA para login e retorno ao checkout.
- [x] Nao usar senha temporaria fixa em producao.
- [x] Criar fallback idempotente em `create-checkout-session` e `create-subscription` para criar/reparar `profiles`, `user_roles`, `user_settings`, `user_credits`, `orgs` e `org_members` quando o trigger remoto nao provisionar a base completa.

### P1.1 - Validar Stripe e CSP

Checks:

- [x] Testar em navegador limpo/sem extensoes via Playwright Chromium isolado.
- [x] Testar em producao HTTPS.
- [x] Confirmar que `r.stripe.com/b` bloqueado por extensao nao impede pagamento.
- [ ] Se houver erro de CSP sem extensao, ajustar `connect-src` para endpoints Stripe necessarios.
- [x] Manter `https://api.stripe.com`, `https://js.stripe.com`, `https://hooks.stripe.com` e demais dominios estritamente necessarios; nenhum dominio extra foi exigido no smoke limpo.

### P1.2 - Validar webhook e estado de assinatura

Checks:

- [ ] Criar assinatura controlada em ambiente seguro.
- [ ] Confirmar evento `checkout.session.completed` ou `invoice.payment_succeeded`.
- [x] Confirmar linha em `stripe_events` processada para `customer.subscription.updated` sem erro `Invalid time value`.
- [ ] Confirmar `subscriptions.status`, `stripe_subscription_id`, `stripe_customer_id`, `stripe_price_id`.
- [ ] Confirmar `profiles.stripe_customer_id` e `profiles.stripe_subscription_id` quando aplicavel.
- [ ] Confirmar plano/limites refletidos no app.

### P1.3 - Validar UX do erro

Checks:

- [x] Sem erros silenciosos no botao para usuario autenticado com campos de senha ocultos.
- [x] Toasts em portugues com causa acionavel.
- [x] Loading nao fica preso.
- [x] Usuario pode voltar para `/preco`.
- [x] Conta existente orienta login.
- [x] Falha Stripe mostra mensagem segura sem vazar detalhes tecnicos.

## 6. Criterios de aceite final

- [x] `create-checkout-session` retorna `checkout.stripe.com` para `basic`, `professional` e `master` em usuario anonimo valido, mensal e anual.
- [x] `/checkout?plan=basic`, `/checkout?plan=professional` e `/checkout?plan=master` passam do formulario para pagamento em browser anonimo valido.
- [x] `/checkout?plan=basic&billing=yearly` passa do formulario para pagamento em usuario anonimo valido.
- [x] Usuario autenticado com org ativa passa para pagamento.
- [x] Console limpo para erros de Supabase em `/checkout` anonimo no fluxo validado.
- [x] Erros de telemetria Stripe bloqueados por extensao sao classificados como nao bloqueantes ou eliminados em navegador limpo.
- [x] Banco `plans` continua alinhado com Stripe API/MCP.
- [ ] Webhook atualiza assinatura no banco em compra controlada.
- [x] `npm run build` passa apos alteracoes.
- [x] Evidencia final salva em `docs/evidence/prd-pagamento-2026-05-31.md`, `docs/evidence/prd-pagamento-2026-06-04.md` e `docs/evidence/prd-pagamento-2026-06-05.md`.

## 7. Execucao log

| Data | Etapa | Resultado | Evidencia | Proximo passo |
| --- | --- | --- | --- | --- |
| 2026-05-29 | Consulta `PRD_MESTRE.md` e PRDs relacionados | Baseline de checkout publico, Stripe smoke e pendencias manuais identificado | `PRD_MESTRE.md`, `PRD.md`, `PRD_ADMIN.md`, `PRD_USUARIO.md` | Reproduzir clique controlado |
| 2026-05-29 | MCP Stripe - produtos/precos | Produtos e precos ativos encontrados; DB remoto bate com Stripe para planos pagos atuais | MCP `_search`, `node scripts/check_plans.mjs` | Confirmar tentativa especifica por logs/reproducao |
| 2026-05-29 | Teste anonimo `analytics_events` | Falhou com `42501 permission denied for table analytics_events` | Insercao anonima controlada via Supabase JS | Corrigir grant/policy remoto |
| 2026-05-29 | Leitura do codigo de checkout | Fluxo usa `create-subscription` + Payment Element, nao Checkout Session hospedado | `src/pages/Checkout.tsx`, `supabase/functions/create-subscription/index.ts` | Decidir arquitetura e corrigir bloqueio |
| 2026-05-31 | Validacao com dados informados pela usuaria | Cliente Stripe e Checkout Session hospedada foram criados; pagina Stripe carregou com plano basico anual; nenhuma cobranca foi feita | MCP Stripe, Playwright, `checkout.stripe.com` | Corrigir falhas restantes de webhook/provisionamento |
| 2026-05-31 | Webhook Stripe | Erro `Invalid time value` em `customer.subscription.updated` corrigido com leitura de periodo no item da assinatura; deploy validado com evento processado | `supabase/functions/stripe-webhook/index.ts`, `evt_1TdC00CHfNdO9jxNerOIkitD` | Validar `checkout.session.completed` apos compra autorizada |
| 2026-05-31 | Smoke producao apos primeiro deploy | `auth/v1/signup` 200, `accept-invite` 200, `create-checkout-session` 400 com `Organization not found for user after signup provisioning` | Playwright em `www.metaconstrutor.app.br` | Criar fallback idempotente de org/membership |
| 2026-05-31 | Smoke producao final | `auth/v1/signup` 200, `accept-invite` 200, `create-checkout-session` 200, redirecionamento para `checkout.stripe.com` com `R$ 1.247,04 por ano` | `docs/evidence/prd-pagamento-2026-05-31.md` | Testar compra controlada/autorizada para fechar webhook de pagamento |
| 2026-05-31 | Rechecagem da tentativa real da Eliene | Stripe tem apenas `pi_3TdBuVCHfNdO9jxN1Z9kDmNQ` cancelado para `cus_UcQmGBN3sXMc99`; nao ha charge nem assinatura ativa | MCP Stripe, Supabase service role | Corrigir rotas de usuario ja cadastrado sem assinatura |
| 2026-05-31 | Rotas de usuario cadastrado | Nova rota `/app/planos`; `/preco` e CTAs publicos mandam usuario logado para area de planos; conta existente volta ao checkout apos login | `src/pages/Planos.tsx`, `src/pages/Preco.tsx`, `src/pages/Checkout.tsx` | Validar build, deploy e smoke autenticado |
| 2026-05-31 | Troca de plano | Usuario com assinatura ativa usa `create-portal-session` com deep link do Stripe Billing Portal; backend bloqueia assinatura duplicada no checkout direto | `supabase/functions/create-portal-session/index.ts`, `supabase/functions/create-checkout-session/index.ts` | Validar Billing Portal em assinatura ativa/controlada |
| 2026-05-31 | Validacao e deploy desta rodada | Build, testes e lint passaram; Functions e frontend publicados; smoke sem cartao retornou `checkout.stripe.com` | `npm run build`, `npm run test`, `npm run lint`, Vercel `dpl_GAzvjyiKk2dM26ytqc2HWqarPEcq` | Validar compra/troca real autorizada |
| 2026-06-01 | Conta existente bloqueada em `/app/planos` | Corrigido bloqueio por role antes do `OrgContext` carregar; rota agora exige login e a tela valida permissao apos carregar a org | `src/components/PerformanceOptimizedApp.tsx`, `src/pages/Planos.tsx` | Validar com conta real afetada |
| 2026-06-01 | Smoke conta existente | Usuario existente de teste fez login e `create-checkout-session` retornou `checkout.stripe.com`; deploy publicado em producao | `npm run build`, `npm run test`, `npm run lint`, Vercel `dpl_GnFk7x7RjetacCGPZ5rmBRxc5HTf` | Testar fluxo da Eliene sem novo cadastro |
| 2026-06-01 | Botao sem acao em usuario autenticado | Corrigida validacao Zod que recusava `password: ""` quando os campos de senha estavam ocultos; `handleDetailsSubmit` agora dispara para conta logada | `src/components/pricing/CheckoutForm.tsx`, `src/components/pricing/__tests__/CheckoutForm.test.tsx`, `npm run test`, `npm run build`, `npm run lint` | Publicar frontend e revalidar producao |
| 2026-06-04 | Smoke todos os planos pagos | `basic`, `professional` e `master`, mensal e anual, retornaram `checkout.stripe.com` via `create-checkout-session`; nenhuma cobranca executada | `docs/evidence/prd-pagamento-2026-06-04.md` | Validar compra controlada/autorizada |
| 2026-06-04 | Analytics anonimo | Grant/policy remotos corrigidos; insert anonimo permitido retorna 201 e tentativa com `org_id` e bloqueada por RLS; frontend voltou a persistir eventos publicos permitidos | `src/integrations/analytics.ts`, `src/integrations/__tests__/analytics.test.ts`, `docs/evidence/prd-pagamento-2026-06-04.md` | Browser smoke de console como complemento |
| 2026-06-04 | Browser smoke publico | `/preco`, `/checkout?plan=basic&billing=monthly`, `/criar-conta` e `/contato` renderizaram sem overlay, sem page errors e sem console relevante; clique no checkout `master/monthly` chegou a `checkout.stripe.com` | `docs/evidence/prd-pagamento-browser-smoke-2026-06-04.json`, screenshots em `docs/evidence/` | Validar compra real autorizada |
| 2026-06-04 | Foundation de usuario no checkout | `create-checkout-session` e `create-subscription` passaram a usar `_shared/billing-user-foundation.ts`; deploy remoto concluido; usuario descartavel validado com `profiles`, `stripe_customer_id`, `org_members`, `user_roles`, `user_settings` e `user_credits` | `supabase/functions/_shared/billing-user-foundation.ts`, `docs/evidence/prd-pagamento-edge-foundation-smoke-2026-06-04.json` | Testar webhook em compra controlada |
| 2026-06-04 | Validacao automatizada pos-correcao | `npm run test` passou com 19 arquivos e 62 testes; `npm run build` passou; deploy Supabase Functions `create-checkout-session` e `create-subscription` passou via CLI `--use-api` | Terminal, `docs/evidence/prd-pagamento-2026-06-04.md` | Compra controlada/Billing Portal |
| 2026-06-05 | UX segura do checkout | Removida senha temporaria fixa; erros tecnicos agora viram mensagens acionaveis e seguras; checkout exibe retorno para `/preco`; testes, lint e build passaram | `src/pages/Checkout.tsx`, `src/utils/checkoutErrors.ts`, `src/utils/__tests__/checkoutErrors.test.ts`, `docs/evidence/prd-pagamento-2026-06-05.md` | Validar compra real autorizada |
| 2026-06-05 | Browser smoke dos tres planos | `basic`, `professional` e `master` preencheram formulario anonimo valido e chegaram a `checkout.stripe.com`, sem cartao, sem console relevante e sem page errors | `docs/evidence/prd-pagamento-browser-all-plans-2026-06-05.json` | Webhook/Billing Portal em assinatura controlada |

## 8. Rechecagem de usuario ja cadastrado

Dados verificados em 2026-05-31:

- Usuario Supabase: `ea998ead-d06c-404b-b21f-5b6dd4463290`.
- Email: `eliene_fsa@hotmail.com`.
- Perfil: nome `Eliene Santana`, telefone `75981646888`, `stripe_customer_id = cus_UcQmGBN3sXMc99`, sem `stripe_subscription_id`.
- Organizacao ativa: `e3b62dde-e921-4c81-9613-29ff7d4b7a35`, role `Administrador`.
- Tabela `subscriptions`: sem linhas para a organizacao.
- Stripe: sem charge, sem pagamento bem-sucedido, PaymentIntent anterior cancelado.

Diagnostico:

- A conta ja existia, portanto o fluxo anonimo de signup nao podia ser tratado como o unico caminho de compra.
- Usuario cadastrado sem assinatura ativa precisa conseguir voltar ao pagamento apos login.
- Usuario cadastrado com assinatura ativa nao deve criar segunda assinatura em `/checkout`; deve trocar plano/ciclo pelo Billing Portal.

Rotas definidas:

- `/preco`: anonimo segue para `/checkout`; autenticado segue para `/app/planos`.
- `/checkout`: aceita autenticado sem assinatura ativa para primeira assinatura; se houver assinatura ativa, redireciona para `/app/planos`.
- `/login?redirect=/checkout?...&email=...`: usado quando o email ja existe no signup anonimo.
- `/app/planos`: area protegida para `Presidente` e `Administrador` escolherem, assinarem, alterarem ciclo, cancelarem ou abrirem o Billing Portal.
- `/app/perfil`: mantem aba de assinatura como caminho secundario.

Pendencias especificas:

- Validar uma troca real/controlada via Billing Portal em uma assinatura ativa.
- Confirmar que a configuracao do Billing Portal da Stripe inclui todos os `price_id` permitidos para `subscription_update_confirm`.
- Validar login real da Eliene ou de conta equivalente com senha conhecida, sem executar cobranca nao autorizada.

## 9. Correcao de bloqueio em conta existente - 2026-06-01

Sintoma novo:

- Cadastro novo direto no checkout conseguia chegar ao pagamento.
- Conta existente, ao tentar escolher/trocar plano, era bloqueada antes do meio de pagamento.

Causa confirmada:

- `/app/planos` estava protegido no roteador com `roles={["Presidente", "Administrador"]}`.
- O `ProtectedRoute` usa roles do `AuthContext`.
- Para conta existente, a role real da organizacao e sincronizada depois pelo `OrgContext`.
- Durante esse intervalo, a pagina podia renderizar `Acesso Negado`, mesmo para um usuario que e `Administrador` na organizacao.

Correcao:

- `/app/planos` agora exige apenas autenticacao no roteador.
- A propria pagina `Planos` aguarda `OrgContext.isLoading`.
- Depois do carregamento, apenas `Presidente` e `Administrador` podem gerenciar planos.
- Conta existente sem role ainda visivel nao e bloqueada no roteador; o checkout backend continua provisionando/validando organizacao quando necessario.

Validacao:

- `npm run build`: passou.
- `npm run test`: 10 arquivos e 33 testes passaram.
- `npm run lint`: passou com 32 warnings nao bloqueantes.
- Smoke com conta existente de teste: login bem-sucedido e `create-checkout-session` retornou URL em `checkout.stripe.com`.
- Deploy: `dpl_GnFk7x7RjetacCGPZ5rmBRxc5HTf`, alias `https://www.metaconstrutor.app.br`.

## 10. Correcao do botao sem acao no checkout - 2026-06-01

Sintoma novo:

- Em conta ja autenticada, o clique em `Continuar para Pagamento` gerava apenas `user_interactions` e `analytics_events`.
- Nenhuma requisicao `create-checkout-session` aparecia na aba Network.
- O usuario ficava na mesma tela, sem toast e sem redirecionamento para Stripe.

Causa confirmada:

- `CheckoutForm` escondia os campos de senha quando `showPasswordFields={false}`.
- Mesmo escondidos, `password` e `confirmPassword` continuavam no `defaultValues` como string vazia.
- O schema Zod tratava `password` como `string().min(8).optional()`.
- `optional()` aceita `undefined`, mas nao aceita `""`; por isso o `react-hook-form` bloqueava o submit antes de chamar `handleDetailsSubmit`.
- Como `handleDetailsSubmit` nao rodava, o app nunca chegava em `create-checkout-session` nem na Stripe.

Correcao:

- `src/components/pricing/CheckoutForm.tsx`: `password` e `confirmPassword` agora aceitam string vazia quando os campos nao participam do fluxo.
- `src/components/pricing/__tests__/CheckoutForm.test.tsx`: teste de regressao garante que usuario autenticado com campos de senha ocultos dispara `onSubmit` ao clicar no botao.

Validacao:

- `npm run test`: passou, 11 arquivos e 34 testes.
- `npm run build`: passou, incluindo postbuild/prerender.
- `npm run lint`: passou com 32 warnings preexistentes/nao bloqueantes.
- Deploy Vercel producao: `dpl_PSbP5pEvbt8Q4sxKUCLLrdMtnpw3`.
- Alias atualizado: `https://www.metaconstrutor.app.br`.
- Smoke HTTP: `/checkout?plan=basic&billing=monthly` retornou `200 text/html`.
- Smoke HTTP: `/app/planos` retornou `200 text/html`.
- Bundle de producao `/assets/Checkout-D8XrHZu_.js` retornou `200` e contem a validacao corrigida para `password`/`confirmPassword`.
- MCP Stripe `_search`: customer `cus_UcQmGBN3sXMc99` segue com apenas o PaymentIntent anterior `pi_3TdBuVCHfNdO9jxN1Z9kDmNQ` e invoice `in_1TdBuVCHfNdO9jxNnpgU5EjY` retornados pela busca.

## 11. Proxima atividade recomendada

Continuar por validacao de compra controlada/autorizada ou ambiente Stripe de teste dedicado.

Passos imediatos:

1. Executar uma compra controlada com cartao autorizado ou em ambiente Stripe de teste.
2. Confirmar `checkout.session.completed`, `invoice.payment_succeeded`, `subscriptions` e `profiles`.
3. Validar Billing Portal em assinatura ativa/controlada para troca/cancelamento.
4. Validar login real de conta ja existente retornando ao checkout ou a `/app/planos`.
5. Manter smoke de navegador como rechecagem de regressao antes de nova publicacao.

Nao marcar pagamento real como concluido sem uma compra controlada autorizada ou ambiente Stripe de teste dedicado.
