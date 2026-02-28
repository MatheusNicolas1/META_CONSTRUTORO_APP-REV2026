import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
    id: string;
    slug: string;
    name: string;
    description: string;
    monthly_price_cents: number | null;
    yearly_price_cents: number | null;
    features: string[];
    is_active: boolean;
    is_popular: boolean;
    display_order: number;
    stripe_price_id_monthly: string | null;
    stripe_price_id_yearly: string | null;
}

export const usePlans = () => {
    return useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('plans' as any)
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                throw error;
            }

            // Parse features JSON ensuring it is strictly string[]
            const parsedData = (data as any[]).map(plan => ({
                ...plan,
                features: Array.isArray(plan.features)
                    ? plan.features.map(String)
                    : []
            })) as Plan[];

            return parsedData;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
