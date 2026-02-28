/**
 * useRDOsByObra.ts
 * Busca RDOs da tabela `rdos` filtrados por obra_id.
 * Fase 4 PRD4 — exibição real de RDOs no painel da obra.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RDOSummary {
    id: string;
    data: string;
    status: string;
    clima?: string;
    periodo?: string;
    observacoes?: string;
    totalAtividades: number;
    totalEquipamentos: number;
}

async function fetchRDOsByObra(obraId: string): Promise<RDOSummary[]> {
    const { data, error } = await supabase
        .from('rdos')
        .select(`
      id,
      data,
      status,
      clima,
      periodo,
      observacoes,
      rdo_atividades (id),
      rdo_equipamentos (id)
    `)
        .eq('obra_id', obraId)
        .order('data', { ascending: false })
        .limit(50);

    if (error) throw error;

    return (data || []).map((rdo: any) => ({
        id: rdo.id,
        data: rdo.data,
        status: rdo.status ?? 'rascunho',
        clima: rdo.clima,
        periodo: rdo.periodo,
        observacoes: rdo.observacoes,
        totalAtividades: (rdo.rdo_atividades ?? []).length,
        totalEquipamentos: (rdo.rdo_equipamentos ?? []).length,
    }));
}

export function useRDOsByObra(obraId?: string) {
    return useQuery({
        queryKey: ['rdos-by-obra', obraId],
        queryFn: () => fetchRDOsByObra(obraId!),
        enabled: !!obraId,
        staleTime: 30_000,
    });
}
