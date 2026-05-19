import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CheckSquare, 
  Calendar, 
  Users, 
  Wrench, 
  BarChart3, 
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import { FeatureExpandableCard } from '@/components/ui/feature-expandable-card';

const FeaturesSection = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();
  // Force rebuild to clear cache

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Gestão de Obras',
      description: 'Acompanhe prazos e progresso em tempo real para nunca perder o controle',
      href: '/login',
      benefits: [
        { title: 'Controle total de cronograma', completed: true },
        { title: 'Alertas automáticos de atrasos', completed: true },
        { title: 'Dashboard visual intuitivo', completed: true },
      ],
      stats: {
        improvement: 40,
        users: '350+',
        satisfaction: 95,
      },
      testimonial: {
        name: 'Carlos Silva',
        role: 'Gerente de Obras',
        quote: 'Reduziu nossos atrasos em 60% no primeiro mês de uso',
      }
    },
    {
      icon: Building2,
      title: 'RDO Digital',
      description: 'Elimine papelada e ganhe agilidade com relatórios automáticos',
      href: '/login',
      benefits: [
        { title: 'Relatórios digitais automáticos', completed: true },
        { title: 'Aprovação online', completed: true },
        { title: 'Histórico completo', completed: true },
      ],
      stats: {
        improvement: 65,
        users: '800+',
        satisfaction: 92,
      },
      testimonial: {
        name: 'Ana Costa',
        role: 'Engenheira Civil',
        quote: 'Economizamos 3 horas por dia eliminando papelada',
      }
    },
    {
      icon: CheckSquare,
      title: 'Checklist Digital',
      description: 'Reduza retrabalhos com checklists validados em campo',
      href: '/login',
      benefits: [
        { title: 'Templates personalizáveis', completed: true },
        { title: 'Fotos e evidências', completed: true },
        { title: 'Assinatura digital', completed: true },
      ],
      stats: {
        improvement: 50,
        users: '600+',
        satisfaction: 90,
      },
      testimonial: {
        name: 'Roberto Lima',
        role: 'Supervisor de Obras',
        quote: 'Reduzimos retrabalhos em 70% com os checklists',
      }
    },
    {
      icon: Calendar,
      title: 'Cronograma Visual',
      description: 'Evite atrasos com gestão inteligente de prazos e atividades',
      href: '/login',
      benefits: [
        { title: 'Visualização de Gantt', completed: true },
        { title: 'Dependências automáticas', completed: true },
        { title: 'Alertas de prazo', completed: true },
      ],
      stats: {
        improvement: 35,
        users: '450+',
        satisfaction: 88,
      },
      testimonial: {
        name: 'Mariana Santos',
        role: 'Coordenadora de Projetos',
        quote: 'Nunca mais perdemos prazos importantes',
      }
    },
    {
      icon: Users,
      title: 'Controle de Equipes',
      description: 'Maximize produtividade com gestão otimizada de recursos humanos',
      href: '/login',
      benefits: [
        { title: 'Controle de presença', completed: true },
        { title: 'Alocação inteligente', completed: true },
        { title: 'Métricas de produtividade', completed: true },
      ],
      stats: {
        improvement: 30,
        users: '200+',
        satisfaction: 85,
      },
      testimonial: {
        name: 'João Ferreira',
        role: 'Mestre de Obras',
        quote: 'Equipe mais organizada e produtiva',
      }
    },
    {
      icon: Wrench,
      title: 'Gestão de Equipamentos',
      description: 'Evite paradas não planejadas com controle preventivo de equipamentos',
      href: '/login',
      benefits: [
        { title: 'Manutenção preventiva', completed: true },
        { title: 'Controle de disponibilidade', completed: true },
        { title: 'Histórico de uso', completed: true },
      ],
      stats: {
        improvement: 45,
        users: '150+',
        satisfaction: 87,
      },
      testimonial: {
        name: 'Paulo Oliveira',
        role: 'Técnico em Máquinas',
        quote: 'Eliminamos 80% das paradas não programadas',
      }
    },
    {
      icon: BarChart3,
      title: 'Relatórios Automáticos',
      description: 'Tome decisões rápidas com dados confiáveis e atualizados',
      href: '/login',
      benefits: [
        { title: 'Dashboards em tempo real', completed: true },
        { title: 'Exportação automática', completed: true },
        { title: 'Análises preditivas', completed: true },
      ],
      stats: {
        improvement: 55,
        users: '400+',
        satisfaction: 93,
      },
      testimonial: {
        name: 'Fernanda Reis',
        role: 'Diretora Técnica',
        quote: 'Decisões mais rápidas com dados precisos',
      }
    },
    {
      icon: Zap,
      title: 'Integrações Inteligentes',
      description: 'Centralize comunicação conectando WhatsApp, Gmail e outras ferramentas',
      href: '/login',
      benefits: [
        { title: 'WhatsApp integrado', completed: true },
        { title: 'Sincronização Gmail', completed: true },
        { title: 'API flexível', completed: true },
      ],
      stats: {
        improvement: 60,
        users: '250+',
        satisfaction: 91,
      },
      testimonial: {
        name: 'Ricardo Alves',
        role: 'Gerente de TI',
        quote: 'Comunicação unificada em uma só plataforma',
      }
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plataforma completa para gestão de obras
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Empresas de todos os portes confiam no MetaConstrutor para gerir suas obras 
            com mais eficiência, produtividade e controle total. Todas as ferramentas 
            necessárias em uma única plataforma.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {features.map((feature, index) => (
            <FeatureExpandableCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              href={feature.href}
              benefits={feature.benefits}
              stats={feature.stats}
              testimonial={feature.testimonial}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 mb-8 sm:mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Números que comprovam nossa qualidade
            </h3>
            <p className="text-muted-foreground">
              Resultados reais de empresas que confiam no Meta Construtor
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Obras Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1.2K+</div>
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">35%</div>
              <div className="text-sm text-muted-foreground">Redução de Tempo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl"
            onClick={() => {
              // Analytics tracking
              if ((window as any).gtag) {
                (window as any).gtag('event', 'cta_click', {
                  cta_location: 'features_section',
                  page_location: window.location.href
                });
              }
              navigate('/login');
            }}
          >
            Começar Gratuitamente
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
