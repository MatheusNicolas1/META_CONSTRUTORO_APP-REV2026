import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import type { RDOAgenda, ResumoNicho, ResumoGeral } from '@/types/rdo';
import { agruparRDOsPorNicho, SLUG_SEM_NICHO } from '@/utils/rdoAgrupamento';
import type { RDOAgrupavel, NichoAgrupavel } from '@/utils/rdoAgrupamento';

interface UpdateAgendaData {
  id: string;
  data: {
    resumo_geral?: string;
    clima_geral?: string;
    observacoes_gestor?: string;
    titulo?: string;
  };
}

interface AgendaComRDOs extends RDOAgenda {
  rdos: Record<string, unknown[]>; // RDOs agrupados por nicho
}

/**
 * Hook TanStack Query para agenda diária de RDOs.
 * Gerencia:
 * - Listagem de agendas por data + RDOs agrupados por nicho
 * - Resumo por nicho (Edge Function resumo-diario-nicho)
 * - Resumo geral (Edge Function resumo-diario-geral)
 * - Atualização de metadados da agenda
 */
export const useRDOAgenda = () => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // ── Agenda diária com RDOs agrupados por nicho ──────────────────
  const useAgendaQuery = (data: string) =>
    useQuery({
      queryKey: ['rdos', 'agenda', orgId, data],
      queryFn: async (): Promise<AgendaComRDOs | null> => {
        // 1. Buscar a agenda do dia
        const { data: agenda, error: agendaError } = await supabase
          .from('rdo_agendas')
          .select('*')
          .eq('org_id', orgId)
          .eq('data', data)
          .single();

        if (agendaError) {
          // Se não existir agenda, retorna null (não é erro)
          if (agendaError.code === 'PGRST116') return null;
          throw agendaError;
        }

        // 2. Buscar nichos da organização (ordem de exibição)
        const { data: nichos, error: nichosError } = await supabase
          .from('rdo_nichos')
          .select('id, slug, nome, cor, icone')
          .eq('org_id', orgId)
          .order('ordem', { ascending: true });

        if (nichosError) throw nichosError;

        // 3. Buscar RDOs daquele dia (inclui RDOs sem nicho)
        const { data: rdos, error: rdosError } = await supabase
          .from('rdos')
          .select('*')
          .eq('org_id', orgId)
          .eq('data', data)
          .order('created_at', { ascending: true });

        if (rdosError) throw rdosError;

        // 4. Agrupar RDOs por nicho (utilidade pura testada)
        const grupos = agruparRDOsPorNicho(
          (rdos || []) as RDOAgrupavel[],
          (nichos || []) as NichoAgrupavel[],
        );

        const rdosPorNicho: Record<string, unknown[]> = {};
        for (const grupo of grupos) {
          const chave = grupo.nicho?.slug ?? SLUG_SEM_NICHO;
          rdosPorNicho[chave] = grupo.rdos as unknown[];
        }

        return {
          ...(agenda as RDOAgenda),
          rdos: rdosPorNicho,
        };
      },
      enabled: !orgLoading && !!orgId && !!data,
    });

  // ── Resumo por nicho (Edge Function) ──────────────────────────
  const useResumoNichoQuery = (data: string, slug: string) =>
    useQuery({
      queryKey: ['rdos', 'agenda', 'nicho', orgId, data, slug],
      queryFn: async (): Promise<ResumoNicho> => {
        const { data: result, error } = await supabase.rpc(
          'resumo_diario_nicho',
          {
            p_org_id: orgId,
            p_data: data,
            p_nicho_slug: slug,
          },
        );

        if (error) throw error;

        return result as ResumoNicho;
      },
      enabled: !orgLoading && !!orgId && !!data && !!slug,
    });

  // ── Resumo geral (Edge Function) ──────────────────────────────
  const useResumoGeralQuery = (data: string) =>
    useQuery({
      queryKey: ['rdos', 'agenda', 'geral', orgId, data],
      queryFn: async (): Promise<ResumoGeral> => {
        const { data: result, error } = await supabase.rpc(
          'resumo_diario_geral',
          {
            p_org_id: orgId,
            p_data: data,
          },
        );

        if (error) throw error;

        return result as ResumoGeral;
      },
      enabled: !orgLoading && !!orgId && !!data,
    });

  // ── Atualizar metadados da agenda ──────────────────────────────
  const updateAgendaMutation = useMutation({
    mutationFn: async ({ id, data }: UpdateAgendaData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updatePayload: Record<string, unknown> = {};
      if (data.resumo_geral !== undefined) updatePayload.resumo_geral = data.resumo_geral;
      if (data.clima_geral !== undefined) updatePayload.clima_geral = data.clima_geral;
      if (data.observacoes_gestor !== undefined) updatePayload.observacoes_gestor = data.observacoes_gestor;
      if (data.titulo !== undefined) updatePayload.titulo = data.titulo;

      updatePayload.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('rdo_agendas')
        .update(updatePayload)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return updated as RDOAgenda;
    },
    onSuccess: (data) => {
      const dataStr = data.data;
      queryClient.invalidateQueries({ queryKey: ['rdos', 'agenda', orgId, dataStr] });
      queryClient.invalidateQueries({ queryKey: ['rdos', 'agenda', 'geral', orgId, dataStr] });
      toast.success('Agenda atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar agenda:', error);
      toast.error('Erro ao atualizar agenda. ' + error.message);
    },
  });

  return {
    useAgendaQuery,
    useResumoNichoQuery,
    useResumoGeralQuery,
    updateAgendaMutation,
  };
};
