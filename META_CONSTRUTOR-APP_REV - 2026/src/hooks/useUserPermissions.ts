import { useMemo } from 'react';
import { UserRole, getUserPermissions, UserPermissions } from '@/types/user';
import { useAuth } from '@/components/auth/AuthContext';

// Hook para gerenciar permissões do usuário
export const useUserPermissions = () => {
  const { user } = useAuth();

  const currentUser = user || {
    id: '',
    name: 'Visitante',
    email: '',
    role: 'Colaborador' as UserRole,
  };

  const permissions = useMemo(
    () => getUserPermissions(currentUser.role),
    [currentUser.role]
  );

  const canApproveRDO = (rdoCreatorId: string): boolean => {
    // Não pode aprovar próprio RDO
    if (!currentUser.id || rdoCreatorId === currentUser.id) return false;
    return permissions.canApproveRDO;
  };

  const canExportRDO = (rdoStatus: string): boolean => {
    // Só pode exportar RDOs aprovados
    if (rdoStatus !== 'Aprovado' && rdoStatus !== 'APPROVED') return false;
    return permissions.canExportRDO;
  };

  return {
    currentUser,
    permissions,
    canApproveRDO,
    canExportRDO,
    hasPermission: (permission: keyof UserPermissions) => permissions[permission],
  };
};
