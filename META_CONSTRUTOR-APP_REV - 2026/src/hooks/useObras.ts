import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyObraChange } from '@/utils/notificationService';
import { usePermissions } from './usePermissions';
import { useRequireOrg } from '@/hooks/requireOrg';
import { track } from '@/integrations/analytics';
import { useAuthUserId } from './useAuthUserId';

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
  atividades?: any[]; // Budget items to be converted to activities
}

export const useObras = () => {
  const queryClient = useQueryClient();
  const { obra: obraPerms } = usePermissions();
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { userId, isLoading: authLoading } = useAuthUserId();

  // Realtime subscription for obras updates
  // Realtime subscription for Obras (Singleton + Grace Period)
  useEffect(() => {
    if (!orgId || !userId) return;

    const channelKey = `obras-realtime-${userId}`; // Key by user since we filter by user
    const REGISTRY_KEY = '__meta_obras_realtime_registry__';

    // Initialize registry if needed
    if (!(globalThis as any)[REGISTRY_KEY]) {
      (globalThis as any)[REGISTRY_KEY] = new Map();
    }
    const registry = (globalThis as any)[REGISTRY_KEY];

    let entry = registry.get(channelKey);
    let didSubscribe = false;

    // Setup function
    const setup = () => {
      if (!entry) {
        const channel = supabase
          .channel(channelKey)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'obras',
              filter: `org_id=eq.${orgId}`
            },
            () => {
              window.dispatchEvent(new CustomEvent(`obras-changed-${channelKey}`));
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') console.error(`[Realtime-Obras] Error: ${channelKey}`);
          });

        entry = { channel, refCount: 0, cleanupTimeout: null };
        registry.set(channelKey, entry);
      }

      // Cancel pending cleanup
      if (entry.cleanupTimeout) {
        window.clearTimeout(entry.cleanupTimeout);
        entry.cleanupTimeout = null;
      }

      entry.refCount++;
      didSubscribe = true;
    };

    setup();

    // Event listener for data reload
    const handleRemoteChange = () => {
      queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
    };
    window.addEventListener(`obras-changed-${channelKey}`, handleRemoteChange);


    return () => {
      window.removeEventListener(`obras-changed-${channelKey}`, handleRemoteChange);

      if (didSubscribe && entry) {
        entry.refCount--;
        if (entry.refCount <= 0) {
          // Grace period 2s
          entry.cleanupTimeout = window.setTimeout(() => {
            if (entry.refCount <= 0) {
              supabase.removeChannel(entry.channel);
              registry.delete(channelKey);
            }
          }, 2000);
        }
      }
    };
  }, [queryClient, orgId, userId]);

  const obrasQuery = useQuery({
    queryKey: ['obras', orgId, userId],
    queryFn: async () => {
      if (!userId) throw new Error('Usuario nao autenticado');

      let query = supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      query = orgId
        ? query.or(`org_id.eq.${orgId},user_id.eq.${userId}`)
        : query.eq('user_id', userId);

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map((obra) => ({ ...obra, atividades: [] }));
    },
    enabled: !authLoading && !orgLoading && !!userId,
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

      // Separate activities from obra data
      const { atividades, ...obraPayload } = obraData;

      const { data, error } = await supabase
        .from('obras')
        .insert({
          ...obraPayload,
          user_id: user.id,
          org_id: orgId,
          progresso: 0,
          status: 'ACTIVE',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Insert activities if present
      if (atividades && atividades.length > 0) {
        const atividadesToInsert = atividades.map((item: any) => ({
          user_id: user.id,
          obra_id: data.id, // Link to the new obra
          titulo: item.descricao || 'Nova Atividade',
          status: 'agendada',
          prioridade: 'media',
          data: obraData.data_inicio || new Date().toISOString().split('T')[0],
          hora: '08:00',
          unidade_medida: item.unidade,
          quantidade_prevista: Number(item.quantidade) || 0,
          // Store entered value in observacoes strictly or just ignore if no column
          observacoes: `Orçamento: Val. Unit: ${item.valorUnitario} | Total: ${item.valorTotal}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: atividadesError } = await supabase
          .from('atividades')
          .insert(atividadesToInsert);

        if (atividadesError) {
          console.error('Error creating initial activities:', atividadesError);
          toast.error('Obra criada, mas houve erro ao salvar algumas atividades.');
        }
      }

      if (error) throw error;

      // Enviar notificação
      await notifyObraChange(user.id, obraData.nome, 'created', data.id, orgId);

      // M9: Analytics
      track('product.obra_created', {
        obra_id: data.id,
        org_id: orgId,
        created_by: user.id,
        tipo: obraData.tipo,
        localizacao: obraData.localizacao
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-obras', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
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
        .update(updateData as any)
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      queryClient.invalidateQueries({ queryKey: ['obra'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
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
