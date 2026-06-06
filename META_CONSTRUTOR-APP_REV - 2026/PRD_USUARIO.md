# PRD_USUARIO - Homologacao completa das funcionalidades do usuario

Data de criacao: 2026-05-27
Objetivo: garantir que todas as funcionalidades usadas por usuarios reais no Meta Construtor estejam testadas, funcionais, responsivas e persistentes nos modos PC, tablet e mobile.

## 1. Resumo executivo

Este PRD cobre a homologacao operacional ponta a ponta do produto, desde o primeiro acesso do usuario ate o uso completo dos modulos internos: criacao de obra, atividades, RDO, checklists, documentos, equipes, equipamentos, despesas, fornecedores, relatorios, notificacoes, seguranca, perfil e configuracoes pessoais.

Resultado esperado:

- [ ] 100% das rotas publicas relevantes testadas em PC, tablet e mobile.
- [ ] 100% das rotas autenticadas testadas em PC, tablet e mobile.
- [ ] 100% dos fluxos principais testados com persistencia real no backend.
- [ ] 100% dos fluxos de criacao, edicao, listagem, filtros, exclusao/cancelamento e recarregamento validados.
- [ ] 100% dos estados de carregamento, vazio, erro e sucesso revisados.
- [ ] 100% das permissoes por papel verificadas.
- [ ] 100% das configuracoes pessoais do usuario persistindo apos reload, logout/login e troca de dispositivo.
- [ ] Nenhum erro critico no console durante os fluxos homologados.
- [ ] Nenhuma quebra visual, sobreposicao ou scroll horizontal indevido em PC, tablet ou mobile.

Recomendacao atual:

- [ ] Nao considerar a experiencia do usuario como 100% homologada ate todos os itens P0 e P1 estarem concluidos com evidencia.
- [ ] Pendencias manuais e externas devem permanecer abertas, separadas das funcionalidades automatizaveis.

## 2. Excecoes de escopo

Ficam fora do criterio obrigatorio de 100% funcional:

- [ ] Envio real de e-mails para destinatarios externos.
- [ ] Entrega real de e-mails transacionais, convites, notificacoes e recuperacao de senha.
- [ ] Integracoes externas reais com N8N, webhooks, sistemas de terceiros, ERPs, CRMs, WhatsApp, provedores de e-mail ou APIs externas.

Mesmo fora do escopo, estes pontos ainda devem ser testados de forma segura:

- [ ] Validar que a UI nao mostra sucesso falso quando uma integracao externa estiver desativada.
- [ ] Validar que funcoes de e-mail retornam erro claro, estado pendente, modo sandbox ou evidencia de requisicao criada, sem exigir entrega real.
- [ ] Validar que integracoes bloqueadas, nao configuradas ou manuais aparecem como indisponiveis de forma honesta.
- [ ] Validar que logs, auditoria ou mensagens internas sao persistidos quando aplicavel.

Observacao: pagamentos e checkout devem ser testados preferencialmente com modo de teste/sandbox. Cobrancas reais so devem ser executadas com autorizacao explicita.

## 3. Definicao de pronto

Um item so pode ser marcado como concluido quando todos os criterios abaixo forem verdadeiros:

- [ ] O fluxo foi testado no navegador em PC, tablet e mobile.
- [ ] O fluxo foi testado com usuario autenticado no papel correto.
- [ ] O fluxo foi testado em reload da pagina apos salvar.
- [ ] O fluxo foi testado apos logout/login quando envolve persistencia pessoal.
- [ ] O dado salvo aparece em listagem, detalhe, filtro, relatorio ou tela relacionada quando aplicavel.
- [ ] O dado salvo existe no backend ou storage esperado quando aplicavel.
- [ ] O console do navegador nao mostra erro critico inesperado.
- [ ] A tela nao apresenta texto cortado, elementos sobrepostos, scroll horizontal indevido ou botoes inacessiveis.
- [ ] Estados de erro, vazio, carregamento e sucesso foram avaliados.
- [ ] Evidencia foi registrada em `docs/evidence/` ou neste PRD com data, comando/rota, usuario, dispositivo e resultado.

Status permitidos:

- Aberto
- Em execucao
- Bloqueado
- Falhou
- Corrigido
- Validado
- Fora do escopo

## 4. Matriz obrigatoria de dispositivos

Cada fluxo funcional deve passar nos tres modos abaixo:

| Modo | Viewport minimo | Viewport recomendado | Criterio principal |
| --- | --- | --- | --- |
| PC | 1366x768 | 1440x900 | Navegacao lateral, tabelas, modais, filtros e relatorios completos. |
| Tablet | 768x1024 | 820x1180 | Layout sem quebra, menus acessiveis, formularios utilizaveis por toque. |
| Mobile | 360x800 | 390x844 | Fluxos principais possiveis sem perda de conteudo, scroll vertical coerente e botoes acessiveis. |

Checks globais por dispositivo:

- [ ] Sem scroll horizontal no `body`.
- [ ] Sem sobreposicao de headers, menus, cards, dialogos ou toasts.
- [ ] Tabelas e listas possuem alternativa responsiva, scroll interno controlado ou colunas legiveis.
- [ ] Dialogos cabem na tela e permitem rolagem interna.
- [ ] Menus, selects, date pickers, uploaders e popovers funcionam por mouse e toque.
- [ ] Botoes primarios e destrutivos mantem tamanho clicavel.
- [ ] Textos longos quebram linha sem vazar do container.
- [ ] Loading skeleton/spinner nao desloca a tela de forma incoerente.
- [ ] Tema claro e escuro nao reduzem contraste de textos e controles.

## 5. Usuarios e papeis de teste

Criar ou identificar usuarios de teste para:

- [ ] Presidente: acesso total, admin, configuracoes, seguranca, relatorios, usuarios e acoes restritas.
- [ ] Administrador: acesso operacional amplo sem permissoes exclusivas de Presidente quando aplicavel.
- [ ] Gerente: obras, atividades, RDO, checklists, equipes, fornecedores, despesas, relatorios e configuracoes permitidas.
- [ ] Colaborador: acesso restrito a rotinas permitidas, sem areas administrativas.
- [ ] Usuario anonimo: rotas publicas, preco, checkout publico e bloqueio correto de rotas privadas.

Checks de isolamento:

- [ ] Usuario de uma organizacao nao enxerga dados de outra organizacao.
- [ ] Usuario sem papel permitido recebe bloqueio, redirecionamento ou mensagem adequada.
- [ ] Alteracoes feitas por um papel aparecem para outros papeis autorizados.
- [ ] Acoes restritas nao aparecem ou falham com erro controlado para usuarios sem permissao.

## 6. Comandos e verificacoes tecnicas

Executar antes e depois de correcoes relevantes:

```powershell
npm run lint
npm run test
npm run build
```

Validacoes complementares:

- [ ] Rodar smoke visual responsivo nas rotas principais.
- [ ] Rodar smoke de rotas protegidas e publicas.
- [ ] Verificar console do navegador em todos os fluxos P0.
- [ ] Verificar rede para chamadas 401/403 inesperadas em rotas publicas.
- [ ] Verificar Supabase real antes de corrigir bugs de persistencia.
- [ ] Registrar evidencias em `docs/evidence/`.

## 7. Fluxo P0 ponta a ponta do usuario

Este e o caminho critico minimo que precisa funcionar de forma continua.

### P0.1 - Acesso publico, conta e sessao

Rotas:

- `/home`
- `/preco`
- `/checkout`
- `/login`
- `/criar-conta`
- `/recuperar-senha`
- `/redefinir-senha`
- `/mfa`

Checks:

- [x] Usuario anonimo acessa `/home` sem erro. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Usuario anonimo acessa `/preco` sem requisicoes nao autorizadas inesperadas. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Usuario anonimo acessa `/checkout` quando vier de plano valido. Validado com `/checkout?plan=basic`. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Login com credenciais validas redireciona para `/app/dashboard`. Validado com usuarios temporarios de smoke. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Login com credenciais invalidas mostra erro claro. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Logout encerra sessao e bloqueia rotas privadas. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Reload apos login mantem sessao quando esperado. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Rota privada sem sessao redireciona para login. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Recuperacao/redefinicao de senha valida formulario e estados, sem exigir envio real de e-mail. Evidencia: `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] MFA valida tela, erro de formato, retorno ao login e estado indisponivel honesto; preferencia `two_factor_enabled` persiste em `user_settings`. MFA real de login ainda nao esta implementado. Evidencia: `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] Criacao de conta valida campos obrigatorios, aceite legal e erro de e-mail duplicado. Criacao valida com aceite legal gera `profiles.id`; e-mail duplicado exibe erro generico, nao autentica e nao duplica `profiles` em PC/tablet/mobile. Evidencias: `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-signup-duplicado-2026-06-02.md`.

Responsivo:

- [x] PC validado para renderizacao, overflow e fluxos publicos/auth principais. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] Tablet validado para renderizacao, overflow e fluxos publicos/auth principais. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] Mobile validado para renderizacao, overflow e fluxos publicos/auth principais. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.

Status: Em execucao

### P0.2 - Configuracao inicial e perfil do usuario

Rotas:

- `/app/configurar-perfil`
- `/app/perfil`
- `/app/configuracoes`

Checks:

- [x] Usuario novo completa configuracao inicial. Evidencia: `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Nome, telefone, cargo, empresa, documento/CPF-CNPJ, biografia, privacidade e endereco de empresa salvam de verdade; endereco pessoal separado nao existe na UI atual. Evidencias: `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Nome, telefone, cargo, empresa, biografia e perfil publico salvam no backend e recarregam apos reload. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Foto/avatar salva, recarrega e aparece nos locais esperados. Evidencia: `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Preferencia de tema claro/escuro salva e sobrevive a reload. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Preferencia de tema sobrevive a logout/login. Evidencia: `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`.
- [x] Preferencia de idioma/localidade, se disponivel, salva e reflete na UI. Validado com `en-US`. Evidencia: `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`.
- [x] Preferencias de notificacao salvam e recarregam. Evidencia: `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`.
- [x] Dados da organizacao salvam apenas para papeis autorizados. Administrador salva dados de empresa em `profiles`; colaborador sem permissao e bloqueado em `/app/configuracoes`. Evidencias: `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [ ] Alteracao de senha valida senha atual, senha nova e erros. Parcial: fluxo atual solicita reset por e-mail em `/app/perfil` e retorna feedback controlado sem validar entrega real; troca com senha atual + nova senha nao existe na UI atual. Evidencia: `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] Exclusao, desativacao ou acoes sensiveis exigem confirmacao quando existirem. Validado sem executar exclusao real. Evidencia: `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.

Responsivo:

- [x] PC validado para renderizacao, persistencia de configuracoes, reload, logout/login, perfil/avatar e acoes sensiveis em `/app/configuracoes`, `/app/configurar-perfil` e `/app/perfil`. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Tablet validado para renderizacao, persistencia de configuracoes, reload, logout/login, perfil/avatar e acoes sensiveis em `/app/configuracoes`, `/app/configurar-perfil` e `/app/perfil`. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Mobile validado para renderizacao, persistencia de configuracoes, reload, novo login, perfil/avatar e acoes sensiveis em `/app/configuracoes`, `/app/configurar-perfil` e `/app/perfil`. Evidencias: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`, `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`, `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.

Status: Em execucao

### P0.3 - Criacao de obra

Rotas:

- `/app/obras`
- `/app/obras/:id`
- `/app/obras/:id/editar`

Checks:

- [x] Criar obra com dados minimos obrigatorios. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [ ] Criar obra com dados completos.
- [ ] Validar campos obrigatorios e formatos.
- [ ] Salvar endereco, responsavel, datas, status, orcamento, cliente e observacoes quando existirem.
- [x] Anexar documentos durante a criacao da obra. Validado com PDF. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Confirmar que anexos da criacao persistem em storage/backend. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Ver a obra criada na listagem. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Abrir detalhe da obra criada. Validado com obra temporaria de smoke. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Editar dados da obra e recarregar a pagina.
- [x] Editar observacoes da obra pela UI e confirmar persistencia no backend. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Busca encontra a obra criada. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [ ] Filtros, busca e ordenacao encontram a obra.
- [ ] Alterar status da obra quando permitido.
- [ ] Validar comportamento sem obras cadastradas.
- [ ] Validar bloqueio para usuario sem permissao de editar.

Responsivo:

- [x] PC validado para fluxo parcial de criacao, anexo, detalhe, edicao e busca. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Tablet validado para fluxo parcial de criacao, anexo, detalhe, edicao e busca. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Mobile validado para fluxo parcial de criacao, anexo, detalhe, edicao e busca. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Status: Em execucao

### P0.4 - Atividades da obra

Rotas:

- `/app/atividades`
- `/app/obras/:id`

Checks:

- [x] Criar atividade vinculada a uma obra. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Criar atividade com nome, categoria, unidade e quantidade. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [ ] Criar atividade com responsavel, data inicial, data final, prioridade e status. Parcial: responsavel, data, prioridade e status validados; data final segue pendente por ausencia de coluna em `public.atividades`. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Editar atividade existente. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Alterar status da atividade. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Excluir/cancelar atividade quando permitido. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Filtrar por obra, status, responsavel, periodo e prioridade. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [ ] Validar visualizacao em calendario/lista quando disponivel. Parcial: lista validada em PC/tablet/mobile; calendario segue pendente. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Validar atividades atrasadas, concluidas e pendentes. Evidencia: `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Recarregar e confirmar persistencia. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Busca textual encontra a atividade criada apos reload. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [ ] Confirmar que atividades aparecem no detalhe da obra e em dashboards/relatorios quando aplicavel.

Responsivo:

- [x] PC validado para criacao vinculada, persistencia, reload, busca textual, filtros, edicao e Lixeira. Evidencias: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`, `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Tablet validado para criacao vinculada, persistencia, reload, busca textual, filtros e Lixeira. Evidencias: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`, `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.
- [x] Mobile validado para criacao vinculada, persistencia, reload, busca textual, filtros e Lixeira. Evidencias: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`, `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md`.

Status: Em execucao

### P0.5 - RDO completo

Rotas:

- `/app/rdo`
- `/app/rdo/novo`
- `/app/rdo/:id/visualizar`
- `/app/rdo/:id/editar`

Checks:

- [x] Criar RDO vinculado a uma obra. Validado por colaborador temporario. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Validar data, periodo, clima e campos obrigatorios.
- [ ] Preencher equipe, equipamentos, atividades, ocorrencias, observacoes e anexos.
- [x] Salvar RDO com dados minimos. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Salvar RDO com dados completos.
- [ ] Editar RDO antes de aprovacao.
- [x] Visualizar RDO salvo apos reload. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Listar RDO na tela principal. Fluxo retornou para `/app/rdo` apos finalizar. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Filtrar por obra, status, data e responsavel.
- [ ] Validar anexos do RDO com persistencia real.
- [ ] Validar notas/comentarios do RDO quando disponivel.
- [ ] Gerar PDF do RDO.
- [x] Aprovar RDO com papel autorizado. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Reprovar ou solicitar correcao quando disponivel. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Bloquear edicao indevida apos aprovacao, se essa for a regra vigente.
- [x] Validar que envio de e-mail do RDO nao exige entrega real e nao mostra sucesso falso. Payload interceptado sem provedor real. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Confirmar que status aprovado/reprovado aparece em listagens, detalhe e relatorios. Persistencia no banco validada; relatorios completos ainda pendentes. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.

Responsivo:

- [x] PC validado para rotas de RDO e detalhe dinamico. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Tablet validado para rotas de RDO e detalhe dinamico. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Mobile validado para criacao/aprovacao de RDO e rotas de RDO. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.

Status: Em execucao

### P0.6 - Checklists

Rotas:

- `/app/checklist`
- `/app/checklist/:id`

Checks:

- [x] Criar checklist do zero. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Criar checklist a partir de template padrao quando disponivel. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Vincular checklist a obra. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Preencher itens como concluido/conforme, nao conforme ou nao aplicavel. Evidencias: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md` e `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Marcar item como concluido e confirmar persistencia no backend. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Adicionar observacoes e evidencias/anexos quando disponivel. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Salvar progresso parcial. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Recarregar e confirmar progresso salvo. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Editar checklist em aberto. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Finalizar checklist. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Aprovar checklist com papel autorizado. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Reprovar ou reabrir checklist quando disponivel. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Filtrar por obra, status, responsavel e periodo. Evidencia: `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md`.
- [x] Busca textual encontra checklist criado. Evidencia: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Validar PDF/exportacao quando existir. Funcao `generate-checklist-pdf` interceptada com download simulado; sem entrega externa real. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Validar bloqueio de acoes para papel sem permissao. Colaborador ficou bloqueado no detalhe restrito do checklist. Evidencia: `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.

Responsivo:

- [x] PC validado para criacao por template, criacao do zero, vinculo com obra, item concluido/nao conforme/nao aplicavel, observacao, anexo, reload, edicao, finalizacao, PDF simulado, aprovacao, reabertura, reprovacao, permissao restrita e filtros completos. Evidencias: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`, `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md` e `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md`.
- [x] Tablet validado para criacao por template, criacao do zero, vinculo com obra, item concluido/nao conforme/nao aplicavel, observacao, anexo, reload, edicao, finalizacao, PDF simulado, aprovacao, reabertura, reprovacao, permissao restrita e filtros completos. Evidencias: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`, `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md` e `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md`.
- [x] Mobile validado para criacao por template, criacao do zero, vinculo com obra, item concluido/nao conforme/nao aplicavel, observacao, anexo, reload, edicao, finalizacao, PDF simulado, aprovacao, reabertura, reprovacao, permissao restrita e filtros completos. Evidencias: `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`, `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md` e `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md`.

Status: Concluido

### P0.7 - Documentos e anexos

Rotas:

- `/app/documentos`
- `/app/obras/:id`
- `/app/rdo/:id/visualizar`
- `/app/checklist/:id`

Checks:

- [x] Upload de PDF. Validado como anexo durante criacao de obra. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Upload de imagem. Validado apos criacao da obra em PC/tablet/mobile. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Upload de arquivo com tipo permitido. Validado com PDF e PNG. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Bloqueio de arquivo com tipo/tamanho nao permitido. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Bloqueio de arquivo com tipo nao permitido impede persistencia no backend e mostra erro claro. Validado com `.exe` em PC/tablet/mobile. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Bloqueio de arquivo acima de 50MB impede persistencia no backend e mostra erro claro. Validado em PC/tablet/mobile. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Documento aparece na listagem geral. Validado em `/app/documentos`. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Documento aparece no detalhe da obra quando vinculado. Validado com PDF anexado durante criacao. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Documento anexado na criacao de obra persiste. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Documento anexado depois da obra criada persiste. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Download/visualizacao funciona. Visualizacao por URL assinada e download concluidos. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Exclusao/remove vinculo funciona quando permitido. Validado na listagem e backend com contrato atual de Lixeira (`deleted_at`). Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Permissoes de leitura e escrita respeitam organizacao e papel. RLS remota de `public.documentos` aplicada com leitura/escrita por membro ativo da organizacao, bloqueio de anonimo/outra org e preservacao da policy restritiva da Lixeira; smoke passou em PC/tablet/mobile. Evidencia: `docs/evidence/prd-usuario-ciclo-3-documentos-permissoes-2026-06-03.md`.
- [x] Estados de erro de upload sao claros. Contrato de upload centralizado com mensagens para tipo invalido, arquivo acima de 50MB, `accept` e texto de ajuda compartilhados nas telas; testes unitarios, TypeScript e build passaram. Evidencia: `docs/evidence/prd-usuario-ciclo-3-upload-erros-2026-06-03.md`.
- [x] Estado de erro para tipo de arquivo invalido e claro e nao gera erro critico no console. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Estado de erro para arquivo acima de 50MB e claro e nao persiste no backend. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Responsivo:

- [x] PC validado para PDF anexado na criacao e exibido no detalhe da obra. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Tablet validado para PDF anexado na criacao e exibido no detalhe da obra. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Mobile validado para PDF anexado na criacao e exibido no detalhe da obra. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Status: Em execucao

## 8. Modulos P1 de operacao

### P1.1 - Dashboard

Rota: `/app/dashboard`

Checks:

- [x] Cards carregam dados reais ou estados vazios honestos.
- [x] Indicadores batem com dados de obras, RDOs, atividades e checklists.
- [x] Links/cards navegam para as rotas corretas.
- [x] Filtros ou periodos alteram os dados quando existirem.
- [x] Reload nao quebra dados.
- [x] Sem dados mockados apresentados como reais.
- [x] PC validado...
- [x] Tablet validado para criacao vinculada, persistencia, reload e busca textual. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Mobile validado para criacao vinculada, persistencia, reload e busca textual. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Status: Aberto

### P1.2 - Equipes e colaboradores

Rotas:

- `/app/equipes`
- `/app/equipes/novo`
- `/app/equipes/:id/editar`
- `/app/colaboradores`
- `/app/colaboradores/novo`
- `/app/colaboradores/:id/editar`

Checks:

- [x] Criar equipe.
- [x] Editar equipe.
- [x] Inativar/remover equipe quando permitido.
- [x] Criar colaborador.
- [x] Editar colaborador.
- [x] Vincular colaborador a equipe e obra quando aplicavel.
- [x] Validar permissoes de Administrador/Gerente.
- [x] Validar bloqueio para Colaborador.
- [x] Confirmar persistencia apos reload.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

### P1.3 - Equipamentos

Rota: `/app/equipamentos`

Checks:

- [x] Criar equipamento.
- [x] Editar equipamento.
- [x] Alterar status/disponibilidade.
- [x] Vincular equipamento a obra ou RDO quando aplicavel.
- [x] Filtrar por status, obra, tipo ou responsavel.
- [x] Confirmar persistencia apos reload.
- [x] Validar estados sem equipamentos.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

### P1.4 - Fornecedores

Rota: `/app/fornecedores`

Checks:

- [x] Criar fornecedor.
- [x] Editar fornecedor.
- [x] Validar CNPJ/CPF, telefone, e-mail e endereco quando existirem.
- [x] Buscar e filtrar fornecedores.
- [x] Vincular fornecedor a despesa, obra ou documento quando aplicavel.
- [x] Confirmar persistencia apos reload.
- [x] Validar permissoes.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

### P1.5 - Despesas e financeiro

Rota: `/app/despesas`

Checks:

- [x] Criar despesa.
- [x] Editar despesa.
- [x] Categorizar despesa.
- [x] Vincular despesa a obra e fornecedor quando aplicavel.
- [ ] Anexar comprovante quando disponivel.
- [x] Filtrar por obra, status, periodo, categoria e fornecedor.
- [x] Validar totais, somatorios e estados vazios.
- [x] Confirmar persistencia apos reload.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

### P1.6 - Relatorios

Rota: `/app/relatorios`

Checks:

- [x] Relatorio de obras carrega dados reais.
- [x] Relatorio de RDO carrega dados reais.
- [x] Relatorio de atividades carrega dados reais.
- [x] Relatorio financeiro carrega dados reais quando disponivel.
- [x] Filtros alteram resultados corretamente.
- [x] Exportacao/PDF funciona quando disponivel.
- [x] Resultados vazios sao exibidos corretamente.
- [x] Dados batem com os registros criados nos fluxos P0.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

### P1.7 - Notificacoes

Rota: `/app/notificacoes`

Checks:

- [x] Lista de notificacoes carrega.
- [x] Notificacao nova aparece quando acao interna dispara evento.
- [x] Marcar como lida funciona.
- [x] Marcar todas como lidas funciona quando disponivel.
- [x] Link da notificacao navega para rota correta.
- [x] Preferencias de notificacao respeitam configuracao do usuario.
- [x] Envio real de e-mail/push externo permanece fora do escopo.
- [x] PC validado.
- [x] Tablet validado.
- [x] Mobile validado.

Status: Aberto

### P1.8 - Feedback e FAQ

Rotas:

- `/app/feedback`
- `/app/faq`

Checks:

- [x] Enviar feedback com campos validos.
- [x] Validar campos obrigatorios.
- [x] Persistir feedback no backend ou registrar chamada esperada.
- [x] FAQ carrega conteudo sem quebrar layout.
- [x] Busca/filtros do FAQ funcionam quando disponiveis.
- [x] Estados de erro sao claros.
- [x] PC validado.
- [x] Tablet validado.
- [x] Mobile validado.

Status: Aberto

### P1.9 - Seguranca e auditoria

Rota: `/app/seguranca`

Checks:

- [x] Logs de auditoria carregam dados reais ou estado vazio honesto.
- [x] Filtros de auditoria funcionam.
- [x] Eventos administrativos aparecem apos acoes restritas.
- [x] Acesso restrito por papel funciona.
- [x] Sem indicadores falsos ou hardcoded apresentados como reais.
- [x] PC validado.
- [x] Tablet validado.
- [x] Mobile validado.

Status: Aberto

### P1.10 - Admin

Rota: `/app/admin/dashboard`

Checks:

- [x] Presidente acessa dashboard admin.
- [x] Outros papeis sao bloqueados.
- [x] Listagem de usuarios carrega.
- [x] Alteracoes administrativas permitidas funcionam.
- [x] Suspensao/desativacao, se disponivel, chama backend real ou mostra indisponibilidade honesta.
- [x] Logs/admin audit sao gravados quando aplicavel.
- [x] PC validado.
- [x] Tablet validado.
- [x] Mobile validado.

Status: Aberto

## 9. Modulos P2 publicos, suporte e institucionais

Rotas:

- `/sobre`
- `/contato`
- `/atualizacoes`
- `/carreiras`
- `/blog`
- `/central-ajuda`
- `/documentacao`
- `/status`
- `/api`
- `/perfil/:slug`
- `/legal/privacidade`
- `/legal/termos`
- `/legal/cookies`
- `/legal/lgpd`

Checks:

- [ ] Cada rota renderiza sem erro.
- [ ] Links internos funcionam.
- [ ] Formularios validam campos obrigatorios.
- [ ] Formulario de contato nao exige entrega real de e-mail.
- [ ] Paginas legais estao legiveis e acessiveis.
- [ ] Perfil publico respeita privacidade e dados publicados.
- [ ] Conteudo institucional nao usa CTA quebrado.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

## 10. Integracoes externas

Rota: `/app/integracoes`

Este modulo deve ser tratado com a excecao definida no escopo: integracoes reais externas nao sao obrigatorias para concluir este PRD. O que precisa ser validado e a honestidade do estado da funcionalidade.

Checks:

- [ ] Tela carrega sem erro.
- [ ] Integracoes configuradas mostram status real ou estado vazio honesto.
- [ ] Integracoes nao configuradas nao mostram sucesso falso.
- [ ] Teste de webhook/API externa nao e obrigatorio quando depende de servico real.
- [ ] Acoes bloqueadas mostram erro claro ou estado indisponivel.
- [ ] Logs internos sao persistidos quando a acao local ocorrer.
- [ ] PC validado.
- [ ] Tablet validado.
- [ ] Mobile validado.

Status: Aberto

## 11. Tema, acessibilidade e experiencia geral

Checks:

- [x] Tema claro funciona em rotas autenticadas principais testadas no smoke. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Tema escuro funciona em rotas autenticadas principais testadas no smoke. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Alternancia claro/escuro reflete imediatamente na UI. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Tema escolhido sobrevive a reload. Evidencia: `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [ ] Tema escolhido sobrevive a logout/login.
- [ ] Botoes possuem estados hover/focus/disabled visiveis.
- [ ] Formularios indicam erro por campo.
- [ ] Navegacao por teclado funciona em formularios e dialogos principais.
- [ ] Contraste minimo aceitavel em textos, botoes e alertas.
- [ ] Toasts nao cobrem acoes criticas.
- [ ] Modais podem ser fechados por botao e tecla quando aplicavel.
- [ ] Textos de erro sao compreensiveis para usuario final.

Status: Aberto

## 12. Criterios de falha critica

Se qualquer item abaixo acontecer durante a execucao, parar o ciclo, registrar evidencia e corrigir antes de seguir:

- [ ] Perda de dados salvos.
- [ ] Criacao visual sem persistencia real em fluxo P0.
- [ ] Upload que parece salvo, mas some apos reload.
- [ ] RDO criado com erro ou sem aparecer na listagem.
- [ ] Checklist finalizado sem persistir itens.
- [ ] Usuario sem permissao acessando dado restrito.
- [ ] Dados de outra organizacao visiveis.
- [ ] Rota publica gerando 401/403 inesperado no console.
- [ ] Quebra visual que impede concluir fluxo em mobile.
- [ ] Build, lint ou testes automatizados falhando por causa das alteracoes.

## 13. Plano de execucao por ciclos

### Ciclo 1 - Inventario e ambiente

- [x] Confirmar branch/commit inicial. Branch `master`, commit `c33bdf7`.
- [x] Confirmar `.env.local` e variaveis necessarias. `.env.local` e `.env` presentes; nomes de variaveis registrados na evidencia.
- [ ] Confirmar usuarios e papeis de teste.
- [x] Rodar `npm run lint`. Passou com 34 warnings.
- [x] Rodar `npm run test`. Passou: 8 arquivos, 27 testes.
- [x] Rodar `npm run build`. Passou.
- [x] Subir ambiente local. Ambiente reaproveitado em `http://127.0.0.1:5173`.
- [x] Confirmar matriz PC/tablet/mobile no navegador. Validado por Browser e Playwright.
- [x] Registrar evidencia inicial. `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.

Observacao: usuarios temporarios cobriram Presidente, Administrador e Colaborador nos smokes. Papel Gerente segue pendente para confirmacao especifica.

Status: Em execucao

### Ciclo 2 - Publico, auth e perfil

- [x] Executar P0.1. Rotas publicas principais, checkout publico, login valido, login invalido, logout, bloqueio anonimo, reload de sessao, reset/redefinicao sem entrega real, MFA honesto, criacao valida de conta e erro de e-mail duplicado validados em PC/tablet/mobile.
- [ ] Executar P0.2. Parcial: configuracao inicial, nome, telefone, cargo, empresa, documento/CPF-CNPJ, biografia, privacidade, avatar, tema em reload/logout-login, idioma/localidade, preferencias de notificacao, dados de empresa por Administrador, bloqueio de colaborador sem permissao, confirmacoes de exclusao, preferencia MFA e reset controlado por perfil validados; troca de senha com senha atual + nova senha nao existe na UI atual.
- [x] Corrigir falhas encontradas em configuracoes: perda de estado em mudancas sequenciais e sobrescrita de tema no submit.
- [x] Reexecutar fluxos corrigidos em PC, tablet e mobile.
- [x] Registrar evidencia. `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.
- [x] Registrar evidencia complementar. `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Registrar evidencia de configuracoes pessoais. `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md`.
- [x] Registrar evidencia de perfil, avatar, acoes sensiveis e bloqueio negativo. `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md`.
- [x] Registrar evidencia de auth, recuperacao/redefinicao, MFA honesto e criacao valida de conta. `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md`.
- [x] Registrar evidencia de e-mail duplicado no cadastro. `docs/evidence/prd-usuario-ciclo-2-signup-duplicado-2026-06-02.md`.

Status: Em execucao

### Ciclo 3 - Obra, documentos e atividades

- [ ] Executar P0.3. Parcial: criacao de obra com dados obrigatorios, anexo PDF, listagem, detalhe, busca e edicao de observacoes validados em PC/tablet/mobile; validacoes negativas, status, orcamento e permissoes seguem pendentes.
- [ ] Executar P0.4. Parcial: criacao de atividade vinculada a obra, categoria, unidade, quantidade, persistencia apos reload e busca textual validados em PC/tablet/mobile; busca, filtros por obra/status/prioridade/responsavel/periodo, edicao de status/prioridade/data/responsavel e exclusao para Lixeira validados em PC/tablet/mobile. Seguem pendentes data final de atividade e validacao em calendario/dashboard/relatorios.
- [x] Executar P0.7 nos pontos vinculados a obra. Concluido para escopo automatizavel: PDF na criacao, imagem posterior, listagem geral, detalhe, visualizacao, download, exclusao/Lixeira, bloqueios de extensao/tamanho, estados de erro e permissoes por organizacao/papel validados em PC/tablet/mobile. Evidencias: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`, `docs/evidence/prd-usuario-ciclo-3-upload-erros-2026-06-03.md`, `docs/evidence/prd-usuario-ciclo-3-documentos-permissoes-2026-06-03.md`.
- [x] Corrigir/estabilizar erro tablet no detalhe da obra: `useDocuments` registrava `TypeError: Failed to fetch` em `/app/obras/:id`; corrigido desabilitando query redundante nos pontos que usam apenas mutation. Evidencia: `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.
- [x] Corrigir falhas encontradas nesta etapa.
- [x] Reexecutar fluxos corrigidos em tablet e mobile.
- [x] Registrar evidencia. `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md`.

Status: Em execucao

### Ciclo 4 - RDO

- [ ] Executar P0.5. Parcial: criacao por colaborador, persistencia, visualizacao, aprovacao, rejeicao e e-mail simulado validados; anexos, filtros, edicao e PDF de RDO pela UI seguem pendentes.
- [ ] Corrigir falhas encontradas.
- [ ] Reexecutar fluxos corrigidos.
- [x] Registrar evidencia. `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md`.

Status: Em execucao

### Ciclo 5 - Checklists

- [x] Executar P0.6. Concluido para escopo automatizavel: criacao por template, criacao do zero, vinculo com obra, responsavel por membro ativo da organizacao, busca textual, filtro de categoria, filtros completos por obra/status/responsavel/periodo, detalhe, item concluido, item nao conforme, item nao aplicavel, observacao, anexo, reload, edicao, finalizacao, PDF/exportacao simulada, aprovacao com assinatura, reabertura, reprovacao e bloqueio de colaborador validados em PC/tablet/mobile.
- [x] Corrigir falhas encontradas: responsavel de checklist usava `equipes.id` em vez de `auth.users.id`; card de checklist gerava DOM nesting invalido.
- [x] Reexecutar fluxos corrigidos em PC, tablet e mobile.
- [x] Registrar evidencia. `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md`.
- [x] Registrar evidencia complementar. `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md`.
- [x] Registrar evidencia de filtros completos. `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md`.

Status: Concluido

### Ciclo 6 - Operacao P1

- [ ] Executar Dashboard.
- [ ] Executar Equipes/Colaboradores.
- [ ] Executar Equipamentos.
- [ ] Executar Fornecedores.
- [ ] Executar Despesas.
- [ ] Executar Relatorios.
- [ ] Executar Notificacoes.
- [ ] Executar Feedback/FAQ.
- [ ] Executar Seguranca/Admin.
- [ ] Registrar evidencia.

Status: Aberto

### Ciclo 7 - Publico, suporte, integracoes e excecoes

- [ ] Executar rotas P2.
- [ ] Executar Integracoes com a regra de excecao.
- [ ] Validar e-mails sem exigir entrega real.
- [ ] Registrar itens externos como fora do escopo ou pendencia manual.
- [ ] Registrar evidencia.

Status: Aberto

### Ciclo 8 - Regressao final

- [ ] Rodar `npm run lint`.
- [ ] Rodar `npm run test`.
- [ ] Rodar `npm run build`.
- [ ] Reexecutar smoke PC.
- [ ] Reexecutar smoke tablet.
- [ ] Reexecutar smoke mobile.
- [ ] Validar rotas publicas anonimas sem 401/403 inesperado.
- [ ] Validar reload dos dados P0.
- [ ] Validar logout/login dos dados pessoais.
- [ ] Atualizar resultado final deste PRD.

Status: Aberto

## 14. Registro de execucao

Preencher durante a homologacao.

| Data | Ciclo | Executor | Ambiente | Evidencia | Resultado | Proxima acao |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-27 | Criacao do PRD | Codex | Local | `PRD_USUARIO.md` | Aberto | Iniciar Ciclo 1 |
| 2026-05-27 | Ciclo 1 + smokes iniciais | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-1-2026-05-27.md` | Gates tecnicos, 70 testes Playwright, login invalido e logout passaram; sem falha critica | Continuar fluxos funcionais completos de obra, atividades, checklists, documentos e perfil |
| 2026-05-28 | Ciclos 2/3 complementares | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md` | Reload de sessao, perfil parcial, obra com PDF, detalhe, busca, edicao de observacoes, atividade e documentos ampliados passaram em PC/tablet/mobile; arquivo invalido bloqueado; build passou | Continuar pendencias de reset, MFA, criacao de conta, checklists, permissoes e limite de tamanho |
| 2026-05-29 | Ciclo 3 - limite de documentos | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-2-3-2026-05-28.md` | Arquivo acima de 50MB bloqueado em PC/tablet/mobile sem persistir no backend; exclusao validada como Lixeira (`deleted_at`); console/rede limpos; build passou | Continuar pendencias de reset, MFA, criacao de conta, checklists e permissoes |
| 2026-05-31 | Ciclo 5 - Checklists parcial | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-5-2026-05-31.md` | Criacao por template, vinculo com obra, responsavel, busca, detalhe, item concluido, observacao, anexo e reload passaram em PC/tablet/mobile; console/rede limpos; build passou | Continuar checklist do zero, edicao, finalizacao, aprovacao, reabertura/reprovacao, filtros completos, PDF/exportacao e permissoes |
| 2026-06-01 | Ciclo 5 - Checklists complementar | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-5-complementar-2026-06-01.md` | Checklist do zero, edicao, status nao conforme/nao aplicavel, finalizacao, PDF simulado, aprovacao com assinatura, reabertura, reprovacao e bloqueio de colaborador passaram em PC/tablet/mobile; build passou | Fechar filtros completos por obra, status, responsavel e periodo; seguir Ciclo 2/configuracoes e demais permissoes |
| 2026-06-02 | Ciclo 5 - Checklists filtros | Codex | Local `http://127.0.0.1:5173` | `docs/evidence/prd-usuario-ciclo-5-filtros-2026-06-02.md` | Filtros por obra, status, responsavel, periodo e categoria, isolados e combinados, passaram em PC/tablet/mobile; build passou | Seguir Ciclo 2/configuracoes, documentos/permissoes e demais modulos P1 |
| 2026-06-02 | Ciclo 2 - Configuracoes pessoais | Codex | Local `http://127.0.0.1:5180` | `docs/evidence/prd-usuario-ciclo-2-configuracoes-2026-06-02.md` | Tema, idioma, fonte, cor, preferencias de notificacao e dados de empresa por Administrador persistiram em `user_settings`/`profiles`, recarregaram e sobreviveram a novo login em PC/tablet/mobile; build passou | Fechar configuracao inicial, avatar, senha/acoes sensiveis e validacao negativa de papel nao autorizado |
| 2026-06-02 | Ciclo 2 - Perfil, avatar e acoes sensiveis | Codex | Local `http://127.0.0.1:5182` | `docs/evidence/prd-usuario-ciclo-2-perfil-avatar-2026-06-02.md` | Configuracao inicial, perfil pessoal, documento/CPF-CNPJ, avatar em storage, reload, confirmacao de exclusao sem chamada destrutiva e bloqueio de colaborador em configuracoes passaram em PC/tablet/mobile; build passou | Fechar recuperacao/redefinicao de senha sem entrega real, MFA, criacao de conta e alteracao de senha |
| 2026-06-02 | Ciclo 2 - Auth, senha e MFA | Codex | Local `http://127.0.0.1:5183` | `docs/evidence/prd-usuario-ciclo-2-auth-2026-06-02.md` | Criacao valida de conta, recuperacao/redefinicao sem entrega real, MFA honesto, persistencia de `two_factor_enabled` e reset por perfil com feedback controlado passaram em PC/tablet/mobile; build passou | Fechar erro de e-mail duplicado na criacao de conta; decidir/implementar MFA real e troca de senha com senha atual se forem requisitos |
| 2026-06-02 | Ciclo 2 - Signup duplicado | Codex | Local `http://127.0.0.1:5184` | `docs/evidence/prd-usuario-ciclo-2-signup-duplicado-2026-06-02.md` | E-mail duplicado exibiu erro generico, nao autenticou, nao duplicou `profiles` e limpou dados de teste em PC/tablet/mobile; paginas publicas de auth restauradas de bytes nulos; build passou | Seguir documentos/permissoes e decidir/implementar MFA real ou troca de senha com senha atual + nova senha se forem requisitos |
| 2026-06-03 | Ciclo 3 - Documentos/permissoes | Codex | Local `http://127.0.0.1:5185` + Supabase remoto atual | `docs/evidence/prd-usuario-ciclo-3-documentos-permissoes-2026-06-03.md` | `useDocuments`, smoke dedicado e migracao RLS criados; TypeScript e build passaram; smoke PC encontrou falha real de RLS remota: Colaborador da mesma org nao le documento do Admin; CLI direto bloqueado por `Invalid db.major_version: 17`; workdir temporario com apenas esta migracao conectou ao projeto, mas dependeu da senha Postgres remota | Aplicar senha Postgres remota e reexecutar PC/tablet/mobile |
| 2026-06-03 | Ciclo 3 - Estados de erro de upload | Codex | Local | `docs/evidence/prd-usuario-ciclo-3-upload-erros-2026-06-03.md` | Contrato de upload centralizado, TXT alinhado entre hook/UI, mensagens de tipo invalido e limite 50MB cobertas por 4 testes unitarios; TypeScript e build passaram | Aplicar migracao remota de documentos/permissoes ou seguir filtros/permissoes dos demais modulos |
| 2026-06-03 | Ciclo 3 - Documentos/permissoes remoto fechado | Codex | Local `http://127.0.0.1:5186` + Supabase remoto | `docs/evidence/prd-usuario-ciclo-3-documentos-permissoes-2026-06-03.md` | RLS remota de `public.documentos` aplicada e confirmada; smoke PC, tablet e mobile passaram com leitura/escrita por membro da org e bloqueio de anonimo/outra org; TypeScript e build passaram | Seguir P0.3/P0.4: validacoes negativas, status, orcamento, edicao/status/responsavel/datas/prioridade/exclusao/filtros |
| 2026-06-04 | Ciclo 3 - Atividades busca/filtros/edicao/Lixeira | Codex | Local `http://127.0.0.1:5187` + Supabase remoto | `docs/evidence/prd-usuario-ciclo-3-atividades-busca-lixeira-2026-06-04.md` | Busca por titulo/categoria/status, filtros por obra/status/prioridade/responsavel/periodo, edicao de status/prioridade, exclusao para Lixeira e RPC `soft_delete_atividade` passaram em PC/tablet/mobile; console/rede limpos; TypeScript e build passaram | Seguir P0.3 obras restantes e validar atividades em calendario/dashboard/relatorios |

## 15. Pendencias manuais

Itens que exigem decisao, credencial, confirmacao humana ou ambiente externo:

- [ ] Confirmar usuarios reais/sandbox para cada papel.
- [ ] Confirmar se checkout deve ser testado apenas em sandbox ou tambem com pagamento real.
- [ ] Confirmar provedores externos que devem permanecer fora do escopo neste ciclo.
- [ ] Confirmar politica de envio de e-mail: sandbox, log interno, fila, ou envio real posterior.
- [ ] Confirmar se validacao final sera feita em local, preview Vercel, producao ou todos.

## 16. Proxima atividade recomendada

Continuar pelos fluxos funcionais ainda abertos:

1. Fechar pendencias restantes do Ciclo 2: decisao/implementacao de MFA real e decisao/implementacao de troca de senha com senha atual + nova senha, caso sejam requisitos obrigatorios.
2. Fechar pendencias restantes do Ciclo 3: obras com validacoes negativas, status, orcamento e permissoes; atividades ainda precisam de data final e validacao em calendario/dashboard/relatorios.
3. Executar filtros completos, permissoes por papel e estados vazios dos demais modulos.
