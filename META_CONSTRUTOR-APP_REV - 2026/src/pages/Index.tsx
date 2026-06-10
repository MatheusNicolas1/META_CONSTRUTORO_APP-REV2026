import React, { useRef, lazy } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, BarChart3, ClipboardCheck, Users, FileText, HardHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicNav from './PublicNav';
import { getOptimizedImageUrl } from '@/hooks/useOptimizedImage';

// ─── Lazy load abaixo da dobra ─────────────────────────────
const ObrasReaisSection = lazy(() => import('@/components/ObrasReaisSection'));
const MobilePrintsSectionWrapper = lazy(() =>
  import('@/components/SaasPrintsSection').then(m => ({ default: m.MobilePrintsSection }))
);
const FloatingElements = lazy(() =>
  import('@/components/public/FloatingElements').then(m => ({ default: m.FloatingElements }))
);
const TypewriterEffect = lazy(() =>
  import('@/components/public/TypewriterEffect').then(m => ({ default: m.TypewriterEffect }))
);
const WhatsAppDemoSection = lazy(() => import('@/components/WhatsAppDemoSection'));
const DashboardPrintsCarousel = lazy(() => import('@/components/DashboardPrintsCarousel'));
const OperationsPrintsCarousel = lazy(() => import('@/components/OperationsPrintsCarousel'));
const MobileTabletCarousel = lazy(() => import('@/components/MobileTabletCarousel'));

// ─── Constants ────────────────────────────────────────────────
const MARKETING = '/marketing';

const stats = [
  { value: '1.500+', label: 'Obras gerenciadas' },
  { value: '300+', label: 'Construtoras ativas' },
  { value: '50k+', label: 'RDOs registrados' },
  { value: '98%', label: 'Satisfação' },
];

const features = [
  {
    icon: ClipboardCheck,
    title: 'RDO Digital',
    desc: 'Registre diários de obra em segundos. Aprovação, fotos e clima em um só lugar.',
    image: `${MARKETING}/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.png`,
    cta: 'Testar RDO',
  },
  {
    icon: HardHat,
    title: 'Gestão de Obras',
    desc: 'Acompanhe cada obra com cronograma, orçamento, equipes e documentos integrados.',
    image: `${MARKETING}/prd-prints-2026-06-04-02-obras-lista-desktop.png`,
    cta: 'Ver obras',
  },
  {
    icon: FileText,
    title: 'Documentos & Checklists',
    desc: 'Checklists inteligentes, upload de documentos e controle de versão para sua equipe.',
    image: `${MARKETING}/prd-prints-2026-06-04-06-checklist-lista-desktop.png`,
    cta: 'Ver checklists',
  },
  {
    icon: BarChart3,
    title: 'Relatórios em Tempo Real',
    desc: 'Dashboards, PDFs e exportações para tomar decisões com dados reais da obra.',
    image: `${MARKETING}/prd-prints-2026-06-04-12-relatorios-resumo-desktop.png`,
    cta: 'Ver relatórios',
  },
  {
    icon: Users,
    title: 'Equipes & Colaboradores',
    desc: 'Cadastre equipes, atribua responsáveis e acompanhe a produtividade de cada frente.',
    image: `${MARKETING}/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`,
    cta: 'Gerir equipes',
  },
  {
    icon: FileText,
    title: 'Documentos da Obra',
    desc: 'Centralize projetos, ART, laudos e todos os documentos em um repositório seguro.',
    image: `${MARKETING}/prd-prints-2026-06-04-07-documentos-lista-desktop.png`,
    cta: 'Ver documentos',
  },
];

const faqItems = [
  { q: 'Preciso instalar algo?', a: 'Não. O Meta Construtor funciona 100% online. Basta acessar pelo navegador no computador, tablet ou celular.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Usamos criptografia em trânsito e em repouso, autenticação segura e seguimos a LGPD. Seus dados são isolados por obra e organização.' },
  { q: 'Funciona offline?', a: 'O app precisa de internet para sincronizar. Mas você pode preencher RDOs com fotos e elas são enviadas assim que a conexão voltar.' },
  { q: 'Posso migrar meus dados?', a: 'Sim. Temos importação de planilhas e suporte para migração de sistemas legados. Fale com a gente para saber mais.' },
  { q: 'Tem suporte em português?', a: 'Sim! Nosso time fala português e entende o dia a dia da construção civil brasileira.' },
  { q: 'Como funciona o cancelamento?', a: 'Você pode cancelar a qualquer momento. Seus dados ficam disponíveis por 30 dias para exportação.' },
];

// ─── Motion Variants (memorizados fora do componente) ─────────
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Sub-components ───────────────────────────────────────────

function Section({ children, className = '', dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={`py-12 md:py-20 ${dark ? 'bg-neutral-900 text-white' : 'bg-white'} ${className} contain-layout`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {children}
      </div>
    </motion.section>
  );
}

function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="text-2xl md:text-4xl font-extrabold text-brand-orange mb-1">{value}</div>
      <div className="text-xs md:text-sm text-neutral-500">{label}</div>
    </motion.div>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const webpImage = getOptimizedImageUrl(feature.image, { width: 600 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 25 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.06 } },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-neutral-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
        <img
          src={webpImage!}
          alt={feature.title}
          className="absolute bottom-0 left-0 right-0 w-full object-cover object-top rounded-b-2xl"
          style={{ maxHeight: '70%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="relative z-20">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-orange-ghost rounded-xl flex items-center justify-center mb-3 sm:mb-4">
          <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-2">{feature.title}</h3>
        <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed mb-4">{feature.desc}</p>
        <span className="text-brand-orange text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          {feature.cta} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </motion.div>
  );
}

function FAQItem({ item, index }: { item: typeof faqItems[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: index * 0.05 } },
      }}
      className="border-b border-neutral-100 pb-5 sm:pb-6"
    >
      <h4 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 sm:mb-2">{item.q}</h4>
      <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{item.a}</p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  // Hero fade-in combinado em uma única variante para menos cálculos
  const heroContent = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <SEO {...seoPages.home} />

      <PublicNav />

      {/* ═══════════════════════════════════════════════════════
          FLUXO DA PÁGINA (narrativa do visitante):
          1. HERO — impacto, o que é
          2. FEATURES — o que faz (6 cards)
          3. DASHBOARD PRINTS — visão executiva (carrossel)
          4. HOW IT WORKS — como começar em 3 passos
          5. BEFORE / AFTER — por que trocar
          6. OPERATIONS PRINTS — gestão diária (carrossel)
          7. WHATSAPP DEMO — a novidade: bot inteligente
          8. MOBILE TABLET — prints responsivos (carrossel)
          9. MOBILE PRINTS — veja o app funcionando
          10. OBRAS REAIS — prova social
          11. TRUST STATS — números de impacto
          12. FAQ — dúvidas comuns
          13. CTA FINAL — ação
          ═══════════════════════════════════════════════════════ */}

      {/* ── 1. HERO ───────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[80vh] md:min-h-screen flex items-center overflow-hidden bg-hero-gradient">
        {/* Orbs decorativos com will-change */}
        <FloatingElements count={3} className="hidden md:block" />

        <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-3xl opacity-30 md:opacity-100 pointer-events-none"
             style={{ willChange: 'transform' }} />

        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-brand-emerald/5 rounded-full blur-3xl opacity-30 md:opacity-100 pointer-events-none"
             style={{ willChange: 'transform' }} />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div style={{ y: heroY, opacity: heroOpacity }}>
              <motion.div
                variants={heroContent}
                initial="hidden"
                animate="visible"
              >
                <span className="inline-flex items-center gap-2 bg-brand-orange-ghost text-brand-orange text-xs sm:text-sm font-semibold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full mb-4 sm:mb-6">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sistema de gestão de obras
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="text-[clamp(2rem,7vw,4.5rem)] font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-4 sm:mb-6"
              >
                Gestão de obras{' '}
                  <span className="text-brand-orange">em um só lugar</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-[clamp(0.9rem,2.5vw,1.25rem)] text-neutral-600 leading-relaxed mb-6 sm:mb-8 max-w-lg"
              >
                <TypewriterEffect
                  texts={[
                    'RDO digital, checklists de qualidade, equipes, documentos, contratos e relatórios — tudo integrado em uma plataforma completa para sua construtora.',
                    'Mais de 300 construtoras já transformaram a gestão de obras com RDO online e controle de obras em tempo real.',
                    'Do diário de obra ao relatório final — RDO, ocorrências, fotos, pendencias, medições e assinaturas, tudo digital.',
                  ]}
                  speed={35}
                  delayBetween={5000}
                  deleteSpeed={25}
                />
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <Button className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-full shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 transition-all w-full sm:w-auto" asChild>
                  <Link to="/criar-conta">
                    Comece grátis <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </Button>
                <Button variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 rounded-full border-2 border-neutral-200 hover:border-brand-orange hover:text-brand-orange transition-all w-full sm:w-auto" asChild>
                  <Link to="/preco">
                    Ver planos
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-500"
              >
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-emerald" /> Sem cartão</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-emerald" /> Sem instalação</span>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-emerald" /> Suporte BR</span>
              </motion.div>
            </motion.div>

            {/* Dashboard image — hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-orange/10 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden bg-white">
                  <div className="bg-neutral-100 px-4 py-2 flex items-center gap-2 border-b border-neutral-200">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-xs text-neutral-400 ml-2">Meta Construtor — Dashboard</div>
                  </div>
                  <img
                    src={`${MARKETING}/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.png`}
                    alt="Dashboard do Meta Construtor"
                    className="w-full"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>

                {/* Mobile mockup overlay */}
                <div className="absolute -bottom-6 -right-4 lg:-right-8 w-32 lg:w-40">
                  <div className="rounded-2xl border-2 border-neutral-200 shadow-xl overflow-hidden bg-white">
                    <img
                      src={`${MARKETING}/prd-prints-2026-06-04-13-integracoes-status-desktop.png`}
                      alt="Meta Construtor mobile"
                      className="w-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-neutral-300 flex items-start justify-center p-1"
          >
            <motion.div className="w-1.5 h-3 bg-brand-orange rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── 2. FEATURES GRID ──────────────────────────────── */}
      <Section className="content-visibility-auto">
        <motion.div variants={fadeInUp} className="text-center mb-10 md:mb-16">
          <span className="text-brand-orange font-semibold text-xs sm:text-sm tracking-wide uppercase">Funcionalidades</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-2 sm:mt-3 mb-3 sm:mb-4">
            Tudo que sua obra precisa
          </h2>
          <p className="text-neutral-600 text-sm sm:text-lg max-w-2xl mx-auto px-2">
            Do diário de obra ao relatório final — cada módulo foi pensado para o dia a dia da construção civil.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </Section>

      {/* ── 3. DASHBOARD PRINTS — carrossel de visão executiva ── */}
      <div className="content-visibility-auto">
        <DashboardPrintsCarousel />
      </div>

      {/* ── 4. HOW IT WORKS ───────────────────────────────── */}
      <Section className="bg-neutral-50 content-visibility-auto">
        <motion.div variants={fadeInUp} className="text-center mb-10 md:mb-16">
          <span className="text-brand-orange font-semibold text-xs sm:text-sm tracking-wide uppercase">Como funciona</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-2 sm:mt-3 mb-3 sm:mb-4">
            Do papel ao digital em 3 passos
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto"
        >
          {[
            { step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido, sem cartão de crédito. Sua primeira obra já fica pronta em minutos.' },
            { step: '02', title: 'Registre o dia a dia', desc: 'RDOs, checklists, fotos e documentos — tudo registrado e organizado automaticamente.' },
            { step: '03', title: 'Tome decisões', desc: 'Relatórios e dashboards em tempo real para você focar no que importa: a obra.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className="text-center"
            >
              <div className="text-5xl sm:text-6xl font-extrabold text-brand-orange/15 mb-3 sm:mb-4">{item.step}</div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1 sm:mb-2">{item.title}</h3>
              <p className="text-sm sm:text-base text-neutral-600">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── 4. BEFORE / AFTER ─────────────────────────────── */}
      <Section className="content-visibility-auto">
        <motion.div variants={fadeInUp} className="text-center mb-10 md:mb-16">
          <span className="text-brand-orange font-semibold text-xs sm:text-sm tracking-wide uppercase">Comparativo</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-2 sm:mt-3 mb-3 sm:mb-4">
            Adeus, planilha e WhatsApp
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-red-50 border-2 border-red-100 rounded-2xl p-5 sm:p-8"
          >
            <h3 className="text-base sm:text-lg font-bold text-red-700 mb-3 sm:mb-4 flex items-center gap-2">
              Antes
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {['Papel e planilha espalhados', 'RDO perdido no WhatsApp', 'Relatório manual no Excel', 'Sem histórico de obra', 'Fotos sem organização'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-red-800">
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-red-400" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 sm:p-8"
          >
            <h3 className="text-base sm:text-lg font-bold text-emerald-700 mb-3 sm:mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 sm:w-5 sm:h-5" /> Depois
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {['App centralizado e online', 'RDO digital com fotos e clima', 'Relatórios em 1 clique', 'Histórico completo por obra', 'Documentos organizados por categoria'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-emerald-800">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Section>

      {/* ── 6. OPERATIONS PRINTS — carrossel de gestão diária ── */}
      <div className="content-visibility-auto">
        <OperationsPrintsCarousel />
      </div>

      {/* ── 7. WHATSAPP DEMO ──────────────────────────────── */}
      <div className="content-visibility-auto">
        <WhatsAppDemoSection />
      </div>

      {/* ── 8. MOBILE TABLET PRINTS — carrossel responsivo ── */}
      <div className="content-visibility-auto">
        <MobileTabletCarousel />
      </div>

      {/* ── 9. MOBILE PRINTS ──────────────────────────────── */}
      <div className="content-visibility-auto">
        <MobilePrintsSectionWrapper />
      </div>

      {/* ── 10. OBRAS REAIS ────────────────────────────────── */}
      <div className="content-visibility-auto">
        <ObrasReaisSection />
      </div>

      {/* ── 11. TRUST BAR ──────────────────────────────────── */}
      <Section className="py-10 border-y border-neutral-100 bg-neutral-50">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} delay={i * 0.08} />
          ))}
        </motion.div>
      </Section>

      {/* ── 12. FAQ ────────────────────────────────────────── */}
      <Section className="content-visibility-auto">
        <motion.div variants={fadeInUp} className="text-center mb-8 sm:mb-16">
          <span className="text-brand-orange font-semibold text-xs sm:text-sm tracking-wide uppercase">Dúvidas</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-2 sm:mt-3 mb-3 sm:mb-4">
            Perguntas frequentes
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto divide-y divide-neutral-100">
          {faqItems.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </div>
      </Section>

      {/* ── 13. CTA FINAL ─────────────────────────────────── */}
      <Section className="bg-brand-orange/5 content-visibility-auto">
        <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-neutral-900 mb-4 sm:mb-6">
            Pronto para transformar sua obra?
          </h2>
          <p className="text-neutral-600 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
            Comece grátis hoje. Sem cartão de crédito. Sem instalação. Suporte em português.
          </p>
          <Button className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm sm:text-base px-8 sm:px-12 py-5 sm:py-6 rounded-full shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 transition-all" asChild>
            <Link to="/criar-conta">
              Comece grátis agora <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
        </motion.div>
      </Section>
    </div>
  );
}
