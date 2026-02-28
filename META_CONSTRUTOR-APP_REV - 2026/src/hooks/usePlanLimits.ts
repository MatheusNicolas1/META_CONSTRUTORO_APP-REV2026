import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPlanLimits, PLAN_LIMITS } from "../utils/planLimits";

export const usePlanLimits = () => {
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile-plan'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const [profileResult, roleResult] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('plan_type')
                    .eq('id', user.id)
                    .single(),
                supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle()
            ]);

            if (profileResult.error) throw profileResult.error;

            return {
                plan_type: profileResult.data?.plan_type || 'free',
                role: roleResult.data?.role
            };
        },
    });

    // Presidente sempre tem acesso ilimitado (business), independente do plan_type
    const isPresidente = profile?.role === 'Presidente';
    const planType = (isPresidente ? 'business' : (profile?.plan_type || 'free')) as string;
    const limits = isPresidente ? PLAN_LIMITS.business : getPlanLimits(planType);

    return {
        planType,
        limits,
        isLoading: isProfileLoading,
        isPresidente,
    };
};
