import React, { useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Heart, Target, Lightbulb, Users, Shield, Rocket, Quote, Star, HardHat, BarChart3 } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';

// ─── Variants ────────────────────────────────────────────────
const cinematic = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Data ────────────────────────────────────────────────────
const VALUES = [
  { icon: Target, title: 'Missão', desc: 'Transformar a gestão de obras no Brasil, tornando construtoras mais produtivas, organizadas e lucrativas através da tecnologia.', color: 'from-brand-orange to-orange-400' },
  { icon: Heart, title: 'Propósito', desc: 'Simplificar o dia a dia de quem constrói o Brasil. Uma obra bem gerenciada transforma vidas.', color: 'from-brand-blue to-blue-500' },
  { icon: Lightbulb, title: 'Inovação', desc: 'Tecnologia que resolve problemas reais. Cada funcionalidade nasce de uma necessidade real de obra.', color: 'from-emerald-500 to-emerald-400' },
  { icon: Users, title: 'Pessoas', desc: 'Nossa equipe entende de obra porque já viveu obra. Engenheiros e arquitetos que sabem o que fazem.', color: 'from-brand-orange to-orange-400' },
  { icon: Shield, title: 'Confiança', desc: 'Mais de 1.500 obras confiam no Meta Construtor. Dados seguros, suporte humano e resultados reais.', color: 'from-brand-blue to-blue-500' },
  { icon: Rocket, title: 'Crescimento', desc: 'Evoluímos junto com nossos clientes. A cada feedback, uma melhoria. A cada obra, uma nova funcionalidade.', color: 'from-emerald-500 to-emerald-400' },
];

const TIMELINE = [
  { year: '2024', title: 'Nasce o Meta Construtor', desc: 'Fundado por engenheiros civis que cansaram da burocracia. O primeiro RDO digital é criado em uma madrugada de sexta-feira.' },
  { year: '2024', title: 'Primeiros 100 clientes', desc: 'O boca a boca entre engenheiros leva o Meta Construtor para as primeiras 100 construtoras em apenas 3 meses.' },
  { year: '2025', title: 'Lançamento do App Mobile', desc: 'RDO direto do celular com fotos, assinatura digital e geolocalização.' },
  { year: '2025', title: 'Checklists e Relatórios', desc: 'Checklists inteligentes e relatórios automáticos. Produtividade das equipes aumenta 40%.' },
  { year: '2026', title: '1.500 obras gerenciadas', desc: 'Presente em todos os estados brasileiros. O ecossistema completo de gestão de obras está pronto.' },
  { year: '2026', title: 'Portal do Cliente + Integrações', desc: 'Portal do Cliente e integrações com ERPs. Obras conectadas do início ao fim.' },
];

const TEAM_PHOTOS = [
  { name: 'Eng. Carlos Mendes', role: 'CEO & Fundador', desc: 'Engenheiro civil com 15 anos de obra. Criou o Meta Construtor na obra onde era residente.' },
  { name: 'Ana Oliveira', role: 'CTO', desc: 'Ex-desenvolvedora de ERP para construção civil. Conhece cada linha de código do sistema.' },
  { name: 'Lucas Santos', role: 'Head de Produto', desc: 'Arquiteto que migrou para tecnologia. Entende de obra e de UX como ninguém.' },
  { name: 'Marina Costa', role: 'Customer Success', desc: 'Engenheira civil que ama ajudar construtoras a extrair o máximo do sistema.' },
];

const METRICS = [
  { value: '1.500+', label: 'Obras Gerenciadas' },
  { value: '300+', label: 'Construtoras Ativas' },
  { value: '98%', label: 'Satisfação' },
  { value: '50k+', label: 'RDOs Digitais' },
];

// ─── Timeline ────────────────────────────────────────────────
function TimelineItem({ item, index }: { item: typeof TIMELINE[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-6 ${index % 2 === 1 ? 'md:flex-row-reverse md:text-right' : ''} group`}
    >
      <div className={`flex-1 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:border-brand-orange/30">
          <Badge className="bg-brand-orange/10 text-brand-orange border-0 mb-2">{item.year}</Badge>
          <h3 className="text-lg font-bold text-brand-blue mb-1">{item.title}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
        </div>
      </div>
      <div className="relative flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-4 border-brand-orange bg-white z-10 shadow-md ${
          isInView ? 'scale-100' : 'scale-0'
        } transition-transform duration-300`} />
      </div>
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

// ─── Team Card ───────────────────────────────────────────────
function TeamCard({ member, index }: { member: typeof TEAM_PHOTOS[0]; index: number }) {
  const initials = member.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <motion.div variants={staggerItem}
      className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
        {initials}
      </div>
      <h3 className="font-bold text-brand-blue mb-1">{member.name}</h3>
      <p className="text-sm text-brand-orange font-medium mb-2">{member.role}</p>
      <p className="text-sm text-neutral-500 leading-relaxed">{member.desc}</p>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function Sobre2() {
  const { scrollYProgress } = useScroll();
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.sobre2} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/marketing/obras-reais/cobertura-metalica-canteiro.webp" alt="Obra de construção civil"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/90 via-brand-blue/80 to-brand-blue/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15)_0%,_transparent_60%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-orange text-sm font-semibold mb-6 border border-brand-orange/30">
              Quem Somos
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 font-heading leading-tight">
              Nascemos para transformar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-300">
                a gestão de obras
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto leading-relaxed">
              O Meta Construtor foi criado por engenheiros que sentiram na pele a dor de gerenciar obras com papel, planilha e WhatsApp.
              Cansamos disso. E resolvemos criar algo melhor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {METRICS.map((m) => (
              <motion.div key={m.label} variants={staggerItem} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-brand-orange mb-1 font-heading">{m.value}</div>
                <div className="text-sm text-neutral-500 font-medium">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Images Strip */}
      <section className="py-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp',
              '/marketing/prd-prints-2026-06-04-05-rdo-lista-desktop.webp',
              '/marketing/prd-prints-2026-06-04-16-checklist-detalhe-desktop.webp',
              '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp'
            ].map((src, i) => (
              <motion.img key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                src={src} alt={`Screenshot ${i + 1}`}
                className="rounded-xl shadow border border-neutral-200"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/20">
              Nossos Valores
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              O que nos <span className="text-brand-orange">move</span>
            </h2>
          </motion.div>
          <motion.div {...staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <motion.div key={v.title} variants={staggerItem}
                className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-brand-blue mb-2">{v.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/20">
              Nossa História
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              Como <span className="text-brand-orange">chegamos aqui</span>
            </h2>
          </motion.div>
          <div className="hidden md:block h-1 bg-neutral-100 rounded-full mb-12 relative overflow-hidden">
            <motion.div style={{ scaleX: progressScale }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-orange to-orange-400 origin-left rounded-full"
            />
          </div>
          <div className="space-y-8 md:space-y-12 relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-100 -translate-x-1/2" />
            {TIMELINE.map((item, i) => (
              <TimelineItem key={`${item.year}-${i}`} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/20">
              Equipe
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              Quem faz o <span className="text-brand-orange">Meta Construtor</span>
            </h2>
            <p className="text-lg text-neutral-500 max-w-2xl mx-auto">Engenheiros, arquitetos e desenvolvedores que respiram obra.</p>
          </motion.div>
          <motion.div {...staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_PHOTOS.map((member) => (
              <TeamCard key={member.name} member={member} index={0} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hero image break */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img src="/marketing/obras-reais/estrutura-metalica-aerea.webp" alt="Estrutura metálica de obra"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/70 to-transparent" />
        <div className="relative h-full flex items-center px-8 md:px-16">
          <motion.div {...cinematic} className="max-w-lg">
            <Quote className="w-10 h-10 text-brand-orange/60 mb-4" />
            <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed">
              &ldquo;O que levava um dia inteiro de planilha, hoje fazemos em 15 minutos.&rdquo;
            </blockquote>
            <div className="flex items-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="w-4 h-4 fill-brand-orange text-brand-orange" />))}
            </div>
            <p className="text-sm text-blue-200 mt-2">Eng. Rafael Torres — Construtora Torres & Associados</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">Vamos construir juntos?</h2>
            <p className="text-lg text-neutral-500 mb-8 max-w-lg mx-auto">
              Junte-se a mais de 300 construtoras que já transformaram sua gestão de obras.
            </p>
            <Button size="lg" className="bg-brand-orange hover:bg-orange-600 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-brand-orange/25 hover:shadow-xl transition-all duration-300">
              Comece Grátis Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
