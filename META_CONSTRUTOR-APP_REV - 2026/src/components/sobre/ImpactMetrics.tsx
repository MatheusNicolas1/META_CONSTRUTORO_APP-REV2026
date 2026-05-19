import React from 'react';
import { TrendingUp, Clock, Users, Building } from 'lucide-react';

const ImpactMetrics = () => {
  const metrics = [
    {
      icon: Building,
      number: '500+',
      label: 'Obras Gerenciadas',
      description: 'Projetos ativos na plataforma',
      details: [
        '350+ obras residenciais',
        '120+ obras comerciais',
        '30+ obras industriais',
        'R$ 2.8 bi em VGV gerenciado'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      number: '2.5K+',
      label: 'Usuários Ativos',
      description: 'Profissionais utilizando diariamente',
      details: [
        '850+ engenheiros',
        '1.200+ técnicos',
        '450+ gestores',
        '95% taxa de satisfação'
      ],
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      number: '45%',
      label: 'Redução no Retrabalho',
      description: 'Melhoria média reportada pelos clientes',
      details: [
        '38% menos revisões',
        '52% menos retrabalho em documentos',
        '41% redução em atrasos',
        'R$ 1.2 mi economizados'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Clock,
      number: '120h',
      label: 'Horas Economizadas/Mês',
      description: 'Tempo poupado por obra gerenciada',
      details: [
        '45h em gestão documental',
        '32h em relatórios',
        '28h em comunicação',
        '15h em planejamento'
      ],
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
            Impacto em Números
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Resultados reais que demonstram o valor da nossa plataforma para o setor da construção civil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="relative bg-card rounded-2xl p-8 border border-border text-center hover:shadow-lg transition-all duration-300 group overflow-hidden"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}>
                  <metric.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Number */}
              <div className="relative mb-3">
                <div className="text-4xl md:text-5xl font-semibold leading-none text-foreground mb-2 animate-fade-in break-words">
                  {metric.number}
                </div>
                <h3 className="text-lg font-semibold leading-snug text-foreground break-words">
                  {metric.label}
                </h3>
              </div>

              {/* Description */}
              <p className="relative text-sm text-muted-foreground leading-relaxed mb-4">
                {metric.description}
              </p>

              {/* Details */}
              <div className="relative space-y-2">
                {metric.details.map((detail, detailIndex) => (
                  <div 
                    key={detailIndex}
                    className="flex min-w-0 items-center justify-between gap-2 text-xs leading-snug bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <span className="shrink-0 text-muted-foreground">{detail.split(' ')[0]}</span>
                    <span className="min-w-0 text-right font-medium text-foreground break-words">{detail.substring(detail.indexOf(' ') + 1)}</span>
                  </div>
                ))}
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse delay-1000"></div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="mt-16 text-center">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 max-w-2xl mx-auto">
            <p className="text-muted-foreground text-sm leading-relaxed">
              <span className="font-semibold text-foreground">Metodologia:</span> Dados coletados entre janeiro de 2024 e dezembro de 2024, 
              baseados em métricas de +200 obras ativas e feedback direto de clientes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactMetrics;
