# PRD_PRINTS - Ciclo 6 - Pacote seguro de selecionados

Data: 2026-06-05  
Pasta fonte: `docs/evidence/prd-prints-campanha-2026-06-03/`  
Pacote final: `docs/evidence/prd-prints-campanha-2026-06-03/selecionados-campanha-2026-06-05/`

## Objetivo

Separar o lote final de campanha do historico de recapturas, evitando que PNGs antigos sejam usados por engano.

## Execucao

Foi criado um subpacote seguro com os 28 arquivos listados no `manifest.json` final.

Arquivos copiados para o pacote:

- 28 screenshots finais.
- `source-manifest.json`: copia do manifesto final.
- `selection-manifest.json`: indice do pacote, com rota, dispositivo, status e hash SHA-256 de cada PNG.
- `seed-summary.json`: resumo da massa demonstrativa.
- `README.md`: regras de uso editorial do pacote.

## Resultado

- `selection-manifest.json`: 28 entradas.
- `manifest.json` fonte: `captured`.
- Eventos criticos de console no manifesto fonte: 0.
- Eventos transitorios no manifesto fonte: 1 evento Auth `_useSession` do Supabase sem impacto visual.
- Ultimo print do pacote: `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`.

## Ressalvas

- A pasta continua fora de `public/`.
- O pacote esta pronto para revisao editorial, mas nao remove automaticamente IDs internos truncados ou campos demonstrativos visiveis.
- Perfil e configuracoes devem passar por revisao humana antes de anuncio externo, porque exibem e-mail `.test`, telefone ficticio e CNPJ/CPF zerado.
- Notificacoes deve ser tratada como estado vazio honesto, nao como evidencia de notificacoes persistidas.

## Validacao

Validacoes executadas:

- Conferencia de existencia de todos os arquivos referenciados pelo manifesto.
- Copia dos 28 PNGs finais para o pacote.
- Geracao de SHA-256 para cada PNG no `selection-manifest.json`.
- Conferencia de que o dashboard final permanece como ultimo print.

Nao houve alteracao de codigo de produto neste ciclo. `npm run lint`, `npm run test` e `npm run build` nao foram reexecutados.
