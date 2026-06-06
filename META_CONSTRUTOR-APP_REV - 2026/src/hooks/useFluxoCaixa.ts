import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface PrevisaoRecord {
  id: string;
  org_id: string;
  obra_id: string;
  tipo: 'entrada' | 'saida';
  origem: string;
  categoria: string;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  descricao: string;
  data_prevista: string;
  valor_previsto: number;
  status: string;
  alerta_percentual?: number | null;
}

export interface RealizadoRecord {
  id: string;
  obra_id: string;
  tipo: string;
  categoria: string;
  data_realizada: string;
  valor_realizado: number;
  origem: string;
  expense_id?: string | null;
}

export interface CurvaABCRecord {
  id: string;
  obra_id: string;
  competencia: string;
  base_planejada: number;
  base_realizada: number;
  percentual_planejado: number;
  percentual_realizado: number;
  desvio_percentual: number;
  status: string;
}

export function useFluxoCaixa(obraId?: string) {
  const queryClient = useQueryClient();
  const { userId } = useAuthUserId();
  const { orgId } = useRequireOrg();

  const previsoesQuery = useQuery({
    queryKey: ['fluxo-caixa-previsoes', orgId, obraId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from('fluxo_caixa_previsao').select('*').eq('org_id', orgId);
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.order('data_prevista', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const realizadoQuery = useQuery({
    queryKey: ['fluxo-caixa-realizado', orgId, obraId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from('fluxo_caixa_realizado').select('*').eq('org_id', orgId);
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.order('data_realizada', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const curvaQuery = useQuery({
    queryKey: ['curva-abc', orgId, obraId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from('curva_abc_log').select('*').eq('org_id', orgId);
      if (obraId) q = q.eq('obra_id', obraId);
      const { data, error } = await q.order('competencia', { ascending: false }).limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createPrevisao = useMutation({
    mutationFn: async (p: Omit<PrevisaoRecord, 'id' | 'org_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('fluxo_caixa_previsao').insert({
        ...p,
        org_id: orgId,
        created_by: userId,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa-previsoes', orgId] });
      toast.success('Previsão criada');
    },
    onError: (err) => { console.error(err); toast.error('Falha ao criar previsão'); },
  });

  const createRealizado = useMutation({
    mutationFn: async (r: { obra_id: string; tipo: string; categoria: string; data_realizada: string; valor_realizado: number; origem?: string }) => {
      const { data, error } = await supabase.from('fluxo_caixa_realizado').insert({
        ...r,
        org_id: orgId,
        created_by: userId,
        origem: r.origem || 'manual',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa-realizado', orgId] });
      toast.success('Lançamento registrado');
    },
    onError: (err) => { console.error(err); toast.error('Falha ao lançar'); },
  });

  // Resumo financeiro: entradas - saídas do realizado
  const saldoRealizado = (realizadoQuery.data || []).reduce((acc: number, r: any) => {
    return r.tipo === 'entrada' ? acc + Number(r.valor_realizado) : acc - Number(r.valor_realizado);
  }, 0);

  const saldoPrevisto = (previsoesQuery.data || []).reduce((acc: number, p: any) => {
    return p.tipo === 'entrada' ? acc + Number(p.valor_previsto) : acc - Number(p.valor_previsto);
  }, 0);

  return {
    isLoading: previsoesQuery.isLoading || realizadoQuery.isLoading,
    previsoes: previsoesQuery.data || [],
    realizado: realizadoQuery.data || [],
    curva: curvaQuery.data || [],
    saldoPrevisto,
    saldoRealizado,
    createPrevisao,
    createRealizado,
  };
}
