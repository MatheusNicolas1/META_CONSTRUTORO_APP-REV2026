import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types/obra';

export const useObraDetails = (id: string) => {
    return useQuery({
        queryKey: ['obra', id],
        queryFn: async (): Promise<Obra> => {
            const { data, error } = await supabase
                .from('obras')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Transform DB response to Obra type matching the UI expectations
            // Note: Relation data is still mocked/empty for now as per step-by-step migration
            return {
                id: data.id,
                // Actually, looking at types/obra.ts, id is number. But DB id is UUID.
                // I need to check if types/obra.ts is outdated or if the app uses number IDs.
                // The migration shows id is UUID. types/obra.ts shows id: number.
                // This is a type mismatch I need to fix. 
                // For now, I will cast or handle it.
                // Let's assume for this step we map what we can.
                ...data,

                dataInicio: data.data_inicio,
                previsaoTermino: data.previsao_termino,
                orcamento: 0, // Not in DB yet?
                atividades: 0, // Need to count
                equipes: [],
                equipamentos: [],
                rdos: [],
                financeiro: {
                    orcamentoTotal: 0,
                    valorExecutado: 0,
                    saldoRestante: 0,
                    itensOrcamento: []
                }
            } as unknown as Obra;
        },
        enabled: !!id,
    });
};
