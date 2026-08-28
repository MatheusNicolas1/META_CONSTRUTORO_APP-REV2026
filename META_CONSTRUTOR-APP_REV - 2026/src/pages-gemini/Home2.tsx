import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ChevronDown, BarChart3, ClipboardCheck, Users, FileText, HardHat, Shield, Clock, Quote, Play, Layers, Smartphone, Monitor, Tablet, X, Menu } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { FloatingElements } from '@/components/public/FloatingElements';

// ─── Visual Assets ──────────────────────────────────────
const HERO_SCREENS = [
  '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp',
  '/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.webp',
  '/marketing/prd-prints-2026-06-04-05-rdo-lista-desktop.webp',
  '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp',
  '/marketing/prd-prints-2026-06-04-06-checklist-lista-desktop.webp',
];

const OBRA_IMAGES = [
  '/marketing/obras-reais/obra-01.webp','/marketing/obras-reais/obra-02.webp',
  '/marketing/obras-reais/obra-03.webp','/marketing/obras-reais/obra-04.webp',
  '/marketing/obras-reais/obra-05.webp','/marketing/obras-reais/obra-06.webp',
  '/marketing/obras-reais/obra-07.webp','/marketing/obras-reais/obra-08.webp',
  '/marketing/obras-reais/obra-09.webp','/marketing/obras-reais/obra-10.webp',
  '/marketing/obras-reais/obra-11.webp','/marketing/obras-reais/obra-12.webp',
  '/marketing/obras-reais/obra-13.webp','/marketing/obras-reais/obra-14.webp',
  '/marketing/obras-reais/obra-15.webp',
];

const FEATURE_PRINTS = [
  { label: 'Dashboard', src: '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp', desc: 'Visão geral de todas as suas obras em tempo real' },
  { label: 'RDO', src: '/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.webp', desc: 'Registro diário de obras digital com aprovação' },
  { label: 'Checklists', src: '/marketing/prd-prints-2026-06-04-16-checklist-detalhe-desktop.webp', desc: 'Checklists inteligentes por etapa da obra' },
  { label: 'Equipes', src: '/marketing/prd-prints-2026-06-04-08-equipes-lista-desktop.webp', desc: 'Gestão de equipes e alocação por obra' },
  { label: 'Documentos', src: '/marketing/prd-prints-2026-06-04-07-documentos-lista-desktop.webp', desc: 'Documentos, contratos e ART digitalizados' },
  { label: 'Relatórios', src: '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp', desc: 'Relatórios gerenciais automáticos' },
  { label: 'Mobile', src: '/marketing/prd-prints-2026-06-04-25-rdo-mobile.webp', desc: 'App mobile — faça RDO direto da obra' },
  { label: 'Financeiro', src: '/marketing/prd-prints-2026-06-04-11-despesas-lista-desktop.webp', desc: 'Controle financeiro e fluxo de caixa' },
];

const DEVICE_MOCKUPS = [
  { label: 'Desktop', src: '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp', icon: Monitor },
  { label: 'Tablet', src: '/marketing/prd-prints-2026-06-04-22-dashboard-tablet.webp', icon: Tablet },
  { label: 'Mobile', src: '/marketing/prd-prints-2026-06-04-25-rdo-mobile.webp', icon: Smartphone },
];

// ─── Variants ───────────────────────────────────────────
const cinematic = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const revealUp = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const revealScale = {
  initial: { opacity: 0, scale: 0.85 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const staggerParent = {
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  viewport: { once: true },
};

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Hero Cinematic Carousel ────────────────────────────
function HeroCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setIdx((p) => (p + 1) % images.length), 4000);
    return () => clearInterval(intervalRef.current);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={images[idx]}
          src={images[idx]}
          alt={`Meta Construtor screenshot ${idx + 1}`}
          initial={{ opacity: 0, scale: 1.1, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full object-cover rounded-2xl shadow-2xl"
        />
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === idx ? 'w-6 bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Parallax Image Section ─────────────────────────────
function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1, 1.05]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img src={src} alt={alt} style={{ y, scale }}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ─── Glass Card ─────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div {...revealScale}
      className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function Home2() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.92]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const unsub = scrollY.on('change', (v) => setScrolled(v > 60));
    return () => unsub();
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.home2} />

      {/* ─── NAVBAR ─── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <motion.a href="/home2" className="flex items-center gap-2 font-bold text-xl md:text-2xl font-heading">
            <span className="text-brand-blue">Meta</span>
            <span className="text-brand-orange">Construtor</span>
          </motion.a>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {['Funcionalidades','Preços','Blog','Contato'].map((l, i) => (
              <motion.a key={l} href={`/${l === 'Funcionalidades' ? 'home2' : l.toLowerCase() + '2'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="text-brand-blue/70 hover:text-brand-blue transition-colors"
              >
                {l}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button className="bg-[#dc4415] hover:bg-[#c43a10] text-white rounded-xl px-6 shadow-lg shadow-[#dc4415]/25">
                Começar Grátis <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden bg-white border-t border-neutral-100"
            >
              <div className="px-4 py-4 space-y-3">
                {['Funcionalidades','Preços','Blog','Contato'].map((l) => (
                  <a key={l} href={`/${l.toLowerCase() === 'funcionalidades' ? 'home2' : l.toLowerCase() + '2'}`}
                    className="block py-2 text-brand-blue/70 font-medium"
                  >{l}</a>
                ))}
                <Button className="w-full bg-[#dc4415] hover:bg-[#c43a10] text-white rounded-xl">Começar Grátis</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── HERO ─── */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-brand-blue via-[#162d4e] to-brand-blue">
        <FloatingElements />
        {/* Gradient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text (minimal) */}
            <motion.div {...cinematic}>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-orange-400 text-sm font-semibold mb-6 border border-brand-orange/30"
              >
                Obra digital, não papelada
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 font-heading leading-tight">
                Gestão de obras{' '}
                <span className="text-orange-400">
                  sem burocracia
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100/70 max-w-lg leading-relaxed mb-8">
                RDO, checklists, equipes e relatórios em um só lugar. Use do celular ou desktop.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-[#dc4415] hover:bg-[#c43a10] text-white px-8 py-6 text-lg rounded-xl shadow-xl shadow-[#dc4415]/30 hover:shadow-2xl transition-all duration-300">
                  Começar Grátis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                  <Play className="mr-2 w-5 h-5" /> Ver Demo
                </Button>
              </div>
            </motion.div>

            {/* Right: Hero mockup carousel */}
            <motion.div
              initial={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-[300px] md:h-[450px] lg:h-[500px]"
            >
              {/* Device frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <HeroCarousel images={HERO_SCREENS} />
              </div>
              {/* Glow behind */}
              <div className="absolute -inset-4 bg-brand-orange/5 rounded-3xl blur-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── FEATURES WITH PRINTS ─── */}
      <section className="py-20 md:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4">
              O Meta Construtor em ação
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue mb-4 font-heading">
              Veja como funciona
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              Prints reais do sistema em uso — sem mockups, sem ilusão.
            </p>
          </motion.div>

          {/* Feature tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {FEATURE_PRINTS.map((f, i) => (
              <button key={f.label} onClick={() => setActiveFeature(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFeature === i
                    ? 'bg-[#dc4415] text-white shadow-lg shadow-[#dc4415]/25'
                    : 'bg-white text-neutral-500 hover:bg-[#dc4415]/10 hover:text-brand-blue border border-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Feature display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl mx-auto"
            >
              <div className="grid lg:grid-cols-5 gap-8 items-center">
                <div className="lg:col-span-3">
                  <img
                    src={FEATURE_PRINTS[activeFeature].src}
                    alt={FEATURE_PRINTS[activeFeature].label}
                    className="w-full rounded-2xl shadow-2xl border border-neutral-200"
                  />
                </div>
                <div className="lg:col-span-2">
                  <span className="text-sm uppercase tracking-wider text-brand-blue font-semibold">{FEATURE_PRINTS[activeFeature].label}</span>
                  <p className="text-lg text-neutral-600 mt-2">{FEATURE_PRINTS[activeFeature].desc}</p>
                  <Button className="mt-6 bg-[#dc4415] hover:bg-[#c43a10] text-white rounded-xl">
                    Explorar {FEATURE_PRINTS[activeFeature].label} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ─── OBRAS REAIS GALLERY ─── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4">
              Galeria de Obras
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue mb-4 font-heading">
              Obras reais, resultados reais
            </h2>
          </motion.div>

          <motion.div {...staggerParent} className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {OBRA_IMAGES.slice(0, 15).map((src, i) => (
              <motion.div key={i} variants={fadeSlide} className="break-inside-avoid">
                <img src={src} alt={`Obra real ${i + 1}`}
                  className="w-full rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── DEVICE MOCKUPS ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-brand-blue via-[#162d4e] to-brand-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/30">
              Multiplataforma
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-heading">
              Funciona onde você precisar
            </h2>
            <p className="text-lg text-blue-200/70 max-w-xl mx-auto">
              Do escritório ao canteiro de obras — o Meta Construtor está sempre com você.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {DEVICE_MOCKUPS.map((d, i) => (
              <motion.div key={d.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center"
              >
                <div className="relative mb-6 mx-auto max-w-xs">
                  <img src={d.src} alt={d.label}
                    className="w-full rounded-2xl shadow-2xl border border-white/10"
                  />
                </div>
                <d.icon className="w-8 h-8 mx-auto mb-2 text-brand-orange" />
                <span className="text-lg font-semibold">{d.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROPOSTA DE VALOR ─── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-brand-blue/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-3xl p-8 md:p-12 border border-neutral-100 shadow-xl">
                <Quote className="w-10 h-10 text-brand-blue/30 mx-auto mb-6" />
                <blockquote className="text-xl md:text-2xl font-medium text-brand-blue mb-6 leading-relaxed">
                  &ldquo;RDO, checklists, equipes e relatórios em um só lugar — do canteiro ao escritório.&rdquo;
                </blockquote>
                <p className="text-sm text-neutral-400">
                  Gestão de obras digital, sem burocracia e sem papelada.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-[#dc4415] via-[#dc4415] to-brand-blue overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2LjUgMzUuNWMtNC4xNDEgMC03LjUtMy4zNTktNy41LTcuNSAwLTQuMTQxIDMuMzU5LTcuNSA3LjUtNy41IDQuMTQxIDAgNy41IDMuMzU5IDcuNSA3LjUgMCA0LjE0MS0zLjM1OSA3LjUtNy41IDcuNXoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-heading leading-tight">
              Pronto para transformar sua gestão de obras?
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg mx-auto">
              Comece grátis, sem cartão de crédito.
            </p>
            <Button size="lg" className="bg-white text-brand-blue hover:bg-orange-50 px-10 py-6 text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 font-bold">
              Começar Grátis Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-white/50 text-sm mt-4">Não precisa de cartão de crédito • Cancele quando quiser</p>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-brand-blue py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm text-blue-200/60">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg text-white mb-4">
                <span className="text-white">Meta</span>
                <span className="text-brand-orange">Construtor</span>
              </div>
              <p className="leading-relaxed">Gestão de obras inteligente para construtoras que querem crescer.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Produto</h3>
              <ul className="space-y-2">
                <li><a href="/home2" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="/preco2" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="/blog2" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Empresa</h3>
              <ul className="space-y-2">
                <li><a href="/sobre2" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="/contato2" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/legal/privacidade" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="/legal/termos" className="hover:text-white transition-colors">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-8 text-center text-blue-200/40 text-xs">
            &copy; {new Date().getFullYear()} Meta Construtor. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
