import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface CreateEquipamentoData {
  nome: string;
  categoria: string;
  status?: string;
  observacoes?: string;
}

export const useEquipamentosSupabase = () => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { userId, isLoading: userLoading } = useAuthUserId();

  const equipamentosQuery = useQuery({
    queryKey: ['equipamentos', orgId, userId],
    queryFn: async () => {
      if (!userId || !orgId) return [];

      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !userLoading && !!orgId && !!userId,
  });

  const createEquipamento = useMutation({
    mutationFn: async (equipamentoData: CreateEquipamentoData) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('equipamentos')
        .insert({
          ...equipamentoData,
          user_id: userId,
          org_id: orgId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos', orgId, userId] });
      toast.success('Equipamento cadastrado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar equipamento:', error);
      toast.error('Erro ao criar equipamento. Tente novamente.');
    },
  });

  const updateEquipamento = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateEquipamentoData>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('equipamentos')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos', orgId, userId] });
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar equipamento:', error);
      toast.error('Erro ao atualizar equipamento. Tente novamente.');
    },
  });

  const deleteEquipamento = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipamentos', orgId, userId] });
      toast.success('Equipamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir equipamento:', error);
      toast.error('Erro ao excluir equipamento. Tente novamente.');
    },
  });

  return {
    equipamentos: equipamentosQuery.data || [],
    isLoading: equipamentosQuery.isLoading || orgLoading || userLoading,
    error: equipamentosQuery.error,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento,
    refetch: equipamentosQuery.refetch,
  };
};
