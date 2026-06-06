# PRD_SEO - Nested-cards finais das paginas publicas

Data: 2026-06-04

## Escopo

- Continuacao da execucao do `PRD_SEO.md`.
- Alteracoes restritas a paginas publicas e componentes de marketing.
- Layout autenticado do app mantido fora do escopo.
- Fotos reais vindas de `fotos criativo` preservadas nas paginas publicas ja atualizadas.

## Alteracoes executadas

- `/home`: removidas bordas e superficies aninhadas residuais em blocos de hero, workflow, features, estatisticas, cases, beneficios, depoimentos, video e integracoes.
- `/home`: selos do `IntegrationsBanner` deixaram de usar `Badge` com borda dentro de secao bordada e passaram a rotulos tipograficos simples.
- `/blog/como-estruturar-rdo`: categoria do artigo, aside e CTA final foram achatados para reduzir profundidade visual.
- `/legal/privacidade` e layout legal compartilhado: eyebrow visual deixou de ser pill com borda e passou a texto simples.

## Arquivos alterados

- `src/components/landing/HeroSectionNew.tsx`
- `src/components/landing/VisualWorkflowSection.tsx`
- `src/components/landing/ModernFeaturesSection.tsx`
- `src/components/landing/StatsSection.tsx`
- `src/components/landing/CaseStudies.tsx`
- `src/components/landing/BenefitsSection.tsx`
- `src/components/landing/EnhancedTestimonials.tsx`
- `src/components/landing/VideoDemo.tsx`
- `src/components/landing/IntegrationsBanner.tsx`
- `src/pages/BlogArticle.tsx`
- `src/pages/legal/LegalPageLayout.tsx`

## Validacao Impeccable

### Fonte

Comandos executados:

```powershell
npx.cmd impeccable detect src\components\landing\HeroSectionNew.tsx src\components\landing\VisualWorkflowSection.tsx src\components\landing\BenefitsSection.tsx src\components\landing\ModernFeaturesSection.tsx src\components\landing\StatsSection.tsx src\components\landing\CaseStudies.tsx src\components\landing\EnhancedTestimonials.tsx src\components\landing\VideoDemo.tsx
npx.cmd impeccable detect src\components\landing\IntegrationsBanner.tsx src\components\landing\HeroSectionNew.tsx src\components\landing\VisualWorkflowSection.tsx src\components\landing\BenefitsSection.tsx src\components\landing\ModernFeaturesSection.tsx src\components\landing\StatsSection.tsx src\components\landing\CaseStudies.tsx src\components\landing\EnhancedTestimonials.tsx src\components\landing\VideoDemo.tsx
npx.cmd impeccable detect src\pages\BlogArticle.tsx src\pages\legal\LegalPageLayout.tsx src\components\landing\FooterSection.tsx
```

Resultado: sem achados reportados nos arquivos fonte alterados.

### Rotas renderizadas

Comandos executados:

```powershell
npx.cmd impeccable detect http://127.0.0.1:5173/home
npx.cmd impeccable detect http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/legal/privacidade
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/central-ajuda http://127.0.0.1:5173/documentacao http://127.0.0.1:5173/api http://127.0.0.1:5173/status http://127.0.0.1:5173/atualizacoes http://127.0.0.1:5173/carreiras http://127.0.0.1:5173/legal/privacidade
```

Resultados:

- `/home`: caiu de 15 achados antes deste ciclo para 9 achados; `nested-cards` removido.
- `/blog/como-estruturar-rdo` + `/legal/privacidade`: 8 achados finais; `nested-cards` nao reapareceu.
- Scan consolidado de 13 rotas: caiu de 65 para 57 achados; nenhum `nested-cards` no resultado consolidado.

Residuos renderizados:

- `cramped-padding`: ainda aparece em wrappers/elementos detectados por rota.
- `gradient-text`: sinal global recorrente de CSS/bundle compartilhado.
- `layout-transition`: sinal global recorrente de CSS/bundle compartilhado.

## Validacao tecnica

```powershell
npm.cmd run lint -- --quiet
npm.cmd run test
npm.cmd run build
```

Resultados:

- Lint: passou.
- Testes: passaram, 18 arquivos e 61 testes.
- Build: passou com `postbuild`, sitemap e `Prerendered 18 public route HTML files.`

Observacao: o build manteve avisos preexistentes de Vite/CSS sobre `color-adjust` depreciado e import dinamico/estatico do cliente Supabase. Esses avisos nao foram introduzidos por este ciclo de SEO publico.

## Proxima execucao recomendada

- Investigar os achados restantes de `cramped-padding` com evidencia DOM por rota antes de editar.
- Manter `gradient-text` e `layout-transition` documentados como residuos globais ate existir isolamento seguro em superficie publica, sem tocar o layout autenticado do app.
