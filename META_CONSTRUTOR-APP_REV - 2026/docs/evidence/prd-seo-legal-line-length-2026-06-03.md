# PRD_SEO - Ciclo legal line-length e superficie publica

Data: 2026-06-03  
Escopo: somente paginas publicas legais e footer publico de marketing. Nenhuma alteracao foi feita no layout autenticado do app.

## Alteracoes executadas

- `src/pages/legal/LegalPageLayout.tsx`: largura principal reduzida para `max-w-3xl`, mantendo breadcrumb, navegacao publica e footer.
- `src/pages/legal/PrivacyPolicy.tsx`, `TermsOfService.tsx`, `CookiePolicy.tsx` e `LGPD.tsx`: blocos de leitura reduzidos de `max-w-[75ch]` para `max-w-[64ch]`.
- `src/pages/legal/CookiePolicy.tsx`: categorias de cookies achatadas para lista com `divide-y` e `border-y`, removendo cards aninhados.
- `src/components/landing/FooterSection.tsx`: superficie do footer trocada de `bg-card` para `bg-background` e botoes sociais achatados para links iconicos simples.

## Validacao Impeccable

Arquivos fonte:

```powershell
npx.cmd impeccable detect src\pages\legal\LegalPageLayout.tsx src\pages\legal\PrivacyPolicy.tsx src\pages\legal\TermsOfService.tsx src\pages\legal\CookiePolicy.tsx src\pages\legal\LGPD.tsx
npx.cmd impeccable detect src\components\landing\FooterSection.tsx src\pages\legal\LegalPageLayout.tsx src\pages\legal\PrivacyPolicy.tsx src\pages\legal\TermsOfService.tsx src\pages\legal\CookiePolicy.tsx src\pages\legal\LGPD.tsx
```

Resultado: sem achados reportados nos arquivos alterados.

Rotas legais renderizadas:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/legal/privacidade http://127.0.0.1:5173/legal/termos http://127.0.0.1:5173/legal/cookies http://127.0.0.1:5173/legal/lgpd
```

Resultado apos ajuste de largura: 23 achados renderizados, sem `line-length`.

Resultado apos ajuste do footer: 25 achados renderizados, ainda sem `line-length`. Os achados restantes ficaram concentrados em `cramped-padding`, `nested-cards`, `ai-color-palette`, `gradient-text` e `layout-transition`.

Observacao: a rota `/legal/termos` reportou `single-font`/`overused-font` de forma intermitente. A inspecao DOM confirmou `bodyClass: marketing-surface`, H1 com `Archivo, "Noto Sans", Inter, system-ui, sans-serif` e paragrafo com `"Noto Sans", Inter, system-ui, sans-serif`; portanto este item foi tratado como falso positivo/intermitente do scan renderizado.

## Validacoes complementares

```powershell
rg -n "max-w-\[75ch\]|rounded-xl border border-border bg-card|rounded-lg border border-border bg-card" src\pages\legal
curl.exe -I http://127.0.0.1:5173/legal/privacidade
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

- `rg`: sem ocorrencias no recorte legal.
- `curl`: `/legal/privacidade` retornou HTTP 200 com `text/html`.
- `lint`: passou com 0 erros e 32 warnings preexistentes.
- `test`: passou com 13 arquivos e 43 testes.
- `build`: passou com `postbuild` e `Prerendered 18 public route HTML files.`

## Residuais e proximo foco

- Triar apenas fontes publicas de gradiente/layout em `/api`, `/central-ajuda`, `/carreiras`, `/contato`, `/sobre` e componentes compartilhados de marketing.
- Manter fora do escopo qualquer alteracao em dashboard, formularios internos, modulos autenticados, administracao, obras, RDO, checklist e documentos.
- Continuar `cramped-padding` e `nested-cards` somente com evidencia DOM por rota, evitando tentativas amplas sobre o bundle.
