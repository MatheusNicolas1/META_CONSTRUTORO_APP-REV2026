# PRD_USUARIO - Ciclo 1 e smokes iniciais

Data: 2026-05-27
Executor: Codex
Ambiente: local, `http://127.0.0.1:5173`
Branch inicial: `master`
Commit inicial: `c33bdf7`

## Escopo executado

- Ciclo 1: inventario tecnico, ambiente, gates base e matriz responsiva inicial.
- Smokes complementares ja existentes para rotas publicas, autenticadas, PWA, PDFs, tema, obra/RDO dinamicos e fluxo convite/RDO.
- Validacao anonima limpa para `/home`, `/preco`, `/login`, `/checkout?plan=basic` e redirecionamento de `/app/dashboard`.

## Ambiente

- `.env.local`: presente, contendo `VERCEL_OIDC_TOKEN`.
- `.env`: presente, contendo chaves esperadas para Supabase, Stripe e banco:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `DATABASE_URL`
- Servidor local: reaproveitado em `127.0.0.1:5173`.

## Gates tecnicos

| Comando | Resultado | Observacoes |
| --- | --- | --- |
| `npm run lint` | Passou | 0 erros, 34 warnings de hooks/fast-refresh ja existentes. |
| `npm run test` | Passou | 8 arquivos, 27 testes. |
| `npm run build` | Passou | Build Vite concluido; warnings de `color-adjust` e chunking dinamico/estatico do Supabase client. |

## Browser e responsividade

Validacao em contexto limpo Playwright:

- `/home`: PC, tablet e mobile sem console errors, sem 401/403/5xx e sem overflow horizontal.
- `/preco`: PC, tablet e mobile sem console errors, sem 401/403/5xx e sem overflow horizontal.
- `/login`: PC, tablet e mobile sem console errors, sem 401/403/5xx e sem overflow horizontal.
- `/checkout?plan=basic`: mobile sem console errors, sem 401/403/5xx, sem overflow horizontal, titulo `Finalizar Assinatura`.
- `/app/dashboard` anonimo: redirecionou para `/login`, sem console errors e sem 401/403/5xx.

Capturas visuais:

- `docs/evidence/prd-usuario-home-mobile-2026-05-27.png`
- `docs/evidence/prd-usuario-checkout-mobile-2026-05-27.png`

Observacao: o Browser in-app mostrou inicialmente `Invalid Refresh Token` por storage antigo da sessao. O reteste em contexto Playwright limpo nao reproduziu o erro; por isso nao foi classificado como falha real de rota publica.

## Playwright specs executadas

| Spec | Resultado | Cobertura principal |
| --- | --- | --- |
| `scripts/prd-layout-smoke.spec.ts` | 32/32 passou | Rotas publicas e privadas principais sem overflow em mobile 320/390, tablet 768 e desktop 1440. |
| `scripts/prd-layout-route-inventory-smoke.spec.ts` | 12/12 passou | Inventario de rotas publicas, autenticadas e legadas; cria usuario temporario Presidente. |
| `scripts/prd-layout-auth-smoke.spec.ts` | 22/22 passou | Login, dashboard, obras, RDO, relatorios, configuracoes, rotas dinamicas de obra/RDO e persistencia de tema apos reload. |
| `scripts/prd-layout-report-pdf-smoke.spec.ts` | 1/1 passou | Edge Function `generate-rdo-pdf` gerou PDFs genericos para relatorios completos. |
| `scripts/prd-layout-pwa-smoke.spec.ts` | 1/1 passou | PWA standalone mobile com bottom navigation sem cobrir conteudo. |
| `scripts/prd-layout-invite-rdo-smoke.spec.ts` | 2/2 passou | Convite simulado, colaborador cria RDO, admin aprova/rejeita, persistencia no banco e e-mail de RDO simulado. |

Total Playwright complementar: 70 testes passaram.

## Itens validados com evidencia

- Rotas publicas principais renderizam em PC/tablet/mobile.
- Checkout publico com plano `basic` renderiza em mobile sem erro anonimo.
- Rota privada anonima redireciona para login.
- Login valido com usuarios temporarios redireciona para dashboard.
- Login invalido permanece em `/login` e mostra mensagem: "E-mail/telefone ou senha invalidos. Verifique suas credenciais e tente novamente."
- Logout encerra a sessao; tentativa posterior de acessar `/app/dashboard` redireciona para `/login`.
- Rotas autenticadas principais renderizam sem overflow horizontal.
- Tema claro/escuro persiste apos reload no shell autenticado.
- Obra e RDO dinamicos renderizam sem overflow.
- RDO criado por colaborador foi persistido no banco com `criado_por_id`, `org_id`, `observacoes` e status `DRAFT`.
- Aprovacao de RDO persistiu status `APPROVED`, aprovador e campos legados/novos.
- Rejeicao de RDO persistiu status `REJECTED`, aprovador e motivo.
- Envio de e-mail de RDO foi simulado/interceptado sem provedor real, validando payload sem exigir entrega real.
- PDFs genericos de relatorios retornaram `application/pdf` com corpo real.
- PWA mobile validou navegacao inferior sem cobrir conteudo.

## Validacao adicional de auth

Fluxo executado em mobile 390 com usuario temporario `prd-usuario-auth-<timestamp>@teste.com`:

- Usuario temporario criado via Supabase Admin, com perfil, papel `Administrador`, organizacao, membro ativo e creditos.
- Login invalido com usuario inexistente e senha incorreta:
  - Permaneceu em `/login`.
  - Exibiu erro claro de credenciais invalidas.
  - Respostas 400/401 ocorreram como retorno esperado da autenticacao invalida, sem 5xx.
- Login valido:
  - Redirecionou para `/app/dashboard`.
- Logout:
  - Acessar `/logout` encerrou a sessao.
  - Acessar `/app/dashboard` depois do logout redirecionou para `/login`.
- Cleanup executado:
  - `org_credits`
  - `org_members`
  - `orgs`
  - `user_roles`
  - `user_settings`
  - `profiles`
  - `auth.users`

## Pendencias mantidas abertas

- Confirmar usuario/papel `Gerente` em fluxo real.
- Testar credenciais invalidas no login.
- Testar logout completo.
- Testar recuperacao/redefinicao de senha sem entrega real de e-mail.
- Testar criacao de obra pela UI, incluindo anexos no ato de criacao.
- Testar atividades pela UI.
- Testar checklists pela UI.
- Testar upload/download/exclusao de documentos pela UI.
- Testar configuracoes pessoais completas alem de tema.
- Testar filtros, ordenacoes, estados vazios e permissoes por papel em cada modulo.

## Resultado

Sem falha critica encontrada nos gates executados. O PRD pode avancar para os ciclos funcionais completos, mantendo as pendencias acima abertas.
