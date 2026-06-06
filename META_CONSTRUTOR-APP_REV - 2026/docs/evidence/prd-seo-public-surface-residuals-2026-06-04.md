# PRD_SEO - Residuos publicos com isolamento seguro

Data: 2026-06-04

## Escopo

- Continuacao da execucao do `PRD_SEO.md`.
- Alteracoes restritas a paginas publicas, navegacao publica e chat flutuante usado em `/contato`.
- Layout autenticado do app mantido fora do escopo.

## Diagnostico

O ciclo anterior terminou com 53 achados renderizados no scan consolidado. A recomendacao era continuar apenas em residuos com seletor DOM confiavel e arquivo publico claro.

Foi feita inspecao DOM em `/home`, `/api`, `/central-ajuda`, `/carreiras`, `/preco`, `/sobre` e `/contato`.

Achados com correcao segura:

- `LandingNavigation`: botoes e icones publicos tinham `duration-*` sem `transition-*` explicito, resultando em `transition: all` no DOM.
- `/api`, `/central-ajuda` e `/carreiras`: paginas publicas independentes ainda nao aplicavam `body.marketing-surface`.
- Wrappers publicos com `bg-background` em `/home`, `/preco`, `/sobre`, `/contato`, `/api`, `/central-ajuda`, `/carreiras`, `/documentacao`, `/status` e `/atualizacoes` apareciam como superficie sem inset.
- FAQ da home tinha `border-y` sem padding no wrapper.
- Chat flutuante publico de `/contato` usava `transition-all`.

Residuos mantidos documentados:

- `gradient-text`: a inspecao DOM nao encontrou elemento renderizado com `background-clip:text` e gradiente nas rotas publicas verificadas. O alerta continua classificado como residuo de CSS/bundle compartilhado.
- `layout-transition`: apos corrigir a navegacao publica e o chat flutuante, a inspecao DOM nao encontrou transicao de `height` ou `all` nas rotas verificadas, mas o scan URL ainda reporta o residuo. Nao foi feita alteracao em componentes globais de app como sidebar/accordion sem seletor publico confiavel.
- `#root`: segue como falso positivo estrutural do scanner em alguns casos, por ser o mount point do React.

## Alteracoes executadas

- `LandingNavigation`: trocado `duration-*` solto por `transition-opacity` ou `transition-colors`.
- `APIPage`, `CentralAjuda` e `Carreiras`: aplicado `useMarketingSurface`.
- Wrappers publicos principais receberam `p-2` para criar inset minimo em superficies com `bg-background`.
- `FAQSection`: wrapper com `border-y` recebeu padding.
- `expandable-chat`: trocado `transition-all` por `transition-[opacity,transform]` no painel e `transition-colors` no botao.

## Arquivos alterados

- `src/components/landing/LandingNavigation.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/ui/expandable-chat.tsx`
- `src/pages/Index.tsx`
- `src/pages/Preco.tsx`
- `src/pages/Sobre.tsx`
- `src/pages/Contato.tsx`
- `src/pages/APIPage.tsx`
- `src/pages/CentralAjuda.tsx`
- `src/pages/Carreiras.tsx`
- `src/pages/Documentacao.tsx`
- `src/pages/Status.tsx`
- `src/pages/Atualizacoes.tsx`

## Validacao Impeccable

### Fonte

Comandos executados:

```powershell
npx.cmd impeccable detect src\components\landing\LandingNavigation.tsx
npx.cmd impeccable detect src\pages\Index.tsx src\pages\Preco.tsx src\pages\Sobre.tsx src\pages\Contato.tsx src\pages\APIPage.tsx src\pages\CentralAjuda.tsx src\pages\Carreiras.tsx src\pages\Documentacao.tsx src\pages\Status.tsx src\pages\Atualizacoes.tsx src\components\landing\LandingNavigation.tsx
npx.cmd impeccable detect src\components\landing\FAQSection.tsx src\components\ui\expandable-chat.tsx
```

Resultado: sem achados reportados nos arquivos fonte alterados.

### DOM

Inspecao em `/api`, `/central-ajuda` e `/carreiras` confirmou:

- `bodyClass`: `marketing-surface`.
- H1 unico por rota.
- H1 com `Archivo, "Noto Sans", Inter, system-ui, sans-serif`.
- Body com `"Noto Sans", Inter, system-ui, sans-serif`.
- Sem overflow horizontal.

Inspecao em `/home`, `/central-ajuda` e `/api` apos ajuste da navegacao confirmou ausencia de elementos renderizados com `transition-property: all` ou `height`.

### Rotas renderizadas

Comando consolidado:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/api http://127.0.0.1:5173/status http://127.0.0.1:5173/atualizacoes http://127.0.0.1:5173/carreiras http://127.0.0.1:5173/legal/privacidade
```

Resultado final: 46 achados renderizados.

Comparativo:

- Baseline anterior: 53 achados.
- Resultado final deste ciclo: 46 achados.
- Reducao liquida: 7 achados.
- `nested-cards`: nao reapareceu.

## Validacao tecnica

```powershell
npm.cmd run lint -- --quiet
npm.cmd run test
npm.cmd run build
```

Resultados:

- Lint: passou.
- Testes: passaram, 19 arquivos e 62 testes.
- Build: passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`

Observacao: o build manteve avisos preexistentes de Vite/CSS sobre `color-adjust` depreciado e import dinamico/estatico do cliente Supabase.

## Proxima execucao recomendada

- Nao perseguir `gradient-text` e `layout-transition` sem seletor DOM publico reproduzivel.
- Proxima fatia segura: revisar os `cramped-padding` restantes de `/home`, `/preco`, `/sobre` e `/contato` apenas quando o DOM apontar um container publico real, nao `#root` ou superficie full-width intencional.
