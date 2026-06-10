import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Star, CreditCard, Building2, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/public/PublicLayout';
import { AnimatedSection } from '@/components/public/AnimatedSection';
import { AnimatedGradient } from '@/components/public/AnimatedGradient';
import { StaggerContainer, StaggerItem } from '@/components/public/StaggerContainer';
import EnterpriseContactModal from '@/components/EnterpriseContactModal';
import { cn } from '@/lib/utils';

const ANNUAL_DISCOUNT = 0.20;

interface PlanCard {
  name: string;
  priceMonthly: number;  // em centavos (ex: 12990)
  priceYearly: number;   // em centavos (ex: 103920)
  desc: string;
  features: string[];
  cta: string;
  to: string;
  popular: boolean;
  highlight: boolean;
  priceId: string | null;
  slug: string | null;
}

const plans: PlanCard[] = [
  {
    name: 'Grátis',
    priceMonthly: 0,
    priceYearly: 0,
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
    priceId: null,
    slug: null,
  },
  {
    name: 'Básico',
    priceMonthly: 12990,
    priceYearly: 103920,
    desc: 'Perfeito para pequenas construtoras.',
    features: [
      'Até 3 usuários',
      'Armazenamento ilimitado',
      'RDO digital completo',
      'Relatórios básicos',
      'Suporte por email',
      'Backup automático',
    ],
    cta: 'Assinar Básico',
    to: '/checkout?plan=basic',
    popular: false,
    highlight: false,
    priceId: 'price_1Spd6ICHfNdO9jxNRYj10lkA',
    slug: 'basic',
  },
  {
    name: 'Profissional',
    priceMonthly: 19990,
    priceYearly: 159920,
    desc: 'Ideal para construtoras em crescimento.',
    features: [
      'Até 5 usuários',
      'Obras ilimitadas',
      'Relatórios avançados',
      'Integrações WhatsApp',
      'Suporte via chat 24h',
      'Dashboard avançado',
      'Controle de estoque',
    ],
    cta: 'Assinar Profissional',
    to: '/checkout?plan=professional',
    popular: true,
    highlight: true,
    priceId: 'price_1T1HSsCHfNdO9jxNDtPicSaZ',
    slug: 'professional',
  },
  {
    name: 'Master',
    priceMonthly: 34700,
    priceYearly: 333120,
    desc: 'Para construtoras estabelecidas.',
    features: [
      'Até 15 usuários',
      'Obras ilimitadas',
      'Todas as funcionalidades do Profissional',
      'API personalizada',
      'Integração com ERP',
      'Suporte prioritário (SLA 8h)',
      'Treinamento dedicado',
    ],
    cta: 'Assinar Master',
    to: '/checkout?plan=master',
    popular: false,
    highlight: true,
    priceId: 'price_1TfSRPCHfNdO9jxNA6dpVV7D',
    slug: 'master',
  },
  {
    name: 'Enterprise',
    priceMonthly: 0,
    priceYearly: 0,
    desc: 'Para grandes operações com necessidades específicas.',
    features: [
      'Tudo do plano Master',
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
    priceId: null,
    slug: null,
  },
];

const comparisons = [
  { feature: 'Obras ativas', free: '1', basico: '3', profissional: 'Ilimitadas', master: 'Ilimitadas', enterprise: 'Ilimitadas' },
  { feature: 'Usuários', free: '5', basico: 'Até 3', profissional: 'Até 5', master: 'Até 15', enterprise: 'Ilimitados' },
  { feature: 'Armazenamento', free: 'Limitado', basico: 'Ilimitado', profissional: 'Ilimitado', master: 'Ilimitado', enterprise: 'Ilimitado' },
  { feature: 'RDOs', free: 'Ilimitados', basico: '✓', profissional: '✓', master: '✓', enterprise: '✓' },
  { feature: 'Relatórios', free: '—', basico: 'Básicos', profissional: 'Avançados', master: 'Avançados', enterprise: 'Customizados' },
  { feature: 'WhatsApp', free: '—', basico: '—', profissional: '✓', master: '✓', enterprise: '✓' },
  { feature: 'API + Webhooks', free: '—', basico: '—', profissional: '—', master: '✓', enterprise: '✓' },
  { feature: 'ERP / SAP', free: '—', basico: '—', profissional: '—', master: '✓', enterprise: '✓' },
  { feature: 'Controle de estoque', free: '—', basico: '—', profissional: '✓', master: '✓', enterprise: '✓' },
  { feature: 'Suporte', free: 'Email', basico: 'Email', profissional: 'Chat 24h', master: 'Prioritário (SLA 8h)', enterprise: 'Concierge' },
];

const faqItems = [
  { q: 'Posso trocar de plano depois?', a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento. No upgrade, você paga apenas a diferença proporcional.' },
  { q: 'Como funciona o cancelamento?', a: 'Você pode cancelar a qualquer momento pelo painel. Seus dados ficam disponíveis para exportação por 30 dias.' },
  { q: 'Preciso de cartão para o plano grátis?', a: 'Não. O plano Grátis não pede cartão de crédito. Basta criar sua conta e começar a usar.' },
  { q: 'Tem desconto no plano anual?', a: 'Sim! No plano anual você economiza 20% em relação ao valor mensal. Por exemplo, o plano Master sai de R$ 347,00/mês para R$ 277,60/mês — uma economia de R$ 832,80 por ano.' },
  { q: 'Qual a diferença entre Profissional e Master?', a: 'O Master inclui tudo do Profissional, mais API personalizada, integração com ERP, suporte prioritário (SLA 8h) e treinamento dedicado.' },
  { q: 'O que acontece se eu atingir o limite de obras?', a: 'Você recebe um aviso e pode fazer upgrade para o plano superior a qualquer momento, sem perder dados.' },
  { q: 'Vocês emitem nota fiscal?', a: 'Sim. Emitimos nota fiscal para todos os planos pagos.' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Preco() {
  const [isYearly, setIsYearly] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

  const fireConfetti = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors: ['#FF6B35', '#FFB347', '#34D399', '#60A5FA'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors: ['#FF6B35', '#FFB347', '#34D399', '#60A5FA'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleToggleYearly = useCallback(() => {
    const next = !isYearly;
    setIsYearly(next);
    if (next) {
      setTimeout(fireConfetti, 100);
    }
  }, [isYearly, fireConfetti]);

  const getDisplayPrice = (plan: PlanCard) => {
    if (plan.priceMonthly === 0) return null;
    if (isYearly && plan.priceYearly > 0) return plan.priceYearly / 12;
    return plan.priceMonthly;
  };

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
            <p className="text-[clamp(0.875rem,2.5vw,1.125rem)] text-neutral-600 max-w-lg mx-auto leading-relaxed mb-8">
              Comece grátis, escale conforme suas obras crescem. Sem taxas escondidas, sem surpresas.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Mensal
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isYearly}
                onClick={handleToggleYearly}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                  isYearly ? 'bg-brand-orange' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Anual
              </span>
              {isYearly && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs font-bold text-brand-emerald bg-brand-emerald/10 px-2.5 py-0.5 rounded-full"
                >
                  −20%
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans Grid — estilo consistente com PlanCarousel do app */}
      <AnimatedSection>
        <div className="container max-w-6xl mx-auto">
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-4">
            {plans.map((plan, i) => {
              const displayPrice = getDisplayPrice(plan);
              const isFree = plan.priceMonthly === 0 && plan.slug === null && plan.name === 'Grátis';
              const isEnterprise = plan.name === 'Enterprise';
              const showYearlyDetails = isYearly && !isFree && !isEnterprise;
              const Icon = i === 0 ? Zap : i === 1 ? Star : i === 2 ? Crown : i === 3 ? Shield : Building2;
              const isPopular = plan.popular;

              return (
                <StaggerItem
                  key={i}
                  whileHover={{ y: -6 }}
                >
                  <div
                    className={cn(
                      "flex flex-col h-full relative border-2 rounded-2xl p-5 md:p-6 transition-all duration-300 bg-white",
                      isPopular
                        ? "border-brand-orange shadow-xl shadow-brand-orange/10 lg:scale-[1.02] z-10"
                        : plan.highlight && !isPopular
                          ? "border-neutral-200 shadow-md"
                          : "border-neutral-100 shadow-sm hover:border-brand-orange/50"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 whitespace-nowrap z-20 shadow-md">
                        <Star className="w-3 h-3 fill-current" /> Mais popular
                      </div>
                    )}

                    {/* Icon */}
                    <div className="w-10 h-10 bg-brand-orange-ghost rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-orange" />
                    </div>

                    {/* Name + Price — estilo PlanCarousel */}
                    <div className="text-sm font-semibold text-brand-orange mb-1">{plan.name}</div>

                    {isFree ? (
                      <div className="flex min-h-[48px] items-center mt-2">
                        <span className="text-2xl sm:text-3xl font-bold text-neutral-900">Grátis</span>
                      </div>
                    ) : isEnterprise ? (
                      <div className="flex min-h-[48px] items-center mt-2">
                        <span className="text-2xl sm:text-3xl font-bold text-neutral-900">Sob consulta</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1 mt-2 flex-wrap">
                          <span className="text-sm text-neutral-500">R$</span>
                          <span className="text-3xl sm:text-4xl font-bold text-neutral-900">
                            {formatPrice(displayPrice!)}
                          </span>
                          <span className="text-sm text-neutral-500 font-medium">/mês</span>
                        </div>
                        {showYearlyDetails && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-xs text-green-600 font-medium">
                              Economize 20% com o plano anual
                            </div>
                            <div className="text-xs text-neutral-500">
                              {(plan.priceYearly / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/ano
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <p className="text-neutral-500 text-xs mb-5 mt-2">{plan.desc}</p>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-neutral-700">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isEnterprise ? (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto border-neutral-200 hover:border-brand-orange hover:text-brand-orange rounded-full"
                        onClick={() => setEnterpriseModalOpen(true)}
                      >
                        {plan.cta} <ArrowRight className="ml-1 w-4 h-4 inline" />
                      </Button>
                    ) : (
                      <Button
                        variant={isPopular ? 'default' : 'default'}
                        className={cn(
                          "w-full sm:w-auto rounded-full",
                          isPopular
                            ? 'bg-brand-orange hover:bg-brand-orange-hover shadow-lg shadow-brand-orange/25'
                            : plan.highlight && !isPopular
                              ? 'bg-neutral-900 hover:bg-neutral-800 shadow-md text-white'
                              : 'bg-brand-orange hover:bg-brand-orange-hover shadow-lg shadow-brand-orange/25'
                        )}
                        asChild
                      >
                        <Link to={plan.to}>
                          {plan.cta} <ArrowRight className="ml-1 w-4 h-4 inline" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </AnimatedSection>

      {/* Comparison Table */}
      <AnimatedSection className="bg-neutral-50" distance={20}>
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-3">
              <AnimatedGradient as="span">Compare os planos</AnimatedGradient>
            </h2>
            <p className="text-neutral-600">Veja qual plano atende melhor a sua operação.</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-neutral-500">Funcionalidade</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-neutral-500">Grátis</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-brand-orange bg-brand-orange-ghost/50">Básico</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-amber-700 bg-amber-50/50">Profissional</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-purple-700 bg-purple-50/50">Master</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-neutral-500">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-neutral-800">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-sm text-neutral-600">{row.free}</td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-brand-orange bg-brand-orange-ghost/30">
                        {row.basico === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.basico}
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-amber-700 bg-amber-50/30">
                        {row.profissional === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.profissional}
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-purple-700 bg-purple-50/30">
                        {row.master === '✓' ? <Check className="w-4 h-4 mx-auto text-brand-emerald" /> : row.master}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-neutral-600">
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
      <EnterpriseContactModal open={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} />
    </PublicLayout>
  );
}
