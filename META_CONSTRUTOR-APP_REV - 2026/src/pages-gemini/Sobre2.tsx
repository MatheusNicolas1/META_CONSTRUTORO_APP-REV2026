import React, { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Target, Lightbulb, Users, Shield, Rocket } from 'lucide-react';
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
  { icon: Target, title: 'Missão', desc: 'Transformar a gestão de obras no Brasil, tornando construtoras mais produtivas, organizadas e lucrativas através da tecnologia.', color: 'from-[#dc4415] to-[#e86035]' },
  { icon: Heart, title: 'Propósito', desc: 'Simplificar o dia a dia de quem constrói o Brasil. Uma obra bem gerenciada transforma vidas.', color: 'from-brand-blue to-blue-500' },
  { icon: Lightbulb, title: 'Inovação', desc: 'Tecnologia que resolve problemas reais. Cada funcionalidade nasce de uma necessidade real de obra.', color: 'from-emerald-500 to-emerald-400' },
  { icon: Users, title: 'Pessoas', desc: 'Uma equipe de engenharia e tecnologia que trabalha próxima aos clientes para resolver problemas reais de obra.', color: 'from-[#dc4415] to-[#e86035]' },
  { icon: Shield, title: 'Confiança', desc: 'Dados seguros, suporte humano e resultados reais. Cada obra importa.', color: 'from-brand-blue to-blue-500' },
  { icon: Rocket, title: 'Crescimento', desc: 'Evoluímos junto com nossos clientes. A cada feedback, uma melhoria. A cada obra, uma nova funcionalidade.', color: 'from-emerald-500 to-emerald-400' },
];

// ─── Page ────────────────────────────────────────────────────
export default function Sobre2() {
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-blue text-sm font-semibold mb-6 border border-brand-orange/30">Quem Somos</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 font-heading leading-tight">
              Nascemos para transformar{' '}
              <span className="text-orange-400">a gestão de obras</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto leading-relaxed">
              O Meta Construtor nasceu da rotina real de obra, para substituir papel, planilha e WhatsApp
              por um fluxo único de RDO, checklists, equipes e relatórios.
            </p>
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4 border border-brand-orange/20">Nossos Valores</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              O que nos <span className="text-brand-blue">move</span>
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

      {/* Nossa História (honesta — sem marcos/anos inventados) */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4 border border-brand-orange/20">Nossa História</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              Como <span className="text-brand-blue">chegamos aqui</span>
            </h2>
          </motion.div>
          <motion.div {...cinematic} className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
            <p className="text-neutral-600 leading-relaxed">
              O Meta Construtor é um produto em constante evolução, construído a partir de necessidades reais
              do canteiro de obras. Cada funcionalidade — RDO digital, checklists, equipes, documentos e
              relatórios — nasce do diálogo com quem usa o sistema no dia a dia. Seguimos evoluindo junto
              com nossos clientes, priorizando o que realmente resolve a rotina de uma obra.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Equipe (honesta — sem nomes/biografias inventados) */}
      <section className="py-20 md:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4 border border-brand-orange/20">Equipe</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              Quem faz o <span className="text-brand-blue">Meta Construtor</span>
            </h2>
          </motion.div>
          <motion.div {...cinematic} className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-neutral-500 leading-relaxed">
              Somos um time de engenharia, produto e tecnologia que trabalha próximo aos clientes para
              transformar a gestão de obras. Nosso contato com construtoras e profissionais da construção
              civil guia cada decisão de produto.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">Vamos construir juntos?</h2>
            <p className="text-lg text-neutral-500 mb-8 max-w-lg mx-auto">
              Gestão de obras mais simples para construtoras que querem crescer.
            </p>
            <Button size="lg" className="bg-[#dc4415] hover:bg-[#c43a10] text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-[#dc4415]/25 hover:shadow-xl transition-all duration-300">
              Comece Grátis Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
