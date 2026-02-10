import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyRDOChange } from '@/utils/notificationService';
import { useRequireOrg } from '@/hooks/requireOrg';
import { track } from '@/integrations/analytics';

export interface CreateRDOData {
  obra_id: string;
  data: string;
  periodo: string;
  clima: string;
  equipe_ociosa?: boolean;
  tempo_ocioso?: number;
  observacoes?: string;
}

export const useRDOs = () => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // Realtime subscription for RDOs updates
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`rdos-realtime-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdos',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          console.log('RDOs realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
          queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, orgId]);

  const rdosQuery = useQuery({
    queryKey: ['rdos', orgId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('rdos')
        .select(`
          *,
          obras (nome)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !!orgId,
  });

  const createRDO = useMutation({
    mutationFn: async (rdoData: CreateRDOData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('rdos')
        .insert({
          ...rdoData,
          org_id: orgId,
          criado_por_id: user.id,
          status: 'Em elaboração',
        })
        .select(`*, obras (nome)`)
        .single();

      if (error) throw error;

      // Enviar notificação
      const obraName = data.obras?.nome || 'Obra';
      await notifyRDOChange(user.id, obraName, rdoData.data, 'created', data.id);

      // M9: Analytics
      track('product.rdo_created', {
        rdo_id: data.id,
        org_id: orgId,
        obra_id: rdoData.obra_id,
        data: rdoData.data
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      toast.success('RDO criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar RDO:', error);
      toast.error('Erro ao criar RDO. Tente novamente.');
    },
  });

  const updateRDO = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateRDOData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('rdos')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select(`*, obras (nome)`)
        .single();

      if (error) throw error;

      // Enviar notificação
      const obraName = data.obras?.nome || 'Obra';
      await notifyRDOChange(user.id, obraName, data.data, 'updated', id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      toast.success('RDO atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar RDO:', error);
      toast.error('Erro ao atualizar RDO. Tente novamente.');
    },
  });

  const submitForApproval = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('rdos')
        .update({ status: 'Aguardando aprovação' })
        .eq('id', id)
        .eq('org_id', orgId)
        .select(`*, obras (nome)`)
        .single();

      if (error) throw error;

      // Enviar notificação especial para aprovação
      const obraName = data.obras?.nome || 'Obra';
      await notifyRDOChange(user.id, obraName, data.data, 'submitted', id);

      // M9: Analytics
      track('product.rdo_submitted', {
        rdo_id: id,
        org_id: orgId,
        obra_id: data.obra_id,
        status_to: 'Aguardando aprovação'
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      toast.success('RDO enviado para aprovação!');
    },
    onError: (error) => {
      console.error('Erro ao enviar RDO:', error);
      toast.error('Erro ao enviar RDO para aprovação.');
    },
  });

  const deleteRDO = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do RDO antes de deletar
      const { data: rdoData } = await supabase
        .from('rdos')
        .select(`*, obras (nome)`)
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      const { error } = await supabase
        .from('rdos')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;

      // Enviar notificação
      if (rdoData) {
        const obraName = rdoData.obras?.nome || 'Obra';
        await notifyRDOChange(user.id, obraName, rdoData.data, 'deleted');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      toast.success('RDO excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir RDO:', error);
      toast.error('Erro ao excluir RDO. Tente novamente.');
    },
  });

  return {
    rdos: rdosQuery.data || [],
    isLoading: rdosQuery.isLoading,
    error: rdosQuery.error,
    createRDO,
    updateRDO,
    submitForApproval,
    deleteRDO,
    refetch: rdosQuery.refetch,
  };
};
