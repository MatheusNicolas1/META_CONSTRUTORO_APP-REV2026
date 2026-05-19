import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CheckSquare, 
  Calendar, 
  Users, 
  Wrench, 
  DollarSign,
  FileText,
  Handshake,
  BarChart3, 
  Zap,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import { FeatureExpandableCard } from '@/components/ui/feature-expandable-card';

const ModernFeaturesSection = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Obras & Cronograma',
      description: 'Planejamento por fases e marcos com linha do tempo e dependências automáticas',
      href: '/login',
      benefits: [
        { title: 'Planejamento por fases e marcos', completed: true },
        { title: 'Linha do tempo e dependências', completed: true },
        { title: 'Controle visual de progresso', completed: true },
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
      title: 'RDO Inteligente',
      description: 'Lançamento em minutos com assinatura e envio automático',
      href: '/login',
      benefits: [
        { title: 'Lançamento em minutos', completed: true },
        { title: 'Assinatura e envio automático', completed: true },
        { title: 'Histórico completo digital', completed: true },
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
      title: 'Checklists QS',
      description: 'Qualidade e Segurança padronizadas com templates prontos e customizáveis',
      href: '/login',
      benefits: [
        { title: 'Templates prontos e customizáveis', completed: true },
        { title: 'Fotos e evidências digitais', completed: true },
        { title: 'Assinatura digital validada', completed: true },
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
      title: 'Atividades Kanban',
      description: 'Quadro Kanban com prioridades, duração estimada e responsáveis',
      href: '/login',
      benefits: [
        { title: 'Quadro Kanban e prioridades', completed: true },
        { title: 'Duração estimada e responsáveis', completed: true },
        { title: 'Alertas automáticos de prazo', completed: true },
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
      title: 'Equipes & Colaboradores',
      description: 'Funções e times personalizados com controle de disponibilidade e produtividade',
      href: '/login',
      benefits: [
        { title: 'Funções e times personalizados', completed: true },
        { title: 'Disponibilidade e produtividade', completed: true },
        { title: 'Métricas de performance', completed: true },
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
      title: 'Equipamentos & Manutenção',
      description: 'Manutenção preventiva e corretiva com controle de horas e check-in',
      href: '/login',
      benefits: [
        { title: 'Preventiva e corretiva', completed: true },
        { title: 'Controle de horas e check-in', completed: true },
        { title: 'Histórico completo de uso', completed: true },
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
      icon: DollarSign,
      title: 'Orçamento & Financeiro',
      description: 'Orçamento analítico por obra com executado vs. pendente por RDO',
      href: '/login',
      benefits: [
        { title: 'Orçamento analítico por obra', completed: true },
        { title: 'Executado vs. pendente por RDO', completed: true },
        { title: 'Controle de margem automático', completed: true },
      ],
      stats: {
        improvement: 55,
        users: '400+',
        satisfaction: 93,
      },
      testimonial: {
        name: 'Fernanda Reis',
        role: 'Diretora Financeira',
        quote: 'Controle total dos custos em tempo real',
      }
    },
    {
      icon: FileText,
      title: 'Documentos & Anexos',
      description: 'Central única por obra com versionamento e controle de permissões',
      href: '/login',
      benefits: [
        { title: 'Central única por obra', completed: true },
        { title: 'Versionamento e permissões', completed: true },
        { title: 'Busca inteligente', completed: true },
      ],
      stats: {
        improvement: 60,
        users: '300+',
        satisfaction: 89,
      },
      testimonial: {
        name: 'Lucas Martins',
        role: 'Arquiteto',
        quote: 'Documentos organizados e sempre atualizados',
      }
    },
    {
      icon: Handshake,
      title: 'Fornecedores & Contratos',
      description: 'Cadastro completo com SLA, anexos, status e histórico',
      href: '/login',
      benefits: [
        { title: 'Cadastro, SLA e anexos', completed: true },
        { title: 'Status e histórico', completed: true },
        { title: 'Avaliação de performance', completed: true },
      ],
      stats: {
        improvement: 25,
        users: '180+',
        satisfaction: 82,
      },
      testimonial: {
        name: 'Patricia Almeida',
        role: 'Gerente de Suprimentos',
        quote: 'Fornecedores mais organizados e pontuais',
      }
    },
    {
      icon: BarChart3,
      title: 'Relatórios & Dashboards',
      description: 'Indicadores em tempo real com exportação PDF automática',
      href: '/login',
      benefits: [
        { title: 'Indicadores em tempo real', completed: true },
        { title: 'Exportação PDF', completed: true },
        { title: 'Análises preditivas', completed: true },
      ],
      stats: {
        improvement: 70,
        users: '500+',
        satisfaction: 96,
      },
      testimonial: {
        name: 'Eduardo Santos',
        role: 'Diretor Técnico',
        quote: 'Decisões mais rápidas com dados precisos',
      }
    },
    {
      icon: Zap,
      title: 'Integrações & Automação',
      description: 'WhatsApp, Gmail, Drive, Agenda com fluxos n8n prontos para usar',
      href: '/login',
      benefits: [
        { title: 'WhatsApp, Gmail, Drive, Agenda', completed: true },
        { title: 'Fluxos n8n prontos', completed: true },
        { title: 'API flexível para integração', completed: true },
      ],
      stats: {
        improvement: 80,
        users: '250+',
        satisfaction: 94,
      },
      testimonial: {
        name: 'Ricardo Alves',
        role: 'Gerente de TI',
        quote: 'Comunicação unificada em uma só plataforma',
      }
    },
    {
      icon: MessageSquare,
      title: 'Comunicação & Alertas',
      description: 'Notificações multi-canal com comentários e menções @ em tempo real',
      href: '/login',
      benefits: [
        { title: 'Notificações multi-canal', completed: true },
        { title: 'Comentários e menções @', completed: true },
        { title: 'Histórico de conversas', completed: true },
      ],
      stats: {
        improvement: 45,
        users: '400+',
        satisfaction: 87,
      },
      testimonial: {
        name: 'Camila Rocha',
        role: 'Coordenadora de Comunicação',
        quote: 'Comunicação mais eficiente entre todas as equipes',
      }
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            Plataforma completa para gestão de obras
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Todas as ferramentas que você precisa para controlar suas obras do planejamento 
            à entrega, centralizadas em uma única plataforma intuitiva e poderosa.
          </p>
        </div>

        {/* Features Grid - 3×4 desktop, 2×6 tablet, 1×12 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 px-2 sm:px-0 items-stretch">
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
        <div className="bg-primary/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 mb-8 sm:mb-12 mx-2 sm:mx-0">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-foreground mb-2">
              Números que comprovam nossa eficiência
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground px-2 sm:px-0">
              Resultados reais de empresas que escolheram o MetaConstrutor
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-none text-primary mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground px-1">Obras Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-none text-primary mb-1 sm:mb-2">1.2K+</div>
              <div className="text-xs sm:text-sm text-muted-foreground px-1">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-none text-primary mb-1 sm:mb-2">40%</div>
              <div className="text-xs sm:text-sm text-muted-foreground px-1">Redução de Tempo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-none text-primary mb-1 sm:mb-2">99.9%</div>
              <div className="text-xs sm:text-sm text-muted-foreground px-1">Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold leading-none rounded-xl"
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

export default ModernFeaturesSection;
