# PRD_PRINTS - Evidencia do Ciclo 1

Data: 2026-06-03  
Ambiente: app local `http://127.0.0.1:5173` conectado ao Supabase remoto configurado no `.env`  
Conta de captura: `campanha+prdprints10@metaconstrutor.test`

## Massa criada

- 10 usuarios de campanha.
- 1 organizacao de campanha.
- 1 plano tecnico oculto `prd-prints-campaign`, usado para respeitar triggers de limite sem alterar planos reais.
- 6 obras.
- 36 atividades.
- 6 RDOs.
- 18 atividades de RDO.
- 6 checklists.
- 30 itens de checklist.
- 6 documentos demonstrativos.
- 6 equipes.
- 6 equipamentos.
- 6 fornecedores.
- 6 despesas.

## Capturas

- 20 screenshots capturados em desktop, tablet e mobile.
- Ultimo screenshot: `prd-prints-2026-06-03-20-dashboard-resumo-final-desktop.png`.
- Indice: `manifest.json`.
- Resumo do seed: `seed-summary.json`.

## Validacoes

- `npm run lint`: passou com 31 warnings existentes e 0 erros.
- `npm run test`: passou com 14 arquivos e 47 testes.
- `npm run build`: passou; postbuild prerenderizou 18 rotas publicas.

## Observacoes

- Nenhuma senha foi registrada nos artefatos.
- A massa usa e-mails `.test` e dados demonstrativos.
- Nao foram acionadas integracoes externas reais.
- `manifest.json` registrou 5 eventos de console durante `/app/atividades`; os prints foram capturados, mas devem passar por revisao antes de uso publicitario externo.
