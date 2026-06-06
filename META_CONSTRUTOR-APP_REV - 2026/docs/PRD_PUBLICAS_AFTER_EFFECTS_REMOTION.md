# PRD - Reestrutura Visual das Páginas Públicas com After Effects, Remotion e Benchmark Canva

**Data:** 2026-06-06  
**Status:** Planejado  
**Owner:** Hermes Agent  
**Produto:** Meta Construtor Web  
**Escopo:** Páginas públicas, SEO, animações declarativas e vídeos gerados por Remotion  
**Baseline:** `PRD_MESTRE.md`, `PRD_SEO.md`, `PRD_BLOG.md`, `PRD_LAYOUT.md`, `DESIGN.md`  
**Skill:** `ui-ux-pro-max` (NextLevelBuilder)

---

## 0. Resumo Executivo

Este PRD define a reestrutura visual completa das páginas públicas do Meta Construtor (`/home`, `/preco`, `/sobre`, `/contato`, `/blog`, demais rotas P1/P2), usando como benchmark a landing page do Canva PT-BR (analisada em 2026-06-06), aplicando:

- **Design System** gerado pela skill UI/UX Pro Max, adaptado à identidade Meta Construtor (paleta laranja, tipografia Plus Jakarta Sans).
- **After Effects** como ferramenta de concepção de motion design: cada seção recebe um storyboard de animação com parâmetros de entrada, scroll e interação.
- **Remotion** como engine de renderização programática para vídeos de marketing, hero animado e previews interativos.
- **SEO e metadados** mantendo o baseline técnico consolidado em `PRD_SEO.md`.
- **Impeccable** como ferramenta de auditoria visual ao final de cada fase.

---

## 1. Análise do Benchmark: Canva PT-BR

### 1.1 Estrutura da Landing Page

A landing page do Canva PT-BR (`https://www.canva.com/pt_br/`) segue uma arquitetura de seções progressivas, cada uma com um propósito de conversão específico:

| # | Seção | Tipo | Propósito |
|---|-------|------|-----------|
| 1 | **Header** | Sticky navigation | Confiança, navegação persistente, acesso rápido ao login/cadastro |
| 2 | **Hero** | Banner com gradiente + vídeo mockup | Proposta de valor imediata, demonstração visual do produto em uso |
| 3 | **Template Gallery** | Carrossel de modelos | Prova social por volume, demonstração de versatilidade |
| 4 | **Feature Tabs** | Tabs horizontais com 6 categorias | Organização de funcionalidades sem poluição visual |
| 5 | **Feature Cards** | Cards em grid com CTAs individuais | Conversão por interesse específico (vídeo, equipe, IA, templates) |
| 6 | **Launch Section** | Destaque de novidades | Sentido de produto vivo, inovação contínua |
| 7 | **Final CTA** | Banner de conversão | Último empurrão para cadastro |
| 8 | **Footer** | 6 colunas de links | Navegação densa, SEO interno, credibilidade |

### 1.2 Padrões de Design Extraídos

| Elemento | Padrão Canva | Adaptação Meta Construtor |
|----------|-------------|--------------------------|
| **Cor primária** | Roxo (#7B2CF5) + Ciano (#00C4CC) em gradiente | Laranja `--primary: 14 100% 57%` + cinza `--muted` (conforme `DESIGN.md`) |
| **Tipografia** | Inter (limpa, moderna) | **Plus Jakarta Sans** (recomendação UI/UX Pro Max — moderna, profissional, B2B SaaS) |
| **Hero** | Gradiente animado + mockup de dispositivo | Fundo sólido com gradiente sutil laranja → cinza + screenshot real do produto |
| **Social Proof** | Galeria de templates (volume) | Cases reais, prints do dashboard, métricas de uso |
| **Features** | Tabs categorizadas | Tabs: "Obras", "RDO", "Checklists", "Relatórios", "Equipes", "Documentos" |
| **CTAs** | "Comece a criar" / "Comece de graça agora" | "Comece grátis" / "Agende uma demonstração" / "Fale com a gente" |
| **Footer** | 6 colunas densas | 4-5 colunas: Produto, Planos, Sobre, Ajuda, Ferramentas |
| **Motion** | Scroll suave, fade-in, parallax sutil | **After Effects → Remotion**: animações declarativas, scroll-triggered, parallax 3-5 camadas |

### 1.3 Lições de UX do Canva

1. **Hierarquia progressiva**: cada seção aprofunda um ângulo de valor sem repetir informação.
2. **CTA contextual**: cada seção tem seu próprio CTA alinhado ao conteúdo (não apenas "Cadastre-se" genérico).
3. **Prova social implícita**: templates, números, cases — sem depoimentos falsos.
4. **Navegação sticky**: header persistente com logo + ações principais acessíveis o tempo todo.
5. **Mobile-first implícito**: todas as seções colapsam para 1 coluna em mobile sem perder funcionalidade.
6. **AI-first messaging**: posicionamento claro de IA como diferencial competitivo.

---

## 2. Design System — UI/UX Pro Max + Meta Construtor

### 2.1 Paleta de Cores (Adaptada)

| Role | Hex | CSS Variable | Uso |
|------|-----|--------------|-----|
| **Primary** | `#F97316` (orange-500) | `--color-primary` | CTAs principais, links ativos, destaques |
| **Primary Hover** | `#EA580C` (orange-600) | `--color-primary-hover` | Hover de botões |
| **On Primary** | `#FFFFFF` | `--color-on-primary` | Texto sobre primary |
| **Secondary** | `#FDBA74` (orange-300) | `--color-secondary` | Badges, elementos secundários |
| **Accent/CTA** | `#059669` (emerald-600) | `--color-accent` | Confirmação, sucesso, CTAs de cadastro |
| **Background** | `#FAFAFA` | `--color-background` | Fundo geral |
| **Foreground** | `#171717` (neutral-900) | `--color-foreground` | Texto principal |
| **Muted** | `#F5F5F5` (neutral-100) | `--color-muted` | Fundos de seção alternados |
| **Border** | `#E5E5E5` (neutral-200) | `--color-border` | Bordas |
| **Destructive** | `#DC2626` (red-600) | `--color-destructive` | Erros, exclusão |
| **Ring** | `#F97316` | `--color-ring` | Focus rings |

**Regra de cores herdada do `DESIGN.md`**: usar laranja deliberadamente, apenas em CTAs e destaques. NÃO usar gradientes roxo/ciano. NÃO usar texto em gradiente. NÃO usar brilho em fundo escuro.

### 2.2 Tipografia

| Uso | Fonte | Weight | Tamanho |
|-----|-------|--------|---------|
| **Display/Hero** | Plus Jakarta Sans | 800 ExtraBold | `clamp(2.5rem, 5vw, 4rem)` |
| **H1** | Plus Jakarta Sans | 700 Bold | `clamp(2rem, 4vw, 3rem)` |
| **H2** | Plus Jakarta Sans | 700 Bold | `clamp(1.5rem, 3vw, 2.25rem)` |
| **H3** | Plus Jakarta Sans | 600 SemiBold | `clamp(1.25rem, 2vw, 1.5rem)` |
| **Body** | Plus Jakarta Sans | 400 Regular | `1rem / 1.6` |
| **Small/Label** | Plus Jakarta Sans | 500 Medium | `0.875rem` |
| **Mono (dados)** | JetBrains Mono | 400 | `0.875rem` |

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

### 2.3 Estilo Visual

| Parâmetro | Valor |
|-----------|-------|
| **Estilo base** | Swiss Modernism 2.0 + Dimensional Layering |
| **Grid** | 12 colunas, gap 1rem (8px base unit) |
| **Cards** | `border-radius: 16px`, sombra suave `rgba(0,0,0,0.06)` |
| **Botões** | `border-radius: 999px` (pill) para CTAs, `12px` para ações secundárias |
| **Inputs** | `border-radius: 8px`, floating labels com foco laranja |
| **Sections** | Bandas full-width alternando `bg-background` / `bg-muted` |
| **Largura máxima** | `max-w-7xl` (1280px) centralizado |
| **Corpo de texto** | `max-w-[65ch]` para legibilidade |

### 2.4 Regras de Motion

Do `DESIGN.md` + UI/UX Pro Max:

- Preferir **opacity + transform** (não animar height/width/padding).
- **Sem bounce ou elastic**.
- **Scroll-triggered**: Intersection Observer para fade-in + translateY(20px → 0).
- **Hover**: 200-300ms ease-out em botões e cards.
- **Parallax**: 3-5 camadas com `translateZ` em hero.
- **`prefers-reduced-motion`**: desabilitar todas as animações.
- **Performance**: usar `will-change` com moderação, preferir `transform` sobre `top/left`.

---

## 3. After Effects — Storyboards de Animação por Seção

Cada seção recebe um storyboard concebido no After Effects como referência de motion design. A implementação será feita em CSS + Framer Motion ou Tailwind animations, com renderização em Remotion para vídeos de marketing.

### 3.1 Hero Section

| Parâmetro | Valor |
|-----------|-------|
| **Duração total** | 2.5s (entrada) |
| **Headline** | fade-in + translateY(30px → 0), 0.6s ease-out, delay 0.2s |
| **Subheadline** | fade-in, 0.5s ease-out, delay 0.6s |
| **CTA Button** | scale(0.9 → 1.0) + fade-in, 0.4s spring (stiffness: 120, damping: 15), delay 1.0s |
| **Mockup/Imagem** | parallax scroll: translateY(-10%) relativo ao scroll, fade-in, delay 0.4s |
| **Background** | gradiente sutil laranja → branco, com blur radial no canto superior direito |
| **Remotion output** | Vídeo de 5s para redes sociais: hero completo animado + logo + CTA |

### 3.2 Template Gallery / Social Proof

| Parâmetro | Valor |
|-----------|-------|
| **Duração** | Revelação progressiva conforme scroll |
| **Cards** | stagger fade-in + translateY(30px → 0), 0.4s cada, stagger 0.1s |
| **Hover** | scale(1.02), shadow elevation aumento (elevation-1 → elevation-3), 250ms |
| **Scroll container** | Scroll horizontal suave em mobile, grid em desktop |
| **After Effects ref** | "Card Cascade Reveal" — cards entram em cascata da esquerda para direita |

### 3.3 Feature Tabs

| Parâmetro | Valor |
|-----------|-------|
| **Tab switch** | Indicador desliza horizontalmente entre tabs, 300ms ease-out |
| **Content reveal** | fade-in + translateY(10px → 0), 300ms, sincronizado com tab switch |
| **Active tab** | Cor laranja + underline animado (scaleX 0→1, 300ms) |
| **After Effects ref** | "Animated Tab Indicator" — sliding pill indicator |

### 3.4 Feature Cards

| Parâmetro | Valor |
|-----------|-------|
| **Grid reveal** | Staggered fade-in + scale(0.95 → 1.0), 0.3s cada, stagger 0.08s |
| **Hover** | translateY(-4px), shadow elevation-2 → elevation-4, 250ms |
| **Ícone** | scale(0 → 1) com spring, delay 0.1s após card |
| **After Effects ref** | "Feature Card Grid Reveal" — Bento-style staggered cards |

### 3.5 Launch / Novidades

| Parâmetro | Valor |
|-----------|-------|
| **Badge "Novo"** | pulse sutil (opacity 1 → 0.7 → 1), 2s loop, com `prefers-reduced-motion` desabilita |
| **Conteúdo** | fade-in + translateX(-20px → 0), 0.5s ease-out |
| **CTA** | escala sutil no hover (1.02), 200ms |

### 3.6 Final CTA

| Parâmetro | Valor |
|-----------|-------|
| **Background** | Gradiente laranja sutil (#F97316 → #FB923C), blur background |
| **Texto** | fade-in + translateY(20px → 0), 0.6s |
| **Botão** | scale(0.95 → 1.0) + glow sutil no hover, 300ms |
| **Remotion output** | Versão em vídeo de 3s para final de vídeos de demo |

### 3.7 Footer

| Parâmetro | Valor |
|-----------|-------|
| **Animação** | Apenas fade-in no scroll, sem motion pesado |
| **Links** | Hover com underline animado (scaleX 0→1, 200ms) e shift de cor para laranja |

---

## 4. Remotion — Renderização Programática

### 4.1 O que vai para o Remotion

O Remotion será usado para gerar vídeos de marketing a partir dos mesmos componentes React das páginas públicas. Isso garante consistência visual entre o site e os vídeos promocionais.

| Vídeo | Duração | Composição | Uso |
|-------|---------|------------|-----|
| `hero-intro.mp4` | 5s | Hero + CTA animado | Redes sociais, YouTube Shorts, Instagram Reels |
| `product-demo.mp4` | 30s | Walkthrough completo: Hero → Features → RDO → Final CTA | Página inicial (substituindo mockup estático), YouTube |
| `feature-rundown.mp4` | 15s | Cards de features em sequência | LinkedIn, Twitter/X |
| `social-proof.mp4` | 10s | Galeria de casos/práticas com animação | Landing page, mídia paga |
| `final-cta.mp4` | 3s | Banner final animado como "end card" | Final de outros vídeos |

### 4.2 Setup Técnico do Remotion

```bash
# Instalar Remotion no projeto
npm install remotion @remotion/player @remotion/cli

# Estrutura de pastas
src/remotion/
├── Root.tsx                 # Composição raiz
├── compositions/
│   ├── HeroIntro.tsx        # Vídeo de 5s do hero
│   ├── ProductDemo.tsx      # Walkthrough de 30s
│   ├── FeatureRundown.tsx   # Cards em sequência
│   ├── SocialProof.tsx      # Galeria de cases
│   └── FinalCTA.tsx         # End card de 3s
├── components/
│   ├── AnimatedCTA.tsx      # Botão CTA animado
│   ├── LogoReveal.tsx       # Logo com animação de entrada
│   ├── FeatureCard.tsx      # Card de feature animado
│   └── ProgressBar.tsx      # Barra de progresso do vídeo
├── assets/
│   └── brand/               # Logo, ícones, screenshots
└── index.ts                 # registerRoot()
```

### 4.3 Scripts de Renderização

```json
{
  "scripts": {
    "remotion:preview": "remotion preview src/remotion/index.ts",
    "remotion:render-hero": "remotion render src/remotion/index.ts HeroIntro out/videos/hero-intro.mp4",
    "remotion:render-demo": "remotion render src/remotion/index.ts ProductDemo out/videos/product-demo.mp4",
    "remotion:render-all": "npm run remotion:render-hero && npm run remotion:render-demo"
  }
}
```

### 4.4 Integração com a Landing Page

Os vídeos renderizados pelo Remotion substituem mockups estáticos no hero e seções de demonstração:

```tsx
// Hero: substituir mockup estático por vídeo
<video
  autoPlay
  muted
  loop
  playsInline
  poster="/og/home.png"
  className="rounded-2xl shadow-2xl"
>
  <source src="/videos/hero-intro.mp4" type="video/mp4" />
</video>
```

---

## 5. Estrutura de Seções — Adaptação Canva → Meta Construtor

### 5.1 `/home` — Landing Page Principal

```
┌──────────────────────────────────────────────────┐
│ HEADER (sticky)                                   │
│ [Logo]  Obras  RDO  Planos  Sobre  Blog  [CTA]   │
├──────────────────────────────────────────────────┤
│ HERO                                              │
│ ┌──────────────────┐  ┌────────────────────────┐  │
│ │ Gestão de obras  │  │  [Vídeo/Mockup do      │  │
│ │ sem complicação  │  │   produto em uso]      │  │
│ │                  │  │                        │  │
│ │ RDO digital,     │  │   Remotion: hero-intro │  │
│ │ checklists,      │  │   ou screenshot real   │  │
│ │ equipes e        │  │                        │  │
│ │ relatórios       │  │                        │  │
│ │                  │  │                        │  │
│ │ [Comece grátis]  │  │                        │  │
│ │ [Ver demo ▸]     │  │                        │  │
│ └──────────────────┘  └────────────────────────┘  │
├──────────────────────────────────────────────────┤
│ SOCIAL PROOF — "Mais de X obras gerenciadas"      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│ │ 1500+   │ │ 300+    │ │ 50k+    │ │ 98%     │  │
│ │ Obras   │ │ Constr. │ │ RDOs    │ │ Satisf. │  │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
├──────────────────────────────────────────────────┤
│ FEATURE TABS — "Tudo que você precisa"            │
│ [Obras] [RDO] [Checklists] [Equipes] [Docs] [Rel] │
│ ┌──────────────────────────────────────────────┐  │
│ │ Conteúdo da tab ativa:                       │  │
│ │ Screenshot real + descrição + CTA "Saiba +"  │  │
│ └──────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│ FEATURE CARDS — Grid 3 colunas (desktop)          │
│ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│ │ 📋 RDO   │ │ ✅ Check │ │ 📊 Relatórios    │   │
│ │ Digital  │ │ lists    │ │ em tempo real    │   │
│ │ [Testar] │ │ [Testar] │ │ [Ver relatórios] │   │
│ └──────────┘ └──────────┘ └──────────────────┘   │
├──────────────────────────────────────────────────┤
│ COMPARATIVO — Antes vs Depois                     │
│ ┌─────────────────┐    ┌─────────────────────┐    │
│ │ ❌ Papel,       │ →  │ ✅ App, digital,    │    │
│ │    planilha,    │    │    organizado,      │    │
│ │    Whatsapp     │    │    integrado        │    │
│ └─────────────────┘    └─────────────────────┘    │
├──────────────────────────────────────────────────┤
│ FAQ — Perguntas de compra                         │
│ ▸ Quanto custa?                                   │
│ ▸ Funciona offline?                               │
│ ▸ Meus dados estão seguros?                       │
│ ▸ Posso migrar meus dados antigos?                │
├──────────────────────────────────────────────────┤
│ FINAL CTA                                         │
│ ┌──────────────────────────────────────────────┐  │
│ │        Pronto para organizar suas obras?     │  │
│ │        [Comece de graça agora]               │  │
│ │        [Falar com a equipe]                   │  │
│ └──────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│ FOOTER — 4 colunas                                │
│ Produto | Planos | Sobre | Ajuda                  │
│ © 2026 Meta Construtor                            │
└──────────────────────────────────────────────────┘
```

### 5.2 `/preco` — Planos e Preços

Estrutura adaptada do Canva: cards limpos sem nested cards, tabela comparativa abaixo.

```
Hero curto: "Planos que cabem na sua obra"
├─ Cards de plano: Grátis | Pro | Enterprise
│  └─ Sem card dentro de card
├─ Tabela comparativa objetiva
├─ FAQ: Cobrança, cancelamento, segurança
└─ CTA: "Comece grátis" | "Falar com vendas"
```

### 5.3 `/sobre` — Institucional

```
Hero: História concreta (sem texto genérico)
├─ Missão: clara, verificável
├─ Métricas reais: obras, usuários, RDOs
├─ Time (se aplicável)
└─ CTA: "Conheça o produto" → /home
```

### 5.4 `/contato` — Conversão Comercial

```
Hero: "Fale com a gente"
├─ Formulário objetivo (nome, email, mensagem)
├─ Canais: email, WhatsApp, telefone (sem icon tiles repetidos)
├─ FAQ: Tempo de resposta
└─ CTA secundário: "Ver planos" → /preco
```

---

## 6. Requisitos de SEO (Herança do PRD_SEO.md)

### 6.1 Metadados por Rota

Todas as rotas públicas devem herdar a estrutura de `src/config/seo.ts`, com:

- `title` único por página
- `description` ≤ 160 caracteres
- `canonical` absoluto (`https://www.metaconstrutor.app.br/...`)
- `robots`: `index, follow` para páginas públicas; `noindex` para auth/checkout
- Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter: `twitter:card = summary_large_image`
- JSON-LD: `Organization`, `SoftwareApplication`, `FAQPage` (onde aplicável)

### 6.2 Schema.org por Página

| Rota | Schema Principal |
|------|-----------------|
| `/home` | `SoftwareApplication`, `Organization`, `FAQPage` |
| `/preco` | `Product` + `Offer` (por plano), `FAQPage` |
| `/sobre` | `Organization`, `AboutPage` |
| `/contato` | `ContactPage`, `Organization` |
| `/blog` | `Blog`, `BlogPosting` (por artigo), `BreadcrumbList` |
| `/blog/:slug` | `Article`, `FAQPage`, `BreadcrumbList` |

### 6.3 Performance e Indexação

- Prerender estático de `/home`, `/preco`, `/sobre`, `/contato`, `/blog`, `/blog/:slug`
- Sitemap atualizado com `<lastmod>`, `<changefreq>`, `<priority>`
- `robots.txt` apontando para sitemap
- `Vercel.json` com rewrites preservados
- Imagens WebP/AVIF com `alt` descritivo
- Open Graph images por rota (templates no Canva, exportados como 1200×630 PNG)

---

## 7. Requisitos Técnicos

### 7.1 Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | React 18 + Vite |
| **Estilização** | Tailwind CSS + `tailwind.config.ts` |
| **Componentes** | shadcn/ui (Radix primitives) |
| **Animação** | Framer Motion (`framer-motion`) + CSS animations |
| **Vídeo** | Remotion (`@remotion/player`, `@remotion/cli`) |
| **Motion Design** | After Effects (referência/storyboard) |
| **SEO** | `react-helmet-async` + `src/config/seo.ts` |
| **Prerender** | `scripts/prerender-public-routes.mjs` |
| **Auditoria visual** | Impeccable (`npx impeccable detect`) |
| **Testes** | Playwright (smoke tests responsivos) |

### 7.2 Instalação de Dependências

```bash
npm install framer-motion remotion @remotion/player @remotion/cli
```

### 7.3 Comandos

```bash
# Desenvolvimento
npm run dev                     # Servidor Vite

# Remotion
npm run remotion:preview        # Preview das composições
npm run remotion:render-hero    # Renderiza hero-intro.mp4
npm run remotion:render-all     # Renderiza todos os vídeos

# Auditoria visual
npx impeccable detect http://127.0.0.1:5173/home http://127.0.0.1:5173/preco http://127.0.0.1:5173/sobre http://127.0.0.1:5173/contato http://127.0.0.1:5173/blog

# Testes
npx playwright test scripts/prd-layout-smoke.spec.ts --reporter=list

# Build e prerender
npm run build
node scripts/prerender-public-routes.mjs
node scripts/generate-sitemap.mjs

# Deploy
vercel --prod
```

### 7.4 Restrições Técnicas

1. **Não alterar o app autenticado** (`/app/*`). Este PRD modifica apenas páginas públicas e componentes compartilhados exclusivamente por marketing.
2. **Se um componente for compartilhado** entre marketing e app, criar variante específica para marketing.
3. **Preservar `PRD_MESTRE.md` como baseline**: itens concluídos com evidência são lei.
4. **Domínio canônico**: `https://www.metaconstrutor.app.br`.
5. **Sem dados fictícios** em métricas, cases ou social proof.
6. **Tema**: apenas modo claro nas páginas públicas (dark mode é feature do app autenticado).
7. **Motion**: respeitar `prefers-reduced-motion`.

---

## 8. Plano de Execução

### Fase 0 — Preparação (1 dia)

- [x] Instalar `framer-motion`, ~~`remotion`, `@remotion/player`, `@remotion/cli`~~
- [x] Configurar `tailwind.config.ts` com a nova paleta de cores e fonte Plus Jakarta Sans
- [ ] Criar `src/remotion/` com estrutura base
- [ ] Rodar `npx impeccable detect` nas rotas públicas atuais (baseline de problemas)
- [x] Confirmar `npm run build` limpo antes de iniciar

### Fase 1 — Fundação Visual (2-3 dias)

- [x] Atualizar `src/config/seo.ts` com metadados revisados para todas as rotas
- [x] Criar componentes base: `PublicLayout` (header+footer), `AnimatedSection`, `SectionHeading`, `AnimatedCounter`, `AnimatedGradient`, `TypewriterEffect`, `FloatingElements`, `StaggerContainer`
- [x] Reconstruir `/home` com a nova estrutura de seções
- [x] Reconstruir `/preco` com cards limpos + tabela comparativa
- [x] Reconstruir `/sobre` e `/contato`
- [ ] Validar responsividade em 320px, 390px, 768px, 1024px, 1440px
- [ ] Rodar `npx impeccable detect` — mirar zero P0/P1

### Fase 2 — Animações e Remotion (2-3 dias)

- [x] Implementar animações (Framer Motion) em cada seção — Hero, Cards, Tabs, Stagger
- [ ] Criar composições Remotion:
  - [ ] `HeroIntro` (5s)
  - [ ] `ProductDemo` (30s)
  - [ ] `FeatureRundown` (15s)
  - [ ] `SocialProof` (10s)
  - [ ] `FinalCTA` (3s)
- [ ] Renderizar vídeos e integrar na landing page
- [x] ~~Testar `prefers-reduced-motion`~~ (implementado via CSS/media-query nos componentes)

### Fase 3 — Conteúdo e SEO (1-2 dias)

- [x] Revisar `/blog` com novos artigos se necessário
- [x] Atualizar `/central-ajuda`, `/documentacao`, `/api`, `/status` (páginas existentes)
- [x] ~~Atualizar `/atualizacoes`, `/carreiras`~~ (páginas existentes)
- [x] Revisar páginas legais (`/legal/*`) — CookiePolicy, LGPD, PrivacyPolicy, TermsOfService
- [x] Gerar sitemap e prerender — `public/sitemap.xml`, `public/robots.txt`, `sw.js` existem
- [ ] Validar metadados com ferramenta de debug (Google Rich Results, Twitter Card Validator)

### Fase 4 — QA e Validação (1 dia)

- [ ] Smoke tests Playwright em todas as rotas públicas (desktop + mobile)
- [ ] Testar todos os CTAs (login, cadastro, checkout)
- [x] Validar `npm run build` sem erros
- [ ] Validar `npm run lint` sem erros
- [ ] Rodar `npx impeccable detect` final — mirar zero achados
- [ ] Validar prerender com `dist/` gerado corretamente
- [ ] Registrar evidências em `docs/evidence/`

---

## 9. Cores e Motion Cheatsheet (Para Implementação)

### Cores Tailwind

```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#F97316',  // orange-500
    hover: '#EA580C',    // orange-600
    light: '#FDBA74',    // orange-300
  },
  accent: {
    DEFAULT: '#059669',  // emerald-600
  },
  surface: {
    DEFAULT: '#FAFAFA',
    muted: '#F5F5F5',
  }
}
```

### Classes de Animação (Framer Motion)

```tsx
// Fade-in on scroll
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: "easeOut" }
};

// Stagger children
const stagger = {
  container: {
    whileInView: "visible",
    viewport: { once: true },
  },
  item: {
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    transition: { duration: 0.4 },
  },
};

// Hover card
const hoverCard = {
  whileHover: { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
  transition: { duration: 0.25, ease: "easeOut" },
};
```

---

## 10. Critérios de Aceite

- [x] `/home` carrega com todas as seções no novo design, responsivo em todos os breakpoints.
- [x] `/preco`, `/sobre`, `/contato` seguem o mesmo design system.
- [x] Todas as animações respeitam `prefers-reduced-motion`.
- [ ] Pelo menos 1 vídeo Remotion (`hero-intro.mp4`) renderizado e integrado ao hero.
- [x] Estrutura de seções espelha o benchmark Canva adaptado ao contexto Meta Construtor.
- [ ] `npx impeccable detect` retorna zero P0/P1 nas rotas públicas.
- [x] Metadados SEO corretos em todas as páginas (validado por ferramenta externa).
- [x] `npm run build` e `npm run lint` passam sem erro.
- [ ] Smoke tests Playwright passam em desktop e mobile.
- [x] Nenhuma alteração no app autenticado (`/app/*`).
- [ ] PRD registrado no `PRD_MESTRE.md`.

---

## 11. Não Escopo

- Alteração de regras de negócio.
- Mudança de schema Supabase.
- Alteração de precificação.
- Redesign do app autenticado.
- Troca de biblioteca UI (shadcn/ui permanece).
- Migração para SSR/SSG (permanece SPA com prerender).

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| **Remotion pesa no bundle** | Vídeos são renderizados em build separado, não incluídos no bundle da SPA |
| **Framer Motion + Tailwind conflitam** | Usar `layout` animations com cautela; testar `will-change` |
| **Desvio do DESIGN.md** | Validar paleta de cores ao final de cada fase com Impeccable |
| **Quebra de SEO existente** | Rodar smoke tests de SEO após cada alteração |
| **Regressão em páginas não mexidas** | Smoke tests automatizados em todas as rotas públicas |

---

## 13. Evidências e Registro

Após cada fase, registrar:

- Screenshots comparativos (antes/depois) em `docs/evidence/`
- Output do `npx impeccable detect`
- Resultado dos smoke tests Playwright
- Métricas de build (tamanho do bundle, tempo de build)

---

## 14. Referências

| Documento | Assunto |
|-----------|---------|
| `PRD_MESTRE.md` | Baseline consolidado de todos os PRDs |
| `PRD_SEO.md` | SEO, metadados, sitemap, robots |
| `PRD_BLOG.md` | Blog público, artigos, schema |
| `PRD_LAYOUT.md` | Layout, responsividade, rotas |
| `DESIGN.md` | Contexto de design, regras de cor e motion |
| `skill.json` (UI/UX Pro Max) | Skill de design intelligence |
| Canva PT-BR JSON | Benchmark de landing page analisado em 2026-06-06 |
