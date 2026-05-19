import React from 'react';
import { 
  Zap, 
  RefreshCcw, 
  BarChart3, 
  Puzzle,
  CheckCircle,
  ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BenefitsSection = () => {
  const navigate = useNavigate();
  const benefits = [
    {
      icon: Zap,
      title: 'Economize até 30% em custos operacionais',
      description: 'Automatize processos manuais e elimine desperdícios com fluxos otimizados que comprovadamente reduzem custos.',
      stats: '30% economia',
      color: 'text-yellow-500'
    },
    {
      icon: RefreshCcw,
      title: 'Reduza atrasos com alertas automáticos',
      description: 'Sistema inteligente de notificações evita atrasos e mantém suas obras sempre no prazo.',
      stats: '85% menos atrasos',
      color: 'text-green-500'
    },
    {
      icon: BarChart3,
      title: 'Centralize toda comunicação em um só lugar',
      description: 'Integre WhatsApp, email e outras ferramentas para ter controle total da comunicação.',
      stats: '100% centralizado',
      color: 'text-blue-500'
    },
    {
      icon: Puzzle,
      title: 'Tome decisões baseadas em dados confiáveis',
      description: 'Relatórios em tempo real e analytics avançados para decisões mais assertivas e estratégicas.',
      stats: '20+ relatórios',
      color: 'text-purple-500'
    }
  ];

  const features = [
    'Interface intuitiva e fácil de usar',
    'Funciona offline quando necessário',
    'Segurança de nível empresarial',
    'Suporte técnico especializado 24/7',
    'Atualizações automáticas sem custo',
    'Backup automático na nuvem'
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            Por que escolher o MetaConstrutor?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Desenvolvido por especialistas da construção civil, oferecemos as soluções 
            que você realmente precisa para transformar sua gestão de obras.
          </p>
        </div>

        {/* Main Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-0">
          {benefits.map((benefit, index) => (
            <Card 
              key={index} 
              className="group text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-border bg-card"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                  </div>
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-3">
                  {benefit.title}
                </h3>
                
                <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                  {benefit.description}
                </p>
                
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium leading-none">
                  {benefit.stats}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-background rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-border mx-2 sm:mx-0">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Features List */}
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-foreground mb-6">
                Tudo que você precisa em uma única plataforma
              </h3>
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/50 rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-none text-primary mb-1 sm:mb-2">500+</div>
                <div className="text-xs sm:text-sm leading-snug text-muted-foreground">Obras Gerenciadas</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/50 rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-none text-primary mb-1 sm:mb-2">1.2K+</div>
                <div className="text-xs sm:text-sm leading-snug text-muted-foreground">Usuários Ativos</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/50 rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-none text-primary mb-1 sm:mb-2">99.9%</div>
                <div className="text-xs sm:text-sm leading-snug text-muted-foreground">Uptime</div>
              </div>
              
              <div className="text-center p-3 sm:p-4 md:p-6 bg-muted/50 rounded-lg sm:rounded-xl">
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold leading-none text-primary mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm leading-snug text-muted-foreground">Suporte</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;
