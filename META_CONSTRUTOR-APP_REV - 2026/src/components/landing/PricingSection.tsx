import React from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Básico',
      planKey: 'free',
      price: 'Gratuito',
      description: 'Ideal para pequenas obras e testes',
      features: [
        'Até 2 obras simultâneas',
        'RDO digital básico',
        'Gestão de equipes (até 5 pessoas)',
        'Relatórios básicos',
        'Suporte por email'
      ],
      buttonText: 'Começar Grátis',
      highlighted: false
    },
    {
      name: 'Profissional',
      planKey: 'professional',
      price: 'R$ 49',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Obras ilimitadas',
        'RDO completo com assinaturas',
        'Gestão completa de equipes',
        'Relatórios avançados',
        'Integrações com terceiros',
        'Suporte prioritário',
        'Backup automático'
      ],
      buttonText: 'Iniciar Teste Gratuito',
      highlighted: true
    },
    {
      name: 'Enterprise',
      planKey: 'business',
      price: 'Personalizado',
      description: 'Para grandes construtoras',
      features: [
        'Tudo do Profissional',
        'API personalizada',
        'Implantação dedicada',
        'Treinamento presencial',
        'Suporte 24/7',
        'Customizações especiais',
        'SLA garantido'
      ],
      buttonText: 'Falar com Vendas',
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que crescem com você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho da sua operação.
            Teste gratuito de 14 dias em todos os planos pagos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg ${plan.highlighted
                  ? 'border-primary bg-card shadow-lg scale-105'
                  : 'border-border bg-card hover:border-primary/50'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-card-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.highlighted
                    ? 'bg-primary hover:bg-primary/90'
                    : 'variant-outline hover:bg-primary hover:text-primary-foreground'
                  }`}
                onClick={() => navigate(plan.planKey === 'free' ? '/login' : `/checkout?plan=${plan.planKey}`)}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground mb-4">
            Todos os planos incluem acesso completo durante o período de teste
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span>✓ Sem taxa de configuração</span>
            <span>✓ Cancele a qualquer momento</span>
            <span>✓ Suporte incluído</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;