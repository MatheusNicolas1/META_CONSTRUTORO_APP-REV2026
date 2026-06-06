import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';
import { triggerSuccessFeedback } from '@/hooks/useSuccessFeedback';

export interface CreateFornecedorData {
  nome: string;
  categoria: string;
  contato: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  ativo?: boolean;
}

export const useFornecedores = () => {
  const queryClient = useQueryClient();
  const { userId, isLoading: userLoading } = useAuthUserId();
  const { orgId } = useRequireOrg();

  const fornecedoresQuery = useQuery({
    queryKey: ['fornecedores', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!orgId,
  });

  const createFornecedor = useMutation({
    mutationFn: async (fornecedorData: CreateFornecedorData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('fornecedores')
        .insert({
          ...fornecedorData,
          user_id: user.id,
          org_id: orgId,
          ativo: fornecedorData.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores', orgId] });
      triggerSuccessFeedback('Fornecedor cadastrado');
      toast.success('Fornecedor cadastrado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao cadastrar fornecedor:', error);
      toast.error('Erro ao cadastrar fornecedor. Tente novamente.');
    },
  });

  const updateFornecedor = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateFornecedorData>) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores', orgId] });
      triggerSuccessFeedback('Fornecedor atualizado');
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error('Erro ao atualizar fornecedor. Tente novamente.');
    },
  });

  const deleteFornecedor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores', orgId] });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor. Tente novamente.');
    },
  });

  return {
    fornecedores: fornecedoresQuery.data || [],
    isLoading: fornecedoresQuery.isLoading || userLoading,
    error: fornecedoresQuery.error,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    refetch: fornecedoresQuery.refetch,
  };
};
