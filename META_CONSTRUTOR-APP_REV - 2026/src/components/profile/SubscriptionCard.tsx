
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Package, ArrowRight, AlertTriangle } from 'lucide-react';

export function SubscriptionCard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch current subscription
    const { data: subscription, isLoading } = useQuery({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            const { data: orgMember, error: orgError } = await supabase
                .from('org_members')
                .select('org_id')
                .eq('user_id', user?.id)
                .eq('status', 'active')
                .maybeSingle();

            if (orgError) throw orgError;
            if (!orgMember?.org_id) return null;

            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
          *,
          plan:plans(*)
        `)
                .eq('org_id', orgMember.org_id)
                .in('status', ['active', 'trialing', 'past_due', 'canceled'])
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    if (isLoading) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    const hasActiveSubscription = subscription && ['active', 'trialing', 'past_due'].includes(subscription.status);
    const isCanceled = subscription?.cancel_at_period_end;
    const planName = subscription?.plan?.name || 'Gratuito';
    const renewalDate = subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR') : '-';
    const status = subscription?.status === 'trialing' ? 'TRIAL' : subscription?.status?.toUpperCase() || 'GRATUITO';

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span>Meu Plano</span>
                    </div>
                    <Badge variant={hasActiveSubscription ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
                        {status}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Resumo da sua assinatura atual
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 pb-2">

                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-foreground tracking-tight">{planName}</span>
                    {hasActiveSubscription && (
                        <span className="text-sm text-muted-foreground">
                            Renova em {renewalDate}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Calendar className="h-3.5 w-3.5" /> Ciclo
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                            {subscription?.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
                        </p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Package className="h-3.5 w-3.5" /> Nível
                        </p>
                        <p className="text-sm font-semibold text-foreground truncate">
                            {planName}
                        </p>
                    </div>
                </div>

                {isCanceled && (
                    <div className="flex items-start gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-md text-sm">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="text-xs font-medium">Cancelamento agendado. Acesso até {renewalDate}.</span>
                    </div>
                )}

            </CardContent>

            <CardFooter className="pt-2 pb-6">
                <Button
                    onClick={() => navigate('/preco')}
                    className="w-full gap-2 group"
                    variant="outline"
                >
                    Gerenciar Plano
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
