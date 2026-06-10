import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import type { RDONicho } from '@/types/rdo';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CreateNichoData {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
}

interface UpdateNichoData {
  id: string;
  data: Partial<Pick<RDONicho, 'nome' | 'descricao' | 'cor' | 'icone' | 'ativo' | 'ordem'>>;
}

/**
 * Hook TanStack Query para CRUD de rdo_nichos.
 * Ordem controlada por ordem number, auto-increment.
 */
export const useRDONichos = () => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // ── Lista de nichos ────────────────────────────────────────────
  const nichosQuery = useQuery({
    queryKey: ['rdos', 'nichos', orgId],
    queryFn: async (): Promise<RDONicho[]> => {
      const { data, error } = await supabase
        .from('rdo_nichos')
        .select('*')
        .eq('org_id', orgId)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as RDONicho[]) || [];
    },
    enabled: !orgLoading && !!orgId,
  });

  // ── Criar nicho ────────────────────────────────────────────────
  const createNicho = useMutation({
    mutationFn: async (nichoData: CreateNichoData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      if (!orgId) throw new Error('Organização ativa não encontrada');

      // Auto slug a partir do nome
      const slug = slugify(nichoData.nome);

      // Buscar a maior ordem atual para auto-increment
      const { data: maxOrdem } = await supabase
        .from('rdo_nichos')
        .select('ordem')
        .eq('org_id', orgId)
        .order('ordem', { ascending: false })
        .limit(1);

      const proximaOrdem = (maxOrdem?.[0]?.ordem ?? 0) + 1;

      const { data, error } = await supabase
        .from('rdo_nichos')
        .insert({
          org_id: orgId,
          nome: nichoData.nome,
          slug,
          descricao: nichoData.descricao ?? null,
          cor: nichoData.cor ?? '#6366f1',
          icone: nichoData.icone ?? 'Folder',
          ordem: proximaOrdem,
        })
        .select()
        .single();

      if (error) throw error;
      return data as RDONicho;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdos', 'nichos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rdos', 'agenda', orgId] });
      toast.success(`Nicho "${data.nome}" criado com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao criar nicho:', error);
      toast.error('Erro ao criar nicho. ' + error.message);
    },
  });

  // ── Atualizar nicho ────────────────────────────────────────────
  const updateNicho = useMutation({
    mutationFn: async ({ id, data }: UpdateNichoData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updatePayload: Record<string, unknown> = {};

      if (data.nome !== undefined) {
        updatePayload.nome = data.nome;
        updatePayload.slug = slugify(data.nome);
      }
      if (data.descricao !== undefined) updatePayload.descricao = data.descricao;
      if (data.cor !== undefined) updatePayload.cor = data.cor;
      if (data.icone !== undefined) updatePayload.icone = data.icone;
      if (data.ativo !== undefined) updatePayload.ativo = data.ativo;
      if (data.ordem !== undefined) updatePayload.ordem = data.ordem;

      updatePayload.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('rdo_nichos')
        .update(updatePayload)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return updated as RDONicho;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdos', 'nichos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rdos', 'agenda', orgId] });
      toast.success(`Nicho "${data.nome}" atualizado com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao atualizar nicho:', error);
      toast.error('Erro ao atualizar nicho. ' + error.message);
    },
  });

  // ── Excluir nicho ──────────────────────────────────────────────
  const deleteNicho = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('rdo_nichos')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', 'nichos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rdos', 'agenda', orgId] });
      toast.success('Nicho excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir nicho:', error);
      toast.error('Erro ao excluir nicho. ' + error.message);
    },
  });

  return {
    nichosQuery,
    createNicho,
    updateNicho,
    deleteNicho,
  };
};
