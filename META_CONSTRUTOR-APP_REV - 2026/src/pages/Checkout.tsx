
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import LandingNavigation from '@/components/landing/LandingNavigation';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import CheckoutDialog from '@/components/ui/checkout-dialog';
import { CheckoutForm, CheckoutFormData } from '@/components/pricing/CheckoutForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [defaultFormValues, setDefaultFormValues] = useState<Partial<CheckoutFormData>>({});

  const planKey = searchParams.get('plan') || 'basic';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    (searchParams.get('billing') as 'monthly' | 'yearly') || 'monthly'
  );

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

  const createSubscriptionIntent = async (userId: string, email: string, cycle: 'monthly' | 'yearly') => {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { plan: planKey, billing: cycle, user_id: userId, email }
    });
    if (error || !data?.clientSecret) throw new Error(error?.message || 'Erro ao inicializar pagamento');
    return data.clientSecret;
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
          toast({ title: "Sucesso!", description: "Redirecionando para o dashboard..." });
          setTimeout(() => navigate('/app/dashboard'), 1500);
          return;
        }

        const secret = await createSubscriptionIntent(user.id, user.email, billingCycle);
        setClientSecret(secret);
        setStep('payment');
        return;
      }

      // 1. Sign Up
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || 'TemporaryPass123!', // Should be handled better in real app, prompted or auto-generated logic
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
          toast({ title: "Conta já existe", description: "Faça login para continuar.", variant: "destructive" });
          // Logic to handle existing user could be added here
        } else {
          throw signUpError;
        }
        return;
      }

      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Free Plan
      if (planKey === 'free') {
        toast({ title: "Sucesso!", description: "Redirecionando para o dashboard..." });
        setTimeout(() => navigate('/app/dashboard'), 1500);
        return;
      }

      // 3. Paid Plan -> Intent
      const secret = await createSubscriptionIntent(authData.user.id, authData.user.email!, billingCycle);
      setClientSecret(secret);
      setStep('payment');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPlansLoading || !selectedPlan) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-[600px] w-full max-w-4xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <SEO title="Finalizar Assinatura" description="Checkout seguro Meta Construtor" />
      <LandingNavigation />

      <main className="pt-32 pb-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Stepper */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300", step === 'details' ? "border-primary bg-primary text-primary-foreground" : "border-primary bg-primary text-primary-foreground")}>
                <span className="font-bold">1</span>
              </div>
              <div className={cn("h-1 w-20 rounded-full transition-all duration-300", step === 'payment' ? "bg-primary" : "bg-muted")} />
              <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300", step === 'payment' ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground")}>
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
                          {step === 'details' ? 'Dados da Conta' : 'Pagamento Seguro'}
                        </CardTitle>
                        <CardDescription>
                          {step === 'details' ? 'Informe seus dados para criar o acesso.' : 'Finalize sua assinatura com segurança.'}
                        </CardDescription>
                      </div>
                      <Lock className="w-6 h-6 text-green-600/80" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <AnimatePresence mode="wait">
                      {step === 'details' ? (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <CheckoutForm
                            onSubmit={handleDetailsSubmit}
                            loading={isLoading}
                            defaultValues={defaultFormValues}
                            showPasswordFields={!isAuthenticated}
                          />
                        </motion.div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground mb-4">O modal de pagamento seguro foi aberto.</p>
                          <Button variant="outline" onClick={() => setStep('details')}>Voltar para dados</Button>

                          <CheckoutDialog
                            open={true}
                            onOpenChange={(open) => !open && setStep('details')}
                            clientSecret={clientSecret}
                            planName={selectedPlan.name}
                            amount={displayPrice}
                            period="mês"
                            billingCycle={billingCycle}
                            onBillingChange={async (c) => {
                              setBillingCycle(c);
                              // Re-fetch intent logic would go here if switching allowed at this stage
                            }}
                            planPrice={rawMonthlyPrice} // Simplified for display
                          />
                        </div>
                      )}
                    </AnimatePresence>
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
