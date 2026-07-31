import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Star, Zap, Shield, HelpCircle, ArrowRight, BarChart3, Users, FileText, HardHat, ClipboardCheck } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';

// ─── Variants ───────────────────────────────────────────
const cinematic = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Dados ──────────────────────────────────────────────
const PLANS = {
  monthly: [
    {
      name: 'Grátis', price: 'R$ 0',
      desc: 'Perfeito para testar o app e gerenciar sua primeira obra.',
      features: ['1 obra ativa', '1 usuário', '7 RDOs/mês', 'Checklists simples', 'Suporte por e-mail'],
      cta: 'Comece Grátis', popular: false,
      image: '/marketing/prd-prints-2026-06-04-05-rdo-lista-desktop.webp',
    },
    {
      name: 'Profissional', price: 'R$ 79',
      desc: 'Para construtoras que precisam de gestão completa.',
      features: ['Obras ilimitadas', 'Usuários ilimitados', 'RDO digital completo', 'Checklists inteligentes', 'Relatórios automáticos', 'Dashboard financeiro', 'Suporte prioritário'],
      cta: 'Assinar Agora', popular: true,
      image: '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp',
    },
    {
      name: 'Enterprise', price: 'R$ 299',
      desc: 'Para empresas com necessidades específicas e alto volume.',
      features: ['Tudo do Profissional', 'Integrações ERP', 'Portal do Cliente', 'API dedicada', 'SLA 99.9%', 'Gerente de contas', 'Treinamento da equipe', 'Customizações'],
      cta: 'Falar com Vendas', popular: false,
      image: '/marketing/prd-prints-2026-06-04-13-integracoes-status-desktop.webp',
    },
  ],
  yearly: [
    {
      name: 'Grátis', price: 'R$ 0',
      desc: 'Perfeito para testar o app e gerenciar sua primeira obra.',
      features: ['1 obra ativa', '1 usuário', '7 RDOs/mês', 'Checklists simples', 'Suporte por e-mail'],
      cta: 'Comece Grátis', popular: false,
      image: '/marketing/prd-prints-2026-06-04-05-rdo-lista-desktop.webp',
    },
    {
      name: 'Profissional', price: 'R$ 63',
      desc: 'Para construtoras que precisam de gestão completa.',
      features: ['Obras ilimitadas', 'Usuários ilimitados', 'RDO digital completo', 'Checklists inteligentes', 'Relatórios automáticos', 'Dashboard financeiro', 'Suporte prioritário'],
      cta: 'Assinar Agora', popular: true,
      image: '/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp',
    },
    {
      name: 'Enterprise', price: 'R$ 239',
      desc: 'Para empresas com necessidades específicas e alto volume.',
      features: ['Tudo do Profissional', 'Integrações ERP', 'Portal do Cliente', 'API dedicada', 'SLA 99.9%', 'Gerente de contas', 'Treinamento da equipe', 'Customizações'],
      cta: 'Falar com Vendas', popular: false,
      image: '/marketing/prd-prints-2026-06-04-13-integracoes-status-desktop.webp',
    },
  ],
};

const COMPARISON_ROWS = [
  { feature: 'Obras Ativas', free: '1', pro: 'Ilimitadas', enter: 'Ilimitadas' },
  { feature: 'Usuários', free: '1', pro: 'Ilimitados', enter: 'Ilimitados' },
  { feature: 'RDO Digital', free: 'Básico', pro: 'Completo', enter: 'Completo' },
  { feature: 'Checklists', free: 'Simples', pro: 'Inteligentes', enter: 'Inteligentes' },
  { feature: 'Relatórios', free: '—', pro: 'Automáticos', enter: 'Automáticos' },
  { feature: 'Dashboard Financeiro', free: '—', pro: '✓', enter: '✓' },
  { feature: 'Portal do Cliente', free: '—', pro: '—', enter: '✓' },
  { feature: 'Integrações ERP', free: '—', pro: '—', enter: '✓' },
  { feature: 'API Dedicada', free: '—', pro: '—', enter: '✓' },
  { feature: 'Suporte', free: 'E-mail', pro: 'Prioritário', enter: 'Gerente Dedicado' },
  { feature: 'SLA', free: '—', pro: '99.5%', enter: '99.9%' },
];

const FAQ_ITEMS = [
  { q: 'Posso mudar de plano depois?', a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor é proporcional ao período já utilizado.' },
  { q: 'Como funciona o cancelamento?', a: 'Cancele quando quiser, sem multa. Seu acesso continua até o fim do período já pago.' },
  { q: 'Quais formas de pagamento?', a: 'Aceitamos cartão de crédito (Visa, Mastercard, Elo), boleto bancário e PIX.' },
  { q: 'Tem período de teste no plano Profissional?', a: 'Sim! São 7 dias grátis no plano Profissional. Sem compromisso.' },
];

// ─── Pricing Card ───────────────────────────────────────
function PricingCard({ plan, index }: { plan: typeof PLANS.monthly[0]; index: number }) {
  return (
    <motion.div variants={staggerItem}
      className={`relative rounded-2xl overflow-hidden ${
        plan.popular
          ? 'bg-gradient-to-b from-brand-blue to-[#0f1f35] text-white border-2 border-brand-orange shadow-2xl shadow-brand-orange/20 scale-105 lg:scale-105'
          : 'bg-white text-brand-blue border border-neutral-200 shadow-sm hover:shadow-xl'
      } transition-all duration-300`}
    >
      {/* Plan image */}
      <div className="h-32 overflow-hidden">
        <motion.img
          src={plan.image} alt={plan.name}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-cover opacity-40"
        />
        {plan.popular && (
          <div className="absolute top-3 inset-x-3 flex justify-center">
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-[#dc4415] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            >
              <Star className="w-3 h-3" /> Mais Popular
            </motion.div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className={`text-xl font-bold font-heading mb-1 ${plan.popular ? 'text-white' : 'text-brand-blue'}`}>
          {plan.name}
        </h3>
        <p className={`text-sm mb-4 ${plan.popular ? 'text-blue-200' : 'text-neutral-500'}`}>{plan.desc}</p>

        <div className="mb-5">
          <span className={`text-4xl font-extrabold font-heading ${plan.popular ? 'text-white' : 'text-brand-blue'}`}>
            {plan.price}
          </span>
          <span className={`text-sm ml-1 ${plan.popular ? 'text-blue-200' : 'text-neutral-400'}`}>/mês</span>
        </div>

        <Button className={`w-full mb-5 py-5 rounded-xl font-semibold ${
          plan.popular
            ? 'bg-[#dc4415] hover:bg-[#c43a10] text-white shadow-lg shadow-[#dc4415]/30'
            : 'bg-brand-blue hover:bg-blue-800 text-white'
        }`}>
          {plan.cta} {plan.cta !== 'Comece Grátis' && <ArrowRight className="ml-2 w-4 h-4" />}
        </Button>

        <ul className="space-y-2.5">
          {plan.features.map((feat) => (
            <li key={feat} className={`flex items-start gap-3 text-sm ${plan.popular ? 'text-blue-100' : 'text-neutral-600'}`}>
              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-brand-orange' : 'text-emerald-500'}`} />
              {feat}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function ToggleSwitch({ isYearly, onChange }: { isYearly: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span className={`text-sm font-medium ${!isYearly ? 'text-brand-blue' : 'text-neutral-400'}`}>Mensal</span>
      <button onClick={onChange}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? 'bg-[#dc4415]' : 'bg-neutral-300'}`}
      >
        <motion.div animate={{ x: isYearly ? 28 : 2 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
      <span className={`text-sm font-medium ${isYearly ? 'text-brand-blue' : 'text-neutral-400'}`}>
        Anual
        {isYearly && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="ml-2 inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full"
          >Economize 20%</motion.span>
        )}
      </span>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function Preco2() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const plans = isYearly ? PLANS.yearly : PLANS.monthly;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.preco2} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-blue via-[#162d4e] to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.15)_0%,_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-orange-400 text-sm font-semibold mb-4 border border-brand-orange/30">
              Planos e Preços
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 font-heading">
              Planos que cabem{' '}
              <span className="text-orange-400">
                na sua obra
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto">
              Do profissional autônomo à grande construtora — temos o plano ideal para você
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 -mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ToggleSwitch isYearly={isYearly} onChange={() => setIsYearly(!isYearly)} />
          <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <PricingCard key={`${plan.name}-${isYearly}`} plan={plan} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-blue font-heading">
              Veja o que você leva em cada plano
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {['/marketing/prd-prints-2026-06-04-28-dashboard-resumo-final-desktop.webp',
              '/marketing/prd-prints-2026-06-04-15-rdo-visualizacao-desktop.webp',
              '/marketing/prd-prints-2026-06-04-12-relatorios-resumo-desktop.webp'].map((src, i) => (
              <motion.img key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                src={src} alt={`Print plano ${i + 1}`}
                className="rounded-xl shadow-lg border border-neutral-200"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4 font-heading">
              Compare os <span className="text-brand-blue">planos</span>
            </h2>
          </motion.div>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-blue text-white">
                  <th className="text-left px-6 py-4 font-semibold">Funcionalidade</th>
                  <th className="text-center px-6 py-4 font-semibold">Grátis</th>
                  <th className="text-center px-6 py-4 font-semibold bg-[#dc4415]">Profissional</th>
                  <th className="text-center px-6 py-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <motion.tr key={row.feature}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className={`border-t border-neutral-100 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}
                  >
                    <td className="px-6 py-4 font-medium text-brand-blue">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-neutral-500">{row.free}</td>
                    <td className="px-6 py-4 text-center text-brand-blue font-medium bg-orange-50/50">{row.pro}</td>
                    <td className="px-6 py-4 text-center text-neutral-500">{row.enter}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...cinematic} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-blue text-sm font-semibold mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue font-heading">
              Dúvidas sobre <span className="text-brand-blue">planos</span>?
            </h2>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-brand-blue">{item.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-brand-blue flex-shrink-0" />
                  </motion.div>
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-6 pb-4 text-neutral-500 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 bg-gradient-to-br from-[#dc4415] via-brand-blue to-brand-blue text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2LjUgMzUuNWMtNC4xNDEgMC03LjUtMy4zNTktNy41LTcuNSAwLTQuMTQxIDMuMzU5LTcuNSA3LjUtNy41IDQuMTQxIDAgNy41IDMuMzU5IDcuNSA3LjUgMCA0LjE0MS0zLjM1OSA3LjUtNy41IDcuNXoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-heading">Ainda com dúvidas?</h2>
            <p className="text-lg text-orange-100/80 mb-8">Fale com nossa equipe e descubra qual plano é ideal para sua construtora</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-brand-blue hover:bg-orange-50 px-8 py-6 text-lg rounded-xl font-bold shadow-xl">
                <Zap className="mr-2 w-5 h-5" /> Falar no WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                Enviar E-mail
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
