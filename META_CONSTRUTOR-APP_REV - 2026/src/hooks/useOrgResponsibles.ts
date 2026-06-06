import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';

export interface OrgResponsible {
  id: string;
  nome: string;
  email: string;
  funcao: string;
}

export const useOrgResponsibles = () => {
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  const responsiblesQuery = useQuery({
    queryKey: ['org-responsibles', orgId],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;
      const currentUserFallback = async (): Promise<OrgResponsible[]> => {
        if (!currentUser?.id) return [];

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', currentUser.id)
          .maybeSingle();

        return [{
          id: currentUser.id,
          nome: profile?.name || currentUser.user_metadata?.name || profile?.email || currentUser.email || 'Usuario',
          email: profile?.email || currentUser.email || '',
          funcao: 'Responsavel',
        }];
      };

      const { data: memberships, error: membershipsError } = await supabase
        .from('org_members' as any)
        .select('user_id, role')
        .eq('org_id', orgId)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const userIds = [...new Set((memberships || []).map((membership: any) => membership.user_id).filter(Boolean))];
      if (userIds.length === 0) return currentUserFallback();

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));

      const responsibles = (memberships || []).map((membership: any) => {
        const profile = profileMap.get(membership.user_id);
        return {
          id: membership.user_id,
          nome: profile?.name || profile?.email || 'Usuario',
          email: profile?.email || '',
          funcao: membership.role || 'Responsavel',
        } satisfies OrgResponsible;
      });

      if (responsibles.length > 0) return responsibles;
      return currentUserFallback();
    },
    enabled: !!orgId && !orgLoading,
    placeholderData: [],
  });

  return {
    responsibles: responsiblesQuery.data || [],
    isLoading: responsiblesQuery.isLoading || orgLoading,
    error: responsiblesQuery.error,
    refetch: responsiblesQuery.refetch,
  };
};
