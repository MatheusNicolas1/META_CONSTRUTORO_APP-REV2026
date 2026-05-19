import { supabase } from '@/integrations/supabase/client';

export interface OrgMembership {
    org_id: string;
    role: 'Presidente' | 'Administrador' | 'Gerente' | 'Colaborador';
    status: string;
}

export interface Org {
    id: string;
    name: string;
    slug: string;
    owner_user_id: string;
}

/**
 * Busca todas as memberships ativas do usuário autenticado.
 * RLS garante que só retorna memberships do auth.uid().
 */
export const listMembershipsActive = async (): Promise<OrgMembership[]> => {
    const { data, error } = await supabase
        .from('org_members' as any)
        .select('org_id, role, status')
        .eq('status', 'active')
        .order('id', { ascending: true });

    if (error) {
        console.error('Erro ao buscar memberships:', error);
        return [];
    }

    return data || [];
};

/**
 * Busca dados das orgs baseado nas memberships fornecidas.
 */
export const listMyOrgsByMembership = async (
    memberships: OrgMembership[]
): Promise<Org[]> => {
    if (memberships.length === 0) return [];

    const orgIds = memberships.map((m) => m.org_id);

    const { data, error } = await supabase
        .from('orgs' as any)
        .select('id, name, slug, owner_user_id')
        .in('id', orgIds);

    if (error) {
        console.error('Erro ao buscar orgs:', error);
        return [];
    }

    return data || [];
};
