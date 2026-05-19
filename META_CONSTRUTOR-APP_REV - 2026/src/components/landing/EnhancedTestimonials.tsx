import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import { AnimatedTestimonials } from '@/components/ui/animated-testimonials';

const EnhancedTestimonials = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();

  const testimonials = [
    {
      quote: "Reduzimos 35% dos retrabalhos e aumentamos a produtividade em 28%. O ROI foi imediato e a equipe adorou a interface intuitiva.",
      name: "Carlos Eduardo Santos",
      designation: "Diretor de Operações • Construtora Alfa",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "A digitalização do RDO nos poupou 3 horas por dia. Relatórios automáticos e assinaturas digitais revolucionaram nossa operação.",
      name: "Marina Silva Costa",
      designation: "Gerente de Projetos • Horizonte Engenharia",
      src: "https://images.unsplash.com/photo-1494790108755-2616b612b742?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Eliminamos 90% da papelada e ganhamos transparência total. Nossos clientes acompanham o progresso em tempo real.",
      name: "Roberto Mendes Lima",
      designation: "CEO • ObraSul",
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "O controle de qualidade com checklists digitais nos permitiu reduzir não conformidades em 60%. Auditoria aprovada sem ressalvas.",
      name: "Ana Carolina Ferreira",
      designation: "Coordenadora de Obras • Urbanis",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "A gestão de equipamentos nos salvou R$ 80 mil em manutenções. O sistema previne falhas antes que aconteçam.",
      name: "João Paulo Rodrigues",
      designation: "Engenheiro Civil • Ponte Azul Infra",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Conseguimos certificação ISO mais rápido com a documentação organizada. Transparência total em todos os processos.",
      name: "Fernanda Oliveira Santos",
      designation: "Diretora Técnica • NorteSteel",
      src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Integração perfeita com nossas ferramentas. WhatsApp, Drive e Gmail conectados facilitaram toda comunicação da obra.",
      name: "Pedro Henrique Alves",
      designation: "Supervisor de Obras • Construtora Ômega",
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "A mobilidade do sistema é impressionante. Consigo acompanhar tudo do celular, mesmo em locais sem internet com o modo offline.",
      name: "Juliana Martins",
      designation: "Engenheira Residente • Delta Construções",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Os 7 créditos gratuitos foram perfeitos para testar. Sistema completo e gratuito para começar, virou indispensável na minha rotina!",
      name: "Beatriz Mendes",
      designation: "Arquiteta • Studio BM Design",
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Dashboard visual e intuitivo. Métricas em tempo real ajudaram a tomar decisões mais rápidas e assertivas nos projetos.",
      name: "Lucas Pereira",
      designation: "Gestor de Obras • LP Empreendimentos",
      src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Suporte técnico excepcional. Sempre que preciso, a equipe responde rápido e resolve. Sinto que tenho um parceiro de negócio.",
      name: "Patrícia Gomes",
      designation: "Proprietária • PG Construções",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "A automação de relatórios liberou minha equipe para focar no que realmente importa: qualidade e prazos. Produtividade em alta!",
      name: "Ricardo Tavares",
      designation: "Coordenador Técnico • RT Engenharia",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Segurança de dados impecável. LGPD compliance garantido e backups automáticos nos dão total tranquilidade operacional.",
      name: "Camila Rodrigues",
      designation: "Diretora Jurídica • Grupo Vertice",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Personalização total dos checklists. Adaptamos para cada tipo de obra e garantimos conformidade com todas as normas técnicas.",
      name: "Diego Carvalho",
      designation: "Engenheiro de Qualidade • Qualibuild",
      src: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "Interface limpa e profissional. Apresentações para clientes ficaram mais impactantes com os relatórios visuais do sistema.",
      name: "Renata Cardoso",
      designation: "Coordenadora Comercial • RC Incorporadora",
      src: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    },
    {
      quote: "O controle de custos e orçamentos ficou muito mais preciso. Conseguimos reduzir desperdícios em 22% no último ano.",
      name: "Thiago Nascimento",
      designation: "Analista Financeiro • TN Construtora",
      src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    }
  ];


  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            Depoimentos verificados de quem usa o MetaConstrutor no dia a dia
          </p>
        </div>

        {/* Animated Testimonials */}
        <AnimatedTestimonials 
          testimonials={testimonials}
          autoplay={true}
          className="mb-8 sm:mb-10"
        />

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-semibold leading-none rounded-xl"
            onClick={() => navigate('/login')}
          >
            Começar Gratuitamente
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EnhancedTestimonials;
