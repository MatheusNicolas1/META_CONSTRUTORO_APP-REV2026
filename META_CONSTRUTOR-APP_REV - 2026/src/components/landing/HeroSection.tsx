import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import dashboardPreview from '@/assets/dashboard-preview.jpg';

const HeroSection = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-accent/5 via-transparent to-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Sistema de Gestão Completo
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Gerencie suas{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                obras
              </span>{' '}
              com inteligência
            </h1>

            <p className="text-lg text-muted-foreground mb-4 max-w-xl lg:max-w-none">
              Plataforma completa para controle de obras, RDO digital, gestão de equipes,
              checklists e relatórios. Simplifique sua gestão e aumente a produtividade.
            </p>

            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-medium mb-8">
              <span className="text-lg">🎉</span>
              <span><strong>100% Gratuito</strong> - Comece com 7 Créditos RDO</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-border hover:bg-muted"
              >
                <Play className="mr-2 h-4 w-4" />
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Obras Gerenciadas</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-foreground">1200+</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-foreground">99%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-background/95 backdrop-blur-sm">
              {/* Browser preview header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-background rounded px-3 flex items-center text-xs text-muted-foreground">
                    metaconstrutor.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Image */}
              <div className="aspect-[16/10] relative overflow-hidden">
                <img
                  src={dashboardPreview}
                  alt="Preview do Dashboard Meta Construtor"
                  className="w-full h-full object-cover"
                />

                {/* Overlay with hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer flex items-center justify-center">
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-primary/90 hover:bg-primary backdrop-blur-sm"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Explorar Interface
                  </Button>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;