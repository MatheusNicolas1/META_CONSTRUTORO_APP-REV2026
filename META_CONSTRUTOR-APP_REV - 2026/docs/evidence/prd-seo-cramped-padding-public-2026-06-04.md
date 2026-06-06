# PRD_SEO - Cramped-padding em paginas publicas

Data: 2026-06-04

## Escopo

- Continuacao da execucao do `PRD_SEO.md`.
- Alteracoes restritas a paginas publicas, componentes de marketing e FAQ publico de precos.
- Layout autenticado do app mantido fora do escopo.
- Fotos reais de obras preservadas nas paginas publicas.

## Diagnostico

O scan consolidado anterior tinha 57 achados renderizados, com `cramped-padding`, `gradient-text` e `layout-transition` como residuos principais.

Foi feita inspecao DOM com Playwright para separar achados corrigiveis de residuos globais. O DOM apontou:

- Rodape publico com superficie `bg-background` e borda sem inset no proprio footer.
- Hero sections independentes de `/central-ajuda`, `/api` e `/carreiras` com padding vertical aplicado apenas no filho, nao no `<section>` com fundo.
- Grids publicos da home com `bg-background` sem inset proprio.
- Linhas bordadas do hero e do bloco de teste da home com padding horizontal zerado.
- FAQ publica de precos com itens bordados e padding vertical abaixo do limite do scanner.
- Listas de `/central-ajuda`, `/status` e `/atualizacoes` com borda externa e inset insuficiente.

Tambem foram identificados residuos que nao foram tratados neste ciclo por risco de mexer em layout global ou autenticado:

- Wrappers raiz `#root` e `main.min-h-screen.bg-background` reportados pelo DOM como fundo branco sem padding.
- `gradient-text` e `layout-transition` vindos de CSS/bundle compartilhado.
- Achados intermitentes de fonte unica no `/blog`, ja classificados anteriormente como ruido renderizado por `body.marketing-surface` e tipografia publica aplicada.

## Alteracoes executadas

- `FooterSection`: adicionado inset ao footer publico e ao bloco inferior com borda.
- `CentralAjuda`: padding vertical movido para a section com fundo; lista recomendada e aside receberam inset real.
- `APIPage` e `Carreiras`: padding vertical movido para a section com fundo.
- `HeroSectionNew`: linhas bordadas do fluxo principal receberam inset horizontal e deixaram de zerar padding vertical no primeiro/ultimo item.
- `StatsSection`, `CaseStudies` e `EnhancedTestimonials`: grids com `bg-background` receberam inset proprio.
- `VideoDemo`: section e cabecalho interno receberam inset para remover superficie colada.
- `Pricing`: selo "Mais Popular" recebeu padding vertical maior.
- `FaqSection`: itens do accordion publico receberam padding proprio.
- `Status` e `Atualizacoes`: listas com `border-y` receberam padding proprio.

## Arquivos alterados

- `src/components/landing/FooterSection.tsx`
- `src/components/landing/HeroSectionNew.tsx`
- `src/components/landing/StatsSection.tsx`
- `src/components/landing/CaseStudies.tsx`
- `src/components/landing/EnhancedTestimonials.tsx`
- `src/components/landing/VideoDemo.tsx`
- `src/components/pricing/FaqSection.tsx`
- `src/components/ui/pricing.tsx`
- `src/pages/CentralAjuda.tsx`
- `src/pages/APIPage.tsx`
- `src/pages/Carreiras.tsx`
- `src/pages/Status.tsx`
- `src/pages/Atualizacoes.tsx`

## Validacao Impeccable

### Fonte

Comando executado:

```powershell
npx.cmd impeccable detect src\components\landing\FooterSection.tsx src\components\landing\CaseStudies.tsx src\components\landing\EnhancedTestimonials.tsx src\components\pricing\FaqSection.tsx src\pages\CentralAjuda.tsx src\components\landing\HeroSectionNew.tsx src\components\landing\VideoDemo.tsx src\components\ui\pricing.tsx src\pages\Status.tsx src\pages\Atualizacoes.tsx src\components\landing\StatsSection.tsx src\pages\APIPage.tsx src\pages\Carreiras.tsx
```

Resultado: sem achados reportados nos arquivos fonte alterados.

### Rotas renderizadas

Comando consolidado:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/api http://127.0.0.1:5173/status http://127.0.0.1:5173/atualizacoes http://127.0.0.1:5173/carreiras http://127.0.0.1:5173/legal/privacidade
```

Resultado final: 53 achados renderizados.

Comparativo:

- Baseline anterior: 57 achados.
- Resultado final deste ciclo: 53 achados.
- Reducao liquida: 4 achados.
- `nested-cards`: nao reapareceu.
- `cramped-padding`: reduzido em blog, artigo, legal e em blocos locais corrigiveis; permanecem residuos de wrappers raiz e alguns containers full-width.

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

- Continuar apenas em residuos com seletor DOM confiavel e arquivo publico claro.
- Evitar corrigir `#root`, `main.min-h-screen.bg-background`, `gradient-text` e `layout-transition` sem isolamento especifico da superficie publica, para nao afetar layout autenticado.
