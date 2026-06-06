import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface OrdemServicoRecord {
  id: string;
  obra_id: string;
  atividade_id?: string | null;
  numero: string;
  titulo: string;
  descricao: string;
  responsavel_user_id?: string | null;
  responsavel_nome?: string | null;
  data_limite: string;
  prioridade: string;
  status: string;
  motivo_bloqueio?: string | null;
}

export function useOrdensServico(obraId?: string) {
  const queryClient = useQueryClient();
  const { userId } = useAuthUserId();
  const { orgId } = useRequireOrg();

  const osQuery = useQuery({
    queryKey: ['ordens-servico', orgId, obraId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from('ordens_servico').select('*').eq('org_id', orgId);
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createOS = useMutation({
    mutationFn: async (os: { obra_id: string; titulo: string; descricao: string; data_limite: string; prioridade?: string; responsavel_nome?: string }) => {
      const { data, error } = await supabase.from('ordens_servico').insert({
        ...os,
        org_id: orgId,
        numero: `OS-${Date.now()}`,
        status: 'PENDENTE',
        created_by: userId,
        prioridade: os.prioridade || 'media',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', orgId] });
      toast.success('Ordem de serviço criada');
    },
    onError: (err) => { console.error(err); toast.error('Falha ao criar OS'); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, motivo_bloqueio }: { id: string; status: string; motivo_bloqueio?: string }) => {
      const updateData: any = { status };
      if (status === 'EM_ANDAMENTO') updateData.started_at = new Date().toISOString();
      if (status === 'CONCLUIDA') updateData.finished_at = new Date().toISOString();
      if (motivo_bloqueio) updateData.motivo_bloqueio = motivo_bloqueio;

      const { error } = await supabase.from('ordens_servico').update(updateData).eq('id', id).eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', orgId] });
      toast.success('Status atualizado');
    },
    onError: (err) => { console.error(err); toast.error('Falha ao atualizar'); },
  });

  return {
    isLoading: osQuery.isLoading,
    ordens: osQuery.data || [],
    createOS,
    updateStatus,
  };
}
