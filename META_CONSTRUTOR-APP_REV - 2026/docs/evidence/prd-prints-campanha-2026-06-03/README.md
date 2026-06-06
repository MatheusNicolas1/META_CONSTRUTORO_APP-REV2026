# PRD_PRINTS - Pasta segura de campanha

Esta pasta guarda os screenshots e o manifesto da campanha publicitaria planejada em `PRD_PRINTS.md`.

Regras de uso:

- Manter os arquivos fora de `public/` ate aprovacao final.
- Usar apenas contas e dados demonstrativos.
- Nao armazenar senhas, tokens, chaves, dados reais de clientes ou informacoes pessoais sensiveis.
- Revisar cada imagem antes de uso externo.

## Ciclo 1 - 2026-06-03

Status: massa criada e screenshots capturados; pendencia tecnica resolvida no Ciclo 2.

Arquivos principais:

- `seed-summary.json`: resumo da massa persistida no Supabase.
- `manifest.json`: indice dos 20 screenshots capturados.
- `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`: ultimo print obrigatorio, com dashboard consolidado.

Validacoes:

- `npm run lint`: passou com 31 warnings existentes e 0 erros.
- `npm run test`: passou com 14 arquivos e 47 testes.
- `npm run build`: passou; postbuild prerenderizou 18 rotas publicas.

Pendencia resolvida:

- O manifesto inicial registrou eventos de console durante `/app/atividades`.
- Em 2026-06-04, a consulta de equipamentos foi corrigida em `src/hooks/useEquipamentos.ts` e o lote completo foi recapturado.
- Manifesto final: `captured`, 20 screenshots, `console_events: 0`.

## Ciclo 2 - 2026-06-04

Status: prints publicitarios recapturados e validados.

Arquivos principais:

- `manifest.json`: indice final dos 20 screenshots capturados.
- `prd-prints-ciclo-2-2026-06-04.md`: registro da correcao, recaptura e validacao.
- `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`: ultimo print obrigatorio, com dashboard consolidado.

Validacoes finais:

- `npm run lint`: passou com 31 warnings existentes e 0 erros.
- `npm run test`: passou com 16 arquivos e 53 testes.
- `npm run build`: passou; postbuild prerenderizou 18 rotas publicas.

## Ciclo 3 - 2026-06-04

Status: checklist publicitario reconciliado contra as evidencias finais.

Arquivos principais:

- `prd-prints-ciclo-3-2026-06-04.md`: fechamento de checklist, itens capturados e ressalvas editoriais.
- `seed-summary.json`: confirma 10 usuarios e massa persistida por modulo.
- `manifest.json`: confirma 20 screenshots capturados, `console_events: 0` e `transient_console_events: 0`.

Observacoes:

- O lote final permanece aprovado como material de campanha em pasta segura.
- Modal de nova atividade, detalhe de RDO, detalhe de checklist, perfil/configuracoes e notificacoes/FAQ/feedback nao foram capturados no lote final.
- Revisao humana de enquadramento ainda e recomendada antes de veiculacao externa, especialmente para cortar possiveis IDs internos truncados exibidos pela interface.

## Ciclo 4 - 2026-06-04

Status: lacunas de screenshots fechadas e lote completo recapturado.

Arquivos principais:

- `prd-prints-ciclo-4-2026-06-04.md`: registro da recaptura complementar.
- `manifest.json`: indice final com 23 screenshots capturados.
- `prd-prints-2026-06-04-14-atividade-nova-modal-desktop.png`: modal de nova atividade.
- `prd-prints-2026-06-04-15-rdo-visualizacao-desktop.png`: visualizacao detalhada de RDO.
- `prd-prints-2026-06-04-16-checklist-detalhe-desktop.png`: detalhe de checklist.
- `prd-prints-2026-06-04-23-dashboard-resumo-final-desktop.png`: ultimo print obrigatorio, dashboard consolidado.

Validacao:

- Manifesto final: `captured`, 23 screenshots, `console_events: 0`.
- Houve 1 evento transitorio Auth `_useSession` do Supabase sem impacto visual.
- Os tres novos enquadramentos foram inspecionados visualmente e carregaram dados persistidos.

## Ciclo 5 - 2026-06-04

Status: telas de apoio capturadas e lote completo recapturado.

Arquivos principais:

- `prd-prints-ciclo-5-2026-06-04.md`: registro da captura de perfil, configuracoes, notificacoes, FAQ e feedback.
- `manifest.json`: indice final com 28 screenshots capturados.
- `prd-prints-2026-06-04-17-perfil-conta-desktop.png`: perfil demonstrativo.
- `prd-prints-2026-06-04-18-configuracoes-desktop.png`: configuracoes demonstrativas.
- `prd-prints-2026-06-04-19-notificacoes-desktop.png`: notificacoes em estado vazio honesto.
- `prd-prints-2026-06-04-20-faq-desktop.png`: central de ajuda autenticada.
- `prd-prints-2026-06-04-21-feedback-desktop.png`: formulario de feedback sem envio.
- `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`: ultimo print obrigatorio, dashboard consolidado.

Validacao:

- Manifesto final: `captured`, 28 screenshots, `console_events: 0`.
- Houve 1 evento transitorio Auth `_useSession` do Supabase sem impacto visual.
- As cinco telas de apoio foram inspecionadas visualmente.

## Ciclo 6 - 2026-06-05

Status: pacote seguro de selecionados criado.

Arquivos principais:

- `prd-prints-ciclo-6-2026-06-05.md`: registro da separacao do lote final.
- `selecionados-campanha-2026-06-05/`: pacote final com apenas os 28 screenshots do manifesto.
- `selecionados-campanha-2026-06-05/selection-manifest.json`: indice do pacote com hashes SHA-256.
- `selecionados-campanha-2026-06-05/README.md`: regras editoriais para uso dos selecionados.

Validacao:

- 28 PNGs copiados a partir do `manifest.json` final.
- `source-manifest.json` e `seed-summary.json` copiados para rastreabilidade.
- O dashboard final permanece como `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

## Ciclo 7 - 2026-06-05

Status: copia operacional criada para layout.

Arquivos principais:

- `prd-prints-ciclo-7-prints-layout-2026-06-05.md`: registro da copia operacional.
- `prints_layout/`: pasta na raiz do projeto com os 28 PNGs finais e arquivos de controle.

Validacao:

- `prints_layout/` contem 28 arquivos `.png`.
- `prints_layout/` contem 32 arquivos totais.
- O dashboard final esta presente em `prints_layout/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.
