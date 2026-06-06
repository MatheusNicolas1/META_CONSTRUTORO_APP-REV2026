# PRD_SEO - documentacao, status e atualizacoes publicas

Data: 2026-06-03

## Escopo

- Execucao limitada a paginas publicas de publicidade/marketing/SEO.
- Nenhuma alteracao de layout foi feita no app autenticado.
- Rotas trabalhadas: `/documentacao`, `/status` e `/atualizacoes`.

## Alteracoes

- `src/pages/Documentacao.tsx`: pagina reestruturada em secoes sem `Card`/`Tabs`, com hierarquia H1/H2/H3 e texto honesto sobre documentacao publica.
- `src/pages/Status.tsx`: removidos indicadores ficticios de uptime, incidentes, latencia e badges coloridos de baixo contraste; pagina passou a declarar escopo operacional de forma neutra.
- `src/pages/Atualizacoes.tsx`: removidas versoes antigas/ficticias, datas legadas e promessas quantitativas sem fonte; conteudo passou a focar frentes reais de produto, integracao e marketing.
- `src/hooks/useMarketingSurface.ts`: hook publico para aplicar `body.marketing-surface` em rotas publicas sem depender exclusivamente da navegacao de marketing.

## Evidencia Impeccable

- Scan consolidado de 13 URLs publicas antes deste ciclo: 104 achados.
- Scan fonte depois da reestruturacao:
  - `npx.cmd impeccable detect src\pages\Documentacao.tsx src\pages\Status.tsx src\pages\Atualizacoes.tsx`
  - Resultado: sem achados nos arquivos alterados.
- Scan renderizado focado antes do hook `marketing-surface`: 18 achados nas 3 URLs.
- Scan consolidado de 13 URLs publicas depois da reestruturacao e antes do hook: 93 achados.
- Scan renderizado focado depois do hook:
  - `/documentacao`, `/status`, `/atualizacoes`: 16 achados.
  - Font warnings nao reapareceram nas rotas focadas.

## Validacao tecnica

- `rg` nos tres arquivos nao encontrou `Card`, `Badge`, gradientes, `transition-all`, `rounded-2xl`, `hover:shadow` ou conteudos ficticios antigos; restaram apenas usos textuais benignos de `versao`.
- `curl.exe -I` retornou HTTP 200 e `text/html` para `/documentacao`, `/status` e `/atualizacoes`.
- `npm.cmd run lint`: passou com 0 erros e 31 warnings preexistentes.
- `npm.cmd run test`: passou com 14 arquivos e 47 testes.
- `npm.cmd run build`: passou com `postbuild` e `Prerendered 18 public route HTML files.`

## Residuos

- Os achados renderizados restantes em `/documentacao`, `/status` e `/atualizacoes` ficaram concentrados em `cramped-padding`, `nested-cards` pontual em `/status` e sinais globais recorrentes de `ai-color-palette`, `gradient-text` e `layout-transition`.
- A busca em fonte indica que parte dos sinais globais vem de CSS/bundle compartilhado e de arquivos do app autenticado; esses itens devem permanecer documentados ate existir isolamento publico seguro, sem alterar layout interno do app.
- Proximo ciclo recomendado: inspecionar o `nested-cards` residual de `/status` com evidencia DOM e atacar `/preco`, que ainda concentra componentes publicos de pricing com superficies, transicoes e sinais renderizados.
