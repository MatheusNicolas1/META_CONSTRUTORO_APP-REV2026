import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from "@/components/SEO";
import LandingNavigation from '@/components/landing/LandingNavigation';
import { Pricing } from '@/components/ui/pricing';
import FooterSection from '@/components/landing/FooterSection';
import { usePlans } from '@/hooks/usePlans';
import { Skeleton } from '@/components/ui/skeleton';
import { PricingHero } from '@/components/pricing/PricingHero';
import { FaqSection } from '@/components/pricing/FaqSection';
import { motion } from 'framer-motion';

const Preco = () => {
  const { data: plans, isLoading } = usePlans();
  const navigate = useNavigate();

  // Transform database plans to UI pricing component format
  const pricingPlans = plans
    ? [...plans]
      .sort((a, b) => {
        const priority: Record<string, number> = {
          'free': 1,
          'gratuito': 1,
          'basic': 2,
          'basico': 2,
          'professional': 3,
          'profissional': 3,
          'master': 4,
          'business': 5
        };
        const priorityA = priority[a.slug.toLowerCase()] || 99;
        const priorityB = priority[b.slug.toLowerCase()] || 99;
        return priorityA - priorityB;
      })
      .map(plan => {
        const isFree = plan.monthly_price_cents === 0 || plan.slug === 'gratuito';
        const isBusiness = plan.slug === 'business';

        const monthlyPriceValue = (plan.monthly_price_cents || 0) / 100;

        // Cálculo do valor mensal com desconto de 20% para exibição no modo anual
        // Se o banco já tiver o valor anual, usamos ele dividido por 12, caso contrário calculamos na hora
        const yearlyPriceValue = plan.yearly_price_cents
          ? (plan.yearly_price_cents / 12 / 100)
          : (monthlyPriceValue * 0.8);

        return {
          name: plan.name.toUpperCase(),
          price: isBusiness ? "Sob consulta" : monthlyPriceValue,
          yearlyPrice: isBusiness ? "Sob consulta" : yearlyPriceValue,
          period: isBusiness ? "" : "mês",
          features: plan.features,
          description: plan.description || "Para pequenas equipes",
          buttonText: isBusiness ? "Falar com vendas" : (isFree ? "Começar Agora" : "Assinar Agora"),
          href: (isBusiness || isFree) ? (isBusiness ? "/contato" : "/login") : `/checkout?plan=${plan.slug}`,
          isPopular: plan.slug === 'profissional',
        };
      })
    : [];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10">
      <SEO
        title="Planos e Preços | Meta Construtor"
        description="Escolha o plano ideal para sua construtora. Comece gratuitamente e escale conforme seu crescimento."
        canonical="https://metaconstrutor.com.br/preco"
      />

      <LandingNavigation />

      <main>
        <PricingHero />

        <section id="pricing" className="py-12 md:py-24 relative bg-background">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

          {isLoading ? (
            <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 pt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-[600px] w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Pricing
                plans={pricingPlans}
              // Title and description removed here as they are covered by Hero, but we can keep them subtle if needed
              />
            </motion.div>
          )}
        </section>

        <FaqSection />
      </main>

      <FooterSection />
    </div>
  );
};

export default Preco;