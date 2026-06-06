# Evidencia - textos, envio de RDO e CSP Sentry - 2026-05-21

## Escopo

- Corrigir textos com mojibake/caracteres incorretos em secoes do app.
- Continuar o PRD no bloqueio P1.1: envio de RDO para aprovacao pela UI.
- Corrigir bloqueio de CSP que impedia o frontend de enviar eventos ao Sentry.

## Arquivos ajustados

- `src/pages/RDOVisualizar.tsx`
- `src/hooks/useRDOs.ts`
- `src/pages/Feedback.tsx`
- `src/pages/APIPage.tsx`
- `src/components/ui/hero-section.tsx`
- `src/services/eventManager.ts`
- `src/utils/backgroundTasks.ts`
- `src/utils/performanceMonitor.ts`
- `src/utils/prefetcher.ts`
- `src/utils/routePreloader.ts`
- `src/test/comprehensive-security-test.ts`
- `src/components/security/SecurityHeaders.tsx`
- `vercel.json`

## Validacoes locais

- Scanner Node para mojibake em `src`: `count=0`.
- `npm run lint`: passou com `0 errors` e `34 warnings` existentes.
- `npm run build`: passou.
- Navegador local em `http://127.0.0.1:5178/app/rdo/f880af81-e9bb-465a-a6ab-a3b3723daffe/visualizar`:
  - textos corretos: `Informacoes Gerais`, `Responsavel`, `Periodo`, `Observacoes`, `Aprovacao / Assinatura Digital`;
  - nenhum mojibake detectado no texto renderizado;
  - botao `Enviar para Aprovacao` visivel para o criador do RDO em `DRAFT`.

Screenshot local:

- `C:/Users/nicol/AppData/Local/Temp/rdo-local-submit-for-approval-visible.png`

## Deploys

1. Deploy com correcao de textos e botao de envio:
   - `dpl_EPPD8KgxV6MwJ4M3nrN4uDF7fFJz`
   - alias: `https://www.metaconstrutor.app.br`

2. Deploy final com CSP Sentry corrigida:
   - `dpl_DgPtFwP61y3NgpXoqR3Ar3vobJYZ`
   - alias: `https://www.metaconstrutor.app.br`

## Validacao em producao

URL:

- `https://www.metaconstrutor.app.br/app/rdo/f880af81-e9bb-465a-a6ab-a3b3723daffe/visualizar`

Resultado:

- Antes do clique, o RDO `DRAFT` exibia `Enviar para Aprovacao`.
- Clique executado em producao com usuario QA `qa.prd.p1.1.1779307585003@example.com`.
- Apos o clique, o RDO mudou para `Aguardando Aprovacao`.
- O botao de envio deixou de aparecer apos `SUBMITTED`.
- Textos renderizados sem mojibake.
- CSP do Sentry corrigida: nenhum erro de `Content Security Policy` ou `Refused to connect` para `ingest.us.sentry.io` apos o deploy final.

Screenshots de producao:

- Antes: `C:/Users/nicol/AppData/Local/Temp/rdo-production-submit-before.png`
- Depois do envio: `C:/Users/nicol/AppData/Local/Temp/rdo-production-submit-after.png`
- Depois da CSP final: `C:/Users/nicol/AppData/Local/Temp/rdo-production-after-csp-fix.png`

## Observacoes

- O navegador interno Browser foi tentado anteriormente, mas a digitacao no login falhou por limitacao do runtime de clipboard. A validacao visual foi feita com Playwright externo.
- Durante uma revalidacao, requests abortadas apareceram por navegacao automatizada entre login/dashboard/RDO; nao ficaram erros de CSP do Sentry apos o deploy final.

## Continuidade P1.1 - relatorios e feedback autenticado

Relatorios:

- URL validada: `https://www.metaconstrutor.app.br/app/relatorios`.
- Resultado: rota autenticada carregou com usuario QA e exibiu controles de exportacao/baixar.
- Screenshot: `C:/Users/nicol/AppData/Local/Temp/p1-relatorios-production.png`

Feedback autenticado:

- URL validada: `https://www.metaconstrutor.app.br/app/feedback`.
- Bloqueio encontrado: `send-feedback` retornava `500` porque gravava valores/colunas divergentes do schema remoto.
- Diagnostico:
  - `feedbacks_tipo_check` aceita `Bug`, `Sugestao`, `Elogio`, `Duvida`, `Reclamacao`, `Outro` (com acentos no banco).
  - A UI enviava valores internos como `sugestao`, `problema`, `elogio`, `outro`.
  - A function tambem tentava inserir colunas nao presentes no contrato TypeScript atual (`rating`, `comment`).
- Correcao:
  - `supabase/functions/send-feedback/index.ts` removeu `rating`/`comment`.
  - A function passou a mapear valores internos para a constraint remota.
  - Reimplantado com `npx supabase functions deploy send-feedback --use-api`.
- Validacao direta:
  - `POST /functions/v1/send-feedback` retornou `200`.
  - Feedback criado: `d5d888ee-9939-4165-8352-d9bb15e4a975`.
- Validacao pela UI:
  - Formulario enviado em producao.
  - Feedback criado: `bd0abf6f-a359-43d6-ad8c-d4852427a842`.
  - Status no banco: `Recebido`.
  - Screenshot: `C:/Users/nicol/AppData/Local/Temp/p1-feedback-production-after-submit-success.png`

## Continuidade P1.1 - auth complementar, exportacao e notificacoes

Google OAuth:

- URL inicial: `https://www.metaconstrutor.app.br/login`.
- Acao: clique em `Continuar com Google`.
- Resultado: redirecionou para `accounts.google.com` com `redirect_uri` apontando para callback Supabase.
- Limitacao: autenticacao final em conta Google nao foi executada pela automacao.

Recuperacao de senha:

- URL validada: `https://www.metaconstrutor.app.br/recuperar-senha`.
- Resultado: formulario aceitou e-mail QA e exibiu estado de envio.
- Screenshot: `C:/Users/nicol/AppData/Local/Temp/p1-reset-password-request-production.png`
- Limitacao: redefinicao via link de e-mail nao foi executada nesta automacao.

Exportacao de relatorio:

- URL validada: `https://www.metaconstrutor.app.br/app/relatorios`.
- Problema encontrado: PDF baixava com filename `RELATORIO_RDO_NaN-NaN-NaN.PDF`.
- Arquivo antes da correcao: `C:/Users/nicol/AppData/Local/Temp/RELATORIO_RDO_NaN-NaN-NaN.PDF` (`64640` bytes).
- Causa: o frontend enviava `generatedAt` com `toLocaleString('pt-BR')` e a Edge Function usava `new Date(generatedAt)` sem fallback.
- Correcao:
  - `src/hooks/useReportPdfDownload.ts` agora envia `new Date().toISOString()`.
  - `supabase/functions/generate-rdo-pdf/report-template.ts` usa fallback para data atual se `generatedAt` for invalida.
- Validacoes:
  - `npm run lint`: `0 errors`, `34 warnings` preexistentes.
  - `npm run build`: passou.
  - `npx supabase functions deploy generate-rdo-pdf --use-api`: function implantada no projeto `bgdvlhttyjeuprrfxgun`.
  - `npx vercel deploy --prod --yes`: deployment `dpl_BwxhBJbPWRrNWzsvJ3RAes9EqS8m`, alias `https://www.metaconstrutor.app.br`.
  - Smoke remoto com usuario temporario QA: `pdfStatus=200`, `contentType=application/pdf`, `disposition=attachment; filename="RELATORIO_RDO_2026-05-21.PDF"`, `filenameHasNaN=false`, `bytes=55613`.
  - Usuario temporario removido: `cleanupUserDeleted=true`, `cleanupStatus=200`.
- Screenshot da tela de exportacao: `C:/Users/nicol/AppData/Local/Temp/p1-report-export-production.png`

Notificacoes:

- URL validada: `https://www.metaconstrutor.app.br/app/notificacoes`.
- Resultado: rota autenticada carregou com lista/estado vazio visivel.
- Screenshot: `C:/Users/nicol/AppData/Local/Temp/p1-notificacoes-production.png`

Perfil/LGPD:

- URL validada: `https://www.metaconstrutor.app.br/app/perfil`.
- Resultado: tela autenticada carregou com controles visuais de seguranca/LGPD.
- Screenshot: `C:/Users/nicol/AppData/Local/Temp/p1-perfil-lgpd-production.png`
- Exportacao real testada com conta descartavel:
  - `exportStatus=200`.
  - `exportContentType=application/json; charset=utf-8`.
  - `exportDisposition=attachment; filename="meus-dados-21-05-2026.json"`.
  - JSON retornou `_meta` e chaves iniciais: `perfil`, `configuracoes`, `creditos`, `papeis`, `organizacoes`, `obras`, `rdos`.
- Bloqueio encontrado no primeiro teste de exclusao:
  - `delete-account` retornou `500`.
  - Limpeza admin tambem falhou com `23503`: `admin_audit_logs_admin_id_fkey` ainda referenciava `auth.users`.
  - Causa: `export-my-data` registra auditoria em `admin_audit_logs.admin_id = userId`; essa FK bloqueava `auth.admin.deleteUser`.
- Correcao aplicada:
  - Criada migration `supabase/migrations/20260521235034_allow_admin_audit_logs_user_delete.sql`.
  - A migration remove `NOT NULL` de `admin_id` e recria FKs de `admin_id` e `target_user_id` com `ON DELETE SET NULL`.
  - Aplicada no remoto com `npx supabase db query --linked --file supabase/migrations/20260521235034_allow_admin_audit_logs_user_delete.sql`.
  - Registrada no historico remoto com `npx supabase migration repair --linked --status applied 20260521235034`.
  - `npx supabase migration list --linked` confirmou `20260521235034` em Local e Remote; drift residual antigo de `20260215`/`20260216120000` permanece como previamente aceito/documentado.
- Limpeza do usuario temporario preso:
  - `admin delete` retornou `status=200`, `ok=true`.
- Revalidacao completa com nova conta descartavel:
  - `export-my-data`: `status=200`, JSON com `_meta`.
  - `delete-account`: `status=200`, `success=true`, mensagem `Conta excluida com sucesso.`
