import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { usePlans, Plan } from '@/hooks/usePlans';
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
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const { data: plans, isLoading: plansLoading } = usePlans();

    useEffect(() => {
        loadSubscription();
    }, [user]);

    const loadSubscription = async () => {
        if (!user) return;
        try {
            // Find organization first (simplified for single org per user)
            const { data: orgMember } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            if (!orgMember) {
                setLoading(false);
                return;
            }

            const { data: sub, error } = await supabase
                .from('subscriptions')
                .select(`
                    id,
                    status,
                    current_period_end,
                    billing_cycle,
                    plan:plans(id, name, monthly_price_cents, yearly_price_cents)
                `)
                .eq('org_id', orgMember.organization_id)
                .in('status', ['active', 'trialing', 'past_due'])
                .single();

            if (sub) {
                setSubscription({
                    ...sub,
                    cancel_at_period_end: false // Placeholder
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
                description: "Não foi possível abrir o portal. Tente novamente.",
                variant: "destructive"
            });
            setIsPortalLoading(false);
        }
    };

    const handleSelectPlan = (planId: string) => {
        if (subscription && subscription.status === 'active') {
            // If already has active subscription, must use portal
            toast({
                title: "Alteração de Plano",
                description: "Você será redirecionado para o portal seguro para alterar seu plano.",
            });
            handleManageSubscription();
        } else {
            // New subscription or re-subscription
            const plan = plans?.find(p => p.id === planId);
            if (plan) {
                navigate(`/checkout?plan=${plan.slug}&billing=${billingCycle}`);
            }
        }
    };

    if (loading || plansLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.status);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Current Subscription Status */}
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <span>Meu Plano Atual</span>
                        </div>
                        <Badge variant={hasActiveSubscription ? 'default' : 'secondary'} className="px-3">
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
                                        Valor: {((subscription.billing_cycle === 'yearly'
                                            ? subscription.plan?.yearly_price_cents
                                            : subscription.plan?.monthly_price_cents) || 0) / 100}
                                        <span className="text-xs">/{subscription.billing_cycle === 'yearly' ? 'ano' : 'mês'}</span>
                                    </p>
                                    <p>
                                        Renovação: {subscription.current_period_end
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

            {/* Available Plans */}
            <div className="space-y-6">
                <div className="text-center space-y-2 pt-4">
                    <h3 className="text-2xl font-bold tracking-tight">Planos Disponíveis</h3>
                    <p className="text-muted-foreground">
                        Escolha o plano ideal para suas necessidades
                    </p>
                </div>

                {/* Billing Cycle Toggle - Reused from PricingFlow logic conceptually, but simplified here */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                                    ? 'bg-background shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Anual
                            <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="pb-8">
                    {/* Map PlanCarousel Plan interface */}
                    <PlanCarousel
                        plans={(plans || []).map(p => ({
                            ...p,
                            price_monthly: p.monthly_price_cents || 0,
                            price_yearly: p.yearly_price_cents || 0
                        }))}
                        billingCycle={billingCycle}
                        selectedPlanId={null} // No selection state needed here, just action
                        currentPlanId={subscription?.plan?.id}
                        onSelectPlan={handleSelectPlan}
                    />
                </div>
            </div>
        </div>
    );
}
