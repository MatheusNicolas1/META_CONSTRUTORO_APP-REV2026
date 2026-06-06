# PRD_SEO - Ciclo sobre e contato publicos

Data: 2026-06-03  
Escopo: somente paginas publicas `/sobre`, `/contato` e componentes institucionais usados por `/sobre`. Nenhuma alteracao foi feita no layout autenticado do app.

## Alteracoes executadas

- `src/pages/Sobre.tsx`: removidos fundos em gradiente, glows, `transition-all`, sombras pesadas, cards repetidos e CTA com promessa inflada.
- `src/components/sobre/TeamSection.tsx`: substituida a equipe ficticia com nomes, fotos e emails inventados por sinais institucionais honestos sobre produto, operacao, dados e atendimento.
- `src/components/sobre/InstitutionalTestimonials.tsx`: removidos depoimentos, logos, nomes e metricas inventadas; a secao agora orienta prova por fluxo e conteudo auditavel.
- `src/components/sobre/TimelineSection.tsx`: recriada a linha do tempo em texto limpo, sem encoding quebrado, sem cores roxo/azul e sem cards com sombra.
- `src/components/sobre/ImpactMetrics.tsx`: trocado fundo em gradiente por superficie neutra com divisorias e removidos cards internos.
- `src/pages/Contato.tsx`: hero trocado para superficie neutra; blocos de contato e acoes rapidas passaram de cards com hover pesado para grupos com divisorias; acentos azul/roxo foram substituidos por `text-primary`.
- Fallbacks visuais `Carregando...` das secoes lazy de `/sobre` foram removidos para evitar ruido de contraste no scan renderizado.

## Validacao Impeccable

Arquivos fonte:

```powershell
npx.cmd impeccable detect src\pages\Sobre.tsx src\pages\Contato.tsx src\components\sobre\ImpactMetrics.tsx src\components\sobre\TeamSection.tsx src\components\sobre\InstitutionalTestimonials.tsx src\components\sobre\TimelineSection.tsx
```

Resultado: sem achados reportados nos arquivos alterados.

Busca de padroes removidos:

```powershell
rg -n "bg-gradient|gradient-|bg-clip-text|text-transparent|transition-all|hover:shadow|rounded-2xl|rounded-3xl|purple|blue-|from-primary|to-secondary|shadow-2xl|backdrop-blur|animate-pulse|Ana Silva|Roberto Mendes|40%|24/7|centenas de construtoras" src\pages\Sobre.tsx src\pages\Contato.tsx src\components\sobre
```

Resultado: sem ocorrencias.

Rotas renderizadas:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato
```

Resultado antes do ajuste de fallback: 11 achados renderizados.  
Resultado final: 10 achados renderizados.

O alerta de baixo contraste em `Carregando...` foi removido. Restam um `cramped-padding` generico por rota e os sinais globais recorrentes `ai-color-palette`, `gradient-text` e `layout-transition`, associados ao bundle/CSS compartilhado ja registrado em ciclos anteriores.

## Validacoes complementares

```powershell
curl.exe -I http://127.0.0.1:5173/sobre
curl.exe -I http://127.0.0.1:5173/contato
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

- `curl`: as duas rotas retornaram HTTP 200 com `text/html`.
- `lint`: passou com 0 erros e 31 warnings preexistentes.
- `test`: passou com 14 arquivos e 47 testes.
- `build`: passou com `postbuild` e `Prerendered 18 public route HTML files.`

## Residuais e proximo foco

- Consolidar os residuos globais de `ai-color-palette`, `gradient-text` e `layout-transition` com isolamento da origem publica, sem alterar app autenticado.
- Investigar `cramped-padding` generico por rota com DOM evidence antes de nova tentativa.
- Reexecutar scan consolidado das rotas publicas principais para medir o saldo apos os ciclos recentes.
