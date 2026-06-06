# PRD_falso - ciclo 1

Data: 2026-05-26

## Escopo executado

- Criado `PRD_falso.md` como trilha de auditoria de acoes/mockups ficticios.
- Inventariados os primeiros achados em rotas e componentes ativos.
- Convertido `/app/seguranca` de placeholder para consulta real em `admin_audit_logs` e `user_activity`.
- Removido uptime fixo do dashboard de integracoes.
- Convertidos logs de integracao para leitura/escrita real em `analytics_events`.
- Separados webhooks de integracao como pendencia real (`FALSO-008`).
- Removido sucesso falso dos stubs de webhook: salvar, excluir e disparar agora falham explicitamente; teste retorna falha.
- Desabilitada a acao administrativa de suspensao de usuario ate existir Edge Function real com Admin Auth API.
- Convertidos templates de checklist em padroes locais explicitos com UUIDs estaveis.
- Persistido `template_id` ao criar checklist a partir de um template.
- Convertido `eventManager` para persistir eventos em `analytics_events`.
- Removida chamada direta do browser para webhook N8N; quando configurado, o disparo passa pela Edge Function `n8n-integration`.
- Removidos `src/hooks/useActivities.ts` e `src/components/ActivityCalendar.tsx`, que eram legado baseado em `localStorage` sem referencias ativas no app.
- Registrada decisao de produto: webhooks de integracao permanecem bloqueados por enquanto, sem sucesso falso.
- Criada Edge Function real `suspend-user` para suspensao administrativa com Supabase Auth Admin.
- Reativada a acao `Suspender usuario` no painel admin para chamar a Edge Function real.

## Schema remoto validado

Comando:

```powershell
npx supabase db query --linked "select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'analytics_events' order by ordinal_position;"
```

Resultado confirmado:

- `id` uuid
- `event` text
- `properties` jsonb
- `created_at` timestamp with time zone

Decisao: nao escrever em colunas inexistentes como `org_id`, `user_id`, `source`, `success` ou `error`; estes metadados ficam dentro de `properties`.

## Validacao automatizada

- `npm run build`: passou.
- `npm run lint`: passou com 34 warnings e 0 erros.
- `npm run test`: passou com 8 arquivos e 27 testes.

## Codigo legado removido

Busca estatica confirmou que as rotas atuais usam `useActivitiesSupabase` e `ActivityCalendarModern`. Os arquivos antigos `useActivities.ts` e `ActivityCalendar.tsx` nao tinham referencias ativas e foram removidos para evitar reutilizacao futura de persistencia local ficticia.

## Suspensao administrativa

Arquivos:

- `supabase/functions/suspend-user/index.ts`
- `supabase/config.toml`
- `src/components/admin/AdminUsers.tsx`

Contrato validado:

- `user_roles`: `id`, `user_id`, `role`, `created_at`, `updated_at`.
- `admin_audit_logs`: `id`, `admin_id`, `action`, `target_user_id`, `details`, `created_at`.
- `profiles` nao possui coluna de suspensao; por isso a suspensao real usa Supabase Auth Admin `ban_duration`.

Controles implementados:

- JWT obrigatorio na Edge Function.
- Autorizacao server-side exigindo `user_roles.role = Presidente`.
- Bloqueio contra auto-suspensao.
- Atualizacao Auth Admin via `updateUserById` com `ban_duration`.
- Registro de auditoria em `admin_audit_logs` com acao `SUSPEND_USER`.

Deploy:

```powershell
npx supabase functions deploy suspend-user --use-api
```

Resultado: deploy concluido no projeto `bgdvlhttyjeuprrfxgun`.

Confirmacao remota:

```powershell
npx supabase functions list --output json
```

Resultado confirmado: `suspend-user` aparece como `ACTIVE`, `verify_jwt: true`, `version: 1`.

Observacao: a suspensao real nao foi executada contra um usuario de producao para evitar uma acao destrutiva. A validacao funcional final deve usar uma conta de teste controlada.

## Validacao controlada da suspensao

Data: 2026-05-28

Fluxo executado:

- Criado usuario temporario fake com role `Presidente` para atuar como administrador autenticado.
- Criado usuario temporario fake como alvo da suspensao.
- Login feito com o usuario fake `Presidente` para obter JWT real.
- Edge Function `suspend-user` chamada via HTTP com `Authorization: Bearer <jwt>` e `apikey` anon.
- Payload: `action = suspend`, `ban_duration = 1h`, motivo `Teste controlado PRD_falso`.

Resultado:

- HTTP 200.
- Resposta retornou `success: true`.
- `auth.admin.getUserById` confirmou `banned_until` no usuario alvo.
- `admin_audit_logs` confirmou entrada `SUSPEND_USER` para o admin fake e alvo fake.

Limpeza:

- O log de auditoria de teste foi removido.
- Os registros temporarios em `user_roles` e `profiles` foram removidos.
- Os usuarios temporarios foram removidos de `auth.users`.
- Consultas finais confirmaram contagem zero em:
  - `auth.users` com `email like 'prd-falso-%@example.invalid'`
  - `public.profiles` com `email like 'prd-falso-%@example.invalid'`
  - `public.admin_audit_logs` com `details->>'target_email' like 'prd-falso-%@example.invalid'`

## Auditoria global via Edge Function

Data: 2026-05-28

Arquivos:

- `src/components/security/AuditLogger.tsx`
- `supabase/functions/record-audit-log/index.ts`
- `supabase/config.toml`

Falsidade encontrada:

- O provider global de auditoria estava ativo no app.
- Eventos eram armazenados primeiro em `localStorage`.
- A escrita remota tentava `supabase.from('audit_logs').insert(...)` direto do browser.
- Esse comportamento podia criar falsa percepcao de trilha de auditoria persistente e confiavel.

Schema remoto validado:

```powershell
npx supabase db query --linked "select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'audit_logs' order by ordinal_position;"
```

Resultado confirmado:

- `id` uuid not null
- `user_id` uuid nullable
- `action` text not null
- `entity` text not null
- `entity_id` text nullable
- `details` jsonb nullable
- `created_at` timestamp with time zone nullable

Decisao: nao usar colunas de migracoes antigas que nao existem no schema vivo, como `org_id`, `actor_user_id` ou `metadata`. `org_id`, IP, user agent, severidade, sucesso e demais metadados ficam dentro de `details`.

Controles implementados:

- Edge Function `record-audit-log` com `verify_jwt = true`.
- Autenticacao server-side via JWT do usuario.
- Validacao de membership ativa em `org_members`.
- Escrita em `audit_logs` via service role somente dentro da Edge Function.
- `localStorage` mantido apenas como fallback para usuario nao autenticado ou falha de envio.
- Dados sensiveis sao mascarados antes do envio e no console de desenvolvimento.

Deploy:

```powershell
npx supabase functions deploy record-audit-log --use-api
```

Resultado: deploy concluido no projeto `bgdvlhttyjeuprrfxgun`.

Confirmacao remota:

```powershell
npx supabase functions list --output json
```

Resultado confirmado: `record-audit-log` aparece como `ACTIVE`, `verify_jwt: true`, `version: 2`.

Validacao controlada:

- Criado usuario temporario fake.
- Criada organizacao temporaria fake com membership ativa em `org_members`.
- Login feito com o usuario fake para obter JWT real.
- Edge Function `record-audit-log` chamada com `Authorization: Bearer <jwt>`.
- Payload de teste: `action = prd_falso.audit_test`, `entity = prd_falso`.

Resultado:

- HTTP 200.
- Resposta retornou `success: true`.
- `audit_logs` recebeu uma linha real com `action = prd_falso.audit_test`.
- `details.org_id` confirmou a organizacao fake usada no teste.

Limpeza:

- O log de auditoria de teste foi removido.
- A organizacao temporaria foi removida.
- Os registros temporarios em `profiles` foram removidos.
- O usuario temporario foi removido de `auth.users`.
- Consulta final confirmou contagem zero em:
  - `auth.users` com `email like 'prd-falso-audit-%@example.invalid'`
  - `public.profiles` com `email like 'prd-falso-audit-%@example.invalid'`
  - `public.orgs` com `slug like 'prd-falso-audit-%'`
  - `public.audit_logs` com `action = 'prd_falso.audit_test'`

Validacao tecnica:

- `npm.cmd run lint`: passou com 34 warnings e 0 erros.
- `npm.cmd run test`: passou com 8 arquivos e 27 testes.
- `npm.cmd run build`: passou; a primeira execucao no sandbox falhou por bloqueio de acesso do esbuild ao `vite.config.ts`, e a reexecucao aprovada fora do sandbox passou.

## Pendente

## Checklist PDF e e-mail

Data: 2026-05-28

Arquivos:

- `src/pages/ChecklistDetalhes.tsx`
- `supabase/functions/_shared/checklist-report.ts`
- `supabase/functions/generate-checklist-pdf/index.ts`
- `supabase/functions/send-checklist-email/index.ts`
- `supabase/config.toml`

Falsidade encontrada:

- O botao `Exportar PDF` chamava `toastEnhanced.info("Exportando PDF", "Funcionalidade em desenvolvimento...")`.
- O botao `Enviar Email` validava somente campo preenchido e depois exibia `Funcionalidade em desenvolvimento...`.
- O botao `Salvar` usava `setTimeout` como delay falso e toast de sucesso sem confirmar backend.

Schema remoto validado:

```powershell
npx supabase db query --linked "select table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name in ('checklists','checklist_items','documentos','org_members','orgs','obras') order by table_name, ordinal_position;"
```

Pontos relevantes confirmados:

- `checklists`: `id`, `titulo`, `categoria`, `descricao`, `obra_id`, `responsavel_id`, `status`, `data_vencimento`, `org_id`.
- `checklist_items`: `id`, `checklist_id`, `titulo`, `descricao`, `prioridade`, `status`, `requer_anexo`, `obrigatorio`, `observacoes`, `completed_at`, `completed_by`.
- `documentos`: `checklist_id`, `checklist_item_id`, `nome`, `tipo`, `url`, `tamanho`.
- `org_members`: `org_id`, `user_id`, `role`, `status`.
- `obras`: colunas obrigatorias e constraint `obras_tipo_check` com valores validos como `Residencial`.

Controles implementados:

- Edge Function `generate-checklist-pdf` com JWT obrigatorio.
- Edge Function `send-checklist-email` com JWT obrigatorio.
- Helper compartilhado `checklist-report.ts` para carregar checklist, itens, anexos, responsavel e obra com service role.
- Validacao server-side de membership ativa em `org_members`.
- Geracao de PDF real com `pdf-lib`.
- Envio real por Resend, com validacao de destinatarios antes de chamar o provedor.
- UI de `ChecklistDetalhes` passou a baixar PDF real, enviar e-mail real e mostrar estados de loading.
- Botao `Salvar` passou a executar `refetch()` do checklist no Supabase em vez de delay falso.

Deploy:

```powershell
npx supabase functions deploy generate-checklist-pdf --use-api
npx supabase functions deploy send-checklist-email --use-api
```

Resultado: deploy concluido no projeto `bgdvlhttyjeuprrfxgun`.

Confirmacao remota:

```powershell
npx supabase functions list --output json
```

Resultado confirmado:

- `generate-checklist-pdf`: `ACTIVE`, `verify_jwt: true`, `version: 1`.
- `send-checklist-email`: `ACTIVE`, `verify_jwt: true`, `version: 1`.

Validacao controlada:

- Criado usuario temporario fake.
- Criada organizacao temporaria fake com membership ativa.
- Criada obra temporaria fake.
- Criado checklist temporario fake com itens.
- Login feito com usuario fake para obter JWT real.
- `generate-checklist-pdf` chamada com `checklist_id` do checklist fake.
- `send-checklist-email` chamada com o destinatario de teste `delivered@resend.dev`.

Resultado:

- PDF: HTTP 200, `content-type = application/pdf`, 1784 bytes.
- Validacao de e-mail invalido: HTTP 400, `VALIDATION_ERROR`, sem envio.
- Envio real: HTTP 200, `success: true`, `email_id` presente, destinatario `delivered@resend.dev`.

Limpeza:

- O checklist temporario foi removido.
- A obra temporaria foi removida.
- A organizacao temporaria foi removida.
- O profile temporario foi removido.
- O usuario temporario foi removido de `auth.users`.
- Consulta final confirmou contagem zero em:
  - `auth.users` com `email like 'prd-falso-checklist-%@example.invalid'`
  - `public.profiles` com `email like 'prd-falso-checklist-%@example.invalid'`
  - `public.orgs` com `slug like 'prd-falso-checklist%'`
  - `public.obras` com `slug like 'prd-falso-checklist%'`
  - `public.checklists` com `titulo like 'PRD Falso Checklist%Validacao'`

Validacao tecnica:

- `npm.cmd run lint`: passou com 34 warnings e 0 erros.
- `npm.cmd run test`: passou com 8 arquivos e 27 testes.
- `npm.cmd run build`: passou.

## Pendente

## Chat publico de contato

Data: 2026-05-29

Arquivos:

- `src/components/chat/ExpandableChatDemo.tsx`
- `src/pages/Contato.tsx`

Falsidade encontrada:

- O componente e renderizado em `/contato`.
- O texto inicial se apresentava como assistente virtual.
- A resposta usava delay artificial com `setTimeout`.
- Havia botoes visiveis de anexo e microfone.
- `handleAttachFile` e `handleMicrophoneClick` nao executavam nenhuma acao real.
- As respostas eram locais/predefinidas, sem backend de IA ou atendimento humano.

Decisao:

- Nao criar backend de IA nesta etapa.
- Tornar o recurso honesto e funcional como ajuda rapida local.
- Remover a expectativa falsa de anexo, voz e assistente inteligente.

Controles implementados:

- Removidos `Paperclip`, `Mic`, `handleAttachFile`, `handleMicrophoneClick` e delay artificial.
- Removido avatar externo por URL de imagem.
- Texto do chat passou a se apresentar como `Ajuda Meta Construtor`.
- Respostas locais foram mantidas como direcionamento objetivo para paginas/canais reais.
- Botao `Enviar` fica desabilitado quando nao ha pergunta.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com 34 warnings e 0 erros.
- `npm.cmd run test`: passou com 8 arquivos e 27 testes.

Validacao visual local:

- Rota aberta: `http://127.0.0.1:5174/contato`.
- Chat aberto pelo botao flutuante.
- Pergunta enviada: `preco`.
- Resultado confirmado: `Ajuda Meta Construtor` visivel, resposta contem `/preco`.
- Ausencias confirmadas no texto renderizado: `assistente virtual`, `Anexar`, `Microfone`.

## EventTrigger legado de integracoes

Data: 2026-05-31

Arquivo:

- `src/components/integrations/EventTrigger.tsx`

Falsidade encontrada:

- A busca estatica por `EventTrigger` retornou apenas o proprio arquivo.
- O componente nao era importado por `/app/integracoes` nem por outro componente ativo.
- A tela continha teste direto de integracoes e criava um arquivo mock para Google Drive com `new File(['Test file content'], ...)`.
- Se reativado, poderia apresentar teste operacional sem origem real de arquivo do usuario.

Decisao:

- Remover o componente legado em vez de criar uma rota ou fluxo novo.
- Manter os fluxos reais de integracao nos pontos ja ativos: `integrationService`, Edge Functions e componentes usados por `/app/integracoes`.

Resultado:

- `src/components/integrations/EventTrigger.tsx` removido.
- Busca estatica confirmou que nao havia import ativo a ajustar.

## Home, checkout e analytics

Data: 2026-05-31

Arquivos:

- `src/pages/Index.tsx`
- `src/components/landing/VideoDemo.tsx`
- `src/pages/Checkout.tsx`
- `src/integrations/analytics.ts`
- `supabase/functions/create-checkout-session`
- `supabase/config.toml`

Falsidades/regressoes encontradas:

- O build falhou inicialmente porque a home importava `VideoDemo` enquanto o arquivo ainda nao estava disponivel no workspace local.
- O arquivo `VideoDemo.tsx` apareceu depois no workspace e foi mantido como componente real da home.
- O cache incremental do TypeScript precisou ser limpo com `npx.cmd tsc -b --clean` para revelar os erros atuais.
- `analytics.ts` estava com sintaxe quebrada e tentava gravar colunas inexistentes em `analytics_events`, contrariando o contrato ja validado de `id`, `event`, `properties`, `created_at`.
- `/checkout` misturava o novo fluxo hospedado com restos de modal antigo (`step`, `clientSecret`, `CheckoutDialog`), quebrando TypeScript e mantendo uma mensagem de pagamento aberto sem fluxo real renderizavel.

Controles implementados:

- `src/pages/Index.tsx` manteve a importacao e renderizacao de `VideoDemo`, agora validado como componente existente.
- `src/integrations/analytics.ts` foi restaurado e corrigido para inserir somente `event` e `properties` em `analytics_events`.
- Metadados de sessao, marketing, ambiente e request ficam dentro de `properties`.
- `src/pages/Checkout.tsx` ficou em etapa unica de dados e redireciona para `create-checkout-session` via Supabase Edge Function.
- Busca estatica confirmou `supabase/functions/create-checkout-session` presente e `supabase/config.toml` com `verify_jwt = true`.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com 33 warnings e 0 erros.
- `npm.cmd run test`: passou com 9 arquivos e 30 testes.

## Prefetch de dados ficticios

Data: 2026-05-31

Arquivos:

- `src/utils/prefetcher.ts`
- `src/components/OptimizedLink.tsx`
- `eslint.config.js`

Falsidade encontrada:

- A varredura estatica focada em `Promise.resolve` encontrou `src/utils/prefetcher.ts` com dados operacionais hardcoded.
- O metodo `prefetchCriticalData` populava cache com `dashboard-stats`, `user-profile`, `recent-obras`, `recent-rdos` e `notifications`.
- Os exemplos incluiam totais fixos, obras como `Obra Centro` e notificacao `RDO Pendente`.
- `src/components/OptimizedLink.tsx` importa `usePrefetch`, confirmando que a utility pertence ao app ativo, mesmo sem consumo direto atual desses dados ficticios.

Decisao:

- Nao substituir por novas consultas sem contrato de tela consumidora.
- Remover os fetchers hardcoded para impedir cache operacional falso.
- Manter `prefetchCriticalData` apenas como mecanismo para fetchers reais fornecidos explicitamente por chamador.

Controles implementados:

- `prefetchCriticalData` agora recebe `Array<{ key, fetcher }>` e retorna sem efeito quando nenhum fetcher real e fornecido.
- `initializePrefetch` deixou de popular dados criticos ficticios e manteve somente prefetch de rotas.
- Busca estatica confirmou ausencia de `Obra Centro`, `Obra Norte`, `RDO Pendente`, `equipamentosAtivos` e `Promise.resolve` de arrays/objetos em `src/utils/prefetcher.ts`.

Observacao de validacao:

- A primeira execucao de `npm.cmd run lint` falhou porque `eslint .` passou a varrer `MetaConstrutor/.obsidian/plugins`, pasta local fora do app.
- `eslint.config.js` foi ajustado para ignorar `MetaConstrutor/**`, sem alterar os arquivos dessa pasta externa.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com 33 warnings e 0 erros.
- `npm.cmd run test`: passou com 9 arquivos e 30 testes.

## Alertas, checkout success e upload/aprovacao

Data: 2026-05-31

Arquivos:

- `src/pages/Contato.tsx`
- `src/pages/CheckoutSuccess.tsx`
- `src/components/ExpenseApprovalDialog.tsx`
- `src/components/checklist/FileUploadComponent.tsx`
- `src/components/security/SecureUpload.tsx`
- `src/components/security/SecureFormExample.tsx`
- `supabase/functions/create-portal-session`

Falsidades encontradas:

- `/contato` chamava a Edge Function real `send-contact`, mas falha de envio era comunicada por `alert(...)`.
- `/checkout/success` usava delay artificial antes de declarar `Pagamento confirmado!` e `assinatura foi ativada`.
- `/checkout/success` mostrava acoes de recibo/e-mail que apenas exibiam toasts, sem backend real.
- `FileUploadComponent`, `SecureUpload` e `SecureFormExample` nao tinham referencias ativas e simulavam upload, antivirus e envio com estado local/delays.
- `ExpenseApprovalDialog` usava `alert(...)` quando a rejeicao nao tinha motivo, apesar de a mutation real de aprovacao/rejeicao ja existir.

Decisoes:

- Nao criar um novo backend de recibo/e-mail para checkout nesta etapa.
- Confirmar sucesso de checkout apenas quando o banco indicar assinatura real `active` ou `trialing`.
- Usar a Edge Function real `create-portal-session` para gestao de cobranca/recibos pelo portal Stripe.
- Remover componentes legados sem referencias em vez de deixar simulacoes reutilizaveis.

Controles implementados:

- `Contato.tsx` passou a manter `isSubmitting` e `submitError`, exibindo erro inline e evitando duplo envio.
- `CheckoutSuccess.tsx` passou a consultar `supabase.auth.getUser()`, `profiles` e `subscriptions`; sem assinatura real, a tela fica pendente ou em erro.
- `CheckoutSuccess.tsx` removeu recibo/download/e-mail ficticios e adicionou acao real para portal de cobranca via `create-portal-session`.
- `ExpenseApprovalDialog.tsx` passou a mostrar erro inline para rejeicao sem motivo, preservando `approveExpense.mutateAsync`.
- `FileUploadComponent.tsx`, `SecureUpload.tsx` e `SecureFormExample.tsx` foram removidos.

Busca estatica:

```powershell
rg -n "FileUploadComponent|SecureUpload" src -g "*.tsx" -g "*.ts"
rg -n "alert\(|Simular|simulate|Mock|mock|Recibo gerado|E-mail enviado|Pagamento confirmado|assinatura foi ativada|setTimeout\(" src\pages\Contato.tsx src\pages\CheckoutSuccess.tsx src\components\ExpenseApprovalDialog.tsx src\components\checklist src\components\security -g "*.tsx" -g "*.ts"
```

Resultado:

- Nenhuma referencia ativa restante a `FileUploadComponent` ou `SecureUpload`.
- Nos arquivos priorizados, nao restaram `alert(...)`, recibo/e-mail ficticio, nem confirmacao falsa de pagamento.
- Permanece `setTimeout` apenas como espera tecnica de polling em `CheckoutSuccess.tsx` para aguardar confirmacao real do webhook.
- Ocorrencias de `mock` restantes no escopo consultado pertencem a arquivos de teste em `src/components/security/__tests__/`.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com 33 warnings e 0 erros.
- `npm.cmd run test`: passou com 9 arquivos e 30 testes apos alinhar `src/pages/__tests__/auth-flow.test.tsx` ao contrato atual `signIn(email, password, redirectTo?)`.

## RDO e checkout legados sem rota ativa

Data: 2026-06-01

Arquivos removidos:

- `src/components/RDOForm.tsx`
- `src/components/rdo/RDOApprovalSection.tsx`
- `src/components/checkout/PaymentForm.tsx`
- `src/components/checkout/CheckoutDialog.tsx`
- `src/components/ui/checkout-dialog.tsx`
- `src/components/pricing/PricingFlow.tsx`
- `src/components/pricing/StripePaymentWrapper.tsx`
- `src/components/profile/EmbeddedCheckout.tsx`
- `src/components/profile/PlanSelectionModal.tsx`
- `src/pages/Pricing.tsx`

Falsidades encontradas:

- `RDOForm` nao tinha referencias ativas e ainda usava `alert(...)` para validacao obrigatoria.
- `RDOForm` mantinha atividades hardcoded e upload apenas em estado local, dependendo de um chamador externo para persistir corretamente.
- `RDOApprovalSection` nao tinha referencias ativas e exibia sucesso visual para exportar PDF/e-mail apos callbacks opcionais, sem garantir backend real.
- `Pricing`, `PricingFlow`, `StripePaymentWrapper`, `EmbeddedCheckout`, `PlanSelectionModal` e dialogs antigos de checkout duplicavam caminhos de cobranca fora das rotas oficiais.
- A rota ativa de produto nao registra `/pricing`; o fluxo publico atual usa `/preco`, `/checkout`, `/checkout/success` e `/checkout/cancel`.

Decisao:

- Remover codigo morto em vez de tentar manter duas arquiteturas de checkout/RDO.
- Preservar o fluxo atual de RDO nas telas e hooks ativos.
- Preservar o checkout oficial em `/checkout` e gestao em `/app/planos`, com `create-checkout-session` e `create-portal-session`.

Busca estatica:

```powershell
rg -n 'PaymentForm|CheckoutDialog|EmbeddedCheckoutComponent|PlanSelectionModal|PricingFlow|StripePaymentWrapper|RDOApprovalSection|RDOForm' src -g '*.tsx' -g '*.ts'
```

Resultado:

- Nao restaram referencias aos componentes removidos.
- Ocorrencias restantes de `RDOForm` pertencem ao tipo `RDOFormData`, usado pelos componentes reais do fluxo novo de RDO.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 9 arquivos e 30 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Cadastro, FAQ e seguranca do perfil

Data: 2026-06-01

Arquivos:

- `src/components/ui/sign-up-steps.tsx`
- `src/components/ui/advanced-chat.tsx`
- `src/components/profile/SecurityCard.tsx`

Falsidades encontradas:

- O cadastro em `/criar-conta` tinha delays artificiais de validacao com `setTimeout`/`Promise`, sem chamada real de backend nessa etapa.
- O chat de `/app/faq` se apresentava como assistente virtual, usava delay aleatorio e exibia botoes de anexo/microfone sem implementacao.
- O card de seguranca do perfil prometia `Sessoes Ativas` e gerenciamento de dispositivos, mas o botao apenas informava a sessao atual.

Controles implementados:

- `sign-up-steps.tsx` removeu os delays artificiais; as etapas avancam apos validacao local e a validacao real permanece no envio final do cadastro.
- `advanced-chat.tsx` virou ajuda rapida local deterministica, sem promessa de IA, sem delay, sem anexo/microfone e sem avatars externos.
- `SecurityCard.tsx` passou de `Sessoes Ativas` para `Sessao Atual`, alinhando texto e acao ao que existe hoje.

Busca estatica:

```powershell
rg -n "setTimeout\(|assistente virtual|Paperclip|Mic|handleAttachFile|handleMicrophoneClick|Simulate|simulate|Promise\.resolve|await new Promise" src\components\ui\sign-up-steps.tsx src\components\ui\advanced-chat.tsx src\components\profile\SecurityCard.tsx
```

Resultado:

- Nao restaram delays artificiais nem handlers vazios de anexo/microfone nos arquivos de cadastro e FAQ.
- Permanece `setTimeout` em `SecurityCard.tsx` somente apos resposta real de `delete-account`, para executar sign-out/redirecionamento apos a exclusao confirmada.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 10 arquivos e 33 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Auth, checkout e copia/compartilhamento

Data: 2026-06-01

Arquivos:

- `src/hooks/useSignUp.ts`
- `src/pages/CriarConta.tsx`
- `src/pages/Checkout.tsx`
- `src/components/social/SocialShareButton.tsx`
- `src/components/ReferralManager.tsx`
- `src/components/AchievementsBadges.tsx`
- `src/components/integrations/WebhookManager.tsx`
- `src/pages/ConfigurarPerfil.tsx`
- `src/pages/Lixeira.tsx`

Falsidades encontradas:

- `useSignUp` aguardava 1,5s fixos antes de consultar `profiles`.
- `/criar-conta` e `/checkout` usavam delay fixo para navegar apos sucesso real.
- O signup retornava sucesso mesmo quando o login automatico falhava, permitindo que o chamador tentasse ir ao dashboard sem sessao.
- Copia e compartilhamento indicavam sucesso sem tratar falha de clipboard ou popup bloqueado.

Controles implementados:

- A espera de perfil virou polling real em `profiles`, com no maximo 5 tentativas e intervalo curto.
- `CriarConta` e checkout gratuito navegam imediatamente apos sucesso real.
- Signup sem login automatico agora informa que a conta foi criada e nao dispara redirect do chamador.
- Copia/compartilhamento em social share, indicacao, conquistas, webhooks, perfil publico e lixeira tratam falhas locais.
- `onShareSuccess` fica condicionado a popup/acao local bem-sucedida em `SocialShareButton`.

Busca estatica:

```powershell
rg -n "setTimeout\(|await new Promise|Redirecionando|Compartilhamento iniciado|navigator\.clipboard\.writeText\(|window\.open\(" src\hooks\useSignUp.ts src\pages\CriarConta.tsx src\pages\Checkout.tsx src\components\social\SocialShareButton.tsx src\components\ReferralManager.tsx src\components\AchievementsBadges.tsx src\components\integrations\WebhookManager.tsx src\pages\ConfigurarPerfil.tsx src\pages\Lixeira.tsx
```

Resultado:

- Restam timers apenas para reset visual de `copied`, polling tecnico de perfil e UX real.
- Popups e clipboard agora estao protegidos por try/catch ou checagem de retorno.
- `Compartilhamento iniciado!` permanece somente apos `window.open` retornar popup valido.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 11 arquivos e 34 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Nova atividade, onboarding e downloads/utilitarios

Data: 2026-06-01

Arquivos:

- `src/components/NovaAtividadeModal.tsx`
- `src/components/Onboarding.tsx`
- `src/utils/downloadHelper.ts`
- `src/hooks/useDownload.ts`
- `src/hooks/useRDODownload.ts`
- `src/hooks/useReportPdfDownload.ts`

Falsidades encontradas:

- `NovaAtividadeModal` exibia responsaveis hardcoded (`resp-1` etc.) em um fluxo ativo de atividade.
- Anexos de atividade gravavam `uploadedBy: user-id-placeholder` no estado local antes de persistir metadados.
- Upload de atividade incrementava porcentagem com `setInterval`, mesmo sem callback real de progresso do Supabase Storage.
- `Onboarding` aguardava `setTimeout(1000)` para iniciar tour automatico apos perfil real indicar `has_seen_onboarding = false`.

Controles implementados:

- `NovaAtividadeModal` passou a usar `useOrgResponsibles`, com dados reais de `org_members`/`profiles`.
- Upload de anexos exige usuario autenticado antes do envio e registra `uploadedBy` com `user.id`.
- Barra percentual simulada foi removida; a UI mostra apenas estado de envio enquanto a chamada real esta em andamento.
- `Onboarding` substituiu delay fixo por `requestAnimationFrame` com cleanup, preservando a verificacao real em `profiles`.

Downloads/utilitarios:

- `downloadHelper` e `useReportPdfDownload` mantem `setTimeout` apenas para revogar `ObjectURL` apos o clique de download.
- `useRDODownload` usa Edge Function real `generate-rdo-pdf` e valida `content-type` PDF antes de baixar.
- `useDownload` nao mostra sucesso quando a promise retorna `void`; sucesso e mostrado somente quando recebe `Blob`/`string` e chama `downloadFile`.

Busca estatica:

```powershell
rg -n "resp-1|Joao|Maria Santos|user-id-placeholder|Simular progresso|setInterval\(|setTimeout\(|1000|progressInterval|progress\.progress|responsaveis|requestAnimationFrame" src\components\NovaAtividadeModal.tsx src\components\Onboarding.tsx
```

Resultado:

- Nao restam responsaveis hardcoded, placeholder de usuario, `setInterval` de progresso ou `setTimeout` nos arquivos corrigidos.
- Permanece `requestAnimationFrame` em `Onboarding` como agendamento tecnico cancelavel.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Varredura ampla e RDO visualizar

Data: 2026-06-02

Arquivos:

- `src/pages/RDOVisualizar.tsx`
- `src/hooks/useRDODetails.ts`
- `src/components/RecentObras.tsx`
- `src/components/RecentRDOs.tsx`

Falsidades encontradas:

- `/app/rdo/:id/visualizar` exibia `Responsavel (TBD)` como dado operacional.
- A tela montava periodo com `17:00` e intervalo `12:00 - 13:00` sem coluna correspondente no schema atual de `rdos`.
- Temperatura era exibida como `N/A` sem origem real.
- Atividades e equipamentos exibiam `Equipe` e `Equipamento` genericos apesar de existirem tabelas relacionadas.
- O botao `Imprimir` estava visivel sem handler.

Controles implementados:

- `useRDODetails` passou a carregar `rdo_equipes.equipes` e `rdo_equipamentos.equipamentos`.
- `RDOVisualizar` passou a exibir equipe/equipamento relacionados quando existem.
- Campos sem dado real no schema atual passaram a aparecer como `Nao informado`, em vez de horarios, temperatura ou nomes genericos inventados.
- Botao `Imprimir` chama `window.print()`.

Busca estatica:

```powershell
rg -n 'TBD|Responsável \(TBD\)|17:00|12:00 - 13:00|temperatura|N/A|Equipe"|Equipamento"|window\.print' src\pages\RDOVisualizar.tsx src\hooks\useRDODetails.ts
```

Resultado:

- Nao restam `TBD`, horarios fixos ou temperatura inventada em `RDOVisualizar`.
- `window.print()` aparece como handler real do botao `Imprimir`.
- `RecentObras` e `RecentRDOs` ainda contem fallbacks `TBD`, mas nao apareceram como imports ativos nas rotas principais nesta varredura; ficam para auditoria separada antes de alterar/remover.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Componentes recentes legados e fallbacks tecnicos

Data: 2026-06-02

Arquivos:

- `src/components/RecentObras.tsx`
- `src/components/RecentRDOs.tsx`
- `src/components/DocumentoExpandableCard.tsx`
- `src/components/RDOExpandableCard.tsx`
- `src/pages/ChecklistDetalhes.tsx`
- `src/components/integrations/IntegrationLogs.tsx`
- `src/hooks/useChecklist.ts`
- `src/pages/RDO.tsx`
- `src/hooks/useExpenses.ts`

Falsidades encontradas:

- `RecentObras` e `RecentRDOs` nao tinham imports ativos, mas mantinham `TBD`, `mockObras`, `mockRDOs`, `Fetch relation`, zeros operacionais e horario default.
- Superficies ativas ainda exibiam `N/A` tecnico para ausencia de dado em documentos, RDO, checklist, logs de integracao, exportacao e notificacoes de despesas.
- `OptimizedDashboard` e `AppSidebar` ja usam hooks reais (`useRecentObras`, `useRecentRDOs`), entao os componentes legados nao eram necessarios para a UI ativa.

Controles implementados:

- `src/components/RecentObras.tsx` removido.
- `src/components/RecentRDOs.tsx` removido.
- Fallbacks tecnicos foram trocados por mensagens explicitas: `Tamanho nao informado`, `Sem status`, `Sem prazo`, `Nao registrado`, `Nao informado`, `Obra nao informada`, `Clima nao informado` e `Periodo nao informado`.

Busca estatica:

```powershell
rg -n "RecentObras|RecentRDOs" src -g "*.ts" -g "*.tsx"
rg -n "TBD|mockObras|mockRDOs|Default shift|Fetch relation|\bN/A\b" src -g "*.ts" -g "*.tsx"
Test-Path .\src\components\RecentObras.tsx; Test-Path .\src\components\RecentRDOs.tsx
```

Resultado:

- `RecentObras` e `RecentRDOs` nao restaram como arquivos nem imports ativos.
- A busca por `TBD`, `mockObras`, `mockRDOs`, `Default shift`, `Fetch relation` e `N/A` em `src` nao retornou ocorrencias.
- `Test-Path` retornou `False` para os dois componentes removidos.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Confirmacoes nativas em cadastros destrutivos

Data: 2026-06-02

Arquivos:

- `src/pages/Equipamentos.tsx`
- `src/pages/Equipes.tsx`
- `src/pages/Fornecedores.tsx`

Falsidades encontradas:

- As rotas de equipamentos, equipes e fornecedores tinham exclusoes reais protegidas por `confirm(...)` nativo.
- O feedback era bloqueante e externo ao estado React, sem indicar o item pendente nem o estado da mutation real.
- Os hooks ja executavam mutations reais no Supabase; o problema era a confirmacao visual, nao o backend.

Controles implementados:

- Cada pagina passou a guardar o item pendente de exclusao em estado local.
- `confirm(...)` foi substituido por `AlertDialog` controlado, com titulo, descricao do item e botao destrutivo.
- A exclusao so chama `deleteEquipamento`, `deleteEquipe` ou `deleteFornecedor` quando o usuario confirma no dialog.
- O botao de confirmacao mostra estado de envio enquanto a mutation esta pendente.

Busca estatica:

```powershell
rg -n "\bconfirm\s*\(|window\.confirm|alert\s*\(|setTimeout\s*\(|Promise\.resolve\s*\(" src/pages/Equipamentos.tsx src/pages/Equipes.tsx src/pages/Fornecedores.tsx
rg -n "\bconfirm\s*\(|window\.confirm|alert\s*\(" src -g "*.ts" -g "*.tsx"
```

Resultado:

- A busca focada em `Equipamentos.tsx`, `Equipes.tsx` e `Fornecedores.tsx` nao retornou ocorrencias.
- A varredura ampla ainda encontrou confirmacoes nativas em `AdminUsers.tsx`, `Atividades.tsx`, `Documentos.tsx`, `RDONotasSection.tsx`, `RDOVisualizar.tsx` e `RDO.tsx`.
- Ocorrencias de `alert(...)` em `src/test/comprehensive-security-test.ts` sao payloads de teste de seguranca, nao UI ativa.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

Validacao renderizada auxiliar:

- `npm.cmd run preview -- --host 127.0.0.1 --port 4173`: preview local iniciado.
- Browser interno abriu `http://127.0.0.1:4173/app/equipamentos`.
- A rota autenticada exibiu a tela de login (`Bem-vindo`, formulario de e-mail/celular e senha), sem overlay de Vite/React.
- Console do navegador retornou 0 erros/avisos relevantes.
- A interacao real de exclusao nao foi executada por falta de sessao autenticada e para evitar efeito destrutivo.
- Screenshot nao capturado: comando de captura do Browser interno expirou.

Repeticao com login QA pre-cadastrado:

- Decisao operacional do usuario: validacoes visuais futuras devem autenticar primeiro com usuario QA pre-cadastrado quando a rota for protegida.
- Conta QA usada nesta rodada: `qa-prd-falso-visual@teste.com`.
- Dados QA semeados antes da validacao: `QA PRD Falso Equipamento`, `QA PRD Falso Colaborador` e `QA PRD Falso Fornecedor`.
- Browser interno entrou pela tela real de `/login` e chegou a `/app/dashboard`, com toast de login realizado e 0 erros/avisos no console.
- `/app/equipamentos`: registro QA visivel; clique no botao destrutivo abriu `AlertDialog` com titulo `Excluir equipamento?` e texto contendo `QA PRD Falso Equipamento`; dialog cancelado sem excluir.
- `/app/equipes`: registro QA visivel; clique no botao destrutivo abriu `AlertDialog` com titulo `Excluir colaborador?` e texto contendo `QA PRD Falso Colaborador`; dialog cancelado sem excluir.
- `/app/fornecedores`: registro QA visivel; clique no botao `Excluir` abriu `AlertDialog` com titulo `Excluir fornecedor?` e texto contendo `QA PRD Falso Fornecedor`; dialog cancelado sem excluir.
- Console do navegador retornou 0 erros/avisos relevantes apos as tres verificacoes.

Processos mapeados que haviam parado pelo mesmo motivo:

- `PRD_falso.md`, 2026-05-26: validacao visual de rota protegida ficou pendente por falta de sessao autenticada no navegador local.
- `PRD_falso.md`, 2026-06-02: validacao renderizada de `/app/equipamentos` caiu em `/login` por falta de sessao.
- Novo procedimento: antes de considerar uma validacao visual de rota protegida como bloqueada, autenticar no navegador com a conta QA e repetir a rota alvo.

## Pendente

## Confirmacoes nativas restantes e botoes sem handler

Data: 2026-06-02

Arquivos:

- `src/pages/Atividades.tsx`
- `src/pages/Documentos.tsx`
- `src/pages/RDO.tsx`
- `src/pages/RDOVisualizar.tsx`
- `src/components/rdo/RDONotasSection.tsx`
- `src/components/admin/AdminUsers.tsx`

Falsidades encontradas:

- Fluxos ativos ainda usavam `confirm(...)` ou `window.confirm(...)` para acoes destrutivas/administrativas.
- `/app/atividades` tinha um botao de editar com icone visual, mas sem handler.
- RDO detalhe misturava confirmacao nativa com chamadas reais de Edge Function/mutations, deixando a tela sem estado visual controlado para envio, aprovacao, anexos e notas.
- Suspensao administrativa ja chamava Edge Function real, mas dependia de `window.confirm(...)`.

Controles implementados:

- `confirm(...)` e `window.confirm(...)` foram substituidos por `AlertDialog` controlado.
- Cada fluxo guarda o item pendente em estado React e chama a mutation/Edge Function real somente no botao destrutivo/confirmatorio do dialog.
- O botao de editar sem handler em Atividades foi removido.
- Os dialogs de RDO detalhe cobrem envio para aprovacao, aprovacao, exclusao de anexo e exclusao de nota.
- A suspensao administrativa passou a abrir `AlertDialog` antes de chamar `suspend-user`.

Busca estatica:

```powershell
rg -n "\bconfirm\s*\(|window\.confirm|alert\s*\(" src -g "*.ts" -g "*.tsx"
```

Resultado:

- A varredura ampla nao encontrou `confirm(...)`, `window.confirm(...)` ou `alert(...)` em UI ativa.
- Restaram apenas payloads de teste XSS em `src/test/comprehensive-security-test.ts`.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

Seed e repeticao de bloqueios:

- Conta QA usada: `qa-prd-falso-visual@teste.com`.
- Bloqueio reprocessado: o seed inicial foi barrado pelo limite de plano `free`; a org QA recebeu subscription ativa `professional`, mas o trigger remoto trata `max_obras = NULL` como erro. Para contornar sem DDL, a obra QA existente foi restaurada da Lixeira e reutilizada.
- Bloqueio reprocessado: o insert de RDO falhou por encoding do valor `Manha/Manhã`; o seed foi repetido com escape Unicode para gravar `Manhã`.
- Bloqueio reprocessado: o status de `rdo_atividades` remoto aceita `Em Andamento`, nao `Em andamento`; o seed foi repetido com o valor real.
- Anexo de RDO foi refeito depois que o primeiro registro nao apareceu no join de detalhe; o segundo anexo foi confirmado em `documentos` com `rdo_id` do RDO QA.

Validacao visual autenticada:

- Browser interno fez login real com `qa-prd-falso-visual@teste.com` e acessou rotas protegidas antes dos testes.
- `/app/atividades`: registro `QA PRD Falso 20260602204616 Atividade` visivel; clique no botao de Lixeira abriu `Mover atividade para a Lixeira?`; dialog cancelado.
- `/app/documentos`: registro `QA PRD Falso 20260602204616 Documento.pdf` visivel; clique em `Excluir` abriu `Mover documento para a Lixeira?`; dialog cancelado.
- `/app/rdo`: RDO da obra `QA PRD Falso 20260602204616 Obra` visivel; clique em `Excluir` abriu `Mover RDO para a Lixeira?`; dialog cancelado.
- `/app/rdo/9a4bbb3c-8aff-4557-a4f9-41dd03ef5924/visualizar`: detalhe carregou o RDO QA.
- RDO detalhe: clique em `Enviar para Aprovacao` abriu `Enviar RDO para aprovacao?`; dialog cancelado.
- RDO detalhe: nota `QA PRD Falso 20260602204616 Nota` abriu `Excluir nota?`; dialog cancelado.
- RDO detalhe: anexo `QA PRD Falso 20260602204616 Anexo RDO 2.pdf` abriu `Excluir anexo?`; dialog cancelado.
- Aprovacao administrativa e suspensao administrativa ficaram cobertas por busca estatica/build por serem fluxos sensiveis; nenhuma suspensao/aprovacao real foi confirmada visualmente.

## Botoes de icone sem nome acessivel e acoes sem handler

Data: 2026-06-02

Arquivos:

- `src/components/RDOExpandableCard.tsx`
- `src/components/rdo/RDONotasSection.tsx`
- `src/components/DocumentosObra.tsx`
- `src/components/admin/AdminCoupons.tsx`
- `src/components/admin/AdminManagers.tsx`
- `src/components/admin/AdminUsers.tsx`
- `src/components/ChecklistExpandableCard.tsx`
- `src/components/CreditsInfoDialog.tsx`
- `src/components/social/SocialShareButton.tsx`
- `src/components/NotificationPanel.tsx`
- `src/components/ObraCard.tsx`
- `src/pages/Notificacoes.tsx`
- `src/components/ReferralManager.tsx`
- `src/pages/ConfigurarPerfil.tsx`
- `src/pages/Despesas.tsx`
- `src/components/ui/expandable-chat.tsx`
- `src/components/ui/chat-bubble.tsx`
- `src/components/ui/animated-testimonials.tsx`
- `src/components/ui/calendar-rac.tsx`

Falsidades encontradas:

- Botoes icon-only em superficies ativas tinham acao real sem nome acessivel (`title`, `aria-label`, `aria-labelledby` ou texto `sr-only`).
- `DocumentosObra` exibia botao visual de download sem handler real.
- `ChecklistExpandableCard` usava `<Button>` para um icone decorativo, parecendo acao executavel.

Controles implementados:

- Botoes acionaveis receberam `title`, `aria-label` ou texto `sr-only`, conforme o padrao local do componente.
- O botao de download local sem handler foi removido de `DocumentosObra`.
- O icone decorativo de checklist deixou de ser `<Button>` e passou a elemento nao acionavel com `aria-hidden`.
- Componentes utilitarios reutilizaveis de chat, calendario, depoimentos, notificacoes e compartilhamento passaram a nomear seus controles icon-only.

Scanner estatico:

- Foi usado scanner Node especifico para `<Button>`/`<button>` compactos ou icon-only sem `title`, `aria-label`, `aria-labelledby` ou `sr-only`.
- Resultado apos os ajustes: nenhum candidato retornado.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Timers de feedback visual em rotas ativas

Data: 2026-06-02

Arquivos alterados:

- `src/components/profile/SecurityCard.tsx`
- `src/pages/RedefinirSenha.tsx`

Falsidades encontradas:

- A exclusao de conta aguardava 2 segundos apos resposta real da Edge Function antes de executar `signOut()` e navegar para `/home`.
- A redefinicao de senha aguardava 2 segundos apos `supabase.auth.updateUser(...)` antes de redirecionar para `/login`, embora a tela ja tivesse acao explicita `Ir para login`.

Controles implementados:

- `SecurityCard` passou a deslogar e navegar imediatamente depois da confirmacao real de exclusao de conta.
- `RedefinirSenha` deixou de usar redirecionamento automatico com `setTimeout`; apos sucesso, mostra o estado concluido e mantem o link explicito para login.

Classificacao dos timers mantidos no recorte:

- `CheckoutSuccess`: polling real para aguardar persistencia/webhook da Stripe, nao sucesso visual falso.
- `ChecklistDetalhes`: limpeza tecnica de CSS temporario de impressao.
- `Pricing`: inicializacao/debounce de carousel.
- `ConfigurarPerfil`, `ReferralManager` e `SuccessCheck`: expiracao local de feedback visual, sem bloquear ou simular backend.
- `GlobalSearch`, `Onboarding`, hooks de performance e prefetch: foco/renderizacao, medicao, limpeza, debounce ou prefetch tecnico.

Busca estatica:

```powershell
rg -n "setTimeout\s*\(|setInterval\s*\(|requestAnimationFrame\s*\(|Promise\.resolve\s*\(" src -g "*.ts" -g "*.tsx"
rg -n "setTimeout\s*\(|setInterval\s*\(|requestAnimationFrame\s*\(|Promise\.resolve\s*\(" src\components\profile\SecurityCard.tsx src\pages\RedefinirSenha.tsx src\pages\CheckoutSuccess.tsx src\pages\ChecklistDetalhes.tsx src\components\ui\pricing.tsx
```

Resultado:

- `src/components/profile/SecurityCard.tsx` nao possui mais `setTimeout` para logout.
- `src/pages/RedefinirSenha.tsx` nao possui mais `setTimeout` nem `useNavigate` para redirecionamento automatico.
- Os timers restantes lidos no recorte foram classificados como tecnicos, nao como confirmacao ficticia.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run test`: passou com 12 arquivos e 38 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

## Marketing publico com mockups, metricas e APIs ficticias

Data: 2026-06-02

Arquivos alterados/removidos:

- `src/components/landing/HeroSectionNew.tsx`
- `src/components/landing/VisualWorkflowSection.tsx`
- `src/components/landing/ModernFeaturesSection.tsx`
- `src/components/landing/StatsSection.tsx`
- `src/components/landing/VideoDemo.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/sobre/ImpactMetrics.tsx`
- `src/pages/APIPage.tsx`
- `src/pages/Documentacao.tsx`
- `src/pages/Status.tsx`
- `src/components/DocumentosObra.tsx`
- `scripts/prd-usuario-ciclo2-auth-smoke.mjs`
- Removidos: `src/components/landing/DashboardPreview.tsx`, `src/components/landing/DashboardPreviewMockup.tsx`, `src/components/landing/DemoSection.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/FeaturesSection.tsx`, `src/components/landing/TestimonialsSection.tsx`, `src/components/ui/hero-modern.tsx`, `public/code_SEÇÃO INICIAL.html`.

Falsidades encontradas:

- Componentes publicos ativos estavam zerados por bytes nulos e/ou vinham do historico com mockup de dashboard, formulario `Gerar RDO Agora`, avatares e `+ de 500` construtoras.
- `/status` exibia uptime, latencia e incidentes fixos sem fonte de monitoramento publico.
- `/documentacao` e `/api` anunciavam SDK publico, REST API externa, chaves genericas, rate limit e latencia sem contrato implementado.
- `/sobre` exibia metricas comerciais detalhadas sem fonte auditavel.
- Componentes legados sem import ativo mantinham carrossel de demo, mockups e depoimentos/numeros ficticios para reuso acidental.
- `DocumentosObra` voltou a expor botao de download sem handler e nao aceitava o contrato `onFilesChange` usado por `NovaObraForm`.

Controles implementados:

- Home publica passou a usar seções explicativas sem mockup de produto nem estatisticas comerciais sem fonte.
- `/api` e `/documentacao` agora declaram que SDK publico/API externa nao estao publicados nesta versao e listam apenas limites/Edge Functions reais conhecidos.
- `/status` deixou de publicar uptime/latencia ficticios e passou a explicar que metricas numericas dependem de monitoramento externo auditavel.
- `/sobre` trocou metricas inventadas por beneficios operacionais verificaveis.
- Legados de preview/demo/depoimentos sem import ativo foram removidos.
- `DocumentosObra` voltou a enviar arquivos reais para `NovaObraForm`, respeita `disabled` e removeu o download visual sem handler.
- Script zerado `prd-usuario-ciclo2-auth-smoke.mjs` foi restaurado como arquivo JS valido para nao quebrar lint.

Busca estatica:

```powershell
rg -n "\+ de 500|500\+|2\.5K|R\$ 2\.8|R\$ 1\.2|95%|99\.9|99\.98|99\.99|42ms|45ms|Obras Gerenciadas|Satisfação dos Clientes|Dashboard Intuitivo|Experimente Agora|Gerar RDO Agora|Obra Modelo|Resultados reais|Metodologia: Dados coletados|tour visual|api\.metaconstrutor|@metaconstrutor/sdk|SUA_API_KEY|Performance otimizada com respostas|SDKs Dispon" src public -g "*.tsx" -g "*.ts" -g "*.html"
```

Resultado:

- Busca estatica retornou vazia apos os ajustes.
- Checagem de componentes publicos/marketing nao encontrou bytes nulos em `src/components/landing` e `src/components/sobre`.

Validacao tecnica:

- `npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- `npm.cmd run test`: passou com 12 arquivos e 40 testes.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.

Validacao renderizada publica:

- `npm.cmd run preview -- --host 127.0.0.1 --port 4175`.
- Playwright abriu `/home`, `/api`, `/documentacao`, `/status` e `/sobre`.
- Nenhuma rota validada teve console error/warning.
- Nenhuma rota validada exibiu os termos falsos buscados.
- Screenshot salvo: `docs/evidence/prd-falso-public-home-2026-06-02.png`.

## Fontes corrompidas e rotas lazy

Data: 2026-06-03

Escopo auditado:

- `src`, `scripts` e `public` para bytes nulos em arquivos texto.
- Imports dinamicos/lazy em `src/components/PerformanceOptimizedApp.tsx`, `src/pages/Contato.tsx`, `src/pages/Sobre.tsx`, `src/utils/routePreloader.ts` e utilitarios relacionados.
- Rotas publicas e rotas protegidas representativas em preview.

Resultado da varredura binaria:

```powershell
node -e "const fs=require('fs'), path=require('path'); const roots=['src','scripts','public']; ..."
```

Resultado:

- `[]`
- Nao foram encontrados bytes nulos em arquivos texto de `src`, `scripts` ou `public`.

Mapa lazy/import:

```powershell
rg -n 'lazy\(|import\(' src -g '*.tsx' -g '*.ts'
```

Resultado:

- Imports lazy principais concentrados em `src/components/PerformanceOptimizedApp.tsx`.
- Lazy adicional confirmado em `/contato` (`ExpandableChatDemo`) e `/sobre` (`TimelineSection`, `TeamSection`, `InstitutionalTestimonials`, `ImpactMetrics`).
- `routePreloader` segue apenas como prefetch de modulos e nao como fonte de dados ficticios.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `postbuild`: sitemap e prerender de 18 rotas publicas concluidos.
- Avisos remanescentes: `color-adjust` depreciado e aviso Vite de modulo Supabase importado dinamica/estaticamente; nenhum deles bloqueia carregamento de rota.

Validacao renderizada em preview:

- Preview: `npm.cmd run preview -- --host 127.0.0.1 --port 4176`.
- Browser integrado abriu `/home`; titulo `Meta Construtor | Sistema de gestao de obras e RDO digital`, DOM nao vazio e sem logs `error`/`warn`.
- Smoke Playwright percorreu 52 rotas:
  - 23 rotas publicas.
  - 29 rotas protegidas em modo redirecionamento sem sessao.
- Resultado do smoke: `failures: []`, `consoleRows: []`.
- Rotas protegidas sem sessao redirecionaram para `/login`, sem tela vazia, `pageerror` ou overlay de framework.

Validacao autenticada com usuario QA:

- Usuario: `qa-prd-falso-visual@teste.com`.
- Login real em `/login` passou e redirecionou para `/app/dashboard`.
- Rotas autenticadas abertas com conteudo principal carregado e sem logs relevantes:
  - `/app/fornecedores`: heading `Gestao de Fornecedores`, registro QA visivel.
  - `/app/integracoes`: heading `Configuracoes de Integracoes`, servicos e conectores renderizados.
  - `/app/seguranca`: heading `Seguranca`, auditoria administrativa e eventos reais renderizados.

Screenshots salvos:

- `docs/evidence/prd-falso-lazy-routes-home-2026-06-03.png`
- `docs/evidence/prd-falso-lazy-routes-protected-redirect-2026-06-03.png`
- `docs/evidence/prd-falso-lazy-routes-auth-fornecedores-2026-06-03.png`

## Legados nao importados com login/mockup/metricas ficticias

Data: 2026-06-03

Escopo auditado:

- Grafo simples de imports a partir de `src/main.tsx`.
- Busca por termos de alto risco em arquivos fora da arvore ativa: `mockup`, `simulado`, `ficticio`, `Login Direto`, `test_token`, `google_auth_token`, `Gerar RDO Agora`, `99.9`, `+ de 500`, `stats.users`, `stats.satisfaction`.

Arquivos removidos:

- `src/components/ui/hero-section.tsx`
- `src/components/ui/hero-section-modern.tsx`
- `src/components/ui/feature-expandable-card.tsx`
- `src/components/ui/animated-login.tsx`

Falsidades encontradas:

- `hero-section.tsx` criava usuario e tokens falsos em `localStorage` para redirecionar direto a `/app/dashboard`.
- `hero-section.tsx` exibia dashboard simulado com numeros inventados (`Obras Ativas`, `Equipes`, `RDOs`) e barras aleatorias.
- `animated-login.tsx` tentava simular Google login chamando `signIn("google.user@gmail.com", "google_auth_token")`.
- `feature-expandable-card.tsx` aceitava `stats.improvement`, `stats.users`, `stats.satisfaction` e testemunho como props para renderizar metricas/depoimento sem fonte.
- `hero-section-modern.tsx` era hero alternativo nao importado com preview visual de dashboard, mantendo risco de reuso em marketing.

Controles implementados:

- Os quatro legados foram removidos por nao terem import ativo.
- A busca focada confirmou ausencia dos marcadores removidos em `src`.
- A varredura residual de alto risco em arquivos nao alcancaveis restou apenas com comentarios tecnicos em `PerformanceStatusIndicator` e `performanceMonitor` sobre ambiente de desenvolvimento/performance baixa, sem promessa visual de produto.

Validacao tecnica:

- `npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.
- Busca focada:

```powershell
rg -n "Login Direto|test_user_|test_token_|google.user@gmail.com|google_auth_token|Header simulado|Grid de cards simulado|Area de grafico simulado|Dashboard - Meta Construtor|FeatureExpandableCard|HeroSectionModern|components/ui/hero-section|\+\{stats\.improvement\}|stats\.satisfaction|stats\.users" src -g "*.tsx" -g "*.ts"
```

Resultado:

- Sem ocorrencias.

## Textos ativos de integracoes, FAQ e marketing

Data: 2026-06-03

Escopo auditado:

- `src/pages/FAQ.tsx`
- `src/pages/Integracoes.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Atualizacoes.tsx`
- `src/components/landing/PlansSection.tsx`
- `src/components/landing/PricingSection.tsx`
- `src/components/integrations/GmailConfigCard.tsx`
- `src/components/integrations/GoogleDriveConfigCard.tsx`
- `src/components/integrations/GoogleCalendarConfigCard.tsx`

Falsidades ou promessas sem contrato real encontradas:

- Relatorios automaticos, backup automatico, sincronizacao automatica e agendamento automatico apareciam como recursos ativos.
- Integracoes Google/Gmail/Drive/Calendar eram descritas como automacoes prontas sem separar credenciais, backend e teste real.
- Marketing e atualizacoes citavam IA, API REST/API completa, webhooks e fluxos automaticos implementados como entregues.
- Configuracoes de backup indicavam execucao automatica, quando a tela apenas registra preferencias.

Controles aplicados:

- Textos ativos foram reescritos para indicar estado real, bloqueado ou futuro.
- Integracoes agora exigem credenciais, backend aplicavel e teste real antes de serem tratadas como ativas.
- Webhooks permanecem bloqueados por decisao de produto enquanto nao houver backend real.
- Backup passou a ser descrito como preferencia registrada; a tela nao executa rotina automatica.
- Promessas de IA, API completa/API personalizada e automacoes futuras deixaram de aparecer como funcionalidades entregues.

Busca estatica focada:

```powershell
rg -n "relat[oó]rios autom[aá]ticos|backup autom[aá]tico|sincroniza[cç][aã]o autom[aá]tica|envio autom[aá]tico|agendamento autom[aá]tico|automa[cç][oõ]es inteligentes|Fluxos autom[aá]ticos implementados|Upload autom[aá]tico|Relat[oó]rios avan[cç]ados com IA|Sistema de cr[eé]ditos autom[aá]tico|API completa dispon[ií]vel|API personalizada|Webhooks personalizados|API REST documentada" src\pages src\components -g "*.tsx" -g "*.ts"
```

Resultado:

- Restaram apenas ocorrencias aceitaveis em texto negativo/bloqueado:
  - `src/components/chat/ExpandableChatDemo.tsx`: informa que webhooks personalizados seguem bloqueados.
  - `src/pages/FAQ.tsx`: informa que nao ha backup automatico configuravel pelo usuario.

Validacao tecnica:

- `npm.cmd run build`: passou.
- `npm.cmd run lint`: passou com 32 warnings e 0 erros.
- O arquivo da skill de controle do browser interno nao foi encontrado no cache local; a validacao renderizada foi feita com Playwright em `vite preview`.

Validacao renderizada:

- Preview: `npm.cmd run preview -- --host 127.0.0.1 --port 4177`.
- Rotas publicas visitadas: `/atualizacoes`, `/preco`.
- Rotas protegidas visitadas apos login QA `qa-prd-falso-visual@teste.com`: `/app/faq`, `/app/integracoes`, `/app/configuracoes`.
- Smoke inicial nao registrou `pageerror` nem logs relevantes.
- Smoke complementar abriu a pergunta de FAQ sobre relatorios e a aba Backup de configuracoes:
  - FAQ confirmou texto `Nao como rotina agendada independente`.
  - Backup confirmou `Esta tela nao executa uma rotina automatica de backup`.
  - Backup confirmou `Permitir sincronizacao externa quando houver integracao real`.
  - Houve um log transitorio Supabase `Failed to fetch` no smoke complementar, sem impedir renderizacao nem assercoes de texto.

Screenshots gerados:

- `docs/evidence/prd-falso-active-copy-atualizacoes-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-preco-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-faq-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-faq-relatorios-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-integracoes-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-configuracoes-2026-06-03.png`
- `docs/evidence/prd-falso-active-copy-configuracoes-backup-2026-06-03.png`

## Status e metricas de integracoes

Data: 2026-06-03

Escopo auditado:

- `src/hooks/useIntegrations.ts`
- `src/types/integration.ts`
- `src/pages/Integracoes.tsx`
- `src/components/integrations/IntegrationDashboard.tsx`
- `src/components/integrations/N8NConfigCard.tsx`
- `src/components/integrations/WhatsAppConfigCard.tsx`
- `src/components/integrations/GmailConfigCard.tsx`
- `src/components/integrations/GoogleDriveConfigCard.tsx`
- `src/components/integrations/GoogleCalendarConfigCard.tsx`

Falsidades ou riscos encontrados:

- `saveIntegrationConfig` gravava `status: connected` ao salvar credenciais, antes de teste real.
- `mergeIntegrations` criava `isHealthy`, `successRate: 100` e `uptime: 100` apenas porque o status salvo era `connected`.
- Dashboard de integracoes exibia sucesso/uptime como metricas reais mesmo sem logs operacionais.
- Cards N8N, WhatsApp, Gmail, Drive e Calendar exibiam `Conectado`, `Ativo`, taxa de sucesso e contadores usando status sintetico ou `errorCount` como proxy de envio/sincronizacao.

Controles aplicados:

- Configuracao salva passou a gravar `pending`; apenas teste real bem-sucedido atualiza para `connected`.
- `IntegrationStatus` recebeu `hasEvidence`, `evidenceCount` e `successfulEvents`.
- Status e metricas agora sao derivados de logs operacionais persistidos (`integration.test*`/`integration.execution*`), nao de configuracao salva.
- Sem logs reais, a UI mostra `Sem evidencia`, `Sem logs persistidos` ou `Aguardando teste`.
- Contadores de `Mensagens enviadas`, `E-mails enviados`, `Arquivos sincronizados` e `Eventos criados` foram substituidos por `Eventos reais`.

Busca estatica focada:

```powershell
rg -n 'successRate\.toFixed|status\.successRate[^?]|status\.uptime[^?]|status\.latency[^?]|status\.isHealthy \? ''Ativo''|Mensagens enviadas|E-mails enviados|Arquivos sincronizados|Eventos criados|successRate: integration\.status|uptime: integration\.status' src\components\integrations src\pages\Integracoes.tsx src\hooks\useIntegrations.ts -g '*.tsx' -g '*.ts'
```

Resultado:

- Restaram apenas formatadores protegidos por `typeof status?.successRate === "number"`/`typeof status?.latency === "number"` e exibicoes que aceitam `undefined` como `-`.
- Nao restaram os contadores falsos `Mensagens enviadas`, `E-mails enviados`, `Arquivos sincronizados` ou `Eventos criados`.

Validacao tecnica:

- `npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- Warnings de build/lint permanecem no perfil conhecido do projeto: `color-adjust`, import dinamico/estatico do Supabase e avisos de hooks/fast-refresh.

Validacao renderizada:

- Preview: `npm.cmd run preview -- --host 127.0.0.1 --port 4178`.
- Login QA usado: `qa-prd-falso-visual@teste.com`.
- Rota protegida validada: `/app/integracoes`.
- Aba Servicos confirmou `Aguardando teste` ou `Desconectado`.
- Aba Dashboard confirmou textos de falta de evidencia/logs reais.
- Smoke confirmou ausencia de `100%` sintetico em conjunto com estado sem evidencia.
- Sem `pageerror` e sem logs de console relevantes.

Screenshots gerados:

- `docs/evidence/prd-falso-integration-status-services-2026-06-03.png`
- `docs/evidence/prd-falso-integration-status-dashboard-2026-06-03.png`

## Teste de cadeia de integracoes sem falso sucesso

Data: 2026-06-03

Escopo auditado:

- `src/pages/Integracoes.tsx`
- `src/hooks/useIntegrations.ts`
- `src/utils/integrationHelpers.ts`
- `src/services/eventManager.ts`
- `src/services/integrationService.ts`
- Cards de integracao N8N, WhatsApp, Gmail, Google Drive e Google Calendar.

Falsidades ou riscos encontrados:

- `testIntegration` retornava sucesso visual depois da Edge Function, mas antes de garantir persistencia do log em `analytics_events`.
- `testIntegrationChain` nao persistia evidencia propria da cadeia antes do toast da pagina.
- `handleRelatorioDaily`, `handleAtividadeAtrasada` e `handleDocumentoUpload` podiam continuar para chamadas externas mesmo quando o dispatch/evento local nao persistia.
- `eventManager` registrava mensagem de sucesso final quando N8N nao estava configurado.
- `integrationService.createLog` gerava duracao aleatoria para logs de sucesso.
- Toasts de salvar credenciais diziam que a integracao foi configurada com sucesso, sugerindo conexao operacional.

Controles aplicados:

- `useIntegrations.addLog` passou a retornar se a persistencia real aconteceu.
- `testIntegration` so retorna sucesso se o teste real e o log persistido passarem; se o log falhar, o status volta para `error`.
- `testIntegrationChain` grava `integrations.chain.test` em `analytics_events` e bloqueia sucesso sem essa evidencia.
- Helpers interrompem a cadeia antes de chamadas externas se o dispatch/evento nao persistir.
- N8N ausente nao registra mais sucesso final de disparo externo; desde `FALSO-046`, esse caso retorna erro explicito e bloqueia a cadeia.
- `createLog` nao inventa mais duracao; usa apenas `data.duration` quando fornecido.
- Toasts de salvar credenciais agora dizem que e necessario executar teste real antes de considerar a integracao conectada.

Busca estatica focada:

```powershell
rg -n "Math\.random\(\).*duration|duration: status === 'success'|configurada com sucesso|Teste conclu" src\utils\integrationHelpers.ts src\services\integrationService.ts src\services\eventManager.ts src\pages\Integracoes.tsx src\hooks\useIntegrations.ts src\components\integrations -g "*.ts" -g "*.tsx"
```

Resultado:

- Sem ocorrencias.

Validacao tecnica:

- `npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- `npm.cmd run lint`: passou com 31 warnings e 0 erros.

Validacao renderizada:

- Preview final: `npm.cmd run preview -- --host 127.0.0.1 --port 4180`.
- Login QA usado: `qa-prd-falso-visual@teste.com`.
- Rota protegida validada: `/app/integracoes`.
- Botao `Testar Integracoes` acionado.
- Resultado observado: `analytics_events` bloqueou a persistencia por RLS (`new row violates row-level security policy`).
- Comportamento validado: nenhum texto antigo `Teste concluido`, nenhuma tentativa de `gmail-integration`/CORS, nenhuma `pageerror`; apenas logs esperados de 403/RLS.
- Interpretacao: a cadeia agora falha antes de declarar sucesso ou chamar externo quando a evidencia persistida nao existe.

Screenshot gerado:

- `docs/evidence/prd-falso-integration-chain-test-2026-06-03.png`

## Contrato RLS de analytics_events para logs de integracao

Data: 2026-06-03

Escopo auditado:

- `src/hooks/useIntegrations.ts`
- `src/services/eventManager.ts`
- `src/utils/integrationHelpers.ts`
- `supabase/migrations/20260603213000_prd_falso_analytics_events_integration_rls.sql`
- Tabela remota `public.analytics_events`

Falsidades ou riscos encontrados:

- A UI ja bloqueava falso sucesso quando a persistencia falhava, mas os inserts de integracao ainda preenchiam `orgId`, `userId` e `source` principalmente dentro de `properties`.
- A policy remota de insert validava colunas canonicas (`user_id = auth.uid()` e `source = frontend`), entao a cadeia autenticada era bloqueada por RLS antes de produzir evidencia operacional real.
- Sem alinhar contrato e RLS, qualquer ajuste visual poderia voltar a mascarar falha de persistencia como estado operacional.

Controles aplicados:

- `persistLog`, `persistChainTestLog` e `eventManager.persistEvent` passaram a gravar `org_id`, `user_id`, `source`, `success` e `error` nas colunas reais de `analytics_events`.
- Criada e aplicada a migration `20260603213000_prd_falso_analytics_events_integration_rls.sql`.
- A policy remota `analytics_events_authenticated_insert_own` passou a permitir insert somente quando `user_id = auth.uid()`, `source = frontend` e, quando `org_id` existe, `public.is_org_member(org_id)` retorna verdadeiro.

Validacao de banco:

```powershell
npx.cmd supabase db query --linked --file supabase\migrations\20260603213000_prd_falso_analytics_events_integration_rls.sql
npx.cmd supabase db query --linked "select policyname, cmd, roles, with_check from pg_policies where schemaname='public' and tablename='analytics_events' and policyname='analytics_events_authenticated_insert_own';"
```

Resultado confirmado:

- Policy remota atual: `((user_id = auth.uid()) AND (COALESCE(source, 'frontend') = 'frontend') AND ((org_id IS NULL) OR is_org_member(org_id)))`.
- Query de logs apos smoke autenticado retornou:
  - `integrations.event_manager.report.daily` com `org_id`, `user_id`, `source=frontend`, `success=false` e mensagem `Processing event report.daily`.
  - `integrations.chain.test` com `org_id`, `user_id`, `source=frontend`, `success=false` e erro real `Falha ao enviar email`.

Validacao tecnica:

- `npm.cmd run lint`: passou com 33 warnings e 0 erros.
- `npm.cmd run build`: bloqueado por problema admin fora deste recorte:
  - `src/components/admin/AdminOrganizationsMetrics.tsx`: `AdminEventTimeline` sem default export.
  - `src/components/admin/AdminUsers.tsx`: `AdminEventTimeline` sem default export.
  - Conflito de casing entre `AdminEventTimeline.ts` e `adminEventTimeline.ts`.
- Revalidacao posterior do build:
  - `src/components/admin/AdminEventTimeline.tsx` existe com default export.
  - `npx.cmd tsc -b --clean` limpou estado incremental/casing stale.
  - `npm.cmd run build`: passou com prerender de 18 rotas publicas.
  - `npm.cmd run lint`: passou com 31 warnings e 0 erros.

Validacao renderizada:

- Dev server: `npm.cmd run dev -- --host 127.0.0.1 --port 4181`.
- Login QA usado: `qa-prd-falso-visual@teste.com`.
- Rota protegida validada: `/app/integracoes`.
- Botao `Testar Integrações` acionado no navegador interno.
- Resultado observado: nao houve erro de RLS e nao houve texto de sucesso falso; a cadeia avancou ate a chamada real de Gmail e falhou com `FunctionsFetchError: Failed to send a request to the Edge Function`.
- Interpretacao: o contrato/RLS de logs reais foi corrigido; o proximo bloqueio operacional e o backend externo de Gmail/Edge Function, nao uma simulacao visual.

Screenshot gerado:

- `docs/evidence/prd-falso-analytics-events-rls-smoke-2026-06-03.png`

## Gmail Edge Function com CORS dinamico e bloqueio honesto

Data: 2026-06-03

Escopo auditado:

- `supabase/functions/gmail-integration/index.ts`
- `supabase/functions/_shared/cors.ts`
- `src/services/integrationService.ts`
- Rota `/app/integracoes`

Falsidades ou riscos encontrados:

- Depois do ajuste de RLS, a cadeia de integracoes passou a chegar ao Gmail, mas a UI recebia `FunctionsFetchError: Failed to send a request to the Edge Function`.
- O erro de transporte impedia diferenciar funcao ausente, CORS, secrets ausentes, OAuth incompleto ou falha real de envio.
- `gmail-integration` importava `corsHeaders` estatico, calculado sem o `Request`; para origin local, isso podia responder com origin de producao e bloquear o browser.

Controles aplicados:

- `gmail-integration` passou a importar `getCorsHeaders` e calcular `const corsHeaders = getCorsHeaders(req)` dentro do handler.
- Preflight `OPTIONS` e todas as respostas da funcao passaram a usar os headers dinamicos do request.
- Edge Function redeployada no projeto remoto `bgdvlhttyjeuprrfxgun`:

```powershell
npx.cmd supabase functions deploy gmail-integration --use-api
```

Validacao remota:

- Login API da conta QA retornou JWT para `02876dec-f01c-4ae5-90ca-1c6aadd5e6af`.
- Preflight remoto:
  - `OPTIONS https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/gmail-integration`
  - `Origin: http://127.0.0.1:4182`
  - Resultado: `HTTP 200` e `Access-Control-Allow-Origin: http://127.0.0.1:4182`.
- POST autenticado remoto:
  - Resultado: `HTTP 400` com corpo `{"error":"Gmail integration not configured. Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET secrets.","configured":false}`.

Interpretacao:

- O erro antigo de transporte/CORS foi removido.
- Gmail permanece bloqueado de forma honesta por secrets e OAuth ausentes; nao houve sucesso visual nem envio simulado.
- A proxima decisao de produto e configurar `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` e fluxo OAuth, ou manter Gmail explicitamente bloqueado.

## Gmail bloqueado sem tentativa de envio real

Data: 2026-06-04

Escopo auditado:

- `supabase/functions/gmail-integration/index.ts`
- `src/services/integrationService.ts`
- `src/hooks/useIntegrations.ts`
- `src/components/integrations/GmailConfigCard.tsx`

Falsidades ou riscos encontrados:

- A funcao ja tinha CORS dinamico, mas ainda retornava HTTP 400 quando secrets OAuth estavam ausentes.
- `supabase.functions.invoke` podia transformar esse estado esperado em erro generico no frontend.
- `connectGmailOAuth` podia retornar uma configuracao vazia sem validar `data.success` e `oauthUrl`.
- O card Gmail ainda dizia `Conectado com sucesso`/`Gmail conectado via OAuth2` quando o fluxo apenas abria a janela ou nem recebia URL.
- O teste do card dizia `E-mail de teste enviado com sucesso`, texto forte demais para um fluxo que depende de evidencia persistida e OAuth completo.

Controles aplicados:

- Sem `GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`, `gmail-integration` retorna HTTP 200 com `success:false`, `configured:false`, `error` e `message` explicitos.
- `integrationService.testGmailConnection` exige `success === true` e `configured === true`.
- `integrationService.getGmailOAuthUrl` falha quando nao ha `oauthUrl`.
- `integrationService.sendEmail` propaga `data.error`/`data.message` em vez de mascarar a causa real.
- `connectGmailOAuth` exige `data.success === true` e `data.oauthUrl`; sem isso, lanca erro.
- `GmailConfigCard` agora mostra `OAuth iniciado` apenas quando ha URL, e `Gmail bloqueado` quando secrets/OAuth nao existem; o teste nao declara envio sem evidencia real.

Deploy:

```powershell
npx.cmd supabase functions deploy gmail-integration --use-api
```

Validacao remota:

```powershell
curl.exe -i -sS -X POST "https://bgdvlhttyjeuprrfxgun.supabase.co/functions/v1/gmail-integration" `
  -H "Origin: http://127.0.0.1:4182" `
  -H "Authorization: Bearer <JWT_QA>" `
  -H "apikey: <anon>" `
  -H "Content-Type: application/json" `
  --data-binary "@gmail-blocked-smoke.json"
```

Resultado:

- `HTTP/1.1 200 OK`.
- `Access-Control-Allow-Origin: http://127.0.0.1:4182`.
- Corpo: `{"success":false,"error":"Gmail integration not configured. Please add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET secrets.","message":"Gmail integration is blocked until OAuth secrets are configured.","configured":false}`.

Busca estatica focada:

```powershell
rg -n "Gmail conectado via OAuth2|E-mail de teste enviado|FunctionsFetchError|Conectado com sucesso" src\components\integrations\GmailConfigCard.tsx src\hooks\useIntegrations.ts src\services\integrationService.ts supabase\functions\gmail-integration\index.ts
```

Resultado:

- Sem ocorrencias.

## Build e rotas ativas apos Gmail

Data: 2026-06-04

Falsidades ou riscos encontrados:

- O build falhou por conflito de casing entre `AdminRiskList.tsx` e `adminRiskList.ts`.
- O build tambem falhou porque `/app/atividades` continuava importado em `PerformanceOptimizedApp` e `routePreloader`, mas `src/pages/Atividades.tsx` estava ausente no worktree.
- Restaurar a versao rastreada sem cuidado reintroduziria `confirm(...)` nativo e botao de editar sem handler, itens ja fechados no PRD.

Controles aplicados:

- Helper `adminRiskList.ts` renomeado para `adminRiskUtils.ts`.
- Imports em `AdminRiskList.tsx` e `AdminRetentionMetrics.tsx` atualizados para `adminRiskUtils`.
- `/app/atividades` voltou a resolver para `src/pages/Atividades.tsx` com hook real `useActivitiesSupabase`, filtros reais, edicao real e `AlertDialog` para exclusao.

Busca estatica focada:

```powershell
rg -n "confirm\(|window\.confirm" src\pages\Atividades.tsx src\components\admin\AdminRetentionMetrics.tsx src\components\admin\AdminRiskList.tsx src\components\admin\adminRiskUtils.ts
rg -n "Promise\.resolve\(|setTimeout\(" src\pages\Atividades.tsx src\components\admin\AdminRetentionMetrics.tsx src\components\admin\AdminRiskList.tsx src\components\admin\adminRiskUtils.ts
```

Resultado:

- Sem ocorrencias.

Validacao tecnica:

- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- `npm.cmd run lint`: passou com 31 warnings e 0 erros.

## Edge Functions de integracao com CORS dinamico e bloqueio honesto

Data: 2026-06-05

Escopo auditado:

- `supabase/functions/n8n-integration/index.ts`
- `supabase/functions/google-drive-integration/index.ts`
- `supabase/functions/whatsapp-integration/index.ts`
- `src/services/integrationService.ts`
- `src/hooks/useIntegrations.ts`
- `src/components/integrations/GoogleDriveConfigCard.tsx`

Falsidades ou riscos encontrados:

- `n8n-integration` importava CORS estatico e podia transformar parametros ausentes ou webhook invalido em erro HTTP generico.
- `google-drive-integration` e `whatsapp-integration` usavam wildcard `Access-Control-Allow-Origin: *` em vez do helper compartilhado com origem local/producao.
- Drive e WhatsApp retornavam HTTP 400 quando secrets estavam ausentes, estado esperado que podia virar erro de transporte em `supabase.functions.invoke`.
- Google Drive OAuth no frontend podia retornar configuracao vazia e seguir visualmente quando a funcao nao entregava `success:true` e `oauthUrl`.

Controles aplicados:

- As tres funcoes agora calculam `const corsHeaders = getCorsHeaders(req)` dentro do handler.
- Secrets/parametros ausentes retornam `success:false`, `configured:false` e mensagem explicita sem simular conexao externa.
- `google-drive-integration` e `whatsapp-integration` retornam HTTP 200 no bloqueio por secrets ausentes.
- `integrationService.testGoogleDriveConnection` exige `success === true` e `configured === true`.
- `getGoogleDriveOAuthUrl` e `connectGoogleDriveOAuth` falham sem `success:true` e `oauthUrl`.
- `GoogleDriveConfigCard` exibe `OAuth iniciado` apenas quando existe URL real, e mostra `Google Drive bloqueado` com a mensagem do backend quando o fluxo esta sem secrets.

Busca estatica focada:

```powershell
rg -n "corsHeaders = \{|import \{ corsHeaders \}|Access-Control-Allow-Origin': '\*'|getCorsHeaders" supabase/functions/n8n-integration/index.ts supabase/functions/google-drive-integration/index.ts supabase/functions/whatsapp-integration/index.ts supabase/functions/gmail-integration/index.ts
rg -n "Google Drive conectado via OAuth2|Conectado com sucesso|Conexão com Google Drive estabelecida|Google Drive bloqueado|OAuth iniciado" src/components/integrations/GoogleDriveConfigCard.tsx src/hooks/useIntegrations.ts src/services/integrationService.ts
```

Resultado:

- Nenhum CORS estatico/wildcard restante no recorte de Edge Functions.
- Textos antigos de sucesso OAuth/conexao Google Drive nao aparecem mais; restaram apenas `OAuth iniciado` e `Google Drive bloqueado`.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.

Deploy:

```powershell
npx.cmd supabase functions deploy n8n-integration google-drive-integration whatsapp-integration --use-api
```

Resultado:

- Funcoes implantadas no projeto remoto `bgdvlhttyjeuprrfxgun`: `n8n-integration`, `google-drive-integration`, `whatsapp-integration`.

Validacao remota com usuario QA:

- Conta: `qa-prd-falso-visual@teste.com`.
- Origem usada: `http://127.0.0.1:4182`.

Resultados:

- `n8n-integration`: `HTTP/1.1 200 OK`, `Access-Control-Allow-Origin: http://127.0.0.1:4182`, corpo `{"success":false,"configured":false,"error":"URL e API Key do N8N sao obrigatorios para teste real."}`.
- `google-drive-integration`: `HTTP/1.1 200 OK`, `Access-Control-Allow-Origin: http://127.0.0.1:4182`, corpo `success:false`, `configured:false` e mensagem de secrets OAuth ausentes.
- `whatsapp-integration`: `HTTP/1.1 200 OK`, `Access-Control-Allow-Origin: http://127.0.0.1:4182`, corpo `success:false`, `configured:false` e mensagem de secrets API ausentes.

Interpretacao:

- O erro de transporte/CORS local foi removido no recorte N8N/Drive/WhatsApp.
- As integracoes externas continuam bloqueadas enquanto secrets/credenciais reais nao forem configurados.
- O bloqueio agora e explicito e testavel; nao houve sucesso visual ou tentativa de conexao OAuth sem URL real.

## Cadeia de eventos e componentes legados de integracao

Data: 2026-06-05

Escopo auditado:

- `src/services/eventManager.ts`
- `src/utils/integrationHelpers.ts`
- `src/services/integrationService.ts`
- `src/hooks/useIntegrations.ts`
- `src/components/integrations`

Falsidades ou riscos encontrados:

- `eventManager.dispatch` retornava `success:true` quando `sendToN8N` era pulado por `VITE_N8N_WEBHOOK_URL` ausente.
- Esse retorno podia liberar fluxos externos seguintes em `IntegrationHelpers`, mesmo quando a automacao externa central estava indisponivel.
- `src/components/integrations/WebhookManager.tsx` nao tinha import ativo, mas ainda continha UI de salvar/testar webhook com sucesso e `prompt(...)` nativo.
- `src/components/integrations/GoogleCalendarConfigCard.tsx` nao tinha import ativo, mas ainda continha OAuth Calendar e evento de teste com sucesso visual, enquanto `/app/integracoes` trata Google Agenda como planejado/configuravel via N8N.

Controles aplicados:

- N8N ausente agora chama `logEvent(..., 'error', 'N8N not configured')`.
- `eventManager.dispatch` retorna `success:false` quando o disparo externo esta bloqueado por N8N ausente.
- `WebhookManager.tsx` foi removido por estar sem referencias ativas e contrariar a decisao de webhooks bloqueados.
- `GoogleCalendarConfigCard.tsx` foi removido por estar sem referencias ativas e manter um fluxo Calendar sem backend dedicado.

Busca estatica focada:

```powershell
rg -n "GoogleCalendarConfigCard|WebhookManager|Conectado com sucesso|Google Calendar conectado|Webhook testado com sucesso|Configuração do webhook salva com sucesso|recorded locally; N8N not configured|dispatched successfully" src/services src/hooks src/components/integrations
rg -n "GoogleCalendarConfigCard|WebhookManager" src
```

Resultado:

- `GoogleCalendarConfigCard` e `WebhookManager` nao possuem referencias restantes em `src`.
- Textos antigos de Calendar/Webhook e o retorno `recorded locally; N8N not configured` foram removidos.
- `Event ... dispatched successfully` permanece apenas no caminho em que `n8n-integration` retorna sucesso real.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.

Interpretacao:

- A cadeia ativa deixou de tratar ausencia de N8N como sucesso operacional.
- Componentes legados de integracao que poderiam reintroduzir sucesso visual falso foram eliminados antes de nova reativacao.

## Componentes e dados legados de marketing sem import ativo

Data: 2026-06-05

Escopo auditado:

- `src/components/landing`
- `src/data`
- Mapa de imports de arquivos `.ts` e `.tsx` em `src`
- Busca textual por claims de OAuth, webhook, automacao, backup, integracoes externas e sucesso operacional

Falsidades ou riscos encontrados:

- `src/components/landing/PlansSection.tsx` nao tinha import ativo e mantinha precos/copy antigos, incluindo integracoes configuraveis WhatsApp/Gmail e preferencias de backup.
- `src/components/landing/PricingSection.tsx` nao tinha import ativo e mantinha precos/copy antigos, incluindo integracoes de terceiros e preferencias de backup.
- `src/data/fake-testimonials.json`, `src/data/testimonials-data.json` e `src/data/short-testimonials.json` nao eram importados e continham depoimentos ficticios com claims sobre Google Calendar, WhatsApp, backup automatico, automacao e integracoes externas.
- Esses arquivos nao estavam em rota ativa, mas poderiam ser reativados e contradizer o estado real ja bloqueado/honesto das integracoes.

Controles aplicados:

- Removidos `src/components/landing/PlansSection.tsx` e `src/components/landing/PricingSection.tsx`.
- Removidos `src/data/fake-testimonials.json`, `src/data/testimonials-data.json` e `src/data/short-testimonials.json`.

Busca estatica e import graph:

```powershell
rg -n "fake-testimonials|testimonials-data|short-testimonials|PlansSection|PricingSection" src
rg -n "fake|Google Calendar|backup automatico|backup automático|automação|automacao|integração com outras plataformas|integração com Google Calendar|integração com WhatsApp|comentario" src/data
```

Resultado:

- Sem referencias restantes para os arquivos removidos.
- Sem residuos dos JSONs ficticios em `src/data`.
- O import graph repetido ainda aponta itens sem import direto, mas classificados como nao acionaveis neste bloco:
  - `src/components/integrations/IntegrationLogs.tsx`: componente de visualizacao por props, sem dados inventados.
  - `src/integrations/supabase/types.ts`: tipos gerados.
  - arquivos de teste e `src/vite-env.d.ts`: fora de superficie de produto.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.

Interpretacao:

- O bloco sem import ativo em `src` foi reduzido sem quebrar build.
- As promessas legadas de preco, integracoes, backup e depoimentos ficticios foram removidas antes de nova reativacao.

## Assets publicos e dados/marketing fora do grafo TypeScript

Data: 2026-06-05

Escopo auditado:

- `public`
- JSONs/textos publicos (`manifest.json`, `robots.txt`, `sitemap.xml`, `sw.js`, README e SVG)
- Assets estaticos publicaveis sem referencia ativa em `src`

Falsidades ou riscos encontrados:

- `public/SEÇÃO INICIAL.png` era screenshot estatico de dashboard com usuario, data e estado de produto simulados.
- `public/SEÇÃO INICIAL_2.png` era mockup publicitario com claims sem contrato real: `RDO Automatico`, `+ de 500 construtoras` e `100% Operacional`.
- `public/lovable-uploads/*.png` continha screenshots de demo com nomes, obras, RDOs, percentuais, contadores e status ficticios.
- `public/prints-publicitarios/2026-05-06/*.png` continha screenshots antigos de produto, incluindo integracoes com `Backup Automatico` e automacoes/fluxos suportados que contradizem o estado atual bloqueado/honesto.

Controles aplicados:

- Removidos `public/SEÇÃO INICIAL.png` e `public/SEÇÃO INICIAL_2.png`.
- Removidos 8 PNGs de `public/lovable-uploads`.
- Removidos 15 PNGs de `public/prints-publicitarios/2026-05-06`.
- Preservados assets que nao continham claim falso e/ou permanecem usados pelo app: marca, icons/manifest, `placeholder.svg` de fallback social, service worker, SEO e fotos reais de `public/marketing/obras-reais`.

Busca estatica focada:

```powershell
rg -n "Design sem nome|SEÇÃO INICIAL|SECAO|placeholder\.svg|prints-publicitarios|lovable-uploads|marketing/obras-reais|logo-meta-construtor|icon-192|icon-512|manifest\.json" src public docs PRD_falso.md
rg -n "mock|fake|fict|simulad|placeholder|demo|exemplo|automacao|automação|backup|integra" public -g "*.json" -g "*.md" -g "*.txt" -g "*.xml" -g "*.js" -g "*.svg"
rg -n "lovable-uploads|prints-publicitarios|SEÇÃO INICIAL|SECAO INICIAL|/SEÇÃO|/SECAO" src public docs PRD_falso.md index.html
```

Resultado:

- Textos publicos (`manifest`, `robots`, `sitemap`, `sw`, README e SVG) nao retornaram claims ficticios acionaveis.
- Referencias restantes para `prints-publicitarios`/`SEÇÃO INICIAL` aparecem apenas em `docs/evidence` como historico de execucao.
- `public` ficou restrito a marca, SEO, manifest/service worker, fallback social e fotos reais.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.

Interpretacao:

- O app nao publica mais screenshots estaticos antigos com metricas, usuarios, obras, RDOs ou integracoes ficticias por caminhos diretos de `public`.
- Evidencias historicas em `docs/evidence` foram preservadas por nao serem superficie de produto.

## Pendente

## Artifacts gerados e residuos fora de src/public

Data: 2026-06-05

Escopo auditado:

- Arquivos fora de `src`, `public`, `dist`, `node_modules` e `docs/evidence`.
- `.vercel/output/static` como artifact de deploy prebuilt.
- Busca residual em `src`, `public`, `.vercel`, `index.html`, `vercel.json` e `package.json`.

Falsidades ou riscos encontrados:

- `.vercel/output/static` continha um build prebuilt antigo com `SEÇÃO INICIAL.png`, `SEÇÃO INICIAL_2.png`, `code_SEÇÃO INICIAL.html`, `lovable-uploads/*.png` e JS obsoleto.
- Esse artifact poderia ser reaproveitado em deploy prebuilt e publicar estado anterior ao saneamento do `PRD_falso`.
- A busca residual tambem encontrou `Backup Automatico` em `src/hooks/useIntegrations.ts`, ainda associado ao Google Drive como fluxo padrao.
- `/app/integracoes` rotulava os badges como `Fluxos suportados`, embora os servicos externos estejam bloqueados ate configuracao/teste real.

Controles aplicados:

- Removido o diretorio gerado `.vercel/output` inteiro apos validacao do caminho absoluto dentro do workspace.
- `src/hooks/useIntegrations.ts` deixou de anunciar `Backup Automatico` e passou a listar `Organizacao de Arquivos` para Google Drive.
- `src/pages/Integracoes.tsx` passou a exibir `Fluxos previstos`, evitando declarar suporte operacional antes de configuracao e teste real.
- Docs, PRDs, logs, prints de evidencia, `fotos criativo`, workspaces auxiliares e arquivos de planejamento foram classificados como historicos/nao superficie de produto neste bloco.

Busca estatica focada:

```powershell
rg -n "SEÇÃO INICIAL|RDO Automático|RDO Automatico|500 construtoras|100% Operacional|lovable-uploads|prints-publicitarios|Backup Automático|Backup Automatico" .vercel public src index.html vercel.json package.json --glob "!docs/**" --glob "!dist/**" --glob "!node_modules/**" --glob "!*.jpg" --glob "!*.png" --glob "!*.jpeg"
rg -n "Fluxos suportados|Backup Automatico|Backup Automático" src/pages/Integracoes.tsx src/hooks/useIntegrations.ts src/components/integrations
```

Resultado:

- `.vercel/output`: ausente.
- `Fluxos suportados`, `Backup Automatico` e `Backup Automático`: sem ocorrencias no recorte ativo.
- Os termos de assets antigos aparecem apenas no PRD/evidencia como historico.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 18 rotas publicas concluido.
- Varredura pos-build encontrou residuos antigos em `dist/code_SEÇÃO INICIAL.html`, `dist/SEÇÃO INICIAL.png` e `dist/SEÇÃO INICIAL_2.png`; os tres arquivos gerados/retidos foram removidos.
- Nova varredura em `dist`, `src`, `public`, `.vercel`, `index.html`, `vercel.json` e `package.json` ficou vazia para `Backup Automatico`, `Backup Automático`, `RDO Automatico`, `RDO Automático`, `500 construtoras`, `100% Operacional`, `SEÇÃO INICIAL`, `lovable-uploads`, `prints-publicitarios` e `Fluxos suportados`.

Interpretacao:

- O repo nao mantem mais um artifact prebuilt capaz de republicar mockups ou JS anterior ao saneamento.
- O catalogo ativo de integracoes nao declara backup automatico nem suporte operacional sem evidencia real.

## Pendente

## Logs, temporarios e artefatos raiz

Data: 2026-06-06

Escopo auditado:

- Arquivos soltos na raiz com perfil de log, cache, output, dump, teste, diagnostico, SQL temporario e snapshot externo.
- Scripts que geravam arquivos RAW diretamente na raiz.
- Busca residual por claims antigos fora de `docs/evidence` e `PRD_falso.md`.

Falsidades ou riscos encontrados:

- A raiz mantinha arquivos temporarios de execucoes antigas (`.force-*`, `.vite-*`, logs de build/tsc/Vite, outputs de validacao e caches) que podiam ser confundidos com evidencia atual.
- Havia SQLs soltos, scripts diagnosticos e dumps JSON/Stripe/teste (`seed_plans.sql`, `stripe_live_products*.json`, `premium_prices*.json`, `test_user_creation.sql`, entre outros) fora de uma pasta de evidencia ou ferramenta.
- `seed_plans.sql` continha claims antigos de backup automatico, Gmail/API e fluxos que contradizem o estado atual bloqueado/honesto.
- `scripts/scan_inventory.js` e `scripts/scan_responsiveness.js` ainda gravavam `INVENTORY_RAW.json` e `RESPONSIVENESS_RAW.json` na raiz.

Controles aplicados:

- Removidos logs, caches, outputs temporarios, SQLs soltos, dumps RAW e snapshots Stripe/teste da raiz.
- Removido `DIAGNOSTIC_REPORT.md`, que era relatorio solto de diagnostico/deploy sem referencia ativa.
- `scripts/scan_inventory.js` passou a gravar `docs/evidence/generated/INVENTORY_RAW.json`.
- `scripts/scan_responsiveness.js` passou a gravar `docs/evidence/generated/RESPONSIVENESS_RAW.json`.
- Logs inativos `tmp-vite-prd-seo-blog.*` foram removidos.
- Logs `.codex-blog-preview.*` foram preservados porque pertencem ao preview ativo em `http://127.0.0.1:5189/` e nao contem termos falsos.
- `PRD_BLOG.md` foi preservado como arquivo externo ao recorte deste bloco, criado/alterado por outro fluxo durante a auditoria.

Busca estatica focada:

```powershell
rg -n "seed_plans|stripe_live_products|Backup Automatico|Backup Automático|Fluxos suportados|RDO Automatico|RDO Automático|500 construtoras|100% Operacional|SEÇÃO INICIAL|lovable-uploads|prints-publicitarios" . --glob '!node_modules/**' --glob '!docs/evidence/**' --glob '!PRD_falso.md' --glob '!*.png' --glob '!*.jpg' --glob '!*.jpeg'
Get-ChildItem -File | Where-Object { $_.Name -match '(log|output|out|error|debug|check|verify|validate|test|temp|tmp|audit|dump|rls|quality|polic|trigger|index|price|product|cache|force|rebuild|vite)' -or $_.Extension -in '.log','.txt','.out','.bak','.bak2' } | Sort-Object Name | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
```

Resultado:

- A busca por claims e nomes de artifacts antigos ficou vazia fora de `docs/evidence` e `PRD_falso.md`.
- A lista final de candidatos na raiz ficou restrita a fonte/configuracao (`index.html`, `vite.config.ts`, `vitest.config.ts`, `CHANGELOG.md`, `PRODUCT.md`), `PRD_BLOG.md` e logs do preview ativo `.codex-blog-preview.*`.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 22 rotas publicas concluido.
- Validacao visual autenticada nao executada neste bloco: a alteracao foi de copy/callback e a senha da conta QA visual `qa-prd-falso-visual@teste.com` nao esta registrada nos artefatos. Nenhuma rota foi marcada como validada visualmente sem login.

Interpretacao:

- A raiz deixou de carregar dumps, scripts diagnosticos e snapshots que poderiam republicar ou reintroduzir claims falsos.
- Os scanners locais ainda podem gerar RAW, mas agora o fazem dentro de `docs/evidence/generated`, deixando a raiz como superficie de projeto e nao como deposito de evidencia solta.
- Nenhum teste visual foi necessario neste bloco porque a alteracao foi de saneamento de arquivos raiz e destino de outputs de scripts.

## Pendente

## Workspaces auxiliares na raiz

Data: 2026-06-06

Escopo auditado:

- `codex-supabase-deploy-payment`
- `MetaConstrutor`
- `openai-whisper`
- `prints_layout`
- Referencias a esses diretorios em `package.json`, Vite, Vitest, ESLint, Vercel, Supabase config, `scripts`, `src`, `docs` e `PRD_falso.md`.

Falsidades ou riscos encontrados:

- `codex-supabase-deploy-payment` contem um workspace tecnico auxiliar com Edge Functions Stripe/Supabase duplicadas, fora do app principal.
- `MetaConstrutor` e um vault/local workspace externo; ja havia historico de interferencia no lint quando `eslint .` varria essa pasta.
- `openai-whisper` e clone terceiro do Whisper, com notebooks/testes e conteudo independente do app Meta Construtor.
- `prints_layout` contem material publicitario e manifests de campanha com massa demonstrativa; o proprio README exige revisao editorial antes de publicacao.

Controles aplicados:

- `codex-supabase-deploy-payment/`, `MetaConstrutor/` e `openai-whisper/` foram adicionados a `.gitignore`.
- Os mesmos tres workspaces tecnicos foram adicionados a `.vercelignore`, evitando upload/deploy local acidental.
- `prints_layout/` foi preservado como material publicitario: nenhum arquivo foi excluido, e o diretorio nao foi adicionado a `.gitignore` nem a `.vercelignore`, conforme decisao explicita do usuario.

Busca estatica focada:

```powershell
rg -n "codex-supabase-deploy-payment|MetaConstrutor|openai-whisper|prints_layout" package.json package-lock.json vite.config.ts vitest.config.ts eslint.config.js vercel.json supabase/config.toml scripts src docs PRD_falso.md .vercelignore .gitignore --glob '!docs/evidence/**' --glob '!node_modules/**'
rg -n "Backup Automatico|Backup Automático|Fluxos suportados|RDO Automatico|RDO Automático|500 construtoras|100% Operacional|SEÇÃO INICIAL|lovable-uploads|prints-publicitarios" codex-supabase-deploy-payment MetaConstrutor openai-whisper prints_layout --glob '!**/node_modules/**' --glob '!**/.git/**' --glob '!**/.obsidian/**' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.jpeg' --glob '!**/*.webp'
git check-ignore -v codex-supabase-deploy-payment/supabase/config.toml MetaConstrutor/Bem-vindo.md openai-whisper/README.md
git check-ignore -v prints_layout/README.md
```

Resultado:

- Nao ha chamada ativa de `codex-supabase-deploy-payment`, `openai-whisper` ou `prints_layout` em scripts/configs do app.
- As referencias a `MetaConstrutor` fora de texto de marca ficam restritas ao ignore ja existente do ESLint e aos novos ignores tecnicos.
- A busca por claims antigos nos textos/manifests auditados ficou vazia.
- `git check-ignore` confirmou que os tres workspaces tecnicos estao ignorados.
- `git check-ignore` retornou que `prints_layout/README.md` nao esta ignorado pelo Git.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 22 rotas publicas concluido.

Interpretacao:

- Ferramentas externas e clones tecnicos deixam de ser superficie acidental de commit/deploy.
- O pacote publicitario `prints_layout` permanece disponivel e preservado, mas continua exigindo revisao editorial antes de veiculacao.
- Nenhum teste visual do app foi necessario neste bloco porque a alteracao foi de fronteira de workspace/deploy, nao de rota ativa.

## Pendente

## Material publicitario preservado em prints_layout

Data: 2026-06-06

Escopo auditado:

- 28 PNGs em `prints_layout`.
- `prints_layout/README.md`.
- `prints_layout/selection-manifest.json`.
- `prints_layout/source-manifest.json`.
- `prints_layout/seed-summary.json`.

Evidencia visual:

- Contact sheet gerada: `docs/evidence/prd-falso-prints-layout-contact-sheet-2026-06-06.jpg`.

Falsidades ou riscos encontrados:

- Nenhum PNG foi excluido ou removido do pacote publicitario.
- A visao geral dos 28 prints nao mostrou claims antigos como `100% Operacional`, `500 construtoras` ou `RDO Automatico`.
- O print `prd-prints-2026-06-04-13-integracoes-status-desktop.png` ainda exibe o rotulo antigo `Fluxos suportados` nos cards de integracao.
- Os prints `prd-prints-2026-06-04-17-perfil-conta-desktop.png` e `prd-prints-2026-06-04-18-configuracoes-desktop.png` exibem dados demonstrativos visiveis: e-mail `.test`, telefone/CNPJ zerados e endereco demonstrativo.

Controles aplicados:

- `prints_layout/README.md` passou a registrar que PNGs nao devem ser excluidos sem decisao explicita.
- O README passou a orientar resolucao por recaptura, corte, mascaramento ou ajuste de copy antes de veiculacao.
- O README passou a apontar especificamente o print 13 de integracoes como item que exige revisao/recaptura antes de publicacao por conter `Fluxos suportados`.

Busca/inspecao focada:

```powershell
Get-ChildItem -LiteralPath prints_layout -Filter '*.png' | Sort-Object Name
rg -n "Backup Automatico|Backup Automático|Fluxos suportados|RDO Automatico|RDO Automático|500 construtoras|100% Operacional|SEÇÃO INICIAL|lovable-uploads|prints-publicitarios|\\.test|CNPJ|CPF|telefone|email|e-mail|demo|demonstr|fict" prints_layout --glob '!*.png'
```

Resultado:

- 28 PNGs preservados.
- Manifests confirmam massa demonstrativa e conta `campanha+prdprints10@metaconstrutor.test`.
- O risco visual principal e editorial, nao de app ativo: material deve ser recapturado/cortado/mascarado antes de veiculacao externa, sem exclusao do pacote.

Validacao tecnica:

- `npm.cmd run lint`: ja havia passado neste ciclo com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: ja havia passado neste ciclo; a alteracao posterior foi apenas README/evidencia e nao altera app.

Interpretacao:

- `prints_layout` permanece como material publicitario preservado.
- O pacote agora tem regra explicita para nao excluir arquivos e tratar riscos por revisao editorial.
- O print de integracoes nao deve ser usado para prometer suporte operacional ate ser atualizado para o contrato honesto atual.

## Pendente

## Marca, compartilhamento social e creditos

Data: 2026-06-06

Escopo auditado:

- `src/components/ReferralManager.tsx`
- `src/components/AchievementsBadges.tsx`
- `src/components/social/SocialShareButton.tsx`
- `src/components/ui/expandable-card.tsx`
- `src/components/CreditsInfoDialog.tsx`

Falsidades ou riscos encontrados:

- `ReferralManager` usava copy de WhatsApp com superlativo `melhor plataforma` e prometia 10 dias extras diretamente no texto de indicacao.
- `AchievementsBadges` compartilhava copy promocional ampla (`tecnologia e eficiencia`) e orientava o usuario a "desbloquear" selos sem explicar que dependem de registro real.
- `SocialShareButton` declarava `Compartilhamento iniciado` e chamava `onShareSuccess` quando apenas uma janela externa era aberta; isso podia ser reaproveitado para conceder credito sem publicacao confirmada.
- `CreditsInfoDialog` prometia credito por compartilhamento e validacao automatica sem chamada ativa observada para `add_credit_for_share`.
- `ObraExpandableCard` colocava `Progresso: X%` na legenda publica de compartilhamento da obra.

Controles aplicados:

- `ReferralManager` passou a compartilhar texto neutro sobre organizar obras/RDOs/equipes, sem superlativo, e agora mostra erro se o popup do WhatsApp for bloqueado.
- `AchievementsBadges` passou a compartilhar apenas o selo registrado e a explicar que conquistas aparecem quando houver selo confirmado.
- `SocialShareButton` passou a tratar Instagram/LinkedIn como preparacao de publicacao externa: copia/abre janela, mas nao chama `onShareSuccess` porque a publicacao fora do app nao pode ser confirmada.
- `CreditsInfoDialog` passou a condicionar creditos extras a registro real confirmado e removeu promessa de validacao automatica.
- `ObraExpandableCard` removeu progresso percentual da legenda publica e manteve texto de resumo neutro.

Busca estatica focada:

```powershell
rg -n "melhor plataforma|desbloquear selos|Conquistei o selo|tecnologia e efici|Progresso:|Compartilhamento iniciado|valida automaticamente|100% gratuita|ganhe <strong|ganhe 10 dias|Indique amigos" src/components src/pages src/utils --glob '!**/node_modules/**'
```

Resultado:

- A busca residual no recorte ativo ficou restrita a `src/components/rdo/RDOActivitiesSection.tsx`, onde `Progresso: {atividade.percentualConcluido}%` e dado operacional interno da atividade, nao legenda publica nem promessa comercial.
- Nao restaram ocorrencias de `melhor plataforma`, `desbloquear selos`, `Compartilhamento iniciado`, `valida automaticamente`, `100% gratuita` ou promessa direta de credito por compartilhamento nos componentes auditados.

Validacao tecnica:

- `npm.cmd run lint`: passou com 31 warnings e 0 erros.
- `npx.cmd tsc -b --clean; npm.cmd run build`: passou; prerender de 22 rotas publicas concluido.

Interpretacao:

- Compartilhamentos sociais agora representam apenas preparacao local e abertura de plataforma externa.
- Nenhum credito, conquista ou publicacao externa e tratado como sucesso sem evidencia persistida.
- Progresso percentual permanece apenas em contexto operacional interno onde o dado vem do registro da atividade.

## Pendente

- Auditar contrato legado de creditos sociais (`social_shares`, `add_credit_for_share`, `onShareSuccess`) para separar schema/RPC historicos de fluxo ativo real.
