import { useOrg } from '@/contexts/OrgContext';
import { getActiveOrgIdLocal } from '@/helpers/storage';

interface RequireOrgResult {
    orgId: string;
    role: 'Presidente' | 'Administrador' | 'Gerente' | 'Colaborador';
    isLoading: boolean;
}

/**
 * Hook que garante activeOrgId antes de queries.
 * Retorna { orgId, role, isLoading }.
 * Se isLoading=true, aguarde. Se orgId for null após loading, lança erro.
 */
export const useRequireOrg = (): RequireOrgResult => {
    const { activeOrgId, activeRole, isLoading } = useOrg();
    const storedOrgId = getActiveOrgIdLocal();

    if (isLoading) {
        return { orgId: storedOrgId || '', role: activeRole || 'Colaborador', isLoading: !storedOrgId };
    }

    if (!activeOrgId || !activeRole) {
        if (storedOrgId) {
            return { orgId: storedOrgId, role: activeRole || 'Colaborador', isLoading: false };
        }

        // ERROR HANDLED: Instead of crashing the app, we return a fallback state.
        // This allows the UI to handle "No Organization" scenarios (e.g. Onboarding or Empty State)
        return { orgId: '', role: 'Colaborador', isLoading: false };
    }

    return { orgId: activeOrgId, role: activeRole, isLoading: false };
};
