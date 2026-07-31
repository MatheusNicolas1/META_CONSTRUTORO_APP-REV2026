// Matriz central de RBAC - mapeamento completo de rotas e permissões
import type { UserRole } from "@/types/user";
import { PLATFORM_PRESIDENT_EMAIL, isPlatformPresidentEmail } from "@/utils/adminAccess";

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  allowedEmails?: string[];
  requiredPermissions?: string[];
  description: string;
}

export interface ActionPermission {
  action: string;
  allowedRoles: UserRole[];
  description: string;
}

// Mapeamento completo de rotas protegidas
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Dashboard e navegação principal
  { path: "/app/dashboard", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Dashboard principal" },
  
  // Gestão de obras
  { path: "/app/obras", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Listar obras" },
  { path: "/app/obras/:id", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Visualizar obra" },
  { path: "/app/obras/:id/editar", allowedRoles: ["Presidente", "Administrador", "Gerente"], description: "Editar obra" },
  
  // RDO - Relatório Diário de Obra
  { path: "/app/rdo", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Listar RDOs" },
  { path: "/app/rdo/:id/visualizar", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Visualizar RDO" },
  { path: "/app/rdo/:id/editar", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Editar RDO" },
  
  // Gestão de recursos
  { path: "/app/atividades", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Gerenciar atividades" },
  { path: "/app/equipes", allowedRoles: ["Administrador", "Gerente"], description: "Gerenciar equipes" },
  { path: "/app/equipes/novo", allowedRoles: ["Administrador", "Gerente"], description: "Criar nova equipe" },
  { path: "/app/equipes/:id/editar", allowedRoles: ["Administrador", "Gerente"], description: "Editar equipe" },
  { path: "/app/colaboradores", allowedRoles: ["Administrador", "Gerente"], description: "Gerenciar colaboradores" },
  { path: "/app/colaboradores/novo", allowedRoles: ["Administrador", "Gerente"], description: "Adicionar colaborador" },
  { path: "/app/colaboradores/:id/editar", allowedRoles: ["Administrador", "Gerente"], description: "Editar colaborador" },
  { path: "/app/equipamentos", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Gerenciar equipamentos" },
  { path: "/app/fornecedores", allowedRoles: ["Administrador", "Gerente"], description: "Gerenciar fornecedores" },
  { path: "/app/despesas", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Gerenciar despesas" },
  
  // Checklists e documentos
  { path: "/app/checklist", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Gerenciar checklists" },
  { path: "/app/checklist/:id", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Visualizar checklist" },
  { path: "/app/documentos", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Gerenciar documentos" },
  
  // Relatórios e análises
  { path: "/app/relatorios", allowedRoles: ["Administrador", "Gerente"], description: "Visualizar relatórios" },
  
  // Integrações - Admin + Gerente
  { path: "/app/integracoes", allowedRoles: ["Administrador", "Gerente"], description: "Gerenciar integrações" },
  
  // Configurações e perfil
  { path: "/app/configuracoes", allowedRoles: ["Administrador", "Gerente"], description: "Configurações do sistema" },
  { path: "/app/perfil", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Perfil do usuário" },
  { path: "/app/configurar-perfil", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Configurar perfil publico" },
  { path: "/app/notificacoes", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Historico de notificacoes" },
  { path: "/app/mais", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Menu de opcoes do aplicativo" },
  
  // Feedback e suporte
  { path: "/app/feedback", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Enviar feedback" },
  { path: "/app/faq", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "FAQ" },
  
  // Área de segurança (restrita)
  { path: "/app/seguranca", allowedRoles: ["Administrador", "Gerente"], description: "Dashboard de segurança" },
  { path: "/app/admin/dashboard", allowedRoles: ["Presidente", "Administrador"], allowedEmails: [PLATFORM_PRESIDENT_EMAIL], description: "Painel administrativo" },
  { path: "/app/admin/audio", allowedRoles: ["Presidente", "Administrador"], allowedEmails: [PLATFORM_PRESIDENT_EMAIL], description: "Gerenciar áudio e resumos" },
];

// Permissões específicas de ações
export const ACTION_PERMISSIONS: ActionPermission[] = [
  // RDO
  { action: "rdo.create", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Criar RDO" },
  { action: "rdo.edit.own", allowedRoles: ["Administrador", "Gerente", "Colaborador"], description: "Editar próprio RDO" },
  { action: "rdo.edit.any", allowedRoles: ["Administrador", "Gerente"], description: "Editar qualquer RDO" },
  { action: "rdo.approve", allowedRoles: ["Administrador", "Gerente"], description: "Aprovar RDO" },
  { action: "rdo.export", allowedRoles: ["Administrador", "Gerente"], description: "Exportar RDO" },
  { action: "rdo.delete", allowedRoles: ["Administrador"], description: "Excluir RDO" },
  
  // Obras
  { action: "obra.create", allowedRoles: ["Administrador", "Gerente"], description: "Criar obra" },
  { action: "obra.edit", allowedRoles: ["Presidente", "Administrador", "Gerente"], description: "Editar obra" },
  { action: "obra.delete", allowedRoles: ["Administrador"], description: "Excluir obra" },
  
  // Equipes e colaboradores
  { action: "equipe.create", allowedRoles: ["Administrador", "Gerente"], description: "Criar equipe" },
  { action: "equipe.edit", allowedRoles: ["Administrador", "Gerente"], description: "Editar equipe" },
  { action: "colaborador.create", allowedRoles: ["Administrador", "Gerente"], description: "Adicionar colaborador" },
  { action: "colaborador.edit", allowedRoles: ["Administrador", "Gerente"], description: "Editar colaborador" },
  { action: "colaborador.delete", allowedRoles: ["Administrador"], description: "Remover colaborador" },
  
  // Relatórios e exports
  { action: "relatorio.view", allowedRoles: ["Administrador", "Gerente"], description: "Visualizar relatórios" },
  { action: "relatorio.export", allowedRoles: ["Administrador", "Gerente"], description: "Exportar relatórios" },
  
  // Integrações
  { action: "integracao.configure", allowedRoles: ["Administrador"], description: "Configurar integrações" },
  { action: "integracao.view", allowedRoles: ["Administrador"], description: "Visualizar integrações" },
  
  // Sistema
  { action: "sistema.config", allowedRoles: ["Administrador"], description: "Configurar sistema" },
  { action: "sistema.audit", allowedRoles: ["Administrador", "Gerente"], description: "Auditoria do sistema" },
  { action: "sistema.backup", allowedRoles: ["Administrador"], description: "Backup do sistema" },
];

// Utility functions para verificação de permissões
export const hasRouteAccess = (path: string, userRole: UserRole, userEmail?: string | null): boolean => {
  const permission = ROUTE_PERMISSIONS.find(p => {
    if (p.path.includes(':')) {
      // Para rotas dinâmicas, fazer match básico
      const basePattern = p.path.replace(/\/:[^/]+/g, '/[^/]+');
      const regex = new RegExp(`^${basePattern}$`);
      return regex.test(path);
    }
    return p.path === path;
  });
  
  if (!permission) return false;
  if (permission.allowedEmails?.some((email) => isPlatformPresidentEmail(email)) && isPlatformPresidentEmail(userEmail)) {
    return true;
  }
  return permission.allowedRoles.includes(userRole);
};

export const hasActionPermission = (action: string, userRole: UserRole): boolean => {
  const permission = ACTION_PERMISSIONS.find(p => p.action === action);
  return permission ? permission.allowedRoles.includes(userRole) : false;
};

export const getRoutePermissions = (path: string): RoutePermission | undefined => {
  return ROUTE_PERMISSIONS.find(p => {
    if (p.path.includes(':')) {
      const basePattern = p.path.replace(/\/:[^/]+/g, '/[^/]+');
      const regex = new RegExp(`^${basePattern}$`);
      return regex.test(path);
    }
    return p.path === path;
  });
};

export const getAllowedRoutes = (userRole: UserRole): string[] => {
  return ROUTE_PERMISSIONS
    .filter(p => p.allowedRoles.includes(userRole))
    .map(p => p.path);
};

export const getActionsByRole = (userRole: UserRole): string[] => {
  return ACTION_PERMISSIONS
    .filter(p => p.allowedRoles.includes(userRole))
    .map(p => p.action);
};

// Matriz de permissões para debugging e auditoria
export const RBAC_MATRIX = {
  routes: ROUTE_PERMISSIONS,
  actions: ACTION_PERMISSIONS,
  roles: ['Presidente', 'Administrador', 'Gerente', 'Colaborador'] as UserRole[],
};
