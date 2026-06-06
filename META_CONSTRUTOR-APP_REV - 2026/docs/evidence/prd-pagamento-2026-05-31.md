# Evidencia PRD_PAGAMENTO - 2026-05-31

## Escopo validado

- Ambiente: `https://www.metaconstrutor.app.br/checkout?plan=basic&billing=yearly`
- Fluxo: cadastro anonimo, criacao de organizacao/membership quando ausente, criacao de Checkout Session, redirecionamento para Stripe Checkout.
- Dados usados no smoke final: nome `Eliene Santana`, telefone `75981646888`, empresa `Meta Construtor`, email descartavel `codex.payment.1780245505952@example.com`.
- Nenhum dado de cartao foi informado e nenhuma cobranca foi concluida.

## Resultado do smoke final

- `auth/v1/signup`: 200.
- `functions/v1/accept-invite`: 200.
- `functions/v1/create-checkout-session`: 200.
- Navegador redirecionou para `https://checkout.stripe.com/...`.
- Stripe Checkout exibiu `Assinar Plano Basico - App Meta Construtor`.
- Valor exibido: `R$ 1.247,04 por ano`.
- Console sem erro bloqueante de Supabase; apenas warnings nao bloqueantes de contexto/renderer.

## Confirmacao Stripe MCP

- Customer criado para o smoke final: `cus_UcRG327prW7k7n`.
- Assinatura incompleta criada em diagnostico anterior com os dados de Eliene foi cancelada via MCP: `sub_1TdBuVCHfNdO9jxNMthtqNNz`.

## Correcoes aplicadas

- `src/pages/Checkout.tsx`: fluxo publico passou a usar Stripe Checkout hospedado via `create-checkout-session`.
- `supabase/functions/create-checkout-session/index.ts`: aguarda `org_members` e cria fallback idempotente de `orgs` + `org_members` se o trigger remoto nao provisionar.
- `supabase/functions/create-subscription/index.ts`: mesmo fallback aplicado para compatibilidade com fluxos legados.
- `src/integrations/analytics.ts`: evita persistir evento autenticado no Supabase antes de existir `org_id`.
- `supabase/functions/stripe-webhook/index.ts`: corrige `Invalid time value` lendo periodo da assinatura no item quando o campo top-level nao existir.

## Pendencias

- Validar `checkout.session.completed` e `invoice.payment_succeeded` com compra controlada/autorizada.
- Testar os planos `professional` e `master` ate a pagina Stripe.
- Validar em browser a UX de conta ja existente com login e retorno ao checkout.

## Rechecagem apos tentativa real da Eliene

Data: 2026-05-31.

### Stripe MCP

- Customer por email `eliene_fsa@hotmail.com`: `cus_UcQmGBN3sXMc99`.
- PaymentIntents do customer: apenas `pi_3TdBuVCHfNdO9jxN1Z9kDmNQ`, valor `124704` BRL, titulo `Subscription creation`.
- Status do PaymentIntent encontrado: `canceled`.
- Charges do customer: nenhuma.
- Invoices do customer: apenas `in_1TdBuVCHfNdO9jxNnpgU5EjY`.
- Resultado: nao ha registro de pagamento real bem-sucedido ou tentativa nova apos o diagnostico anterior.

### Supabase remoto

- Profile: `ea998ead-d06c-404b-b21f-5b6dd4463290`.
- Nome: `Eliene Santana`.
- Email: `eliene_fsa@hotmail.com`.
- Telefone: `75981646888`.
- `stripe_customer_id`: `cus_UcQmGBN3sXMc99`.
- `stripe_subscription_id`: `null`.
- `plan_type`: `free`.
- Organizacao ativa: `e3b62dde-e921-4c81-9613-29ff7d4b7a35`.
- Role na organizacao: `Administrador`.
- `subscriptions`: nenhuma linha para a organizacao.

### Diagnostico adicional

- O usuario ja estava cadastrado, com organizacao ativa, mas sem assinatura ativa.
- A falha persistente nao aparece na Stripe como recusa de cartao ou charge falha.
- O app precisava de uma rota clara para usuario cadastrado escolher plano e de uma protecao contra nova assinatura duplicada em usuario ja assinante.

### Correcoes desta rodada

- Criada rota protegida `/app/planos` com a aba de planos/assinatura.
- Menu lateral e menu do usuario agora expõem `Planos` para `Presidente` e `Administrador`.
- `/preco` e CTAs publicos redirecionam usuario autenticado para `/app/planos` em vez de iniciar checkout anonimo.
- `/checkout` agora envia conta ja existente para `/login?redirect=...&email=...` e retorna ao fluxo apos login.
- `/checkout` verifica assinatura ativa antes de criar nova Checkout Session e redireciona para `/app/planos` quando necessario.
- `create-checkout-session` bloqueia assinatura duplicada no backend.
- `create-portal-session` aceita `plan` e `billing` para deep link de troca/cancelamento via Stripe Billing Portal.
- `stripe-webhook` passa a sincronizar `plan_id`, `billing_cycle` e `stripe_price_id` em `customer.subscription.updated`.

### Pendencias atualizadas

- `npm run build`: passou.
- `npm run test`: 9 arquivos e 30 testes passaram.
- `npm run lint`: passou com 33 warnings preexistentes/nao bloqueantes.
- Deploy Supabase Functions: `create-checkout-session`, `create-portal-session`, `change-subscription`, `stripe-webhook`.
- Deploy Vercel producao: `dpl_GAzvjyiKk2dM26ytqc2HWqarPEcq`, alias `https://www.metaconstrutor.app.br`.
- Smoke sem cartao: usuario descartavel criou Checkout Session e recebeu URL em `checkout.stripe.com`.
- Smoke rota `/app/planos`: HTML de producao respondeu 200.

### Pendencias remanescentes

- Validar `/app/planos` com usuario autenticado real e sem assinatura ativa.
- Validar Billing Portal com assinatura ativa/controlada e confirmar que a configuracao da Stripe inclui todos os precos permitidos.

## Correcao adicional - conta existente bloqueada

Data: 2026-06-01.

### Sintoma

- Usuario novo, criado diretamente no checkout, conseguia chegar ao meio de pagamento.
- Usuario ja cadastrado, ao tentar acessar/trocar plano, era bloqueado antes do pagamento.

### Causa

- A rota `/app/planos` estava protegida no roteador por `roles={["Presidente", "Administrador"]}`.
- O `ProtectedRoute` avalia roles do `AuthContext`.
- Em conta existente, a role da organizacao e carregada depois pelo `OrgContext`.
- Resultado: a tela podia mostrar `Acesso Negado` antes de sincronizar a role real `Administrador`.

### Correcao aplicada

- `src/components/PerformanceOptimizedApp.tsx`: `/app/planos` agora usa `ProtectedPage` sem role no roteador.
- `src/pages/Planos.tsx`: a tela aguarda `OrgContext.isLoading` e so bloqueia depois de conhecer `activeRole`.
- `Presidente` e `Administrador` seguem autorizados a contratar/trocar/cancelar plano.
- `Gerente` e `Colaborador` continuam bloqueados pela propria tela.

### Validacao

- `npm run build`: passou.
- `npm run test`: 10 arquivos e 33 testes passaram.
- `npm run lint`: passou com 32 warnings nao bloqueantes.
- Smoke programatico com conta existente de teste: login por senha e `create-checkout-session` retornando host `checkout.stripe.com`.
- Deploy Vercel: `dpl_GnFk7x7RjetacCGPZ5rmBRxc5HTf`.
- Alias atualizado: `https://www.metaconstrutor.app.br`.

## Correcao adicional - botao sem acao no checkout autenticado

Data: 2026-06-01.

### Sintoma

- Em conta ja autenticada, clicar em `Continuar para Pagamento` nao disparava redirecionamento para Stripe.
- A aba Network mostrava apenas eventos de observabilidade (`user_interactions` e `analytics_events`).
- Nao havia requisicao para `functions/v1/create-checkout-session`.

### Causa

- `src/pages/Checkout.tsx` usa `CheckoutForm` com `showPasswordFields={!isAuthenticated}`.
- Em usuario autenticado, os campos de senha ficam ocultos.
- `CheckoutForm` ainda inicializava `password` e `confirmPassword` como `""`.
- O schema Zod validava `password` como `z.string().min(8).optional()`.
- Como `optional()` nao aceita string vazia, `react-hook-form` bloqueava o submit silenciosamente antes de chamar `handleDetailsSubmit`.

### Correcao aplicada

- `src/components/pricing/CheckoutForm.tsx`: `password` e `confirmPassword` agora aceitam `""` quando os campos de senha estao ocultos.
- `src/components/pricing/__tests__/CheckoutForm.test.tsx`: teste de regressao cobre o fluxo autenticado sem campos de senha e confirma que o botao chama `onSubmit`.

### Validacao

- `npm run test`: 11 arquivos e 34 testes passaram.
- `npm run build`: passou com `tsc -b`, build Vite, sitemap e prerender.
- `npm run lint`: passou com 32 warnings preexistentes/nao bloqueantes.
- Deploy Vercel producao: `dpl_PSbP5pEvbt8Q4sxKUCLLrdMtnpw3`.
- Alias atualizado: `https://www.metaconstrutor.app.br`.
- `vercel inspect meta-construtor-app-rev-2026-r5jdp8wbh.vercel.app`: status `Ready`.
- Smoke HTTP `https://www.metaconstrutor.app.br/checkout?plan=basic&billing=monthly`: `200 text/html`.
- Smoke HTTP `https://www.metaconstrutor.app.br/app/planos`: `200 text/html`.
- Bundle de producao `https://www.metaconstrutor.app.br/assets/Checkout-D8XrHZu_.js`: `200` e contem `password...optional().or(C(""))`.
- MCP Stripe `_search` por email: customer `cus_UcQmGBN3sXMc99`.
- MCP Stripe `_search` por PaymentIntents do customer: apenas `pi_3TdBuVCHfNdO9jxN1Z9kDmNQ`.
- MCP Stripe `_search` por invoices do customer: apenas `in_1TdBuVCHfNdO9jxNnpgU5EjY`.
- MCP Stripe `_list_customers` e `_list_subscriptions`: indisponiveis nesta sessao por `Unknown tool`; usada busca `_search` como fallback.

### Resultado esperado

- Ao clicar em `Continuar para Pagamento` como usuario autenticado, `handleDetailsSubmit` deve executar.
- O app deve chamar `create-checkout-session`.
- Com backend ja validado, a resposta deve redirecionar para `checkout.stripe.com` quando a conta estiver autenticada, sem assinatura ativa e com permissao de plano.
