import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuth } from '@/components/auth/AuthContext';

export const useRecentObras = () => {
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['recent-obras', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !!orgId && isAuthenticated,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
