# PRD_PRINTS - Base de dados visual e prints para campanha publicitaria

Data de criacao: 2026-06-03  
Produto: Meta Construtor Web  
Status: Ciclo 7 validado; prints finais copiados para `prints_layout/`  
Responsavel operacional: Codex  
Fonte mestre: `PRD_MESTRE.md`  
Pasta segura dos materiais: `docs/evidence/prd-prints-campanha-2026-06-03/`
Pacote final de campanha: `docs/evidence/prd-prints-campanha-2026-06-03/selecionados-campanha-2026-06-05/`
Pasta operacional para layout: `prints_layout/`

## 1. Objetivo

Criar um ambiente demonstrativo controlado do Meta Construtor com 10 contas de campanha, registrar atividades reais do produto em volume suficiente para deixar as telas preenchidas e capturar screenshots publicitarios das principais areas do sistema.

O ultimo print obrigatorio deve ser da guia `/app/dashboard`, exibindo o resumo consolidado das atividades salvas durante a preparacao.

Resultado esperado:

- [x] 10 contas de campanha criadas com e-mails de teste identificaveis. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/seed-summary.json`.
- [x] Cada conta vinculada a uma organizacao/obra demonstrativa segura, sem dados reais de clientes. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/seed-summary.json`.
- [x] 5 a 6 registros salvos para cada fluxo funcional possivel e visualmente relevante no Ciclo 1. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/seed-summary.json`.
- [x] Todas as telas usadas em campanha carregam dados persistidos, nao mocks ou placeholders. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/manifest.json`.
- [x] Prints capturados em desktop, tablet e mobile quando a tela tiver uso publicitario. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/manifest.json`.
- [x] Prints salvos em `docs/evidence/prd-prints-campanha-2026-06-03/`.
- [x] Pacote final de campanha separado em `docs/evidence/prd-prints-campanha-2026-06-03/selecionados-campanha-2026-06-05/`.
- [x] Copia operacional criada em `prints_layout/` para uso no layout.
- [x] Dashboard final capturado por ultimo com resumo dos dados criados. Evidencia: `docs/evidence/prd-prints-campanha-2026-06-03/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

## 2. Regras de seguranca e publicidade

- [x] Usar apenas dados ficticios claramente promocionais, sem nomes, telefones, e-mails, CPFs, CNPJs, enderecos ou documentos de clientes reais. Evidencia: `seed-summary.json` com `real_customer_data: false`.
- [x] Padrao de e-mail permitido: `campanha+prdprintsNN@metaconstrutor.test` ou dominio equivalente de teste que nao dispare comunicacao real. Evidencia: 10 contas `.test`.
- [x] Nao executar pagamento real, envio real de e-mail, webhook externo, WhatsApp, ERP, N8N ou integracao de terceiros sem autorizacao explicita. Evidencia: `external_integrations_called: false`.
- [x] Evitar expor tokens, URLs assinadas, chaves, logs tecnicos ou mensagens de erro nos screenshots finais. Ressalva editorial: revisar possiveis IDs internos truncados antes de publicar externamente.
- [x] Antes de usar em anuncio, revisar cada imagem para remover dados sensiveis, barras de devtools, notificacoes pessoais e estados de erro. Revisao automatizada concluida; revisao humana final permanece recomendada.
- [x] A pasta de campanha deve permanecer fora de `public/` para nao ser publicada automaticamente.

## 3. Baselines adotados do PRD_MESTRE

Este PRD herda as seguintes decisoes:

- `PRD_USUARIO.md`: fluxos autenticados devem provar persistencia real e responsividade em PC, tablet e mobile.
- `PRD_falso.md`: sucesso visual sem persistencia real e bug; campanhas nao podem usar dados fabricados em UI que finjam backend.
- `PRD_DASHBOARD.md`: `/app/dashboard` deve consolidar obras, RDOs, checklists, equipes, documentos, relatorios e acoes recentes sem dados ficticios nao persistidos.
- `PRD_ADMIN.md`: analytics e atividades administrativas nao devem misturar dados de usuarios reais com dados de campanha.
- `PRD_SEO.md`: material publicitario deve preservar a mensagem publica do produto, mas este PRD nao altera paginas publicas nem layout de marketing.

## 4. Contas de campanha

Criar 10 contas/personas para cobrir papeis, rotinas e telas diferentes:

| Conta | Papel sugerido | Persona visual | E-mail de teste | Status |
| --- | --- | --- | --- | --- |
| 01 | Presidente | Diretoria acompanhando indicadores | `campanha+prdprints01@metaconstrutor.test` | Criada |
| 02 | Administrador | Operacao central da construtora | `campanha+prdprints02@metaconstrutor.test` | Criada |
| 03 | Gerente | Gestor de obra residencial | `campanha+prdprints03@metaconstrutor.test` | Criada |
| 04 | Gerente | Gestor de obra comercial | `campanha+prdprints04@metaconstrutor.test` | Criada |
| 05 | Colaborador | Encarregado registrando RDO | `campanha+prdprints05@metaconstrutor.test` | Criada |
| 06 | Colaborador | Tecnico de qualidade/checklist | `campanha+prdprints06@metaconstrutor.test` | Criada |
| 07 | Administrador | Suprimentos/fornecedores | `campanha+prdprints07@metaconstrutor.test` | Criada |
| 08 | Gerente | Controle de equipes/equipamentos | `campanha+prdprints08@metaconstrutor.test` | Criada |
| 09 | Administrador | Financeiro/despesas | `campanha+prdprints09@metaconstrutor.test` | Criada |
| 10 | Presidente | Revisao final e dashboard | `campanha+prdprints10@metaconstrutor.test` | Criada e validada em captura |

Checks por conta:

- [x] Criacao da conta concluida.
- [x] Perfil basico preenchido.
- [x] Papel e permissao aplicados.
- [x] Organizacao/obra demonstrativa vinculada.
- [x] Login validado com conta representativa `campanha+prdprints10@metaconstrutor.test`.
- [x] Dados criados na organizacao de campanha aparecem para papeis autorizados.

## 5. Massa de dados visual

Criar de 5 a 6 registros por fluxo abaixo, sempre que o modulo estiver funcional e persistindo:

| Fluxo | Rota principal | Quantidade alvo | Conteudo visual esperado | Status |
| --- | --- | ---: | --- | --- |
| Obras | `/app/obras` | 6 obras | Obras em diferentes status, etapas, responsaveis e progresso | Concluido |
| Atividades | `/app/atividades` | 6 atividades por obra principal | Tarefas com categoria, unidade, quantidade, prazo e status variados | Concluido |
| RDO | `/app/rdo` e `/app/rdo/novo` | 6 RDOs | Dias de obra com clima, equipe, equipamentos, atividades e ocorrencias | Concluido |
| Checklists | `/app/checklist` | 6 checklists | Qualidade, seguranca, entrega, limpeza, documentacao e vistoria | Concluido |
| Documentos | `/app/documentos` | 6 documentos | Contrato, ART, projeto, foto, nota, laudo ou evidencia operacional | Concluido |
| Equipes/colaboradores | `/app/equipes` | 6 membros/equipes | Times por funcao e obra, com responsaveis claros | Concluido |
| Equipamentos | `/app/equipamentos` | 6 equipamentos | Equipamentos em uso, disponiveis, manutencao e alocados | Concluido |
| Fornecedores | `/app/fornecedores` | 6 fornecedores | Materiais e servicos ligados a obra, sem dados reais | Concluido |
| Despesas | `/app/despesas` | 6 despesas | Custos de material, mao de obra, equipamento e servicos | Concluido |
| Relatorios | `/app/relatorios` | 5 a 6 visualizacoes/exportacoes seguras | Relatorios com filtros e dados demonstrativos | Validado visualmente |
| Integracoes | `/app/integracoes` | 5 a 6 estados honestos | Apenas estados reais, conectados ou indisponiveis sem sucesso falso | Validado visualmente; sem integracao externa |
| Perfil/configuracoes | `/app/perfil`, `/app/configuracoes` | 5 a 6 ajustes visuais | Conta, assinatura, preferencias e configuracoes sem PII real | Validado visualmente |
| Notificacoes/FAQ/feedback | `/app/notificacoes`, `/app/faq`, `/app/feedback` | 5 a 6 itens quando aplicavel | Mensagens demonstrativas e telas de apoio | Validado visualmente; notificacoes em estado vazio honesto |

Se algum fluxo nao suportar criacao real ou estiver bloqueado por permissao, backend ou integracao externa, registrar como `Bloqueado` com evidencia em vez de montar dado falso na interface.

## 6. Roteiro de screenshots

### 6.1 Prints obrigatorios desktop

- [x] Login ou entrada autenticada limpa.
- [x] `/app/obras` com grid/lista preenchida.
- [x] Detalhe de obra com dados, documentos e progresso.
- [x] `/app/atividades` com lista e filtros preenchidos.
- [x] Modal/tela de nova atividade com campos relevantes.
- [x] `/app/rdo` com RDOs recentes.
- [x] Visualizacao de RDO com atividades e evidencias.
- [x] `/app/checklist` com progresso visual.
- [x] Detalhe de checklist com itens marcados.
- [x] `/app/documentos` com biblioteca organizada.
- [x] `/app/equipes` com equipe demonstrativa.
- [x] `/app/equipamentos` com status variados.
- [x] `/app/fornecedores` com cards ou tabela preenchida.
- [x] `/app/despesas` com custos demonstrativos.
- [x] `/app/relatorios` com filtros e resumo.
- [x] `/app/integracoes` com estados reais/honestos.
- [x] `/app/dashboard` por ultimo, mostrando o resumo consolidado.

### 6.2 Prints responsivos

Capturar os melhores enquadramentos publicitarios:

| Dispositivo | Viewport alvo | Rotas minimas |
| --- | --- | --- |
| Desktop | 1440x900 | Dashboard, obras, RDO, checklist, documentos, relatorios |
| Tablet | 820x1180 | Dashboard, obras, checklist |
| Mobile | 390x844 | Dashboard, RDO, atividades, obra, bottom navigation |

Regras visuais:

- [x] Nenhum print pode conter erro de console visivel, toast de falha ou tela vazia inesperada. Evidencia: `console_events: 0`; houve 1 evento Auth transitorio sem impacto visual ou status critico.
- [x] Evitar captura com cursor, hover acidental, popover cortado ou loading.
- [x] Preferir dados com nomes curtos e legiveis.
- [x] Garantir que o logo e a navegacao aparecam de forma consistente.
- [x] Em mobile, validar que bottom navigation nao cobre botoes importantes.

## 7. Nomeacao dos arquivos

Usar padrao estavel:

```text
prd-prints-YYYY-MM-DD-NN-rota-contexto-dispositivo.png
```

Exemplos:

- `prd-prints-2026-06-03-01-dashboard-resumo-desktop.png`
- `prd-prints-2026-06-03-02-obras-lista-desktop.png`
- `prd-prints-2026-06-03-03-rdo-visualizacao-tablet.png`
- `prd-prints-2026-06-03-04-atividade-nova-mobile.png`

Criar tambem um indice:

- [x] `docs/evidence/prd-prints-campanha-2026-06-03/README.md`
- [x] `docs/evidence/prd-prints-campanha-2026-06-03/manifest.json`

O `manifest.json` deve listar rota, conta, viewport, arquivo, status de revisao e observacoes de uso publicitario.

## 8. Validacoes tecnicas

Executar antes da captura final:

```powershell
npm run lint
npm run test
npm run build
```

Executar durante a captura:

- [x] Smoke de login e rotas protegidas.
- [x] Verificacao de persistencia apos reload para registros principais.
- [x] Verificacao de console sem erro critico nas rotas fotografadas.
- [x] Verificacao de ausencia de senhas, tokens, dados reais de cliente e integracoes externas nos prints. Ressalva: revisao editorial humana antes de veiculacao externa.
- [x] Validacao visual desktop/tablet/mobile.

## 9. Evidencias

Registrar andamento em:

- `docs/evidence/prd-prints-campanha-2026-06-03/README.md`
- `docs/evidence/prd-prints-campanha-2026-06-03/manifest.json`
- Prints `.png` na mesma pasta.

Formato minimo por ciclo:

- Data e hora.
- Ambiente usado: local, preview ou producao.
- Contas usadas.
- Registros criados por modulo.
- Rotas capturadas.
- Prints aprovados/reprovados.
- Bloqueios reais.
- Comandos executados e resultado.

## 10. Criterios de aceite

- [x] As 10 contas existem e conseguem autenticar no ambiente de campanha. Validado com a conta `campanha+prdprints10@metaconstrutor.test`.
- [x] Os dados de campanha foram criados com persistencia real.
- [x] Cada modulo funcional possivel recebeu 5 a 6 registros demonstrativos ou foi documentado como bloqueado.
- [x] As telas principais possuem screenshots publicitarios em pasta segura.
- [x] O ultimo screenshot capturado e o dashboard consolidado.
- [x] O dashboard exibe resumo coerente das obras, RDOs, atividades, checklists e documentos criados.
- [x] Nenhuma imagem final contem dados reais de clientes, segredos, tokens, erros ou informacao interna indevida. Revisao automatizada indicou ausencia de senha/dados reais; revisao humana final continua recomendada antes de publicar.
- [x] O PRD e o indice de evidencias estao atualizados.

## 11. Plano de execucao

### Fase 0 - Preparacao

- [x] Confirmar ambiente de execucao: app local em `http://127.0.0.1:5173` conectado ao Supabase remoto configurado no `.env`.
- [x] Confirmar se criacao das 10 contas pode usar Supabase Auth real ou se deve usar ambiente isolado. Executado no Supabase remoto com e-mails `.test` e sem integracoes externas.
- [x] Criar pasta segura de campanha.
- [x] Criar `manifest.json` inicial e atualizar apos captura.
- [x] Definir senha temporaria segura fora do PRD.

### Fase 1 - Contas e organizacoes

- [x] Criar as 10 contas de campanha.
- [x] Validar login de conta representativa de revisao: `campanha+prdprints10@metaconstrutor.test`.
- [x] Aplicar papeis e permissoes.
- [x] Criar organizacoes/obras demonstrativas isoladas.
- [x] Registrar evidencia sem expor senha.

### Fase 2 - Massa de dados

- [x] Criar obras.
- [x] Criar atividades.
- [x] Criar RDOs.
- [x] Criar checklists.
- [x] Criar documentos/anexos seguros.
- [x] Criar equipes, equipamentos, fornecedores e despesas.
- [x] Validar relatorios e dashboard com dados persistidos.

### Fase 3 - Captura

- [x] Capturar desktop.
- [x] Capturar tablet.
- [x] Capturar mobile.
- [x] Capturar dashboard por ultimo.
- [x] Atualizar manifesto e README da pasta.

### Fase 4 - Revisao publicitaria

- [x] Revisar cada print para seguranca antes de publicar.
- [x] Separar capturados e `needs_review` no manifesto.
- [x] Registrar bloqueios e telas que exigem ajuste visual futuro.
- [x] Atualizar este PRD com status do ciclo.

## 13. Ciclo 1 - Execucao em 2026-06-03

Ambiente:

- App local: `http://127.0.0.1:5173`.
- Backend: Supabase remoto configurado no `.env`.
- Conta de captura: `campanha+prdprints10@metaconstrutor.test`.
- Senha temporaria: definida apenas por variavel de ambiente durante os scripts; nao registrada em arquivo.

Scripts criados:

- `scripts/prd-prints-seed.mjs`: cria/limpa somente a massa de campanha `PRD_PRINTS`.
- `scripts/prd-prints-screenshots.mjs`: autentica, captura screenshots e atualiza `manifest.json`.

Massa criada:

- 10 usuarios.
- 1 organizacao de campanha.
- 1 plano tecnico oculto `prd-prints-campaign` com limites finitos para permitir o seed sem alterar planos reais.
- 6 obras.
- 36 atividades.
- 6 RDOs.
- 18 atividades vinculadas a RDO.
- 6 checklists.
- 30 itens de checklist.
- 6 documentos demonstrativos.
- 6 equipes.
- 6 equipamentos.
- 6 fornecedores.
- 6 despesas.

Screenshots:

- 20 imagens capturadas em `docs/evidence/prd-prints-campanha-2026-06-03/`.
- Ultimo screenshot: `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`.
- Manifesto: `docs/evidence/prd-prints-campanha-2026-06-03/manifest.json`.

Validacoes:

- [x] `npm run lint` passou com 31 warnings existentes e 0 erros.
- [x] `npm run test` passou com 14 arquivos e 47 testes.
- [x] `npm run build` passou e prerenderizou 18 rotas publicas.

Observacoes e pendencias:

- O manifesto inicial registrou 5 eventos de console durante `/app/atividades`: respostas 400 e um `TypeError: Failed to fetch` do Supabase Auth.
- A causa raiz dos 400 foi corrigida em `src/hooks/useEquipamentos.ts`: a consulta deixou de usar a coluna inexistente `created_by` e passou a filtrar por `org_id` e `user_id`.
- O lote foi recapturado em 2026-06-04 com `manifest.json` em status `captured`, 20 screenshots com status `captured` e `console_events: 0`.
- Revisao humana final ainda e recomendada antes de publicar qualquer imagem.

## 14. Ciclo 2 - Revisao final em 2026-06-04

Ambiente:

- App local: `http://127.0.0.1:5173`.
- Backend: Supabase remoto configurado no `.env`.
- Conta de captura: `campanha+prdprints10@metaconstrutor.test`.
- Senha temporaria: definida apenas por variavel de ambiente durante os scripts; nao registrada em arquivo.

Correcoes e validacoes:

- [x] Reproduzido o erro de `/app/atividades` e identificado 400 em `equipamentos?created_by=...`.
- [x] Corrigido `src/hooks/useEquipamentos.ts` para consultar `equipamentos` por `org_id` e `user_id`.
- [x] Smoke isolado de `/app/atividades`: 36 linhas renderizadas e nenhum evento de console/resposta critica.
- [x] Lote completo de screenshots recapturado.
- [x] Manifesto final: `captured`, 20 screenshots, `console_events: 0`.
- [x] Ultimo screenshot mantido como `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`, na guia `/app/dashboard`.
- [x] `npm run lint` passou com 31 warnings existentes e 0 erros.
- [x] `npm run test` passou com 16 arquivos e 53 testes.
- [x] `npm run build` passou e prerenderizou 18 rotas publicas.

Observacao:

- Um evento transitorio de sessao Supabase Auth apareceu em recapturas anteriores e foi validado isoladamente sem resposta 4xx/5xx nem estado visual de erro. O lote final nao registrou evento transitorio nem evento critico.

## 15. Ciclo 3 - Fechamento de checklist publicitario em 2026-06-04

Objetivo:

- Reconciliar os itens ainda marcados como `Aberto` no corpo do PRD contra as evidencias ja existentes em `seed-summary.json` e `manifest.json`.
- Preservar como nao capturados os enquadramentos que nao aparecem no manifesto final, sem fabricar evidencia retroativa.

Evidencias reconciliadas:

- `seed-summary.json`: 10 usuarios, 6 obras, 36 atividades, 6 RDOs, 18 atividades de RDO, 6 checklists, 30 itens, 6 documentos, 6 equipes, 6 equipamentos, 6 fornecedores e 6 despesas.
- `manifest.json`: status `captured`, 20 screenshots, `console_events: 0`, `transient_console_events: 0`.
- Ultimo print do lote: `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`, rota `/app/dashboard`.

Itens mantidos como nao capturados no roteiro desktop:

- Modal/tela de nova atividade.
- Visualizacao detalhada de RDO.
- Detalhe de checklist com itens marcados.

Itens fora do lote publicitario deste ciclo:

- Perfil/configuracoes.
- Notificacoes/FAQ/feedback.

Ressalvas editoriais:

- A revisao automatizada confirma ausencia de senha registrada, dados reais de clientes, chamadas a integracoes externas e eventos criticos de console.
- Antes de uso externo em anuncio, cada PNG ainda deve passar por revisao humana para cortes, enquadramento e possiveis IDs internos truncados exibidos pela propria interface.

## 16. Ciclo 4 - Recaptura complementar em 2026-06-04

Objetivo:

- Fechar as tres lacunas do roteiro desktop mantidas abertas no Ciclo 3.
- Recapturar o lote completo para manter o dashboard como ultimo print do manifesto.

Ajuste operacional:

- `scripts/prd-prints-screenshots.mjs` passou a aceitar `PRD_PRINTS_CAPTURE_DATE`.
- O script tambem passou a capturar o modal de nova atividade, a visualizacao detalhada de RDO e o detalhe de checklist por IDs reais da organizacao de campanha.
- A senha temporaria da conta de captura foi definida apenas em variavel de ambiente durante a execucao e removida ao final.

Resultado:

- `manifest.json`: status `captured`.
- Total de screenshots: 23.
- Novos enquadramentos: `prd-prints-2026-06-04-14-atividade-nova-modal-desktop.png`, `prd-prints-2026-06-04-15-rdo-visualizacao-desktop.png` e `prd-prints-2026-06-04-16-checklist-detalhe-desktop.png`.
- Ultimo screenshot: `prd-prints-2026-06-04-23-dashboard-resumo-final-desktop.png`, rota `/app/dashboard`.
- Eventos criticos de console: 0.
- Evento transitorio: 1 `TypeError: Failed to fetch` em `_useSession` do Supabase Auth durante `/app/atividades`, classificado como transitorio e sem impacto visual.

Validacao visual:

- Modal de nova atividade: carregado com campos essenciais e sem estado de erro.
- Visualizacao de RDO: carregada com informacoes gerais, atividades realizadas e equipamentos.
- Detalhe de checklist: carregado com progresso 100%, item marcado e campos editaveis.
- Dashboard final: exibiu resumo consolidado com obras, equipes, equipamentos e atividades pendentes.

## 17. Ciclo 5 - Telas de apoio publicitario em 2026-06-04

Objetivo:

- Capturar as rotas que estavam fora do lote publicitario no Ciclo 4: perfil, configuracoes, notificacoes, FAQ e feedback.
- Recapturar o lote completo para manter o dashboard como ultimo print do manifesto.

Ajuste operacional:

- `scripts/prd-prints-screenshots.mjs` passou a incluir `supportRoutes` com `/app/perfil`, `/app/configuracoes`, `/app/notificacoes`, `/app/faq` e `/app/feedback`.
- Nenhuma integracao externa foi executada e nenhum formulario de feedback foi enviado.
- A senha temporaria foi definida apenas em variavel de ambiente durante a execucao e removida ao final.

Resultado:

- `manifest.json`: status `captured`.
- Total de screenshots: 28.
- Novos enquadramentos: `prd-prints-2026-06-04-17-perfil-conta-desktop.png`, `prd-prints-2026-06-04-18-configuracoes-desktop.png`, `prd-prints-2026-06-04-19-notificacoes-desktop.png`, `prd-prints-2026-06-04-20-faq-desktop.png` e `prd-prints-2026-06-04-21-feedback-desktop.png`.
- Ultimo screenshot: `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`, rota `/app/dashboard`.
- Eventos criticos de console: 0.
- Evento transitorio: 1 `TypeError: Failed to fetch` em `_useSession` do Supabase Auth, classificado como transitorio e sem impacto visual.

Validacao visual:

- Perfil: carregou dados demonstrativos da conta, e-mail `.test`, telefone e CPF/CNPJ ficticios.
- Configuracoes: carregou empresa demonstrativa, CNPJ zerado, telefone ficticio e e-mail `.test`.
- Notificacoes: carregou filtros e estado vazio honesto, sem fabricar notificacoes.
- FAQ: carregou conteudo de ajuda autenticado.
- Feedback: carregou formulario sem envio real.
- Dashboard final: permaneceu como ultimo print do manifesto.

## 18. Ciclo 6 - Pacote seguro de selecionados em 2026-06-05

Objetivo:

- Separar os 28 prints finais do historico de recapturas da pasta principal.
- Criar uma pasta segura que possa ser usada pela campanha sem misturar PNGs antigos.

Resultado:

- Pacote criado em `docs/evidence/prd-prints-campanha-2026-06-03/selecionados-campanha-2026-06-05/`.
- 28 PNGs copiados a partir do `manifest.json` final.
- `selection-manifest.json` gerado com rota, dispositivo, status e SHA-256 por arquivo.
- `source-manifest.json` e `seed-summary.json` copiados para rastreabilidade.
- `README.md` criado no pacote com regras editoriais de uso.
- Ultimo print do pacote: `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

Ressalvas:

- O pacote esta pronto para revisao editorial, nao para publicacao cega.
- Revisar cortes de tela, IDs internos truncados e campos demonstrativos antes de veicular externamente.
- Notificacoes permanece como estado vazio honesto.

## 19. Ciclo 7 - Copia operacional para layout em 2026-06-05

Objetivo:

- Criar a pasta `prints_layout/` na raiz do projeto para facilitar o uso dos prints no layout.

Resultado:

- `prints_layout/` criado.
- 28 PNGs finais copiados a partir do pacote `selecionados-campanha-2026-06-05/`.
- Arquivos de controle copiados: `README.md`, `selection-manifest.json`, `source-manifest.json` e `seed-summary.json`.
- Dashboard final presente em `prints_layout/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

Observacao:

- `prints_layout/` e uma copia operacional. A fonte de auditoria continua sendo `docs/evidence/prd-prints-campanha-2026-06-03/`.

## 20. Dependencias

- Acesso funcional ao ambiente escolhido.
- Credenciais/variaveis Supabase configuradas.
- Capacidade de criar usuarios de teste sem enviar e-mails reais.
- Playwright ou ferramenta equivalente para captura visual.
- Permissoes suficientes para criar dados nos modulos autenticados.
- Definicao do ambiente de campanha para evitar contaminacao de dados reais.
