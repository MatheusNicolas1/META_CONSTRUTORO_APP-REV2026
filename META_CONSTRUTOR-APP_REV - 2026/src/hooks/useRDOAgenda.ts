import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import type { RDOAgenda, ResumoNicho, ResumoGeral } from '@/types/rdo';

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
  const agendaQuery = (data: string) =>
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

        // 2. Buscar RDOs daquele dia, com dados do nicho
        const { data: rdos, error: rdosError } = await supabase
          .from('rdos')
          .select(`
            *,
            rdo_nichos!inner(id, nome, slug, cor, icone)
          `)
          .eq('org_id', orgId)
          .eq('data', data)
          .not('nicho_id', 'is', null)
          .order('created_at', { ascending: true });

        if (rdosError) throw rdosError;

        // 3. Agrupar RDOs por nicho
        const rdosPorNicho: Record<string, unknown[]> = {};
        for (const rdo of rdos || []) {
          const nicho = (rdo as Record<string, unknown>).rdo_nichos as Record<string, unknown> | null;
          const chave = nicho?.slug as string || 'sem-nicho';
          if (!rdosPorNicho[chave]) rdosPorNicho[chave] = [];
          rdosPorNicho[chave].push(rdo);
        }

        return {
          ...(agenda as RDOAgenda),
          rdos: rdosPorNicho,
        };
      },
      enabled: !orgLoading && !!orgId && !!data,
    });

  // ── Resumo por nicho (Edge Function) ──────────────────────────
  const resumoNichoQuery = (data: string, slug: string) =>
    useQuery({
      queryKey: ['rdos', 'agenda', 'nicho', orgId, data, slug],
      queryFn: async (): Promise<ResumoNicho> => {
        const { data: result, error } = await supabase.functions.invoke(
          'resumo-diario-nicho',
          {
            body: {
              org_id: orgId,
              data,
              nicho_slug: slug,
            },
          },
        );

        if (error) throw error;
        if (result?.error) throw new Error(result.error.message || 'Erro ao gerar resumo do nicho');

        return result as ResumoNicho;
      },
      enabled: !orgLoading && !!orgId && !!data && !!slug,
    });

  // ── Resumo geral (Edge Function) ──────────────────────────────
  const resumoGeralQuery = (data: string) =>
    useQuery({
      queryKey: ['rdos', 'agenda', 'geral', orgId, data],
      queryFn: async (): Promise<ResumoGeral> => {
        const { data: result, error } = await supabase.functions.invoke(
          'resumo-diario-geral',
          {
            body: {
              org_id: orgId,
              data,
            },
          },
        );

        if (error) throw error;
        if (result?.error) throw new Error(result.error.message || 'Erro ao gerar resumo geral');

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
    agendaQuery,
    resumoNichoQuery,
    resumoGeralQuery,
    updateAgendaMutation,
  };
};
