import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuth } from '@/components/auth/AuthContext';

export const useDashboardStats = () => {
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Run all queries in parallel for speed
      const [obrasResult, equipesResult, equipamentosResult, atividadesResult] = await Promise.all([
        // 1. Obras da organização
        supabase
          .from('obras')
          .select('id, status')
          .eq('org_id', orgId!),

        // 2. Equipes ativas do usuário
        supabase
          .from('equipes')
          .select('id, ativo')
          .eq('user_id', user.id)
          .eq('ativo', true),

        // 3. Equipamentos operacionais do usuário
        supabase
          .from('equipamentos')
          .select('id, status')
          .eq('user_id', user.id)
          .in('status', ['Operacional', 'Em uso']),

        // 4. Atividades pendentes do usuário
        supabase
          .from('atividades')
          .select('id, status')
          .eq('user_id', user.id)
          .in('status', ['Pendente', 'Em andamento', 'agendada', 'em_andamento']),
      ]);

      // Handle errors gracefully — don't let one failing query break everything
      if (obrasResult.error) console.error('[DashboardStats] Obras:', obrasResult.error);
      if (equipesResult.error) console.error('[DashboardStats] Equipes:', equipesResult.error);
      if (equipamentosResult.error) console.error('[DashboardStats] Equipamentos:', equipamentosResult.error);
      if (atividadesResult.error) console.error('[DashboardStats] Atividades:', atividadesResult.error);

      const obras = obrasResult.data || [];
      const equipes = equipesResult.data || [];
      const equipamentos = equipamentosResult.data || [];
      const atividades = atividadesResult.data || [];

      // 5. RDOs pendentes (via obras da org)
      const obraIds = obras.map(o => o.id);
      let rdosCount = 0;
      if (obraIds.length > 0) {
        const { data: rdos, error: rdosError } = await supabase
          .from('rdos')
          .select('id')
          .in('obra_id', obraIds)
          .eq('status', 'DRAFT');

        if (rdosError) {
          console.error('[DashboardStats] RDOs:', rdosError);
        } else {
          rdosCount = rdos?.length || 0;
        }
      }

      // Contar obras ativas
      const obrasAtivas = obras.filter(o =>
        o.status === 'ACTIVE' || o.status === 'Em andamento' || o.status === 'DRAFT'
      ).length;

      const totalPendentes = atividades.length + rdosCount;

      return {
        obrasAtivas,
        obrasAtivasDescricao: obrasAtivas === 0
          ? 'Nenhuma obra cadastrada'
          : `${obrasAtivas} obra${obrasAtivas > 1 ? 's' : ''} em andamento`,
        equipesTrabalhando: equipes.length,
        equipesDescricao: equipes.length === 0
          ? 'Cadastre equipes nas obras'
          : `${equipes.length} equipe${equipes.length > 1 ? 's' : ''} ativa${equipes.length > 1 ? 's' : ''}`,
        equipamentosAtivos: equipamentos.length,
        equipamentosDescricao: equipamentos.length === 0
          ? 'Nenhum equipamento cadastrado'
          : `${equipamentos.length} em operação`,
        atividadesPendentes: totalPendentes,
        atividadesDescricao: totalPendentes === 0
          ? 'Nenhuma atividade pendente'
          : `${atividades.length} atividade${atividades.length !== 1 ? 's' : ''} + ${rdosCount} RDO${rdosCount !== 1 ? 's' : ''}`
      };
    },
    enabled: !orgLoading && !!orgId && isAuthenticated && !!user?.id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
