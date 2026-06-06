# P1.1 - Smoke final complementar de RDO em producao

Data: 2026-05-21

## Ambiente

- Producao: `https://www.metaconstrutor.app.br`
- Usuario QA: `qa.prd.p1.1.1779307585003@example.com`
- Perfil/role: `Administrador`
- Organizacao: `bd596524-4d53-49b1-9bc7-17efa2ee295d`
- Obra usada: `QA Smoke P1.1 2026-05-20`

## Resultado

- [x] Login autenticado em producao.
- [x] Tela `/app/rdo/novo` carregou com a obra QA disponivel.
- [x] RDO novo criado pela UI em producao.
- [x] PDF de RDO novo gerado pela Edge Function autenticada.
- [x] PDF de RDO aprovado gerado pela Edge Function autenticada.
- [ ] Envio de RDO pela UI bloqueado.
- [ ] Envio por e-mail de RDO bloqueado.

## Evidencias

### RDO criado pela UI

- RDO criado: `f880af81-e9bb-465a-a6ab-a3b3723daffe`
- Numero: `56`
- Status: `DRAFT`
- Obra: `2bb2da5d-2f7e-446e-aff4-c695d1884706`
- Clima: `Ensolarado`
- Periodo: `Manha`
- Criado por: `397e6fed-1587-4eb0-9fb1-12ab4cfd74ff`
- URL validada: `https://www.metaconstrutor.app.br/app/rdo/f880af81-e9bb-465a-a6ab-a3b3723daffe/visualizar`

DOM observado na producao:

- `RDO-2026-f880`
- `Rascunho`
- `Enviar por Email`
- `Baixar PDF`
- `Este RDO esta em rascunho. Envie-o para aprovacao para iniciar o processo de assinatura.`

### PDF validado

RDO novo:

- Function: `generate-rdo-pdf`
- Request: `{ rdoId: "f880af81-e9bb-465a-a6ab-a3b3723daffe" }`
- HTTP: `200`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="RDO-56.PDF"`
- Tamanho: `78902` bytes

RDO aprovado:

- RDO: `239178fe-b8a1-45ed-b029-4effe0e11668`
- Function: `generate-rdo-pdf`
- HTTP: `200`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="RDO-53.PDF"`
- Tamanho: `78734` bytes

Observacao: o navegador interno do Codex nao suporta evento de download; por isso a geracao foi validada pela Edge Function autenticada com o mesmo token do usuario QA.

## Bloqueio encontrado

### Enviar RDO para aprovacao

A tela do RDO em `DRAFT` informa que o usuario deve enviar o RDO para aprovacao, mas nao existe CTA/botao visivel para executar essa acao.

Codigo relacionado:

- `src/hooks/useRDOs.ts`: existe mutation `submitForApproval`, atualizando `status` para `SUBMITTED`.
- `src/pages/RDOVisualizar.tsx`: para status `DRAFT`, apenas renderiza o texto de orientacao; nao chama `submitForApproval`.
- `src/components/RDOExpandableCard.tsx`: nao expoe acao de envio para aprovacao.

### Enviar por e-mail

Na tela de visualizacao, o botao `Enviar por Email` foi clicado em producao:

- URL antes: `https://www.metaconstrutor.app.br/app/rdo/f880af81-e9bb-465a-a6ab-a3b3723daffe/visualizar`
- URL depois: mesma URL.
- Logs recentes: nenhum erro, aviso ou acao.
- DOM depois: botao permaneceu ativo, sem modal/toast/fluxo.

Codigo relacionado:

- `src/pages/RDOVisualizar.tsx`: o botao `Enviar por Email` nao possui `onClick`.

## Decisao

Parar conforme regra do PRD: o smoke final encontrou bloqueio funcional de envio. Proxima atividade deve implementar a acao de envio para aprovacao na UI e decidir se o envio por e-mail sera implementado agora ou removido/ocultado ate existir backend.
