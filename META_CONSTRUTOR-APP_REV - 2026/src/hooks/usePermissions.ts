import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import type { UserRole } from '@/types/user';
import { getUserPermissions } from '@/types/user';
import { usePlanLimits } from './usePlanLimits';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRequireOrg } from '@/hooks/requireOrg';

export const usePermissions = () => {
  const { user, roles } = useAuth();
  const { limits, isLoading: isPlanLoading } = usePlanLimits();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // Buscar contagem atual de obras
  const { data: obrasCount = 0, isLoading: isObrasLoading } = useQuery({
    queryKey: ['obras-count', user?.id], // Stable key based on user
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('obras')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id); // Fixed: table uses user_id, not org_id
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id, // Only depends on user
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Buscar contagem atual de membros da equipe
  const { data: equipeCount = 0, isLoading: isEquipeLoading } = useQuery({
    queryKey: ['equipe-count', user?.id], // Stable key based on user
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('equipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id); // Fixed: table uses user_id, not org_id
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id, // Only depends on user
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const userRole = roles[0] || 'Colaborador';
  const basePermissions = getUserPermissions(userRole);

  const permissions = useMemo(() => ({
    canAccessRoute: (requiredRole?: UserRole) => {
      if (!requiredRole) return true;
      return roles.includes(requiredRole);
    },
    canPerformAction: (action: string) => {
      return basePermissions[action as keyof typeof basePermissions] || false;
    },
    allowedActions: Object.keys(basePermissions).filter(
      key => basePermissions[key as keyof typeof basePermissions]
    ),
    userRole,
  }), [roles, userRole, basePermissions]);

  const rdoPermissions = useMemo(() => ({
    canCreate: basePermissions.canCreateRDO,
    canEditOwn: basePermissions.canCreateRDO,
    canEditAny: basePermissions.canApproveRDO,
    canApprove: basePermissions.canApproveRDO,
    canExport: basePermissions.canExportRDO,
    canDelete: basePermissions.canDeleteRDO,
    canEdit: (rdoCreatorId: string) => {
      if (user?.id === rdoCreatorId) return true;
      return basePermissions.canApproveRDO;
    },
    canApproveRDO: (rdoCreatorId: string) => {
      if (user?.id === rdoCreatorId) return false;
      return basePermissions.canApproveRDO;
    },
  }), [basePermissions, user?.id]);

  const isPresidente = roles.includes('Presidente');
  const isAdmin = roles.includes('Administrador') || isPresidente;
  const isManager = roles.includes('Gerente') || isAdmin;

  const obraPermissions = useMemo(() => {
    // Presidente sempre pode criar, mesmo no plano Free
    const isAtLimit = !isPresidente && !limits.unlimitedObras && obrasCount >= limits.maxObras;
    return {
      canCreate: (isAdmin || isManager) && !isAtLimit,
      canEdit: isAdmin || isManager,
      canDelete: isAdmin,
      isAtLimit,
      maxObras: isPresidente ? 999999 : limits.maxObras,
    };
  }, [roles, limits, obrasCount, isAdmin, isManager, isPresidente]);

  const equipePermissions = useMemo(() => {
    // Presidente sempre pode criar
    const isAtLimit = !isPresidente && !limits.unlimitedUsers && equipeCount >= limits.maxUsers;
    return {
      canCreate: (isAdmin || isManager) && !isAtLimit,
      canEdit: isAdmin || isManager,
      canManageColaboradores: isAdmin || isManager,
      canDeleteColaboradores: isAdmin,
      isAtLimit,
      maxUsers: isPresidente ? 999999 : limits.maxUsers,
    };
  }, [roles, limits, equipeCount, isAdmin, isManager, isPresidente]);

  const relatorioPermissions = useMemo(() => ({
    canView: basePermissions.canViewAllRDOs,
    canExport: basePermissions.canExportRDO,
  }), [basePermissions]);

  const sistemaPermissions = useMemo(() => ({
    canConfigure: isAdmin,
    canAudit: isAdmin || isManager,
    canBackup: isAdmin,
    canManageIntegrations: isAdmin,
  }), [isAdmin, isManager]);

  return {
    ...permissions,
    rdo: rdoPermissions,
    obra: obraPermissions,
    equipe: equipePermissions,
    relatorio: relatorioPermissions,
    sistema: sistemaPermissions,
    isLoading: isPlanLoading || isObrasLoading || isEquipeLoading,
    planType: limits, // Note: might want to return planType name as well
    obrasCount,
    equipeCount,
  };
};

export const useRole = () => {
  const { roles } = useAuth();

  return useMemo(() => ({
    isPresidente: roles.includes('Presidente'),
    isAdmin: roles.includes('Administrador') || roles.includes('Presidente'),
    isGerente: roles.includes('Gerente') || roles.includes('Administrador') || roles.includes('Presidente'),
    isColaborador: roles.includes('Colaborador'),
    role: roles[0] || 'Colaborador' as UserRole,
  }), [roles]);
};

export const useRouteAccess = (path: string) => {
  const { isAuthenticated } = useAuth();

  return useMemo(() => ({
    hasAccess: isAuthenticated,
    path,
  }), [isAuthenticated, path]);
};
