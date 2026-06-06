import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import LandingNavigation from '@/components/landing/LandingNavigation';
import { useAuth } from '@/components/auth/AuthContext';

const CheckoutCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const planKey = searchParams.get('plan') || 'basic';
  const billingParam = searchParams.get('billing');
  const billingCycle = billingParam === 'yearly' ? 'yearly' : 'monthly';

  const planNames = {
    free: 'FREE',
    basic: 'BÁSICO',
    professional: 'PROFISSIONAL',
    master: 'MASTER',
    business: 'BUSINESS'
  };

  const planName = planNames[planKey as keyof typeof planNames] || 'BÁSICO';

  const handleRetryCheckout = () => {
    navigate(`/checkout?plan=${encodeURIComponent(planKey)}&billing=${billingCycle}`);
  };

  const handleBackToPlans = () => {
    navigate('/preco');
  };

  const handleContactSupport = () => {
    navigate('/contato');
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  return (
    <>
      <SEO
        title="Pagamento Cancelado | Meta Construtor"
        description="Seu pagamento foi cancelado. Você pode tentar novamente quando quiser."
        canonical={window.location.href}
      />

      <div className="min-h-screen bg-background">
        <LandingNavigation />

        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Cancelamento */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-amber-600" />
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-2">
                Pagamento Cancelado
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Você cancelou o processo de pagamento do plano <strong>{planName}</strong>.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  Não se preocupe! Nenhum valor foi cobrado e você pode tentar novamente quando quiser.
                </p>
              </div>
            </div>

            {/* Informações */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>O que aconteceu?</CardTitle>
                <CardDescription>
                  Entenda por que o pagamento não foi processado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">
                        <strong>Processo interrompido:</strong> O pagamento foi cancelado antes da conclusão
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">
                        <strong>Nenhum valor cobrado:</strong> Sua conta não foi debitada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-sm">
                        <strong>Dados seguros:</strong> Suas informações pessoais estão protegidas
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motivos comuns */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Motivos Comuns para Cancelamento</CardTitle>
                <CardDescription>
                  Algumas situações que podem levar ao cancelamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Mudança de ideia sobre o plano escolhido
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Necessidade de avaliar outras opções
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Problemas técnicos durante o processo
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Dúvidas sobre funcionalidades ou preços
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternativas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Você ainda pode:</CardTitle>
                <CardDescription>
                  Explore suas opções sem compromisso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Teste o plano FREE por 14 dias</h4>
                      <p className="text-sm text-muted-foreground">
                        Experimente todas as funcionalidades sem compromisso
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Compare os planos disponíveis</h4>
                      <p className="text-sm text-muted-foreground">
                        Veja qual plano se adequa melhor às suas necessidades
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Fale com nossa equipe</h4>
                      <p className="text-sm text-muted-foreground">
                        Tire suas dúvidas e receba orientação personalizada
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="space-y-4">
              <Button
                onClick={handleRetryCheckout}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleBackToPlans}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ver Todos os Planos
                </Button>

                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  className="w-full"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com Suporte
                </Button>
              </div>

              <Button
                onClick={handleBackToHome}
                variant="ghost"
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>

            {/* Oferta especial */}
            <div className="text-center mt-8 pt-8 border-t">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Oferta Especial!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Que tal começar com nosso teste gratuito de 14 dias?
                  Você terá acesso completo a todas as funcionalidades.
                </p>
                <Button
                  onClick={() => navigate(isAuthenticated ? '/app/planos?plan=free' : '/login')}
                  variant="outline"
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CheckoutCancel;
