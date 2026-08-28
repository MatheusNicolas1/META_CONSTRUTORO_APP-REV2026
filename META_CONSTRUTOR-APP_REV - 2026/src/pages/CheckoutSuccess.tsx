import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import LandingNavigation from '@/components/landing/LandingNavigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/integrations/analytics';

type VerificationStatus = 'checking' | 'confirmed' | 'pending' | 'error';

type VerifiedSubscription = {
  planName: string;
  status: string;
  currentPeriodEnd?: string | null;
  billingCycle?: string | null;
  stripeSubscriptionId?: string | null;
};

const ACTIVE_STATUSES = ['active', 'trialing'];
const MAX_VERIFICATION_ATTEMPTS = 6;
const VERIFICATION_RETRY_MS = 2000;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getPlanName = (slug?: string | null) => {
  const planNames: Record<string, string> = {
    free: 'FREE',
    basic: 'BASICO',
    professional: 'PROFISSIONAL',
    master: 'MASTER',
    business: 'BUSINESS',
  };

  return slug ? planNames[slug] || slug.toUpperCase() : 'Plano';
};

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>('checking');
  const [subscription, setSubscription] = useState<VerifiedSubscription | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    let cancelled = false;

    const readSubscriptionState = async (): Promise<VerifiedSubscription | null> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Sessao de usuario nao encontrada. Entre novamente para verificar a assinatura.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('stripe_subscription_id, subscription_status, plan_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: currentSubscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id, status, current_period_end, billing_cycle, plans(name, slug)')
        .in('status', ['active', 'trialing', 'past_due'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) throw subscriptionError;

      const subscriptionData = currentSubscription as any;
      if (subscriptionData && ACTIVE_STATUSES.includes(subscriptionData.status)) {
        return {
          planName: subscriptionData.plans?.name || getPlanName(subscriptionData.plans?.slug),
          status: subscriptionData.status,
          currentPeriodEnd: subscriptionData.current_period_end,
          billingCycle: subscriptionData.billing_cycle,
          stripeSubscriptionId: subscriptionData.stripe_subscription_id,
        };
      }

      if (
        profile?.stripe_subscription_id &&
        profile.subscription_status &&
        ACTIVE_STATUSES.includes(profile.subscription_status)
      ) {
        return {
          planName: getPlanName(profile.plan_type),
          status: profile.subscription_status,
          stripeSubscriptionId: profile.stripe_subscription_id,
        };
      }

      return null;
    };

    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus('pending');
        setErrorMessage('Nenhuma sessao Stripe foi informada na URL. Nao foi possivel confirmar pagamento nesta tela.');
        return;
      }

      try {
        for (let attempt = 1; attempt <= MAX_VERIFICATION_ATTEMPTS; attempt += 1) {
          const verifiedSubscription = await readSubscriptionState();

          if (cancelled) return;

          if (verifiedSubscription) {
            setSubscription(verifiedSubscription);
            setStatus('confirmed');
            track('billing.checkout_completed', { plan: verifiedSubscription.planName, status: verifiedSubscription.status });
            return;
          }

          if (attempt < MAX_VERIFICATION_ATTEMPTS) {
            await wait(VERIFICATION_RETRY_MS);
          }
        }

        if (!cancelled) {
          setStatus('pending');
          setErrorMessage('O checkout retornou, mas a assinatura ainda nao foi confirmada pelo webhook da Stripe.');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel verificar a assinatura.');
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleGoToDashboard = () => {
    navigate('/app/dashboard');
  };

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/app/perfil?tab=subscription`,
        },
      });

      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || 'Nao foi possivel abrir o portal de cobranca.');
      }

      window.location.assign(data.url);
    } catch (error) {
      toast({
        title: 'Portal indisponivel',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const renderStatusCard = () => {
    if (status === 'checking') {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verificando assinatura...</h2>
              <p className="text-muted-foreground">
                Estamos consultando o Supabase para confirmar o processamento real do webhook da Stripe.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (status === 'confirmed' && subscription) {
      return (
        <>
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="mb-2 text-3xl font-bold text-foreground">
              Assinatura confirmada
            </h1>

            <p className="mb-6 text-lg text-muted-foreground">
              O plano <strong>{subscription.planName}</strong> esta ativo no Supabase.
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhes da assinatura</CardTitle>
              <CardDescription>Dados confirmados pelo estado persistido da assinatura.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="font-medium">{subscription.planName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600">{subscription.status}</span>
                </div>
                {subscription.billingCycle && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Ciclo:</span>
                    <span className="font-medium">{subscription.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</span>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Renovacao:</span>
                    <span className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {sessionId && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Sessao Stripe:</span>
                    <span className="break-all font-mono text-sm">{sessionId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Button onClick={handleGoToDashboard} className="w-full" size="lg">
              <ArrowRight className="mr-2 h-4 w-4" />
              Acessar dashboard
            </Button>

            <Button
              onClick={handleOpenBillingPortal}
              variant="outline"
              className="w-full"
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Abrir portal de cobranca
            </Button>
          </div>
        </>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-700" />
          </div>
          <CardTitle>{status === 'error' ? 'Verificacao indisponivel' : 'Confirmacao pendente'}</CardTitle>
          <CardDescription>
            {errorMessage || 'Ainda nao encontramos uma assinatura ativa para esta sessao.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionId && (
            <p className="break-all rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
              Sessao Stripe: {sessionId}
            </p>
          )}
          <Button onClick={() => window.location.reload()} className="w-full">
            Verificar novamente
          </Button>
          <Button onClick={() => navigate('/contato')} variant="outline" className="w-full">
            Falar com suporte
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <SEO
        title="Status do checkout | Meta Construtor"
        description="Verificacao real do status da assinatura."
        canonical={window.location.href}
      />

      <div className="min-h-screen bg-background">
        <LandingNavigation />

        <main className="overflow-x-hidden pt-16">
          <div className="mx-auto w-full max-w-2xl px-6 py-16 lg:px-12">
            {renderStatusCard()}
          </div>
        </main>
      </div>
    </>
  );
};

export default CheckoutSuccess;
