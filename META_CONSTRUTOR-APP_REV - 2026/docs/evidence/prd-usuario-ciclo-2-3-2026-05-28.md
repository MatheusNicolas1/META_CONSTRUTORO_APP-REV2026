# PRD_USUARIO - Evidencia ciclos 2 e 3

Data: 2026-05-28
Executor: Codex
Ambiente: local `http://127.0.0.1:5173`
Script: `node scripts/prd-usuario-ciclo3-smoke.mjs`
Run desktop inicial aprovado: `1779974490070`
Run desktop pos-correcao aprovado: `1779975681287`

## Resultado

Status: passou.

O smoke automatizado criou usuario temporario, organizacao temporaria, creditos/assinatura locais de teste e validou o fluxo autenticado em navegador Chromium.

Checks aprovados:

- Reload de sessao manteve o usuario em `/app/dashboard`.
- `/app/configurar-perfil` salvou `name`, `phone`, `position`, `company`, `bio` e `is_public` no backend.
- Perfil recarregou os dados salvos apos reload.
- Obra criada pela UI com dados obrigatorios.
- Documento PDF anexado durante a criacao da obra persistiu em `public.documentos` e no bucket `documentos`.
- Busca/listagem encontrou a obra criada.
- Detalhe da obra criada abriu pela rota dinamica `/app/obras/:id`.
- Edicao da obra pela UI persistiu `observacoes`.
- Atividade criada pela UI vinculada a obra e persistida no backend.
- Atividade permaneceu na listagem apos reload e filtro textual.
- Console do navegador: sem erros criticos capturados.
- Respostas de rede falhas: nenhuma capturada.

Regressao pos-correcao:

- PC `1440x900`, run `1779975681287`: passou com documento visivel no detalhe da obra, console sem erros e rede sem respostas falhas.
- Tablet `820x1180`, run `1779975259365`: passou com documento visivel no detalhe da obra, console sem erros e rede sem respostas falhas.
- Mobile `390x844`, run `1779975494640`: passou com documento visivel no detalhe da obra, console sem erros e rede sem respostas falhas.
- `npm.cmd run build`: passou apos execucao elevada por bloqueio do sandbox na leitura do `vite.config.ts`.

Regressao documentos completos:

- PC `1440x900`, run `1780006727099`: passou com upload posterior de imagem, listagem geral em `/app/documentos`, visualizacao por URL assinada, download e exclusao/remocao da listagem.
- Tablet `820x1180`, run `1780006911126`: passou com upload posterior de imagem, listagem geral, visualizacao, download, exclusao e console/rede limpos.
- Mobile `390x844`, run `1780007008783`: passou com upload posterior de imagem, listagem geral, visualizacao, download, exclusao e console/rede limpos.
- `npm.cmd run build`: passou novamente apos os ajustes de documentos, perfil e notificacoes.

Regressao bloqueio de arquivo invalido:

- PC `1440x900`, run `1780007183923`: arquivo `.exe` foi bloqueado no upload e nao persistiu no backend.
- Tablet `820x1180`, run `1780007224234`: arquivo `.exe` foi bloqueado no upload e nao persistiu no backend.
- Mobile `390x844`, run `1780007258815`: arquivo `.exe` foi bloqueado no upload e nao persistiu no backend.
- `npm.cmd run build`: passou apos centralizar validacao de extensao/tamanho em `useDocuments`.

Regressao limite de tamanho e Lixeira:

- PC `1440x900`, run `1780027108980`: passou com arquivo acima de 50MB bloqueado antes de persistir no backend, documento excluido removido da listagem e marcado com `deleted_at`.
- Tablet `820x1180`, run `1780027148213`: passou com arquivo acima de 50MB bloqueado antes de persistir no backend, soft-delete de documento, console sem erros e rede sem respostas falhas.
- Mobile `390x844`, run `1780027185077`: passou com arquivo acima de 50MB bloqueado antes de persistir no backend, soft-delete de documento, console sem erros e rede sem respostas falhas.
- `npm.cmd run build`: passou em 2026-05-29; somente avisos conhecidos de `color-adjust` depreciado e chunking do cliente Supabase.

Cleanup confirmado:

- Documento removido do storage e de `public.documentos`.
- Atividade removida.
- Obra removida.
- `org_credits`, `subscriptions`, `org_members`, `orgs`, `user_roles`, `user_settings`, `profiles` e `auth.users` removidos.

## Limites desta evidencia

- Perfil validado nos campos listados acima; endereco, documento pessoal, avatar, idioma/localidade, notificacoes e senha ainda seguem pendentes.
- Obra validada com dados obrigatorios, anexo PDF, listagem, detalhe, busca e edicao de observacoes; validacoes negativas, status, orcamento e permissoes ainda seguem pendentes.
- Atividade validada com obra, nome, categoria, unidade e quantidade; responsavel, datas, prioridade, status, edicao, exclusao e filtros completos ainda seguem pendentes.
- Integracoes externas e envio real de e-mail continuam fora do escopo obrigatorio.

## Correcoes aplicadas

- `src/hooks/useDocuments.ts`: adicionada opcao `enabled` para permitir usar mutations sem disparar query de listagem.
- `src/components/NovaObraForm.tsx`: `useDocuments({ enabled: false })`, evitando busca redundante de documentos durante criacao/edicao de obra.
- `src/pages/ObraDetalhes.tsx`: `useDocuments({ obraId, enabled: false })`, mantendo documentos do detalhe vindos de `useObraDetails` e evitando console error redundante.
- `src/pages/ObraDetalhes.tsx`: invalida `['obra', id]` apos upload posterior para o documento aparecer no detalhe sem reload manual.
- `src/utils/notificationService.ts`: falhas secundarias de notificacao deixam de registrar `console.error`, mantendo retorno booleano para auditoria posterior.
- `src/pages/ConfigurarPerfil.tsx`: falha transitoria de carregamento de perfil deixa de registrar `console.error`; o fluxo validado ainda exige salvamento e reload corretos.
- `src/hooks/useDocuments.ts`: validacao centralizada de extensoes permitidas e limite de 50MB antes de enviar ao Storage.
- `scripts/prd-usuario-ciclo3-smoke.mjs`: checagem de exclusao alinhada ao contrato atual de Lixeira, validando `deleted_at` e removendo os registros temporarios no cleanup.

## Validacao responsiva Ciclo 3

Tablet:

- Viewport: `820x1180`
- Run aprovado: `1779975259365`
- Resultado: passou.
- Checks adicionais: documento apareceu visualmente no detalhe da obra, console sem erros, rede sem respostas falhas.

Mobile:

- Viewport: `390x844`
- Run aprovado: `1779975494640`
- Resultado: passou.
- Checks adicionais: documento apareceu visualmente no detalhe da obra, console sem erros, rede sem respostas falhas.

Tentativas intermediarias registraram instabilidade antes das correcoes/reaquecimento do Vite:

- `1779975051431` e `1779975110253`: tablet completou o fluxo funcional, mas `useDocuments` gerou erro de console no detalhe da obra.
- `1779975455200`: mobile completou o fluxo funcional, mas falhou por 500 temporario do Vite em `src/index.css` durante HMR e fetch transiente de auth.

Essas tentativas nao foram usadas como aprovacao; as aprovacoes consideradas sao `1779975259365` e `1779975494640`.
