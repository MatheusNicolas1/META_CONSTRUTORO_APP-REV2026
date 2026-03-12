import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePermissions } from './usePermissions';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface CreateEquipeData {
  nome: string;
  funcao: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

export const useEquipesSupabase = () => {
  const queryClient = useQueryClient();
  const { equipe: equipePerms } = usePermissions();
  const { orgId } = useRequireOrg();
  const { userId, isLoading: userLoading } = useAuthUserId();

  const equipesQuery = useQuery({
    queryKey: ['equipes', orgId], // Org-Bound Cache Key covers schema drift
    queryFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!userId,
    // Start with empty data to avoid flash of content
    placeholderData: [],
    // Avoid refetching immediately if we just got an error
    retry: (failureCount, error) => {
      // Don't retry 400/401/403
      if ((error as any)?.status === 400 || (error as any)?.status === 401 || (error as any)?.status === 403) return false;
      return failureCount < 3;
    }
  });

  const createEquipe = useMutation({
    mutationFn: async (equipeData: CreateEquipeData) => {
      //Validar permissões e limites
      if (!equipePerms.canCreate) {
        if (equipePerms.isAtLimit) {
          throw new Error('Limite de colaboradores atingido para seu plano. Faça upgrade para continuar.');
        }
        throw new Error('Você não tem permissão para cadastrar colaboradores.');
      }

      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('equipes')
        .insert({
          ...equipeData,
          user_id: userId,
          ativo: equipeData.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes', orgId] });
      toast.success('Colaborador cadastrado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error('Erro ao cadastrar colaborador. Tente novamente.');
    },
  });

  const updateEquipe = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateEquipeData>) => {
      const { data, error } = await supabase
        .from('equipes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes', orgId] });
      toast.success('Colaborador atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar colaborador:', error);
      toast.error('Erro ao atualizar colaborador. Tente novamente.');
    },
  });

  const deleteEquipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipes', orgId] });
      toast.success('Colaborador excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir colaborador:', error);
      toast.error('Erro ao excluir colaborador. Tente novamente.');
    },
  });

  return {
    equipes: equipesQuery.data || [],
    isLoading: equipesQuery.isLoading || userLoading,
    error: equipesQuery.error,
    createEquipe,
    updateEquipe,
    deleteEquipe,
    refetch: equipesQuery.refetch,
  };
};
