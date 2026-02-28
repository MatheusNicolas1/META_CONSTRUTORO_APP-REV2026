// Tipos para sistema de usuários e permissões
export type UserRole = 'Presidente' | 'Administrador' | 'Gerente' | 'Colaborador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  canCreateRDO: boolean;
  canApproveRDO: boolean;
  canExportRDO: boolean;
  canDeleteRDO: boolean;
  canViewAllRDOs: boolean;
  canManageFeedbacks: boolean;
}

// Mapeamento de permissões por cargo
export const rolePermissions: Record<UserRole, UserPermissions> = {
  Presidente: {
    canCreateRDO: true,
    canApproveRDO: true,
    canExportRDO: true,
    canDeleteRDO: true,
    canViewAllRDOs: true,
    canManageFeedbacks: true,
  },
  Administrador: {
    canCreateRDO: true,
    canApproveRDO: true,
    canExportRDO: true,
    canDeleteRDO: true,
    canViewAllRDOs: true,
    canManageFeedbacks: true,
  },
  Gerente: {
    canCreateRDO: true,
    canApproveRDO: true,
    canExportRDO: true,
    canDeleteRDO: false,
    canViewAllRDOs: true,
    canManageFeedbacks: true,
  },
  Colaborador: {
    canCreateRDO: true,
    canApproveRDO: false,
    canExportRDO: false,
    canDeleteRDO: false,
    canViewAllRDOs: false,
    canManageFeedbacks: false,
  },
};

export const getUserPermissions = (role: UserRole): UserPermissions => {
  return rolePermissions[role];
};