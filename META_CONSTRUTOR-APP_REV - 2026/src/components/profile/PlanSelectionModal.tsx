import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlans } from '@/hooks/usePlans';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { EmbeddedCheckoutComponent } from './EmbeddedCheckout';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlanId?: string;
    hasActiveSubscription: boolean;
}

export function PlanSelectionModal({ isOpen, onClose, currentPlanId, hasActiveSubscription }: PlanSelectionModalProps) {
    const { data: plans, isLoading: isLoadingPlans } = usePlans();
    const queryClient = useQueryClient();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

    const changeSubscriptionMutation = useMutation({
        mutationFn: async ({ newPriceId }: { newPriceId: string }) => {
            // Apenas para alterações de plano em assinaturas ativas
            const { data, error } = await supabase.functions.invoke('change-subscription', {
                body: { newPriceId }
            });
            if (error) throw new Error(error.message || 'Erro ao alterar plano');
            return data;
        },
        onSuccess: () => {
            toast.success('Plano atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            onClose();
        },
        onError: (error) => {
            toast.error(`Erro: ${error.message}`);
        },
        onSettled: () => setLoadingAction(null),
    });

    const handleSelectPlan = (priceId: string) => {
        if (!hasActiveSubscription) {
            // Nova assinatura: abrir Embedded Checkout
            setCheckoutPriceId(priceId);
        } else {
            // Alteração de plano: chamar mutation
            setLoadingAction(priceId);
            changeSubscriptionMutation.mutate({ newPriceId: priceId });
        }
    };

    const handleCheckoutClose = () => {
        setCheckoutPriceId(null);
        // Opcional: recarregar dados se o usuário completou (mas difícil saber sem webhook/return_url específico aqui)
        // O checkout do Stripe geralmente redireciona no sucesso para a return_url configurada no backend.
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Escolha seu Plano</DialogTitle>
                        <DialogDescription>
                            Faça um upgrade para desbloquear mais recursos.
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingPlans ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            {plans?.map((plan) => {
                                const isCurrent = plan.id === currentPlanId;
                                const priceMonthly = plan.monthly_price_cents ? (plan.monthly_price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Grátis';

                                return (
                                    <Card key={plan.id} className={`${isCurrent ? 'border-primary ring-1 ring-primary' : ''} flex flex-col`}>
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center text-lg">
                                                {plan.name}
                                                {isCurrent && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                                            </CardTitle>
                                            <CardDescription className="text-sm">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="mb-4">
                                                <span className="text-2xl font-bold">{priceMonthly}</span>
                                                <span className="text-muted-foreground text-sm">/mês</span>
                                            </div>
                                            <ul className="space-y-2">
                                                {plan.features?.map((feature: string, i: number) => (
                                                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            {!isCurrent && plan.stripe_price_id_monthly && (
                                                <Button
                                                    className="w-full"
                                                    size="sm"
                                                    onClick={() => handleSelectPlan(plan.stripe_price_id_monthly!)}
                                                    disabled={!!loadingAction}
                                                >
                                                    {loadingAction === plan.stripe_price_id_monthly && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                    {hasActiveSubscription ? 'Mudar para este' : 'Assinar'}
                                                </Button>
                                            )}
                                            {isCurrent && (
                                                <Button className="w-full" size="sm" disabled variant="secondary">Plano Atual</Button>
                                            )}
                                            {!plan.stripe_price_id_monthly && (
                                                <Button className="w-full" size="sm" variant="outline" onClick={() => window.location.href = '/contato'}>Falar com Vendas</Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Embedded Checkout Overlay */}
            {checkoutPriceId && (
                <EmbeddedCheckoutComponent
                    priceId={checkoutPriceId}
                    onClose={handleCheckoutClose}
                />
            )}
        </>
    );
}
