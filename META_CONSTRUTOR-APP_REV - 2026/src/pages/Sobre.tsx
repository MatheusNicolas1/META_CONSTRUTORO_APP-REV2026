import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from "@/components/SEO";
import LandingNavigation from '@/components/landing/LandingNavigation';
import FooterSection from '@/components/landing/FooterSection';

const TimelineSection = lazy(() => import('@/components/sobre/TimelineSection'));
const TeamSection = lazy(() => import('@/components/sobre/TeamSection'));
const InstitutionalTestimonials = lazy(() => import('@/components/sobre/InstitutionalTestimonials'));
const ImpactMetrics = lazy(() => import('@/components/sobre/ImpactMetrics'));
import {
  Target,
  Eye,
  Heart,
  Shield,
  Headphones,
  Award,
  Zap,
  MapPin,
  Leaf,
  Lock
} from 'lucide-react';

const Sobre = () => {
  const navigate = useNavigate();
  const missionValues = [
    {
      icon: Target,
      title: 'Missão',
      description: 'Empoderar construtoras e engenheiros com tecnologia acessível e intuitiva.'
    },
    {
      icon: Eye,
      title: 'Visão',
      description: 'Ser a plataforma de gestão de obras mais confiável e utilizada na América Latina até 2030.'
    },
    {
      icon: Heart,
      title: 'Valores',
      description: 'Transparência, Inovação, Simplicidade, Foco no Cliente, Segurança.'
    }
  ];

  const differentials = [
    {
      icon: MapPin,
      title: 'Plataforma 100% brasileira',
      description: 'Desenvolvida especialmente para o mercado nacional, adaptada às normas e necessidades locais.'
    },
    {
      icon: Headphones,
      title: 'Suporte humanizado 24/7',
      description: 'Equipe especializada disponível para ajudar você a qualquer momento, todos os dias.'
    },
    {
      icon: Shield,
      title: 'Segurança de dados garantida',
      description: 'Criptografia de nível empresarial, backups automáticos e conformidade com LGPD.'
    },
    {
      icon: Zap,
      title: 'Integrações nativas',
      description: 'Conecte-se facilmente às ferramentas que você já usa no dia a dia da sua empresa.'
    }
  ];

  const commitments = [
    {
      icon: Lock,
      title: 'Conformidade LGPD',
      description: 'Total adequação à Lei Geral de Proteção de Dados, garantindo privacidade e segurança.'
    },
    {
      icon: Shield,
      title: 'Segurança de dados',
      description: 'Infraestrutura robusta com criptografia, backups e monitoramento 24/7.'
    },
    {
      icon: Leaf,
      title: 'Sustentabilidade',
      description: 'Redução significativa no uso de papel e impressões, contribuindo para um planeta mais verde.'
    }
  ];

  return (
    <>
      <SEO
        title="Sobre Nós - Meta Construtor | Transformando a Gestão de Obras no Brasil"
        description="Conheça a história, missão e valores do Meta Construtor. Descubra como revolucionamos a gestão de obras com tecnologia 100% brasileira."
        canonical="https://metaconstrutor.com.br/sobre"
      />

      <div className="min-h-screen bg-background">
        <LandingNavigation />

        <main className="pt-16 md:pt-20 w-full">
          {/* Hero Section */}
          <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/5 relative overflow-hidden w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                    Transformando a gestão de obras
                    <span className="text-primary"> no Brasil</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                    Simplificamos processos, reduzimos retrabalho e damos mais previsibilidade
                    às construtoras através de tecnologia intuitiva e acessível.
                  </p>
                  <button
                    onClick={() => navigate('/contato')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Fale com a nossa equipe
                  </button>
                </div>

                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                    <img
                      src="/lovable-uploads/5557c860-388b-4ad5-bde2-5718350a8197.png"
                      alt="MetaConstrutor - Dashboard de gestão de obras digitalizado"
                      className="w-full h-auto object-cover animate-fade-in"
                    />
                  </div>
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-pulse delay-1000" />
                </div>
              </div>
            </div>
          </section>

          {/* Mission, Vision, Values */}
          <section className="py-12 md:py-16 lg:py-20 bg-muted/30 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Missão, Visão e Valores
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Os pilares que guiam nossa jornada de transformação no setor da construção civil.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {missionValues.map((value, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 text-center group"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                      <value.icon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground mb-4">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline History */}
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Carregando...</div>}>
            <TimelineSection />
          </Suspense>

          {/* Team Section */}
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Carregando...</div>}>
            <TeamSection />
          </Suspense>

          {/* Differentials */}
          <section className="py-12 md:py-16 lg:py-20 bg-muted/30 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Diferenciais do MetaConstrutor
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  O que nos torna únicos no mercado de gestão de obras.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {differentials.map((differential, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 text-center group"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <differential.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {differential.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {differential.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Impact Metrics */}
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Carregando...</div>}>
            <ImpactMetrics />
          </Suspense>

          {/* Institutional Testimonials */}
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Carregando...</div>}>
            <InstitutionalTestimonials />
          </Suspense>

          {/* Commitment and Responsibility */}
          <section className="py-12 md:py-16 lg:py-20 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Compromisso e Responsabilidade
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Nosso compromisso vai além da tecnologia, abraçando responsabilidade social e sustentabilidade.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {commitments.map((commitment, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl p-8 border border-border hover:shadow-lg transition-all duration-300 text-center"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <commitment.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      {commitment.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {commitment.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Final */}
          <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-background w-full">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Pronto para conhecer o MetaConstrutor?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Junte-se às centenas de construtoras que já transformaram sua gestão de obras.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Começar Gratuitamente
                </button>
                <button
                  onClick={() => navigate('/contato')}
                  className="border border-border hover:bg-muted text-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
                >
                  Agendar uma demonstração
                </button>
              </div>
            </div>
          </section>
        </main>

        <FooterSection />
      </div>
    </>
  );
};

export default Sobre;