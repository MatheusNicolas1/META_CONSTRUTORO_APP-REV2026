import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Clock, Award } from 'lucide-react';

const StatsSection = () => {
  const stat1 = useCountUp({ end: 500, duration: 2000 });
  const stat2 = useCountUp({ end: 1200, duration: 2500 });
  const stat3 = useCountUp({ end: 40, duration: 2000 });
  const stat4 = useCountUp({ end: 99.9, duration: 2000, decimals: 1 });

  const stats = [
    {
      icon: Users,
      value: stat1.count,
      suffix: '+',
      label: 'Obras Gerenciadas',
      description: 'Projetos ativos na plataforma',
      color: 'text-blue-500',
      ref: stat1.ref
    },
    {
      icon: TrendingUp,
      value: stat2.count,
      suffix: 'K+',
      label: 'RDOs Digitais',
      description: 'Relatórios criados mensalmente',
      color: 'text-green-500',
      ref: stat2.ref
    },
    {
      icon: Clock,
      value: stat3.count,
      suffix: '%',
      label: 'Ganho de Produtividade',
      description: 'Economia de tempo reportada',
      color: 'text-orange-500',
      ref: stat3.ref
    },
    {
      icon: Award,
      value: stat4.count,
      suffix: '%',
      label: 'Satisfação dos Clientes',
      description: 'Índice de aprovação',
      color: 'text-purple-500',
      ref: stat4.ref
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            Números que comprovam nossa eficiência
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Dados reais de empresas que transformaram sua gestão com o MetaConstrutor
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} ref={stat.ref}>
              <Card className="group hover:shadow-xl transition-all duration-300 border-border bg-card h-full">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-semibold leading-none text-foreground">
                      {stat.value}
                    </span>
                    <span className="text-2xl md:text-3xl font-semibold leading-none text-primary">
                      {stat.suffix}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-2">
                    {stat.label}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
