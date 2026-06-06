# PRD_SEO - Home sem kickers repetidos e menos profundidade

Data: 2026-06-03

## Escopo

Execucao restrita a componentes publicos de marketing usados pela home. Nenhuma tela autenticada do app foi alterada neste ciclo.

## Alteracoes executadas

- Removidos kickers repetidos em `HeroSectionNew`, `ModernFeaturesSection`, `StatsSection`, `VideoDemo`, `FAQSection` e `EnhancedTestimonials`.
- `ModernFeaturesSection`, `StatsSection`, `CaseStudies`, `BenefitsSection`, `EnhancedTestimonials` e `FAQSection` foram achatados de grades de cards para blocos com divisorias.
- Fundos decorativos dos icones foram removidos em blocos publicos para reduzir `nested-cards`.
- Textos longos do FAQ e do banner de integracoes receberam limite de largura.
- `VideoDemo` foi simplificado para lista com divisorias, sem card dentro de card.

## Validacao de fonte

```bash
npx.cmd impeccable detect src/components/landing/HeroSectionNew.tsx src/components/landing/VisualWorkflowSection.tsx src/components/landing/ModernFeaturesSection.tsx src/components/landing/StatsSection.tsx src/components/landing/VideoDemo.tsx src/components/landing/FAQSection.tsx src/components/landing/IntegrationsBanner.tsx src/components/landing/CaseStudies.tsx src/components/landing/BenefitsSection.tsx src/components/landing/EnhancedTestimonials.tsx
```

Resultado: sem achados reportados.

```bash
rg -n "uppercase tracking|Funcionalidades|Prova tecnica|Demonstre pelo app real|Perguntas frequentes|Confianca antes|rounded-lg border border-border bg-card|rounded-xl border" src/components/landing/HeroSectionNew.tsx src/components/landing/ModernFeaturesSection.tsx src/components/landing/StatsSection.tsx src/components/landing/VideoDemo.tsx src/components/landing/FAQSection.tsx src/components/landing/CaseStudies.tsx src/components/landing/BenefitsSection.tsx src/components/landing/EnhancedTestimonials.tsx
```

Resultado: sem ocorrencias no recorte editado.

## Validacao renderizada

Servidor local:

```bash
curl.exe -L -s -o NUL -w "%{http_code} %{content_type} %{size_download}" http://127.0.0.1:5173/home
```

Resultado: `200 text/html 2948`.

Scan isolado da home:

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home
```

Resultado: caiu de 33 para 17 achados.

Scan de cinco URLs criticas:

```bash
npx.cmd impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/blog http://127.0.0.1:5173/blog/como-estruturar-rdo http://127.0.0.1:5173/legal/privacidade
```

Resultado: caiu de 63 para 43 achados.

Residuais principais:

- `/home`: `cramped-padding`, `nested-cards` e sinais globais de `gradient-text`, `ai-color-palette` e `layout-transition`.
- `/legal/privacidade`: `line-length` em secoes legais ainda acima do alvo.
- Todas as cinco URLs ainda recebem achados globais de gradiente/layout vindos do bundle ou de componentes compartilhados fora do recorte editado.

## Gates

```bash
npm.cmd run lint
```

Resultado: passou com 0 erros e 32 warnings preexistentes.

```bash
npm.cmd run test
```

Resultado: passou com 12 arquivos e 40 testes.

```bash
npm.cmd run build
```

Resultado: passou. `postbuild` executou sitemap e prerender com `Prerendered 18 public route HTML files.`

Avisos residuais do build: `color-adjust` depreciado e warning de chunking misto do Supabase, ambos preexistentes.

## Proximo corte

1. Corrigir `line-length` nas paginas legais, com foco em `/legal/privacidade`.
2. Isolar a origem global de `gradient-text`, `ai-color-palette` e `layout-transition` no CSS/bundle.
3. Reduzir os ultimos `cramped-padding` e `nested-cards` da home com evidencia DOM mais especifica.
