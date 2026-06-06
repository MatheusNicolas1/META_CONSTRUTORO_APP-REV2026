# PRD_PRINTS - Selecionados para campanha

Data do pacote: 2026-06-05  
Origem: `../manifest.json`  
Status do lote: `captured`  
Total de screenshots: 28  
Ultimo print obrigatorio: `prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`

## Uso

Esta pasta contem apenas os 28 PNGs referenciados pelo manifesto final do `PRD_PRINTS`, separados do historico de recapturas da pasta principal.

Arquivos de controle:

- `selection-manifest.json`: indice do pacote com rota, dispositivo, status e SHA-256 de cada PNG.
- `source-manifest.json`: copia do manifesto final usado como fonte.
- `seed-summary.json`: resumo da massa demonstrativa persistida.

## Regras editoriais

- Nao excluir PNGs deste pacote sem decisao explicita; quando houver risco editorial, preservar o arquivo e resolver por recaptura, corte, mascaramento ou ajuste de copy antes da veiculacao.
- Manter esta pasta fora de `public/` ate aprovacao final.
- Revisar cada PNG antes de veiculacao externa.
- Cortar ou ocultar qualquer ID interno truncado, endereco tecnico, barra de navegador ou detalhe operacional que nao deva aparecer no anuncio.
- Nao publicar prints de perfil/configuracoes sem revisar e-mail `.test`, telefone ficticio e CNPJ/CPF zerado.
- Usar o print de notificacoes como estado vazio honesto, nao como prova de mensagens persistidas.
- Revisar/recapturar `prd-prints-2026-06-04-13-integracoes-status-desktop.png` antes de veicular: o print preservado ainda exibe o rotulo antigo `Fluxos suportados`; a publicacao deve evitar promessa operacional sem evidencia real.

## Validacao

- `selection-manifest.json` contem 28 entradas.
- Todos os arquivos foram copiados do manifesto final.
- O dashboard final permanece como o ultimo item do pacote.
