import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
    id: string;
    status: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    plan: {
        name: string;
        monthly_price_cents: number;
        yearly_price_cents: number;
    };
    billing_cycle: 'monthly' | 'yearly';
}

export function SubscriptionManagement() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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
                    metadata,
                    plan:plans(name, monthly_price_cents, yearly_price_cents)
                `)
                .eq('org_id', orgMember.organization_id)
                .in('status', ['active', 'trialing', 'past_due'])
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Erro ao carregar assinatura:", error);
            }

            if (sub) {
                // Check if canceled at period end from metadata or standard stripe field if we had it mapped
                // Current schema doesn't have cancel_at_period_end column explicitly mapped in select above?
                // Let's assume metadata or calculate from canceled_at if needed.
                // For now, let's use a simple state or check metadata if available.
                // Actually, let's just use what we have.
                setSubscription({
                    ...sub,
                    cancel_at_period_end: false // Placeholder until we map this field or check Stripe
                } as any);
            }

        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

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
                description: "Não foi possível abrir o portal de assinatura. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return <Card className="animate-pulse h-48" />;
    }

    if (!subscription) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Minha Assinatura
                    </CardTitle>
                    <CardDescription>
                        Você está no plano Gratuito
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Faça um upgrade para desbloquear todos os recursos e aumentar seus limites.
                    </p>
                    <Button onClick={() => navigate('/preco')}>
                        Ver Planos
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Minha Assinatura
                    </div>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'Ativa' : subscription.status}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Gerencie seu plano e método de pagamento
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
                        <p className="text-lg font-bold">{subscription.plan?.name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Valor</p>
                        {subscription.billing_cycle === 'yearly' ? (
                            <div>
                                <p className="text-lg font-bold">
                                    {((subscription.plan?.yearly_price_cents || 0) / 12 / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Cobrado anualmente · {((subscription.plan?.yearly_price_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/ano
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold">
                                {((subscription.plan?.monthly_price_cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Próxima renovação</p>
                        <p className="text-base">
                            {subscription.current_period_end
                                ? format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                : '-'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button
                        onClick={handleManageSubscription}
                        disabled={isProcessing}
                        className="flex-1 sm:flex-none"
                    >
                        {isProcessing ? "Carregando..." : "Gerenciar Assinatura"}
                    </Button>
                    <p className="text-xs text-muted-foreground flex items-center">
                        * Você será redirecionado para o portal seguro da Stripe para alterar plano, cartão ou cancelar.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
