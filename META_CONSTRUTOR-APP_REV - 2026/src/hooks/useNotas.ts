import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthUserId } from './useAuthUserId';

export interface RDONota {
    id: string;
    rdo_id: string;
    texto: string;
    created_at: string;
    user_id: string;
    org_id: string;
    profiles?: {
        name: string | null;
        avatar_url: string | null;
    };
}

export const useNotas = (rdoId: string) => {
    const queryClient = useQueryClient();
    const { userId } = useAuthUserId();

    const { data: notas, isLoading, error } = useQuery({
        queryKey: ['rdo-notas', rdoId],
        queryFn: async () => {
            if (!rdoId) return [];

            const { data, error } = await supabase
                .from('rdo_notas')
                .select(`
          *,
          profiles:user_id(name, avatar_url)
        `)
                .eq('rdo_id', rdoId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar notas:', error);
                toast.error('Não foi possível carregar as notas.');
                throw error;
            }

            // Explicitly awaiting formatting if needed, but data is ready
            return (data || []) as RDONota[];
        },
        enabled: !!rdoId,
    });

    const addNotaMutation = useMutation({
        mutationFn: async (texto: string) => {
            if (!userId) throw new Error('Usuário não autenticado');

            // Get user's org_id
            const { data: userData, error: userError } = await supabase
                .from('org_members')
                .select('org_id')
                .eq('user_id', userId)
                .eq('status', 'active')
                .limit(1)
                .maybeSingle();

            if (userError || !userData?.org_id) {
                throw new Error('Você precisa estar em uma organização ativa.');
            }

            const { data, error } = await supabase
                .from('rdo_notas')
                .insert({
                    rdo_id: rdoId,
                    texto,
                    user_id: userId,
                    org_id: userData.org_id
                })
                .select(`
          *,
          profiles:user_id(name, avatar_url)
        `)
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success('Nota adicionada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['rdo-notas', rdoId] });
            // Também invalidar detalhes do RDO caso precise da contagem num refetch
            queryClient.invalidateQueries({ queryKey: ['rdo', rdoId] });
        },
        onError: (error: any) => {
            console.error('Erro ao adicionar nota:', error);
            toast.error(error.message || 'Erro ao adicionar a nota. Tente novamente.');
        }
    });

    const deleteNotaMutation = useMutation({
        mutationFn: async (notaId: string) => {
            const { error } = await supabase
                .from('rdo_notas')
                .delete()
                .eq('id', notaId);

            if (error) throw error;
            return notaId;
        },
        onSuccess: () => {
            toast.success('Nota removida com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['rdo-notas', rdoId] });
            queryClient.invalidateQueries({ queryKey: ['rdo', rdoId] });
        },
        onError: (error: any) => {
            console.error('Erro ao remover nota:', error);
            toast.error('Erro ao excluir a nota. Verifique suas permissões.');
        }
    });

    return {
        notas,
        isLoading,
        error,
        addNota: addNotaMutation.mutateAsync,
        isAdding: addNotaMutation.isPending,
        deleteNota: deleteNotaMutation.mutateAsync,
        isDeleting: deleteNotaMutation.isPending
    };
};
