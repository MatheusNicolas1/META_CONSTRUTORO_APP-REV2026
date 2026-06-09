# PRD_MESTRE - Fonte consolidada de decisoes e execucoes PRD

Data de criacao: 2026-05-29  
Produto: Meta Construtor Web  
Status: fonte mestre operacional  
Objetivo: concentrar as decisoes, conclusoes e evidencias dos PRDs ja criados/executados, adotando como correto tudo que foi validado e marcado como concluido nos PRDs de origem.

## 1. Regra principal de uso

Sempre que uma nova tarefa tiver relacao com qualquer assunto coberto pelos PRDs abaixo, este arquivo deve ser consultado antes de reabrir diagnostico, recriar requisito ou desfazer decisao anterior.

Regra de continuidade:

- Itens marcados como concluidos com evidencia nos PRDs de origem devem ser tratados como baseline correto do projeto.
- Itens parcialmente executados devem ser preservados como parciais; nao podem virar "feito" sem nova evidencia.
- Itens planejados devem ser tratados como direcao aprovada, mas nao como implementacao concluida.
- Pendencias manuais, externas ou pausadas pelo usuario continuam abertas ate confirmacao objetiva.
- Se uma validacao nova contradisser um item concluido, tratar como regressao ou mudanca de contexto, nao como erro automatico do PRD antigo.
- Em caso de conflito entre PRDs, prevalece a evidencia mais recente, mais especifica e validada no ambiente real.

## 2. Fontes consolidadas

| Arquivo | Assunto | Estado mestre |
| --- | --- | --- |
| `PRD.md` | Release publica, Supabase, Vercel, RDO, Stripe, LGPD, seguranca, testes e operacao | Concluido para itens automatizaveis; pendencias manuais preservadas |
| `docs/PRD_LAYOUT.md` | Layout, responsividade, PWA, RDO, relatorios/PDFs e inventario amplo de rotas | Concluido para cobertura automatizavel; dependencias externas preservadas |
| `PRD_USUARIO.md` | Homologacao completa de fluxos do usuario em PC/tablet/mobile | Parcial em execucao; usar apenas itens marcados como evidenciados |
| `PRD_falso.md` | Auditoria de acoes falsas, mockups, dados ficticios e handlers sem persistencia | Parcialmente concluido com varios P0 convertidos; manter pendencias explicitas |
| `PRD_ADMIN.md` | Admin de usuarios, marketing, analytics, funil, governanca e auditoria | Parcialmente executado; P0/P1/P2 tecnico inicial validado |
| `PRD_SEO.md` | SEO, marketing publico, metadados, sitemap, robots e qualidade visual publica | Fundacao tecnica executada; reestrutura visual ampla ainda aberta |
| `PRD_BLOG.md` | Blog publico, cluster RDO, artigos PAA, FAQ schema, sitemap e prerender | Ciclo 1 implementado e pronto para revisao |
| `PRD_DASHBOARD.md` | Redesign do dashboard principal inspirado no Canva | Planejado; nao tratar como feito |
| `PRD_LIXEIRA.md` | Lixeira, soft delete, restauracao e expurgo | Planejado; nao tratar como feito |
| `PRD_AUDIO_ELEVENLABS.md` | Mensagens de audio, resumos por voz, ElevenLabs TTS, Whisper/OpenAI STT, n8n e WhatsApp Business | Planejamento operacional; fonte primaria atual de audio |
|| `PRD_AUDIO_WHISPER_N8N.md` | Historico de planejamento audio/Whisper; refencia para contratos tecnico anteriores | Historico; consultar apenas para contexto ou contratos nao cobertos pelo PRD atual |
|| `PRD_PRINTS.md` | Contas demonstrativas, massa visual e screenshots seguros para campanha publicitaria | Ciclo 7 validado; 28 prints finais copiados para `prints_layout/`, pacote seguro mantido e dashboard final salvo |
|| `docs/PRD_GESTAO_CONTRATOS_MEDICOES_2026-05-31.md` | Gestão de contratos e medições de obras | Implementado: página `Contratos.tsx`, hook `useContratosMedicoes.ts`, rota `/app/contratos`, EFs `calcular-medicao` e `medicao-approve-flow` |
|| `docs/PRD_ORDEM_SERVICO_2026-05-31.md` | Ordem de Serviço (OS) com aprovação multicamadas | Implementado: página `OrdensServico.tsx`, hook `useOrdensServico.ts`, rota `/app/ordens-servico`, EF `ordem-servico-approve` |
|| `docs/PRD_DIALOGO_DIARIO_SEGURANCA_2026-05-31.md` | DDS (Diálogo Diário de Segurança) | Implementado: página `DDS.tsx`, hook `useDDS.ts`, rota `/app/dds`, EFs `consolidar-fluxo` e `indicadores-mensais-dds` |
|| `docs/PRD_FLUXO_CAIXA_CURVA_ABC_2026-05-31.md` | Fluxo de caixa e curva ABC de obras | Implementado: página `FluxoCaixa.tsx`, hook `useFluxoCaixa.ts`, rota `/app/fluxo-caixa`, EF `calcular-receita` |
|| `docs/PRD_PORTAL_CLIENTE_2026-05-31.md` | Portal do cliente com acesso público por token | Implementado: páginas `ClientesPortal.tsx` e `PortalClientePublico.tsx`, hooks `useClientesPortal.ts` e `usePortalCliente.ts`, rota `/app/clientes-portal` e pública `/portal/:token`, EF `portal-client-register` |
|| `docs/PRD_INTEGRACAO_ERP_2026-05-31.md` | Integração com ERPs (Omie, ContaAzul, etc.) | Implementado: página `IntegracaoERP.tsx`, hook `useIntegracaoERP.ts`, rota `/app/integracoes/erp`, migrations `prd_erp_tables` e `prd_rpcs_complementares` |
|| `docs/PRD2.md` | Estabilizacao, anti-duplicacao, schema drift e verificacao antes de criar | Diretriz historica; aplicar regra de verificar antes de alterar |
| `docs/PRD3.md` | Zero dados ficticios, org_id, query keys e isolamento de cache | Diretriz historica parcialmente executada; validar no PRD_falso e codigo atual |
| `docs/PRD4.md` | Estabilizacao funcional rigida por modulos | Diretriz historica; usar como disciplina de execucao |
| `docs/PRD5.md` e `docs/RELATORIO_FINAL_CONFORMIDADE_PRD5.md` | Funcionalidades mockadas, relatorios, integracoes, contato, approvals | Historico parcialmente superado por PRD.md e PRD_falso |

## 3. Baselines adotados como corretos

### 3.1 Release publica e operacao

Origem principal: `PRD.md`.

Adotar como correto:

- Fluxo de release deve ser controlado por checklist, evidencia e Go/No-Go, nao por suposicao.
- `npm run lint`, `npm run test` e `npm run build` foram gates padrao de validacao.
- Rotas publicas principais ja foram validadas em producao com HTTP 200: `/home`, `/login`, `/criar-conta`, `/preco`, `/checkout?plan=basic`, `/checkout/success`, `/checkout/cancel`, `/contato` e paginas legais.
- Vercel production foi usado como destino real de deploy, com alias em `https://www.metaconstrutor.app.br`.
- Drift recente de Supabase foi reconciliado de forma conservadora; drift residual antigo aceito permanece documentado.
- Edge Functions criticas foram revalidadas como ativas quando registradas no PRD.
- Pendencias manuais/controladas nao devem ser marcadas como feitas sem execucao real: Google OAuth final, redefinicao por link de e-mail, pagamento real, troca e cancelamento de plano.

Regra futura:

- Ao mexer em release, Supabase, Vercel, Stripe, LGPD, RDO ou rotas publicas, partir do estado de `PRD.md` como baseline e registrar nova evidencia se algo mudar.

### 3.2 Layout, responsividade, PWA e relatorios

Origem principal: `docs/PRD_LAYOUT.md`.

Adotar como correto:

- A arvore de rotas de referencia para layout e `src/components/PerformanceOptimizedApp.tsx`.
- O shell autenticado de referencia envolve `OptimizedLayout`, `AppSidebar`, `BottomNavigation` e utilitarios globais de CSS.
- A cobertura automatizada PRD_LAYOUT validou rotas publicas, autenticadas, redirecionamentos legados, PWA, RDO, relatorios e dialog de e-mail.
- A regressao consolidada chegou a 70 testes Playwright; falhas finais em lote foram classificadas como intermitencia de Auth/fetch, nao quebra comprovada de layout.
- PWA mobile deve manter bottom navigation, safe area e conteudo final acessivel.
- Envio real de e-mail e `GOTENBERG_URL` remoto/publico sao dependencias externas, nao falhas de layout.
- Edge Function `generate-rdo-pdf` foi validada localmente com Gotenberg via `--env-file`; producao ainda precisa de endpoint publico/estavel configurado em Supabase Secrets.

Regra futura:

- Ao alterar layout, rotas, shell, RDO, relatorios ou PDFs, reutilizar primeiro os smokes `scripts/prd-layout-*.spec.ts`.
- Nao declarar regressao de layout sem evidencia visual ou Playwright; diferenciar erro de rede/Auth de overflow, sobreposicao ou quebra responsiva.

### 3.3 Homologacao do usuario

Origem principal: `PRD_USUARIO.md`.

Adotar como correto apenas o que esta evidenciado:

- Rotas publicas principais, checkout publico, login valido, login invalido, logout e bloqueio anonimo foram validados.
- Reload apos login manteve sessao quando esperado.
- Tema claro/escuro alterna, reflete na UI e sobrevive a reload nos cenarios testados.
- Perfil parcial salva e recarrega: nome, telefone, cargo, empresa, biografia e perfil publico.
- Criacao de obra com dados obrigatorios, anexo PDF, listagem, detalhe, busca e edicao de observacoes foram validadas em PC/tablet/mobile.
- Documento PDF na criacao, imagem posterior, listagem, detalhe, visualizacao, download, exclusao e bloqueio de extensao invalida foram validados em PC/tablet/mobile.
- Atividade vinculada a obra, categoria, unidade, quantidade, persistencia apos reload, busca textual, filtros por obra/status/prioridade/responsavel/periodo, edicao de status/prioridade/data/responsavel e exclusao para Lixeira foram validadas.
- RDO teve criacao por colaborador, persistencia, visualizacao, aprovacao, rejeicao e e-mail simulado validados.

Pendencias que continuam abertas:

- Recuperacao/redefinicao de senha, MFA e criacao de conta completa.
- Avatar, endereco/documento, idioma/localidade, notificacoes, senha e persistencia de tema apos logout/login.
- Criacao de obra completa, validacoes negativas, status, orcamento, permissoes e filtros completos.
- Data final de atividade e validacao de atividades em calendario/dashboard/relatorios.
- Checklists completos.
- Fluxos P1/P2 completos, permissoes por papel, estados vazios e regressao final.

Regra futura:

- Tarefas de experiencia do usuario devem continuar do ponto aberto em `PRD_USUARIO.md`, nao reiniciar a homologacao do zero.

### 3.4 Dados reais, acoes falsas e mocks

Origem principal: `PRD_falso.md`, com diretrizes historicas de `docs/PRD3.md` e `docs/PRD5.md`.

Adotar como correto:

- Sucesso visual sem persistencia real e considerado bug de produto.
- `/app/seguranca` deixou de ser placeholder e passou a consultar dados reais.
- Dashboard de integracoes deixou de exibir uptime/latencia fabricados.
- Logs de integracao passaram a persistir em `analytics_events.properties`.
- Webhooks sem backend real nao devem retornar sucesso falso; devem falhar de forma explicita ou ficar bloqueados.
- Suspensao administrativa de usuario passou por Edge Function real `suspend-user`, com JWT, permissao e auditoria.
- Auditoria global passou por Edge Function real `record-audit-log`.
- `ChecklistDetalhes` passou a usar `generate-checklist-pdf`, `send-checklist-email` e recarga real do checklist.
- Validacoes tecnicas recentes passaram com lint/test/build, mantendo warnings existentes como nao bloqueantes.

Pendencia aberta:

- Auditar `src/components/chat/ExpandableChatDemo.tsx` em `/contato`, pois respostas locais/predefinidas e botoes de anexo/microfone podem parecer funcionalidade real.

Regra futura:

- Antes de converter qualquer item falso, validar contrato real de Supabase, Storage, Edge Function ou API.
- Se nao houver backend real, bloquear ou sinalizar indisponibilidade com clareza; nao usar toast de sucesso falso.

### 3.5 Admin, analytics, marketing e governanca

Origem principal: `PRD_ADMIN.md`.

Adotar como correto:

- O Admin deve ser orientado a usuarios, aquisicao, ativacao, engajamento, retencao, receita, suporte e governanca, nao a performance operacional de uma obra especifica.
- `analytics_events` foi escolhido como fonte canonica futura, mantendo `user_activity` e `user_interactions` como legado/compatibilidade.
- O schema remoto de Admin/analytics foi verificado antes das alteracoes.
- `analytics_events` foi enriquecido com contexto, policies e indices.
- `setAnalyticsSession` e `resetUser` foram conectados ao ciclo de auth.
- `setAnalyticsSession` foi conectado ao ciclo de organizacao ativa/role.
- Rota de RDO no tracking foi corrigida de `/app/rdos` para `/app/rdo`.
- Gate de Admin global baseado em e-mail hardcoded foi removido em favor de helpers de acesso.
- Placeholder de uptime foi removido de `AdminHealthMetrics`.
- Views administrativas foram criadas e confirmadas no remoto.
- AdminDashboard foi reestruturado para abas de Visao geral, Aquisicao, Ativacao, Engajamento, Retencao, Receita, Usuarios, Organizacoes, Rotas, Campanhas, Saude e Auditoria.
- Tracking publico anonimo com UTM/ref foi implementado e validado em `/home`.

Pendencias abertas:

- Filtros globais de periodo, plano, role, campanha, origem, rota e org.
- Instrumentar CTAs publicos, associacao signup/login, checkout e cupom.
- Validar `/preco`, `/checkout` e `/criar-conta` com Playwright anonimo sem erros de console.
- Validar usuario comum sem acesso ao Admin e admin autorizado com acesso.
- Validar ausencia de PII em eventos e trilhas de auditoria/exportacao.

Regra futura:

- Qualquer tarefa de Admin/analytics deve preservar `analytics_events` como fonte canonica e evitar N+1 queries no frontend.

### 3.6 SEO, marketing publico e descoberta comercial

Origem principal: `PRD_SEO.md`.

Adotar como correto:

- Dominio canonico confirmado: `https://www.metaconstrutor.app.br`.
- `src/config/seo.ts` foi criado como fonte central de metadados.
- `src/components/SEO.tsx` evoluiu para `react-helmet-async`, com canonical, robots, Open Graph, Twitter e JSON-LD.
- Rotas publicas principais e paginas legais foram conectadas a metadados centralizados.
- Rotas de entrada/comercial sensivel como `/login`, `/criar-conta` e `/checkout` receberam metadados e `noindex` conforme configuracao.
- `public/sitemap.xml`, `scripts/generate-sitemap.mjs` e `public/robots.txt` foram criados/atualizados.
- Fallback de `index.html` foi atualizado com metadados absolutos.
- `sitemap.xml`, `robots.txt` e HTML inicial de `/home` foram validados localmente.
- Anti-padroes especificos apontados pelo Impeccable foram corrigidos em `HeroSection`, `VideoDemo`, `Status` e `LGPD`.
- `npm run build` passou apos as alteracoes de SEO.

Pendencias abertas:

- Prerender/HTML estatico completo por rota publica.
- Criar `PRODUCT.md` e `DESIGN.md` ou fluxo equivalente de marca.
- Reestruturar visualmente `/home`, `/preco`, `/sobre`, `/contato` e demais rotas publicas.
- Reduzir achados restantes do Impeccable em URLs publicas.

Regra futura:

- Ao alterar paginas publicas, preservar SEO centralizado e canonico `www.metaconstrutor.app.br`.
- Nao indexar auth, checkout sensivel ou rotas privadas sem decisao explicita.

### 3.7 Dashboard principal

Origem principal: `PRD_DASHBOARD.md`.

Estado mestre:

- Planejado, aguardando execucao.
- Nao existe baseline de implementacao concluida neste PRD.

Direcao aprovada:

- Dashboard deve ser inspirado na estrutura produtiva do Canva, mas mantendo identidade Meta Construtor.
- Preservar `SidebarProvider`, `SidebarTrigger`, acessibilidade e responsividade PWA.
- Usar logo completa e icone de forma responsiva quando a implementacao for executada.
- Nao exibir dados ficticios em recentes, metricas ou documentos.

Regra futura:

- Antes de editar UI do dashboard, executar ou registrar etapa Impeccable de shape/layout.
- Validar desktop, sidebar recolhida, tablet e mobile antes de marcar como concluido.

### 3.8 Lixeira e restauracao

Origem principal: `PRD_LIXEIRA.md`.

Estado mestre:

- Planejado, aguardando execucao.
- Nao existe baseline de implementacao concluida neste PRD.

Direcao aprovada:

- Exclusao operacional deve virar soft delete restauravel por 30 dias.
- Arquivos de Storage nao devem ser removidos antes do expurgo definitivo.
- Lixeira deve respeitar `org_id`, permissoes, auditoria e prazo de retencao.
- Exclusao de conta por LGPD, logs de auditoria e eventos analiticos seguem regras especiais e nao entram automaticamente na Lixeira comum.

Regra futura:

- Antes de implementar, verificar schema remoto real para `deleted_at`, `deleted_by`, nomes de tabelas e policies.
- Nao criar novas exclusoes definitivas em modulos operacionais sem avaliar a Lixeira.

## 4. Contratos tecnicos transversais

### 4.1 Supabase e schema real

- Nao confiar cegamente em tipos gerados ou migrations historicas quando a tarefa envolve persistencia.
- Verificar schema remoto real quando houver risco de drift.
- Preferir queries/read-only checks antes de writes destrutivos.
- Para correcoes estreitas em remoto com historico divergente, aplicar migration/SQL pontual e registrar evidencia.

### 4.2 Multi-tenant e permissoes

- `org_id` e a chave de isolamento operacional.
- Usuario de uma organizacao nao pode ver dados de outra organizacao.
- RLS, policies e funcoes RPC/Edge Functions devem preservar organizacao, papel e autoria.
- Acesso administrativo global nao deve depender de e-mail hardcoded.

### 4.3 RDO

- O contrato vivo validado em runs anteriores usou `criado_por_id` em `rdos`, nao `created_by`.
- Mapeamentos frontend -> DB devem ser explicitos, especialmente `obraId -> obra_id`, `equipeOciosa -> equipe_ociosa`, `tempoOcioso -> tempo_ocioso` e criador.
- RDO aprovado e o estado correto para envio por e-mail.
- Estados canonicos de RDO devem ser preservados: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`.

### 4.4 Documentos e anexos

- Persistencia real de documentos passa por Supabase Storage bucket `documentos` e tabela `public.documentos`.
- Arquivos anexados durante criacao de obra precisam ser enviados depois que a obra existir e vinculados por `obra_id`.
- UI que apenas guarda arquivo em estado local nao e persistencia suficiente.

### 4.5 Tema e configuracoes pessoais

- O provider de tema deve ser a fonte de verdade do estado visual.
- Preferencia de tema deve hidratar no app start e persistir em `user_settings.theme` quando aplicavel.
- Toggle de tema nao deve manter estado independente que possa divergir da classe real no `<html>`.

### 4.6 Paginas publicas, preco e checkout

- `/preco` anonimo nao deve disparar query Supabase protegida que gere `401 Unauthorized`.
- `/checkout?plan=basic` publico deve funcionar sem auth quando aplicavel.
- Se cards renderizam mas o console registra 401 em pagina publica, isso ainda e bug.

### 4.7 Sem dados ficticios

- Nao usar mocks, arrays locais, placeholders operacionais ou contadores hardcoded como se fossem dados reais.
- Ausencia de dado deve ser estado vazio honesto.
- Funcionalidade sem backend real deve ficar desabilitada, indisponivel ou retornar erro claro, nunca sucesso falso.

## 5. Quando retomar uma tarefa

Use este roteamento:

- Release, deploy, producao, Supabase, Stripe, LGPD, RDO amplo: consultar `PRD.md`.
- Layout, responsividade, PWA, overflow, PDFs, rotas amplas: consultar `docs/PRD_LAYOUT.md`.
- Homologacao do usuario, PC/tablet/mobile, fluxos P0/P1/P2: consultar `PRD_USUARIO.md`.
- Mock, falso, placeholder, acao sem persistencia: consultar `PRD_falso.md`.
- Admin, analytics, usuarios, marketing, funil, auditoria: consultar `PRD_ADMIN.md`.
- SEO, sitemap, robots, metadados, paginas publicas: consultar `PRD_SEO.md`.
- Dashboard principal e logo/sidebar inspirada no Canva: consultar `PRD_DASHBOARD.md`.
- Lixeira, soft delete, restauracao, expurgo: consultar `PRD_LIXEIRA.md`.
- Audio, voz, resumos falados, ElevenLabs TTS, Whisper/OpenAI STT, n8n, WhatsApp Business: consultar `PRD_AUDIO_ELEVENLABS.md`.

## 6. Proxima manutencao deste mestre

Atualizar este arquivo quando:

- Um PRD parcial for finalizado.
- Uma pendencia manual for validada e fechada.
- Uma decisao antiga for superada por evidencia nova.
- Um novo PRD operacional for criado.
- Uma regressao comprovada alterar algum baseline adotado como correto.

Ao atualizar, manter a regra: concluido com evidencia vira baseline; aberto continua aberto.
