import React from 'react';
import SEO from "@/components/SEO";
import LandingNavigation from '@/components/landing/LandingNavigation';
import { HeroSectionNew } from '@/components/landing/HeroSectionNew';
import IntegrationsBanner from '@/components/landing/IntegrationsBanner';
import ModernFeaturesSection from '@/components/landing/ModernFeaturesSection';
import StatsSection from '@/components/landing/StatsSection';
import VideoDemo from '@/components/landing/VideoDemo';
import CaseStudies from '@/components/landing/CaseStudies';
import EnhancedTestimonials from '@/components/landing/EnhancedTestimonials';
import BenefitsSection from '@/components/landing/BenefitsSection';
import FAQSection from '@/components/landing/FAQSection';
import FooterSection from '@/components/landing/FooterSection';

const Home = () => {
  return (
    <>
      <SEO
        title="MetaConstrutor - Gestão Inteligente de Obras | Plataforma Completa"
        description="Plataforma completa para gestão de obras, RDO digital, controle de equipes e relatórios inteligentes. Aumente sua produtividade em até 40% e reduza retrabalhos."
        canonical="https://metaconstrutor.com.br/home"
      />

      <LandingNavigation />

      <div className="min-h-screen bg-background w-full">
        <section className="p-0">
          <HeroSectionNew />
        </section>

        <IntegrationsBanner />

        <section className="py-8 md:py-12">
          <ModernFeaturesSection />
        </section>

        <StatsSection />

        <section className="py-8 md:py-12">
          <VideoDemo />
        </section>

        <section className="py-8 md:py-12">
          <CaseStudies />
        </section>

        <section className="py-8 md:py-12">
          <EnhancedTestimonials />
        </section>

        <section className="py-8 md:py-12">
          <BenefitsSection />
        </section>

        <section className="py-8 md:py-12">
          <FAQSection />
        </section>

        <FooterSection />
      </div>
    </>
  );
};

export default Home;
