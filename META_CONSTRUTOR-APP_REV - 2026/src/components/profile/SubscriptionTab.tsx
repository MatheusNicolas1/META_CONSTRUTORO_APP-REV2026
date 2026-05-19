import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { usePlans } from '@/hooks/usePlans';
import { PlanCarousel } from '@/components/pricing/PlanCarousel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    plan: {
        id: string;
        name: string;
        monthly_price_cents: number;
        yearly_price_cents: number;
    };
    billing_cycle: 'monthly' | 'yearly';
}

export function SubscriptionTab() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const { data: plans, isLoading: plansLoading } = usePlans();

    useEffect(() => {
        loadSubscription();
    }, [user]);

    const loadSubscription = async () => {
        if (!user) return;

        try {
            const { data: orgMember } = await supabase
                .from('org_members')
                .select('org_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (!orgMember) {
                setLoading(false);
                return;
            }

            const { data: sub } = await supabase
                .from('subscriptions')
                .select(`
                    id,
                    status,
                    current_period_end,
                    billing_cycle,
                    plan:plans(id, name, monthly_price_cents, yearly_price_cents)
                `)
                .eq('org_id', orgMember.org_id)
                .in('status', ['active', 'trialing', 'past_due'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (sub) {
                setSubscription({
                    ...sub,
                    cancel_at_period_end: false
                } as any);
                setBillingCycle(sub.billing_cycle as 'monthly' | 'yearly');
            }
        } catch (error) {
            console.error("Erro ao carregar assinatura:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsPortalLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: { returnUrl: window.location.href }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Erro ao abrir portal:", error);
            toast({
                title: "Erro",
                description: "Nao foi possivel abrir o portal. Tente novamente.",
                variant: "destructive"
            });
            setIsPortalLoading(false);
        }
    };

    const startCheckout = (planId: string, cycle: 'monthly' | 'yearly') => {
        const plan = plans?.find(p => p.id === planId);
        if (!plan) return;

        if (plan.slug === 'business' || (!plan.monthly_price_cents && plan.slug !== 'free')) {
            toast({
                title: "Plano sob consulta",
                description: "Este plano precisa ser contratado com a equipe comercial.",
            });
            navigate('/contato');
            return;
        }

        if (!plan.slug) {
            toast({
                title: "Plano indisponivel",
                description: "Nao foi possivel identificar este plano. Tente novamente.",
                variant: "destructive"
            });
            return;
        }

        setCheckoutPlanId(planId);
        navigate(`/checkout?plan=${encodeURIComponent(plan.slug)}&billing=${cycle}`);
    };

    const handleSelectPlan = (planId: string) => {
        if (subscription && ['active', 'trialing'].includes(subscription.status)) {
            toast({
                title: "Alteracao de plano",
                description: "Voce sera redirecionado para o portal seguro para alterar seu plano.",
            });
            handleManageSubscription();
            return;
        }

        startCheckout(planId, billingCycle);
    };

    if (loading || plansLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);
    const activePlanPrice = ((subscription?.billing_cycle === 'yearly'
        ? subscription?.plan?.yearly_price_cents
        : subscription?.plan?.monthly_price_cents) || 0) / 100;

    return (
        <div className="space-y-8 animate-fade-in">
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <span>Meu Plano Atual</span>
                        </div>
                        <Badge variant={hasActiveSubscription ? 'default' : 'secondary'} className="px-3 shrink-0">
                            {hasActiveSubscription ? 'Ativo' : 'Gratuito / Inativo'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Gerencie sua assinatura e detalhes de pagamento
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                        <div>
                            <p className="text-2xl font-bold text-foreground">
                                {subscription?.plan?.name || "Plano Gratuito"}
                            </p>

                            {hasActiveSubscription && (
                                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                    <p>
                                        Valor: {activePlanPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        <span className="text-xs">/{subscription.billing_cycle === 'yearly' ? 'ano' : 'mes'}</span>
                                    </p>
                                    <p>
                                        Renovacao: {subscription.current_period_end
                                            ? format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                            : '-'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {hasActiveSubscription && (
                            <Button
                                onClick={handleManageSubscription}
                                disabled={isPortalLoading}
                                variant="outline"
                                className="gap-2 shrink-0"
                            >
                                {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                                Gerenciar Assinatura
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="text-center space-y-2 pt-4">
                    <h3 className="text-2xl font-bold tracking-tight">Planos Disponiveis</h3>
                    <p className="text-muted-foreground">
                        Escolha o plano ideal e continue pelo fluxo seguro de cadastro e pagamento
                    </p>
                </div>

                <div className="flex justify-center items-center mb-6 gap-3 sm:gap-4">
                    <span className="text-xs sm:text-sm font-medium">Mensal</span>
                    <Label>
                        <Switch
                            checked={billingCycle === 'yearly'}
                            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        />
                    </Label>
                    <span className="text-xs sm:text-sm font-medium text-center">
                        Anual <span className="text-primary font-semibold">(Economize 20%)</span>
                    </span>
                </div>

                <div className="pb-8">
                    <PlanCarousel
                        plans={(plans || []).map(p => ({
                            ...p,
                            price_monthly: p.monthly_price_cents || 0,
                            price_yearly: p.yearly_price_cents || 0
                        }))}
                        billingCycle={billingCycle}
                        selectedPlanId={null}
                        currentPlanId={subscription?.plan?.id}
                        onSelectPlan={handleSelectPlan}
                        isLoadingPlanId={checkoutPlanId}
                    />
                </div>
            </div>
        </div>
    );
}
