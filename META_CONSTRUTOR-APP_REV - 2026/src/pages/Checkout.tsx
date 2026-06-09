
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import LandingNavigation from '@/components/landing/LandingNavigation';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import { CheckoutForm, CheckoutFormData } from '@/components/pricing/CheckoutForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import { getCheckoutErrorFeedback } from '@/utils/checkoutErrors';
import { NavigationSafety } from '@/utils/navigationSafety';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [defaultFormValues, setDefaultFormValues] = useState<Partial<CheckoutFormData>>({});

  const planKey = searchParams.get('plan') || 'basic';
  const billingParam = searchParams.get('billing');
  const billingCycle: 'monthly' | 'yearly' = billingParam === 'yearly' ? 'yearly' : 'monthly';
  const planManagementPath = `/app/planos?plan=${encodeURIComponent(planKey)}&billing=${billingCycle}`;

  const { data: plans, isLoading: isPlansLoading } = usePlans({ staticOnly: !isAuthenticated });
  const selectedPlan = plans?.find(p => p.slug === planKey);

  const rawMonthlyPrice = (selectedPlan?.monthly_price_cents || 0) / 100;
  const rawYearlyPrice = (selectedPlan?.yearly_price_cents || 0) / 100;

  const displayPrice = billingCycle === 'yearly'
    ? (rawYearlyPrice / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : rawMonthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  // Handle plan not found or business
  useEffect(() => {
    if (!isPlansLoading && (!selectedPlan || planKey === 'business')) {
      if (planKey === 'business') navigate('/contato');
    }
  }, [planKey, selectedPlan, isPlansLoading, navigate]);

  useEffect(() => {
    if (!user) {
      setDefaultFormValues({});
      return;
    }

    setDefaultFormValues({
      name: user.name || '',
      email: user.email || '',
    });

    let isMounted = true;
    supabase
      .from('profiles')
      .select('name, email, company, cpf_cnpj, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted || !data) return;
        setDefaultFormValues({
          name: data.name || user.name || '',
          email: data.email || user.email || '',
          company: data.company || '',
          cpf_cnpj: data.cpf_cnpj || '',
          phone: data.phone || '',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const createHostedCheckoutSession = async (cycle: 'monthly' | 'yearly', formData?: CheckoutFormData) => {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        plan: planKey,
        billing: cycle,
        coupon_code: formData?.coupon_code || null,
        profile: formData ? {
          name: formData.name,
          company: formData.company,
          cpf_cnpj: formData.cpf_cnpj,
          phone: formData.phone,
        } : undefined,
        successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout/cancel?plan=${encodeURIComponent(planKey)}&billing=${cycle}`,
      }
    });

    if (error || !data?.url) {
      throw new Error(data?.error || error?.message || 'Erro ao iniciar checkout seguro');
    }

    return data.url as string;
  }

  const handleDetailsSubmit = async (data: CheckoutFormData) => {
    setIsLoading(true);
    try {
      if (isAuthenticated && user) {
        await supabase.from('profiles').update({
          name: data.name,
          company: data.company || null,
          cpf_cnpj: data.cpf_cnpj || null,
          phone: data.phone || null
        }).eq('id', user.id);

        if (planKey === 'free') {
          toast({ title: "Sucesso!", description: "Plano gratuito ativado." });
          navigate('/app/dashboard');
          return;
        }

        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (orgMember?.org_id) {
          const { data: activeSubscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('org_id', orgMember.org_id)
            .in('status', ['active', 'trialing', 'past_due'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeSubscription?.stripe_subscription_id) {
            toast({
              title: "Assinatura ativa encontrada",
              description: "Use a area de planos para trocar de plano ou ciclo de cobranca.",
            });
            navigate(planManagementPath);
            return;
          }
        }

        const checkoutUrl = await createHostedCheckoutSession(billingCycle, data);
        window.location.assign(checkoutUrl);
        return;
      }

      const password = data.password?.trim();
      if (!password) {
        throw new Error("Informe uma senha para criar a conta e continuar o pagamento.");
      }

      // 1. Sign Up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
            cpf_cnpj: data.cpf_cnpj
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({ title: "Conta ja existe", description: "Faca login para continuar.", variant: "destructive" });
          const redirect = `${location.pathname}${location.search}`;
          navigate(`/login?redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(data.email)}`);
        } else {
          throw signUpError;
        }
        return;
      }

      if (!authData.user) throw new Error("Falha ao criar usuario");
      if (!authData.session) {
        throw new Error("Conta criada. Confirme seu e-mail e faca login para continuar o pagamento.");
      }

      // 2. Free Plan
      if (planKey === 'free') {
        toast({ title: "Sucesso!", description: "Plano gratuito ativado." });
        navigate('/app/dashboard');
        return;
      }

      // 3. Paid Plan -> Stripe-hosted Checkout
      const checkoutUrl = await createHostedCheckoutSession(billingCycle, data);
      window.location.assign(checkoutUrl);
    } catch (error: any) {
      const feedback = getCheckoutErrorFeedback(error);
      toast({
        title: feedback.title,
        description: feedback.description,
        variant: feedback.variant,
      });

      if (feedback.redirect === 'plan-management') {
        navigate(planManagementPath);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isPlansLoading || !selectedPlan) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-[600px] w-full max-w-4xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <SEO {...seoPages.checkout} />
      <LandingNavigation />

      <main className="pt-32 pb-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Stepper */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 border-primary bg-primary text-primary-foreground")}>
                <span className="font-bold">1</span>
              </div>
              <div className="h-1 w-20 rounded-full bg-muted transition-all duration-300" />
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted text-muted-foreground transition-all duration-300">
                <span className="font-bold">2</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/50 shadow-lg shadow-black/5 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">
                          Dados da Conta
                        </CardTitle>
                        <CardDescription>
                          Informe seus dados para seguir ao checkout seguro da Stripe.
                        </CardDescription>
                        <button
                          onClick={() => NavigationSafety.safeNavigate(navigate, '/preco')}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Voltar aos planos
                        </button>
                      </div>
                      <Lock className="w-6 h-6 text-green-600/80" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <CheckoutForm
                        onSubmit={handleDetailsSubmit}
                        loading={isLoading}
                        defaultValues={defaultFormValues}
                        showPasswordFields={!isAuthenticated}
                      />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="sticky top-32"
              >
                <Card className="bg-primary/5 border-primary/20 shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                      Resumo do Pedido
                      <span className="text-sm font-normal px-2 py-1 bg-primary/10 text-primary rounded-md">{billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-start pb-6 border-b border-primary/10">
                      <div>
                        <h3 className="font-bold text-xl text-primary">Plano {selectedPlan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{selectedPlan.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">R$ {displayPrice}</div>
                        <div className="text-xs text-muted-foreground">/mês</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedPlan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pagamento processado por Stripe</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
