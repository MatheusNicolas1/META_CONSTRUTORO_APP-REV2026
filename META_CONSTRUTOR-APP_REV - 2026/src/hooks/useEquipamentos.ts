import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface Equipamento {
  id: string;
  nome: string;
  categoria: string;
  modelo: string;
  status: "Disponível" | "Ativo" | "Manutenção" | "Inativo";
  obra?: string;
  tipo?: "Próprio" | "Aluguel";
}

export function useEquipamentos() {
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { userId, isLoading: userLoading } = useAuthUserId();

  const { data: equipamentos = [], isLoading } = useQuery({
    queryKey: ['equipamentos', orgId, userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !orgLoading && !userLoading && !!orgId && !!userId,
  });

  const searchEquipamentos = useCallback(
    (query: string) => {
      if (!query) return [];
      return equipamentos.filter(e =>
        e.nome.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);
    },
    [equipamentos]
  );

  const getEquipamentoById = useCallback(
    (id: string) => {
      return equipamentos.find(e => e.id === id) || null;
    },
    [equipamentos]
  );

  return {
    equipamentos,
    isLoading: isLoading || orgLoading || userLoading,
    searchEquipamentos,
    getEquipamentoById,
  };
}
