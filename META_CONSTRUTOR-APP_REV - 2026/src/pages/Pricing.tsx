
import { PricingFlow } from "@/components/pricing/PricingFlow";
import { PricingHero } from "@/components/pricing/PricingHero";
import { FaqSection } from "@/components/pricing/FaqSection";
import SEO from "@/components/SEO";
import LandingNavigation from "@/components/landing/LandingNavigation";

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Planos e Preços | Meta Construtor"
                description="Escolha o melhor plano para sua construtora. Soluções escaláveis para gestão de obras."
                canonical={window.location.href}
            />
            <LandingNavigation />

            <PricingHero />

            <div className="container mx-auto py-16 px-4 md:px-6 max-w-7xl">
                <PricingFlow showHeader={false} />
            </div>

            <FaqSection />
        </div>
    );
};

export default PricingPage;
