import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import LandingNavigation from '@/components/landing/LandingNavigation';
import { useToast } from '@/hooks/use-toast';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const planKey = searchParams.get('plan') || 'basic';
  const sessionId = searchParams.get('session_id');

  const planNames = {
    free: 'FREE',
    basic: 'BÁSICO',
    professional: 'PROFISSIONAL',
    master: 'MASTER',
    business: 'BUSINESS'
  };

  const planName = planNames[planKey as keyof typeof planNames] || 'BÁSICO';

  useEffect(() => {
    // Simular verificação de pagamento
    const verifyPayment = async () => {
      try {
        // Na implementação real, verificar com o backend se o pagamento foi processado
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast({
          title: 'Pagamento confirmado!',
          description: 'Sua assinatura foi ativada com sucesso.',
        });

        setIsLoading(false);
      } catch (error) {
        toast({
          title: 'Erro na verificação',
          description: 'Não conseguimos verificar seu pagamento. Entre em contato conosco.',
          variant: 'destructive',
        });

        // Redirecionar para suporte em caso de erro
        setTimeout(() => {
          navigate('/contato');
        }, 3000);
      }
    };

    verifyPayment();
  }, [toast, navigate]);

  const handleGoToDashboard = () => {
    toast({
      title: 'Bem-vindo ao Meta Construtor!',
      description: 'Você será redirecionado para o dashboard.',
    });

    setTimeout(() => {
      navigate('/app/dashboard');
    }, 1000);
  };

  const handleDownloadReceipt = () => {
    // Na implementação real, gerar e baixar o recibo
    toast({
      title: 'Recibo gerado',
      description: 'O recibo será enviado para seu e-mail e estará disponível no dashboard.',
    });
  };

  const handleSendReceiptEmail = () => {
    // Na implementação real, reenviar recibo por e-mail
    toast({
      title: 'E-mail enviado',
      description: 'O recibo foi reenviado para seu e-mail cadastrado.',
    });
  };

  if (isLoading) {
    return (
      <>
        <SEO
          title="Processando pagamento... | Meta Construtor"
          description="Aguarde enquanto confirmamos seu pagamento."
          canonical={window.location.href}
        />

        <div className="min-h-screen bg-background">
          <LandingNavigation />

          <main className="pt-16 overflow-x-hidden">
            <div className="w-full max-w-2xl mx-auto px-6 lg:px-12 py-16">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
                    <h2 className="text-xl font-semibold">Confirmando pagamento...</h2>
                    <p className="text-muted-foreground">
                      Aguarde enquanto verificamos seu pagamento. Isso pode levar alguns segundos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Pagamento Confirmado! | Meta Construtor"
        description="Seu pagamento foi processado com sucesso. Bem-vindo ao Meta Construtor!"
        canonical={window.location.href}
      />

      <div className="min-h-screen bg-background">
        <LandingNavigation />

        <main className="pt-16 overflow-x-hidden">
          <div className="w-full max-w-2xl mx-auto px-6 lg:px-12 py-16">
            {/* Sucesso */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-2">
                Pagamento Confirmado!
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                Sua assinatura do plano <strong>{planName}</strong> foi ativada com sucesso.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  ✅ Conta criada com sucesso<br />
                  ✅ Pagamento processado<br />
                  ✅ Assinatura ativada<br />
                  ✅ E-mail de confirmação enviado
                </p>
              </div>
            </div>

            {/* Informações da assinatura */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Detalhes da Assinatura</CardTitle>
                <CardDescription>
                  Informações sobre seu plano ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <span className="font-medium">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-green-600">Ativo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próxima cobrança:</span>
                    <span className="font-medium">
                      {planKey === 'free' ? 'Não se aplica' :
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {sessionId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID da transação:</span>
                      <span className="font-mono text-sm">{sessionId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Próximos passos */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
                <CardDescription>
                  Tudo pronto! Agora você pode começar a usar o Meta Construtor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Acesse seu dashboard</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure seu perfil e comece a gerenciar suas obras
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Crie sua primeira obra</h4>
                      <p className="text-sm text-muted-foreground">
                        Cadastre sua primeira obra e organize sua equipe
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Explore as funcionalidades</h4>
                      <p className="text-sm text-muted-foreground">
                        Descubra todas as ferramentas disponíveis para otimizar sua gestão
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="space-y-4">
              <Button
                onClick={handleGoToDashboard}
                className="w-full"
                size="lg"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Acessar Dashboard
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleDownloadReceipt}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Recibo
                </Button>

                <Button
                  onClick={handleSendReceiptEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar por E-mail
                </Button>
              </div>
            </div>

            {/* Suporte */}
            <div className="text-center mt-8 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Precisa de ajuda? Entre em contato conosco
              </p>
              <Button
                onClick={() => navigate('/contato')}
                variant="link"
                className="text-primary"
              >
                Central de Suporte
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CheckoutSuccess;
