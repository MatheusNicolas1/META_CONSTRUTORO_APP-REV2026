import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';
import { getStoragePath } from '@/utils/storageUtils';
import { toast } from 'sonner';

export type LixeiraEntityType =
  | 'obras'
  | 'documentos'
  | 'rdos'
  | 'checklists'
  | 'atividades'
  | 'expenses';

export type LixeiraItem = {
  entity_type: LixeiraEntityType;
  entity_id: string;
  org_id: string;
  title: string | null;
  subtitle: string | null;
  deleted_at: string;
  deleted_by: string | null;
  purge_at: string | null;
  source_path: string | null;
  metadata: Record<string, unknown> | null;
};

export type LixeiraFilters = {
  search?: string;
  entityType?: LixeiraEntityType | 'all';
};

const INVALIDATION_KEYS = {
  obras: ['obras', 'recent-obras', 'dashboard-stats'],
  documentos: ['documentos'],
  rdos: ['rdos', 'recent-rdos', 'dashboard-stats'],
  checklists: ['checklists'],
  atividades: ['dashboard-stats'],
  expenses: ['expenses'],
} satisfies Record<LixeiraEntityType, string[]>;

const ENTITY_LABELS: Record<LixeiraEntityType, string> = {
  obras: 'Obra',
  documentos: 'Documento',
  rdos: 'RDO',
  checklists: 'Checklist',
  atividades: 'Atividade',
  expenses: 'Despesa',
};

const assertKnownEntity = (entityType: string): LixeiraEntityType => {
  if (!Object.prototype.hasOwnProperty.call(ENTITY_LABELS, entityType)) {
    throw new Error('Tipo de item invalido para a Lixeira.');
  }

  return entityType as LixeiraEntityType;
};

const getDaysLeft = (purgeAt: string | null) => {
  if (!purgeAt) return null;

  const diff = new Date(purgeAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const getLixeiraEntityLabel = (entityType: LixeiraEntityType) =>
  ENTITY_LABELS[entityType] ?? entityType;

export const getLixeiraDaysLeft = getDaysLeft;

export function useLixeira(filters?: LixeiraFilters) {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  const query = useQuery({
    queryKey: ['lixeira-items', orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lixeira_items')
        .select('*')
        .eq('org_id', orgId)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      return (data || []) as LixeiraItem[];
    },
    enabled: !orgLoading && !!orgId,
  });

  const items = useMemo(() => {
    const search = filters?.search?.trim().toLowerCase();
    const entityType = filters?.entityType || 'all';

    return (query.data || []).filter((item) => {
      if (entityType !== 'all' && item.entity_type !== entityType) return false;
      if (!search) return true;

      return [
        item.title,
        item.subtitle,
        item.entity_type,
        item.entity_id,
      ].some((value) => String(value || '').toLowerCase().includes(search));
    });
  }, [filters?.entityType, filters?.search, query.data]);

  const invalidateEntity = async (entityType: LixeiraEntityType) => {
    await queryClient.invalidateQueries({ queryKey: ['lixeira-items', orgId] });

    for (const key of INVALIDATION_KEYS[entityType]) {
      await queryClient.invalidateQueries({ queryKey: [key, orgId] });
    }
  };

  const restoreItem = useMutation({
    mutationFn: async (item: LixeiraItem) => {
      const entityType = assertKnownEntity(item.entity_type);
      const daysLeft = getDaysLeft(item.purge_at);

      if (daysLeft === 0) {
        throw new Error('Prazo de restauracao encerrado.');
      }

      const { error } = await (supabase as any)
        .rpc('restore_lixeira_item', {
          p_entity_type: entityType,
          p_entity_id: item.entity_id,
        });

      if (error) throw error;

      return entityType;
    },
    onSuccess: async (entityType) => {
      await invalidateEntity(entityType);
      toast.success('Item restaurado com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nao foi possivel restaurar o item.');
    },
  });

  const deletePermanently = useMutation({
    mutationFn: async (item: LixeiraItem) => {
      const entityType = assertKnownEntity(item.entity_type);

      const { error } = await (supabase as any)
        .rpc('delete_lixeira_item_permanently', {
          p_entity_type: entityType,
          p_entity_id: item.entity_id,
        });

      if (error) throw error;

      if (entityType === 'documentos') {
        const rawUrl = item.metadata?.url;
        if (typeof rawUrl === 'string' && rawUrl) {
          const filePath = getStoragePath(rawUrl, 'documentos');
          const { error: storageError } = await supabase.storage
            .from('documentos')
            .remove([filePath]);

          if (storageError) {
            console.warn('Erro ao remover arquivo definitivo da lixeira:', storageError.message);
          }
        }
      }

      return entityType;
    },
    onSuccess: async (entityType) => {
      await invalidateEntity(entityType);
      toast.success('Item excluido definitivamente.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Nao foi possivel excluir definitivamente.');
    },
  });

  return {
    items,
    total: query.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    restoreItem,
    deletePermanently,
  };
}
