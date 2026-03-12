import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';

interface OrgCredits {
    id: string;
    org_id: string;
    rdo_credits_balance: number;
    plan_type: string;
    last_reset: string;
    created_at: string;
    updated_at: string;
}

/**
 * Hook para gerenciar créditos de RDO da organização.
 *
 * Retorna o saldo atual, tipo de plano e se há créditos disponíveis.
 * Mantém atualização em tempo real via subscription do Supabase.
 */
export function useCredits() {
    const { orgId, isLoading: orgLoading } = useRequireOrg();
    const queryClient = useQueryClient();

    const {
        data: credits,
        isLoading: creditsLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['org-credits', orgId],
        queryFn: async (): Promise<OrgCredits | null> => {
            if (!orgId) return null;

            const { data, error } = await supabase
                .from('org_credits')
                .select('*')
                .eq('org_id', orgId)
                .maybeSingle();

            if (error) {
                console.error('Erro ao buscar créditos:', error);
                throw error;
            }

            return data as OrgCredits | null;
        },
        enabled: !!orgId,
        staleTime: 1000 * 30, // 30 segundos
        refetchOnWindowFocus: true,
    });

    // Subscription realtime para atualizar quando créditos mudarem
    useEffect(() => {
        if (!orgId) return;

        const channel = supabase
            .channel(`org-credits-${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'org_credits',
                    filter: `org_id=eq.${orgId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['org-credits', orgId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId, queryClient]);

    const isFreePlan = credits?.plan_type === 'free';
    const balance = credits?.rdo_credits_balance ?? 0;
    const hasCredits = !isFreePlan || balance > 0;
    const isLowCredits = isFreePlan && balance <= 2 && balance > 0;
    const maxMonthlyRdos = isFreePlan ? 7 : null;
    const isLoading = orgLoading || creditsLoading;

    return {
        credits,
        balance,
        isFreePlan,
        hasCredits,
        isLowCredits,
        maxMonthlyRdos,
        isLoading,
        error,
        refetch,
    };
}
