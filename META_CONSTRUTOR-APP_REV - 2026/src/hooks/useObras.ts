import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyObraChange } from '@/utils/notificationService';
import { usePermissions } from './usePermissions';
import { useRequireOrg } from '@/hooks/requireOrg';
import { track } from '@/integrations/analytics';

export interface CreateObraData {
  nome: string;
  cliente: string;
  localizacao: string;
  responsavel: string;
  tipo: string;
  data_inicio: string;
  previsao_termino: string;
  observacoes?: string;
  descricao?: string;
  area?: string;
  prioridade?: string;
}

export const useObras = () => {
  const queryClient = useQueryClient();
  const { obra: obraPerms } = usePermissions();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // Realtime subscription for obras updates
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`obras-realtime-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'obras',
          filter: `org_id=eq.${orgId}`
        },
        (payload) => {
          console.log('Obras realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
          queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, orgId]);

  const obrasQuery = useQuery({
    queryKey: ['obras', orgId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !!orgId,
  });

  const createObra = useMutation({
    mutationFn: async (obraData: CreateObraData) => {
      // Validar permissões e limites
      if (!obraPerms.canCreate) {
        if (obraPerms.isAtLimit) {
          throw new Error('Limite de obras atingido para seu plano. Faça upgrade para continuar.');
        }
        throw new Error('Você não tem permissão para criar obras.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('obras')
        .insert({
          ...obraData,
          org_id: orgId,
          user_id: user.id,
          progresso: 0,
          status: 'Iniciando',
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar notificação
      await notifyObraChange(user.id, obraData.nome, 'created', data.id, orgId);

      // M9: Analytics
      track('product.obra_created', {
        obra_id: data.id,
        org_id: orgId,
        user_id: user.id,
        tipo: obraData.tipo,
        localizacao: obraData.localizacao
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
      toast.success('Obra criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar obra:', error);
      toast.error('Erro ao criar obra. Tente novamente.');
    },
  });

  const updateObra = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateObraData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('obras')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificação
      await notifyObraChange(user.id, data.nome, 'updated', id, orgId);

      // M9: Analytics
      track('product.obra_updated', {
        obra_id: id,
        org_id: orgId,
        fields_updated: Object.keys(updateData)
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
      toast.success('Obra atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar obra:', error);
      toast.error('Erro ao atualizar obra. Tente novamente.');
    },
  });

  const deleteObra = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar nome da obra antes de deletar
      const { data: obraData } = await supabase
        .from('obras')
        .select('nome')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;

      // Enviar notificação
      if (obraData) {
        await notifyObraChange(user.id, obraData.nome, 'deleted', undefined, orgId);

        // M9: Analytics
        track('product.obra_deleted', {
          obra_id: id,
          org_id: orgId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
      toast.success('Obra excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir obra:', error);
      toast.error('Erro ao excluir obra. Tente novamente.');
    },
  });

  return {
    obras: obrasQuery.data || [],
    isLoading: obrasQuery.isLoading,
    error: obrasQuery.error,
    createObra,
    updateObra,
    deleteObra,
    refetch: obrasQuery.refetch,
  };
};
