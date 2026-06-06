# PRD_SEO - Ciclo hubs publicos sem gradiente e conteudo ficticio

Data: 2026-06-03  
Escopo: somente paginas publicas `/api`, `/central-ajuda` e `/carreiras`. Nenhuma alteracao foi feita no layout autenticado do app.

## Alteracoes executadas

- `src/pages/APIPage.tsx`: hero saiu de `bg-gradient-to-b` para superficie neutra com borda; blocos de integracao deixaram de usar cards e passaram a usar divisorias; contrato publico ficou em bloco textual com largura controlada.
- `src/pages/CentralAjuda.tsx`: removida busca fake, contadores de artigos e promessas de ticket/chat publico; pagina virou hub objetivo com topicos reais, leituras recomendadas e CTA para `/contato`.
- `src/pages/Carreiras.tsx`: removidas vagas ficticias e beneficios inventados; pagina passou a declarar que nao lista vagas abertas no momento e orienta candidatura espontanea por contato.
- Wrappers com `border`/fundo receberam padding real para reduzir `cramped-padding`; textos longos foram limitados com `max-w`.

## Validacao Impeccable

Arquivos fonte:

```powershell
npx.cmd impeccable detect src\pages\APIPage.tsx src\pages\CentralAjuda.tsx src\pages\Carreiras.tsx
```

Resultado: sem achados reportados nos arquivos alterados.

Busca de padroes removidos:

```powershell
rg -n "bg-gradient|gradient-|bg-clip-text|text-transparent|transition-all|hover:shadow|rounded-2xl|rounded-3xl|Abrir Ticket|Chat ao Vivo|Desenvolvedor|Designer UX|Engenheiro Civil|Vagas Abertas" src\pages\APIPage.tsx src\pages\CentralAjuda.tsx src\pages\Carreiras.tsx
```

Resultado: sem ocorrencias.

Rotas renderizadas:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/api http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/carreiras
```

Resultado apos o primeiro ajuste: 17 achados renderizados.  
Resultado final apos padding e largura de leitura: 15 achados renderizados.

Os achados locais de `line-length` foram removidos. Restam, por rota, um `cramped-padding` generico e os sinais globais recorrentes de `ai-color-palette`, `gradient-text` e `layout-transition`, associados ao bundle/CSS compartilhado ja registrado em ciclos anteriores.

## Validacoes complementares

```powershell
curl.exe -I http://127.0.0.1:5173/api
curl.exe -I http://127.0.0.1:5173/central-ajuda
curl.exe -I http://127.0.0.1:5173/carreiras
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

- `curl`: as tres rotas retornaram HTTP 200 com `text/html`.
- `lint`: passou com 0 erros e 31 warnings preexistentes.
- `test`: passou com 14 arquivos e 47 testes.
- `build`: passou com `postbuild` e `Prerendered 18 public route HTML files.`

## Residuais e proximo foco

- Continuar em `/sobre` e `/contato`, onde ainda existem gradientes, `transition-all`, cards repetidos e acentos roxo/azul em blocos publicos.
- Evitar alteracoes em componentes autenticados, checkout interno e layout de app.
- Tratar `ai-color-palette`, `gradient-text` e `layout-transition` globais somente quando a origem publica estiver isolada.
