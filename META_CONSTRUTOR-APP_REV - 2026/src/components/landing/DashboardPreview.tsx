import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import { Play, ArrowRight, Building2, Users, ClipboardList, BarChart3 } from 'lucide-react';
import dashboardPreview from '@/assets/dashboard-preview.jpg';

const DashboardPreview = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();

  const features = [
    {
      icon: Building2,
      title: "Gestão Completa de Obras",
      description: "Controle total do ciclo de vida das suas obras"
    },
    {
      icon: ClipboardList,
      title: "RDO Digital Avançado",
      description: "Relatórios diários digitais com assinatura eletrônica"
    },
    {
      icon: Users,
      title: "Controle de Equipes",
      description: "Gerencie equipes, horários e produtividade"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Analytics avançados para tomada de decisões"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Veja como funciona na prática
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa e intuitiva que revoluciona a gestão de obras.
            Explore o dashboard e descubra todas as funcionalidades.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left - Dashboard Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">

              {/* Browser preview header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-background rounded px-3 flex items-center text-xs text-muted-foreground">
                    app.metaconstrutor.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Image */}
              <div className="aspect-[16/10] relative overflow-hidden bg-background">
                <img
                  src={dashboardPreview}
                  alt="Dashboard do Meta Construtor - Interface completa de gestão de obras"
                  className="w-full h-full object-cover"
                />

                {/* Interactive overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer flex items-center justify-center group">
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 transform scale-95 group-hover:scale-100 transition-transform duration-300">
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Explorar Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000" />
          </div>

          {/* Right - Features */}
          <div className="order-1 lg:order-2">
            <div className="space-y-8">

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  Tudo que você precisa em um só lugar
                </h3>
                <p className="text-muted-foreground">
                  Nossa plataforma integra todas as ferramentas essenciais para uma gestão
                  eficiente de obras, desde o planejamento até a entrega final.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/institucional')}
                    className="border-border hover:bg-muted"
                  >
                    Ver Planos e Preços
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;