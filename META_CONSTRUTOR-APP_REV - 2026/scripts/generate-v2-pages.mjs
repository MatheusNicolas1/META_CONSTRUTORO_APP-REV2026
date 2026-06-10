/**
 * generate-v2-pages.mjs
 * 
 * Gera componentes React para as novas páginas públicas V2 do Meta Construtor
 * usando Google AI Studio (Gemini 2.5 Pro API).
 * 
 * Uso: node scripts/generate-v2-pages.mjs [--all|--home|--preco|--blog|--contato|--sobre]
 * 
 * Diretório de saída: src/pages-gemini/
 * Templates de prompt: scripts/templates/prompt-{slug}.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'pages-gemini');
const MAX_RETRIES = 2;

const PAGES = ['home2', 'preco2', 'blog2', 'contato2', 'sobre2'];

// ─── Prompt Base ──────────────────────────────────────────────────────────────

const BASE_CONTEXT = `You are a senior React + TypeScript developer. Generate a COMPLETE, production-ready page component for Meta Construtor — a Brazilian construction management SaaS.

## Design Philosophy
- Cinematic, motion-rich, After Effects-style animations using Framer Motion
- Minimal text, maximum visual impact — show, don't tell
- Modern B2B SaaS aesthetic (Linear/Stripe/Vercel/Canva-inspired)
- Dark + light balance with orange primary palette
- Every section must have scroll-triggered animations that feel premium

## Color Palette (Tailwind classes)
- Primary: orange-500 (#F97316), hover: orange-600 (#EA580C), light: orange-300 (#FDBA74)
- Accent: emerald-600 (#059669)
- Background: neutral-50 (#FAFAFA), muted: neutral-100 (#F5F5F5)
- Foreground: neutral-900 (#171717), muted-text: neutral-500 (#737373)
- Border: neutral-200 (#E5E5E5)
- Success: emerald-500, Warning: amber-500, Error: red-500

## Typography
- Font: Plus Jakarta Sans (already imported via CSS)
- Use Tailwind classes: font-heading for headings, font-body for text
- Hero title: text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight
- Section heading: text-3xl md:text-4xl font-bold
- Body: text-base md:text-lg leading-relaxed text-neutral-600

## Tech Stack (CRITICAL — use these exact imports)
- React 18 + TypeScript: import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
- Framer Motion: import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValue, useSpring, Variants } from 'framer-motion'
- Tailwind CSS v3: use standard Tailwind classes
- shadcn/ui components: import { Button } from '@/components/ui/button' — use Button variant="default" (orange), variant="outline", variant="ghost"
- Icons: import { ArrowRight, Check, ChevronDown, Menu, X, Star, Zap, BarChart3, ClipboardCheck, Users, FileText, HardHat, Shield, Clock, MessageSquare, Phone, Mail, MapPin, Quote, Play, ChevronRight, Search, Calendar, User, Tag } from 'lucide-react'
- SEO: import SEO from '@/components/SEO' — use <SEO {...seoPages.home2} />
- SEO config: import { seoPages } from '@/config/seo'
- Supabase: import { supabase } from '@/integrations/supabase/client'
- Storage: import { getPublicUrl } from '@/utils/storageUtils'

## IMPORTANT RULES
1. The component MUST be a default export: export default function Home2() { ... }
2. DO NOT use "use client" or React Server Components
3. Use React.lazy-friendly patterns — no top-level data fetching that requires Suspense boundaries outside
4. All data fetching from Supabase MUST use useEffect + useState (no React Query)
5. Handle loading states with skeleton/spinner UI
6. Handle empty states gracefully
7. ALL motion MUST respect prefers-reduced-motion (use the useReducedMotion hook or CSS media query)
8. Use <SafeSuspense> wrapper is NOT needed inside the component itself
9. Every image MUST have alt text, loading="lazy", decoding="async"
10. Use motion.div with whileInView for scroll-triggered animations
11. Standard viewport config: viewport={{ once: true, margin: "-100px" }}
12. DO NOT use @/components/PublicNav or @/components/Footer inside the component — the PublicLayout handles those
13. For the hero section, use a beautiful background gradient or pattern — not a solid color
14. Use glassmorphism (backdrop-blur, bg-white/80) for navbar-like elements
15. Add subtle noise/grain overlay on hero sections for premium feel

## Supabase Data Queries (for pages that need real data)

### Obras com fotos:
const { data: obras } = await supabase
  .from('obras')
  .select('id, nome, fotos_obra')
  .eq('status', 'ativa')
  .not('fotos_obra', 'is', null)
  .limit(12)

// fotos_obra is an array: [{ url: 'obras-limpas/xxx/foto.jpg', ... }]
// getPublicUrl(foto.url, 'documentos') returns the full public URL

### Prints do sistema:
// They're in /marketing/ directory as static images
// Use the MARKETING constant: import MARKETING from '@/constants/marketing'
// Or use hardcoded paths like '/marketing/prd-prints-2026-06-04-*.png'

## Animation Library (use these exact Framer Motion variants)

// Cinematic Fade In (blur reveal)
const cinematicReveal = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
};

// Stagger Container
const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  viewport: { once: true }
};

// Stagger Item
const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// Hover Card
const hoverCard = {
  whileHover: { y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' },
  transition: { duration: 0.25, ease: 'easeOut' }
};

// Scale In
const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

// Slide from left
const slideFromLeft = {
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
};

// Slide from right
const slideFromRight = {
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
};
`;

// ─── Templates por Página ────────────────────────────────────────────────────

const PAGE_TEMPLATES = {
  home2: `${BASE_CONTEXT}

## Page: /home2 — Landing Page Refurbished

### Sections (in order):
1. **NAV** — Glassmorphism sticky navbar: Logo | Obras | RDO | Planos | Sobre | Blog | Contato | [Comece Grátis]
2. **HERO CINEMATOGRÁFICO** — Split layout: Left side has headline with animated gradient text ("Transforme a gestão da sua construtora"), subheading, 2 CTA buttons. Right side has a beautiful animated mockup of the product (use a screenshot from /marketing/ with subtle floating animation — float y: -8 to 8, repeat: Infinity). Background: dark gradient from neutral-900 to orange-900/20 with animated particles/floating elements.
3. **MÉTRICAS** — 4 animated counters: 1500+ Obras, 300+ Construtoras, 50k+ RDOs, 98% Satisfação. Each has an icon, number (animates from 0 to target on scroll), and label. Use useSpring + useMotionValue for smooth counting.
4. **GALERIA DE OBRAS REAIS** — Fetch obras from Supabase with fotos_obra. Show a masonry grid (3 cols desktop, 2 tablet, 1 mobile). Each card: image with overlay gradient, obra name, subtle hover zoom effect. If no obras found, show placeholder.
5. **FEATURES COM PARALLAX** — 6 feature cards in a 3x2 grid (desktop). Each card: icon, title, short description. Cards have parallax tilt on hover (rotateX/Y based on mouse position). Features: RDO Digital, Checklists Inteligentes, Relatórios em Tempo Real, Gestão de Equipes, Controle de Documentos, Dashboard Financeiro.
6. **PRINTS DO SISTEMA** — Horizontal carousel with screenshots from /marketing/. Auto-scroll with pause on hover. Each slide has a title overlay. Show ~8-10 prints.
7. **COMPARATIVO** — Before/After comparison: Left column (before) shows problems (papel, planilha, whatsapp) with red/x icons, right column (after) shows solutions (app digital, organizado, integrado) with green/check icons. Animated transition on scroll — the "before" fades/slides left, "after" slides right.
8. **FAQ** — Accordion-style: 5-6 questions about pricing, offline mode, security, migration. Only one open at a time. Animated open/close with AnimatePresence.
9. **FINAL CTA** — Full-width gradient background (orange-500 to orange-700). Big heading: "Pronto para organizar suas obras?", subheading, 2 CTA buttons. Include animated pulse effect on the primary CTA.
10. **FOOTER** — 4 columns: Produto (links), Planos (links), Sobre (links), Ajuda (links). Copyright line. Social icons.

### Animation Highlights:
- Hero: staggered text reveal (cinematicReveal), gradient text animation (hue shift or color pulse)
- Metrics: count-up with spring physics
- Gallery: stagger container with scaleIn on each card
- Features: staggerItem + tilt on hover (use onMouseMove for parallax)
- Carousel: auto-scroll with AnimatePresence
- FAQ: AnimatePresence with height animation
- Final CTA: gradient background animation (slow color shift)

Return ONLY the COMPLETE TypeScript/React component code wrapped in \`\`\`tsx ... \`\`\`.`,

  preco2: `${BASE_CONTEXT}

## Page: /preco2 — Planos e Preços Animados

### Sections (in order):
1. **HERO** — Clean hero with animated gradient text: "Planos que cabem na sua obra". Subheading explaining value proposition. Minimal — just headline + subtitle + subtle background gradient animation.
2. **TOGGLE MENSAL/ANUAL** — Toggle switch between Monthly and Annual billing. Annual has a badge "Economize 20%" with animated sparkle/pulse. Use Framer Motion layoutAnimation for smooth toggle.
3. **PRICING CARDS** — 3 cards side by side (desktop): Grátis, Profissional (★ destaque), Enterprise.
   - Grátis (R$ 0/mês): Features básicas, 1 obra, 3 usuários
   - Profissional (R$ 79/mês): Tudo do Grátis + obras ilimitadas, RDO digital, checklists, relatórios
   - Enterprise (R$ 299/mês): Tudo do Pro + customizações, integrações, suporte prioritário, SLA
   - The middle card (Profissional) is highlighted — slightly elevated (scale: 1.03), has a "Mais Popular" badge with animated glow
   - Each card: plan name, price (animated when toggling), description, feature list with check icons, CTA button
   - Cards have glassmorphism background, subtle border
   - Staggered entry animation for cards
   - Hover: card lifts slightly (y: -8) with shadow elevation
4. **TABELA COMPARATIVA** — Detailed comparison table with sticky header. Rows: features grouped by category. Columns: Grátis | Profissional | Enterprise. Check/X marks. Animated row reveal on scroll (stagger).
5. **FAQ** — 4-5 questions about billing, cancellation, security, payment methods. Same animated accordion pattern.
6. **FINAL CTA** — "Ainda com dúvidas? Fale com nossa equipe" + WhatsApp/Email buttons.

### Animation Highlights:
- Toggle: layoutAnimation on price text change
- Cards: staggered entry (0.1s delay per card), hover lift
- Table: staggered row reveal
- FAQ: AnimatePresence accordion

Return ONLY the COMPLETE TypeScript/React component code wrapped in \`\`\`tsx ... \`\`\`.`,

  blog2: `${BASE_CONTEXT}

## Page: /blog2 — Blog Listing Cinematográfico

### Sections (in order):
1. **HERO** — Dark gradient background with animated particles/floating elements. Big headline: "Blog Meta Construtor". Subtitle: "Dicas, tutoriais e novidades sobre gestão de obras no Brasil." Search bar with magnifying glass icon.
2. **FEATURED ARTICLE** — The first/latest article displayed prominently. Large card with background image (from the article's cover), overlay gradient from bottom, category pill, title (2 lines), preview (2 lines), author + date. "Ler artigo →" link. CinematicReveal animation.
3. **CATEGORY PILLS** — Horizontal scrollable row of category pills: Todos | RDO | Gestão | Checklist | Finanças | Tecnologia. Active pill highlighted in orange. Filter articles on click with AnimatePresence.
4. **ARTICLES GRID** — 3 columns desktop, 2 tablet, 1 mobile. Each card: image (with hover zoom), category badge, title (clamped 2 lines), preview (clamped 2 lines), author avatar + name, date. Cards have hover effect (y: -4 + shadow). Stagger container animation.
5. **NEWSLETTER CTA** — Full-width gradient section. "Receba novidades no seu email" + email input + "Inscrever" button. Clean, minimal, with subtle background animation.
6. **FOOTER**

### Data Structure:
- Use static mock data for now (array of article objects with: id, title, slug, excerpt, coverImage, category, author, date, readTime)
- Each article links to /blog/{slug}
- Featured article is articles[0]

### Animation Highlights:
- Hero: fade-in with blur reveal, floating elements
- Featured: cinematicReveal with scale
- Grid: staggerContainer + staggerItem
- Filter: AnimatePresence layout animation
- Newsletter: gradient background animation

Return ONLY the COMPLETE TypeScript/React component code wrapped in \`\`\`tsx ... \`\`\`.`,

  contato2: `${BASE_CONTEXT}

## Page: /contato2 — Contato com Micro-interações

### Sections (in order):
1. **HERO** — "Vamos conversar" with animated gradient text. Subtitle: "Tire dúvidas, peça um demo ou mande sugestões." Decorative animated elements (floating circles/shapes) on sides. Clean, airy layout.
2. **CONTACT FORM (2 columns)** — Left column: form fields. Right column: contact info cards + WhatsApp CTA.
   - Form fields: Nome (required), Empresa, Email (required, validation), Telefone (masked input), Mensagem (textarea)
   - Each field has floating label animation (label slides up when focused/has value)
   - Submit button with loading spinner animation
   - Success toast/message animation after submission
   - Form validation with animated error messages
   - Use useState for form state, simple validation (no Formik/React Hook Form needed)
3. **CONTACT INFO** — Right side: Phone card (with Phone icon + number), Email card (Mail icon + address), WhatsApp CTA (prominent green button with MessageSquare icon). Each card has hover lift animation.
4. **SOCIAL MEDIA** — Row of social media icons (Instagram, LinkedIn, YouTube, Facebook) with hover scale + color transition.
5. **FAQ** — 3-4 questions about response time, support hours, demo scheduling.
6. **SECONDARY CTA** — "Quer conhecer primeiro? Veja nossos planos" → link to /preco2

### Animation Highlights:
- Form fields: floating labels (translateY and scale on focus)
- Submit: loading spinner with rotation animation, success checkmark animation
- Contact cards: staggerItem
- Social icons: hover scale(1.2) + color transition

### Form Submission:
- Simple: store in state, console.log on submit (no API call needed for MVP V2)
- Show success animation after 1.5s delay

Return ONLY the COMPLETE TypeScript/React component code wrapped in \`\`\`tsx ... \`\`\`.`,

  sobre2: `${BASE_CONTEXT}

## Page: /sobre2 — Institucional com Timeline Animada

### Sections (in order):
1. **HERO** — Full-width dark hero with animated gradient background. "Nossa história" in large animated text. Subtitle: "Como o Meta Construtor nasceu e onde queremos chegar." Subtle parallax effect on background.
2. **MISSÃO / VISÃO / VALORES** — 3 cards in a row (desktop). Each card: icon (animated), title, description. Cards: Missão ("Simplificar a gestão de obras no Brasil"), Visão ("Ser referência em tecnologia para construção civil"), Valores ("Transparência, Inovação, Compromisso"). Hover: card tilt + glow.
3. **TIMELINE** — Vertical timeline with 5 milestones:
   - 2020 — Fundação. Ideia nasce em obra real.
   - 2021 — Primeiro MVP. 10 construtoras parceiras.
   - 2023 — 500+ obras gerenciadas. Expansão nacional.
   - 2024 — 1500+ obras. IA e automação de RDO.
   - 2025 — 3000+ obras. Liderança em tecnologia para construção.
   Each milestone: year (large), title, description, icon. Connected by a vertical line with animated progress. Each milestone reveals on scroll (slide from left alternating with slide from right).
4. **MÉTRICAS** — 4 animated counters: 3000+ Obras, 500+ Construtoras, 100k+ RDOs, 99% Disponibilidade. Same count-up animation as home2.
5. **FINAL CTA** — "Faça parte dessa história" + "Comece grátis" button. Clean, warm background.

### Animation Highlights:
- Hero: text reveal with gradient animation, parallax background
- Mission/Vision/Values: staggerContainer, hover tilt
- Timeline: scroll-triggered reveal alternating left/right
- Metrics: count-up with spring

Return ONLY the COMPLETE TypeScript/React component code wrapped in \`\`\`tsx ... \`\`\`.`
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTsxCode(text) {
  // Try multiple patterns
  const patterns = [
    /```tsx\n([\s\S]*?)```/,
    /```typescript\n([\s\S]*?)```/,
    /```ts\n([\s\S]*?)```/,
    /```jsx\n([\s\S]*?)```/,
    /```react\n([\s\S]*?)```/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  
  // If no code block found, assume entire response is the component
  return text.trim();
}

function validateComponent(code, pageName) {
  const checks = [];
  
  // Must have default export
  checks.push({ name: 'default export', pass: code.includes('export default function') });
  
  // Must import React
  checks.push({ name: 'React import', pass: code.includes("from 'react'") || code.includes('from "react"') });
  
  // Must import Framer Motion
  checks.push({ name: 'Framer Motion import', pass: code.includes('framer-motion') });
  
  // Must import SEO
  checks.push({ name: 'SEO import', pass: code.includes('@/components/SEO') });
  
  // Must use motion components
  checks.push({ name: 'motion.div usage', pass: code.includes('motion.') });
  
  // Must use whileInView or useInView
  checks.push({ name: 'scroll animation', pass: code.includes('whileInView') || code.includes('useInView') });
  
  // Must NOT have "use client"
  checks.push({ name: 'no use client', pass: !code.includes('use client') });
  
  // Must NOT have server component patterns
  checks.push({ name: 'no server components', pass: !code.includes('async function') || code.includes('useEffect') });
  
  const fails = checks.filter(c => !c.pass).map(c => c.name);
  const hasErrors = fails.length > 0;
  
  return {
    valid: !hasErrors,
    checks,
    fails,
    errors: hasErrors ? `Validation failed: ${fails.join(', ')}` : null
  };
}

// ─── Core Generation ─────────────────────────────────────────────────────────

async function generatePage(genAI, pageName) {
  const template = PAGE_TEMPLATES[pageName];
  if (!template) throw new Error(`No template for page: ${pageName}`);
  
  console.log(`\n🚀 Generating ${pageName}...`);
  
  const model = genAI.getGenerativeModel({ 
    model: MODEL,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 32768,
    }
  });
  
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/${MAX_RETRIES + 1}...`);
      
      const result = await model.generateContent(template);
      const response = result.response;
      const text = response.text();
      
      if (!text || text.length < 500) {
        throw new Error(`Response too short (${text?.length || 0} chars)`);
      }
      
      const code = extractTsxCode(text);
      
      if (!code || code.length < 300) {
        throw new Error('Could not extract valid TSX code from response');
      }
      
      // Validate
      const validation = validateComponent(code, pageName);
      if (!validation.valid) {
        console.warn(`  ⚠️  ${validation.errors}`);
        // Still save — but log warning
      }
      
      // Save file
      const componentName = pageName.charAt(0).toUpperCase() + pageName.slice(1) + '.tsx';
      const outputPath = path.join(OUTPUT_DIR, componentName);
      
      // Add header comment
      const header = `// Auto-generated by Google AI Studio (Gemini 2.5 Pro)\n// Page: /${pageName}\n// Generated: ${new Date().toISOString()}\n\n`;
      fs.writeFileSync(outputPath, header + code, 'utf-8');
      
      console.log(`  ✅ Saved: ${outputPath} (${code.length} chars)`);
      console.log(`  📋 Validation: ${validation.checks.filter(c => c.pass).length}/${validation.checks.length} checks passed`);
      
      return { pageName, outputPath, chars: code.length, validation };
      
    } catch (err) {
      lastError = err;
      console.error(`  ❌ Attempt ${attempt} failed:`, err.message);
      if (attempt <= MAX_RETRIES) {
        const waitTime = attempt * 5000;
        console.log(`  ⏳ Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      }
    }
  }
  
  throw new Error(`Failed to generate ${pageName} after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

// ─── Barrel Export ────────────────────────────────────────────────────────────

function writeBarrelExport(generatedPages) {
  const lines = generatedPages
    .filter(p => p)
    .map(p => {
      const name = p.pageName.charAt(0).toUpperCase() + p.pageName.slice(1);
      return `export { default as ${name} } from './${name}';`;
    });
  
  const content = `// Auto-generated barrel export — do not edit manually\n// Generated: ${new Date().toISOString()}\n\n${lines.join('\n')}\n`;
  
  const barrelPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(barrelPath, content, 'utf-8');
  console.log(`\n📦 Barrel export: ${barrelPath}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const targetPages = args.includes('--all') || args.length === 0 || !args.some(a => a.startsWith('--'))
    ? PAGES
    : args.filter(a => a.startsWith('--')).map(a => a.replace('--', '').toLowerCase()).filter(p => PAGES.includes(p));
  
  if (targetPages.length === 0) {
    console.error('Usage: node scripts/generate-v2-pages.mjs [--all|--home2|--preco2|--blog2|--contato2|--sobre2]');
    process.exit(1);
  }
  
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║   Meta Construtor — Páginas Públicas V2         ║`);
  console.log(`║   Google AI Studio (${MODEL})                 ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);
  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
  console.log(`📋 Pages: ${targetPages.join(', ')}`);
  
  // Ensure output directory
  ensureDir(OUTPUT_DIR);
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Generate each page
  const results = [];
  
  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`[${i + 1}/${targetPages.length}]`);
    
    try {
      const result = await generatePage(genAI, page);
      results.push(result);
    } catch (err) {
      console.error(`\n❌ Failed to generate ${page}:`, err.message);
    }
  }
  
  // Write barrel export
  if (results.length > 0) {
    writeBarrelExport(results);
  }
  
  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Summary:`);
  console.log(`  ✅ Generated: ${results.length}/${targetPages.length}`);
  console.log(`  ❌ Failed: ${targetPages.length - results.length}`);
  
  for (const r of results) {
    const passedChecks = r.validation ? `${r.validation.checks.filter(c => c.pass).length}/${r.validation.checks.length}` : 'N/A';
    console.log(`  ${r.pageName}: ${r.chars} chars (validation: ${passedChecks})`);
  }
  
  // Print next steps
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📋 NEXT STEPS:`);
  console.log(`  1. Review generated components in src/pages-gemini/`);
  console.log(`  2. Run: npm run build (validate)`);
  console.log(`  3. Add routes to PerformanceOptimizedApp.tsx`);
  console.log(`  4. Add SEO entries to src/config/seo.ts`);
  console.log(`  5. Add rewrites to vercel.json`);
  console.log(`  6. Add routes to prerender script`);
  console.log(`  7. Deploy: vercel --prod`);
  
  return results;
}

// Run
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
