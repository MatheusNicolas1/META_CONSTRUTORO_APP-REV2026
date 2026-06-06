import React from 'react';
import { motion } from 'framer-motion';
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Shield, Star, HelpCircle, CreditCard, Building2, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/public/PublicLayout';
import { AnimatedSection } from '@/components/public/AnimatedSection';
import { AnimatedGradient } from '@/components/public/AnimatedGradient';
import { StaggerContainer, StaggerItem } from '@/components/public/StaggerContainer';

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    desc: 'Ideal para começar e testar a plataforma.',
    features: [
      '1 obra ativa',
      'RDOs ilimitados',
      'Checklists básicos',
      '5 membros na equipe',
      'Suporte por email',
    ],
    cta: 'Comece grátis',
    to: '/criar-conta',
    popular: false,
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R$ 97',
    period: '/mês',
    desc: 'Para construtoras que precisam de gestão completa.',
    features: [
      'Obras ilimitadas',
      'RDOs com aprovação em tempo real',
      'Relatórios em PDF profissionais',
      'Documentos ilimitados',
      'Equipes e colaboradores ilimitados',
      'Suporte prioritário via WhatsApp',
      'Dashboards personalizados',
    ],
    cta: 'Assinar Pro',
    to: '/checkout?plan=pro',
    popular: true,
    highlight: true,
    priceId: 'price_1R9iH9P9oSIg6t2i5qRwTl1R',
  },
  {
    name: 'Premium',
    price: 'R$ 197',
    period: '/mês',
    desc: 'Para construtoras que exigem performance máxima.',
    features: [
      'Tudo do plano Pro',
      'API pública (REST + Webhooks)',
      'Integração com ERP / SAP',
      'Relatórios analíticos avançados',
      'Múltiplos orçamentos por obra',
      'Automações personalizadas',
      'Suporte 24/7 dedicado',
    ],
    cta: 'Assinar Premium',
    to: '/checkout?plan=premium',
    popular: false,
    highlight: false,
    priceId: 'price_1R9iIuP9oSIg6t2iCVG6z8OS',
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    desc: 'Para grandes operações com necessidades específicas.',
    features: [
      'Tudo do plano Premium',
      'White label (sua marca)',
      'Single Sign-On (SSO)',
      'SLA garantido 99.9%',
      'Treinamento dedicado da equipe',
      'On-premise disponível',
      'Contrato personalizado',
    ],
    cta: 'Falar com vendas',
    to: '/contato',
    popular: false,
    highlight: false,
  },
];

const comparisons = [
  { feature: 'Obras ativas', free: '1', pro: 'Ilimitadas', premium: 'Ilimitadas', enterprise: 'Ilimitadas' },
  { feature: 'RDOs', free: 'Ilimitados', pro: 'Ilimitados', premium: 'Ilimitados', enterprise: 'Ilimitados' },
  { feature: 'Checklists', free: 'Básicos', pro: 'Avançados', premium: 'Inteligentes', enterprise: 'Customizados' },
  { feature: 'Membros', free: '5', pro: 'Ilimitados', premium: 'Ilimitados', enterprise: 'Ilimitados' },
  { feature: 'Relatórios PDF', free: '—', pro: '✓', premium: '✓', enterprise: '✓' },
  { feature: 'Documentos', free: '50', pro: 'Ilimitados', premium: 'Ilimitados', enterprise: 'Ilimitados' },
  { feature: 'API + Webhooks', free: '—', pro: '—', premium: '✓', enterprise: '✓' },
  { feature: 'ERP / SAP', free: '—', pro: '—', premium: '✓', enterprise: '✓' },
  { feature: 'White label', free: '—', pro: '—', premium: '—', enterprise: '✓' },
  { feature: 'SSO', free: '—', pro: '—', premium: '—', enterprise: '✓' },
  { feature: 'Suporte', free: 'Email', pro: 'WhatsApp', premium: '24/7 dedicado', enterprise: 'Concierge' },
];

const faqItems = [
  { q: 'Posso trocar de plano depois?', a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento. No upgrade, você paga apenas a diferença proporcional.' },
  { q: 'Como funciona o cancelamento?', a: 'Você pode cancelar a qualquer momento pelo painel. Seus dados ficam disponíveis para exportação por 30 dias.' },
  { q: 'Preciso de cartão para o plano grátis?', a: 'Não. O plano Grátis não pede cartão de crédito. Basta criar sua conta e começar a usar.' },
  { q: 'Tem desconto no plano anual?', a: 'Sim! No plano anual você economiza 20% em relação ao valor mensal.' },
  { q: 'O que acontece se eu atingir o limite de obras?', a: 'Você recebe um aviso e pode fazer upgrade para o plano Pro a qualquer momento, sem perder dados.' },
  { q: 'Vocês emitem nota fiscal?', a: 'Sim. Emitimos nota fiscal para todos os planos pagos.' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Preco() {
  return (
    <PublicLayout>
      <SEO {...seoPages.preco} />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-16 bg-hero-gradient">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-orange-ghost text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <CreditCard className="w-3.5 h-3.5" /> Planos e preços
            </span>
            <h1 className="text-[clamp(1.75rem,5vw,3.75rem)] font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-4">
              Simples e{' '}
              <AnimatedGradient as="span">transparente</AnimatedGradient>
            </h1>
            <p className="text-[clamp(0.875rem,2.5vw,1.125rem)] text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Comece grátis, escale conforme suas obras crescem. Sem taxas escondidas, sem surpresas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plans Grid */}
      <AnimatedSection>
        <div className="container max-w-6xl mx-auto">
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {plans.map((plan, i) => {
              const Icon = i === 0 ? Zap : i === 1 ? Star : i === 2 ? Crown : Building2;
              const isEnterprise = i === plans.length - 1;
              return (
                <StaggerItem
                  key={i}
                  whileHover={{ y: -6 }}
                  className={`relative bg-white border-2 rounded-2xl p-5 md:p-6 flex flex-col transition-shadow duration-300 hover:shadow-xl ${
                    plan.popular
                      ? 'border-brand-orange shadow-lg shadow-brand-orange/10 lg:scale-[1.02]'
                      : plan.highlight
                        ? 'border-brand-orange-ghost shadow-md'
                        : 'border-neutral-100 shadow-sm'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Mais popular
                    </div>
                  )}
                  <div className="w-10 h-10 bg-brand-orange-ghost rounded-xl flex items-center justify-center mb-4">
                    <Icon className={`w-5 h-5 ${plan.popular ? 'text-brand-orange' : 'text-brand-orange'}`} />
                  </div>
                  <div className="text-sm font-semibold text-brand-orange mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl lg:text-4xl font-extrabold text-neutral-900">{plan.price}</span>
                    <span className="text-neutral-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-neutral-500 text-xs mb-5">{plan.desc}</p>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className="w-4 h-4 text-brand-emerald mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isEnterprise ? (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-neutral-200 hover:border-brand-orange hover:text-brand-orange rounded-full"
                      asChild
                    >
                      <Link to={plan.to}>{plan.cta} <ArrowRight className="ml-1 w-4 h-4 inline" /></Link>
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className={`w-full sm:w-auto rounded-full ${
                        plan.popular
                          ? 'bg-brand-orange hover:bg-brand-orange-hover shadow-lg shadow-brand-orange/25'
                          : 'border-neutral-200 hover:border-brand-orange hover:text-brand-orange'
                      }`}
                      asChild
                    >
                      <Link to={plan.to}>{plan.cta} <ArrowRight className="ml-1 w-4 h-4 inline" /></Link>
                    </Button>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </AnimatedSection>

      {/* Comparison Table */}
      <AnimatedSection className="bg-neutral-50" distance={20}>
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-3">
              <AnimatedGradient as="span">Compare os planos</AnimatedGradient>
            </h2>
            <p className="text-neutral-600">Veja qual plano atende melhor a sua operação.</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-500">Funcionalidade</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-neutral-500">Grátis</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-brand-orange bg-brand-orange-ghost">Pro</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-amber-700 bg-amber-50">Premium</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-neutral-500">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-neutral-800">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-sm text-neutral-600">{row.free}</td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-brand-orange bg-brand-orange-ghost/50">
                        {row.pro === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.pro}
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-amber-700 bg-amber-50/50">
                        {row.premium === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.premium}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-neutral-600">
                        {row.enterprise === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection>
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <span className="text-brand-orange font-semibold text-sm tracking-wide uppercase">Dúvidas</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-3">
              <AnimatedGradient as="span">Perguntas frequentes</AnimatedGradient>
            </h2>
          </div>

          <StaggerContainer staggerDelay={0.06} className="space-y-1">
            {faqItems.map((item, i) => (
              <StaggerItem key={i} className="border-b border-neutral-100 pb-4 md:pb-6">
                <h4 className="text-base md:text-lg font-semibold text-neutral-900 mb-1 md:mb-2">{item.q}</h4>
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed">{item.a}</p>
              </StaggerItem>
            ))}
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
            className="text-3xl md:text-4xl font-extrabold text-white mb-4"
          >
            E aí, qual plano faz sentido pra você?
          </motion.h2>
          <motion.p
            variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-neutral-400 mb-8"
          >
            Comece grátis agora. Sem compromisso, sem cartão de crédito.
          </motion.p>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Button className="bg-brand-orange hover:bg-brand-orange-hover text-white text-lg px-10 py-7 rounded-full shadow-xl shadow-brand-orange/30" asChild>
              <Link to="/criar-conta">Comece grátis <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
