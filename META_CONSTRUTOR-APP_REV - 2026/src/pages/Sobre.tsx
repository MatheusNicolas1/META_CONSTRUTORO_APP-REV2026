import React from 'react';
import { motion } from 'framer-motion';
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Eye, Heart, MapPin, Shield, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/public/PublicLayout';
import { AnimatedSection } from '@/components/public/AnimatedSection';
import { AnimatedGradient } from '@/components/public/AnimatedGradient';
import { StaggerContainer, StaggerItem } from '@/components/public/StaggerContainer';

const missionItems = [
  { icon: Target, title: 'Missão', desc: 'Digitalizar a rotina de construtoras brasileiras com simplicidade e eficiência.' },
  { icon: Eye, title: 'Visão', desc: 'Ser a plataforma de referência em gestão de obras no Brasil até 2028.' },
  { icon: Heart, title: 'Valores', desc: 'Clareza, segurança, simplicidade operacional e respeito aos dados.' },
];

const differentials = [
  { icon: MapPin, title: '100% brasileiro', desc: 'Produto pensado para a rotina e legislação da construção civil do Brasil.' },
  { icon: Shield, title: 'Segurança e LGPD', desc: 'Dados criptografados, isolados por organização e em conformidade com a lei.' },
  { icon: Zap, title: 'Rápido e online', desc: 'Acesse de qualquer dispositivo, sem instalar nada. Atualizações em tempo real.' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Sobre() {
  return (
    <PublicLayout>
      <SEO {...seoPages.sobre} />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-hero-gradient">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-orange-ghost text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Building2 className="w-3.5 h-3.5" /> Nossa história
            </span>
            <h1 className="text-[clamp(1.75rem,5vw,3.75rem)] font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-4">
              Construindo o futuro da{' '}
              <AnimatedGradient as="span">construção civil</AnimatedGradient>
            </h1>
            <p className="text-base md:text-lg text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Nascemos para resolver um problema real: a gestão de obras ainda é feita no papel, WhatsApp e planilhas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <AnimatedSection>
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-brand-orange font-semibold text-sm tracking-wide uppercase">Propósito</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-3">
              <AnimatedGradient as="span">Missão, Visão e Valores</AnimatedGradient>
            </h2>
          </div>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {missionItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={i} className="text-center p-6 md:p-8 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-14 h-14 bg-brand-orange-ghost rounded-xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.desc}</p>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </AnimatedSection>

      {/* Differentials */}
      <AnimatedSection dark={false} className="bg-neutral-50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-brand-orange font-semibold text-sm tracking-wide uppercase">Diferenciais</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-3">
              <AnimatedGradient as="span">Por que escolher o Meta Construtor</AnimatedGradient>
            </h2>
          </div>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {differentials.map((item, i) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={i} className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 shadow-sm">
                  <Icon className="w-8 h-8 text-brand-orange mb-4" />
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{item.desc}</p>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </AnimatedSection>

      {/* Final CTA */}
      <section className="relative py-24 bg-neutral-900 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-orange/10 rounded-full blur-3xl"
        />
        <div className="container max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.h2
            variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-white mb-8"
          >
            Faça parte dessa{' '}
            <AnimatedGradient as="span" colors={['#F97316', '#FDBA74', '#EA580C', '#F97316']}>história</AnimatedGradient>
          </motion.h2>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Button className="w-full md:w-auto bg-brand-orange hover:bg-brand-orange-hover text-white text-lg px-10 py-7 rounded-full shadow-xl shadow-brand-orange/30" asChild>
              <Link to="/criar-conta">Comece grátis agora <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
