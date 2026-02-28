import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrg } from "@/hooks/requireOrg";

export function useRDODetails(id: string | undefined) {
    const { orgId } = useRequireOrg();

    return useQuery({
        queryKey: ['rdo', id, orgId],
        queryFn: async () => {
            if (!id) throw new Error("ID do RDO não fornecido");

            const { data, error } = await supabase
                .from('rdos')
                .select(`
          *,
          obras (
            id,
            nome
          ),
          rdo_atividades (*),
          rdo_equipes (*),
          rdo_equipamentos (*),
          documentos (*)
        `)
                .eq('id', id)
                .eq('org_id', orgId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id && !!orgId,
    });
}
