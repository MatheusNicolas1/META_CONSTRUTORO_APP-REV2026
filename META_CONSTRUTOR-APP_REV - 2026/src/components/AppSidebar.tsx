import {
  Home,
  Briefcase,
  FileText,
  CheckSquare,
  Calendar,
  Users,
  Wrench,
  Folder,
  Truck,
  BarChart3,
  Zap,
  Shield,
  DollarSign,
  CreditCard
} from "lucide-react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import i18n from "@/lib/i18n";
import Logo from "./Logo";
import { useAuth } from "./auth/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  // const { t } = useTranslation();
  const { roles, user, hasRole } = useAuth();
  const collapsed = state === "collapsed";

  const t = (key: string) => i18n.t(key);

  const menuItems = [
    { title: t('menu.obras'), url: "/app/obras", icon: Briefcase, tourId: "obras" },
    { title: t('menu.rdo'), url: "/app/rdo", icon: FileText, tourId: "rdo" },
    { title: t('menu.checklist'), url: "/app/checklist", icon: CheckSquare, tourId: "checklist" },
    { title: t('menu.atividades'), url: "/app/atividades", icon: Calendar, tourId: "atividades" },
    { title: t('menu.equipes'), url: "/app/equipes", icon: Users, tourId: "equipes" },
    { title: t('menu.equipamentos'), url: "/app/equipamentos", icon: Wrench, tourId: "equipamentos" },
  ];

  const secondaryItems = [
    { title: t('menu.documentos'), url: "/app/documentos", icon: Folder, tourId: "documentos" },
    { title: t('menu.fornecedores'), url: "/app/fornecedores", icon: Truck, tourId: "fornecedores" },
    { title: 'Despesas', url: "/app/despesas", icon: DollarSign, tourId: "despesas" },
    { title: t('menu.relatorios'), url: "/app/relatorios", icon: BarChart3, tourId: "relatorios" },
    { title: t('menu.integracoes'), url: "/app/integracoes", icon: Zap, tourId: "integracoes" },
  ];

  const isAdmin = hasRole('Administrador');
  const isSuperAdmin = user?.email === 'matheusnicolas.org@gmail.com';

  // Verificação ESTRITA para Presidente conforme solicitado
  const isPresidente = roles.includes('Presidente');

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar
      className={`transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-64"}`}
      collapsible="icon"
      side="left"
    >
      <SidebarContent className="bg-sidebar">
        {/* Header com Logo */}
        {/* Header com Logo */}
        <div className={`border-b border-sidebar-border transition-all duration-300 h-14 sm:h-16 flex items-center ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className="flex items-center justify-center w-full">
            <Link
              to="/app/dashboard"
              className="flex items-center justify-center hover:opacity-80 transition-opacity touch-safe w-full"
              title={collapsed ? "MetaConstrutor - Dashboard" : "Dashboard"}
            >
              {!collapsed && (
                <Logo size="md" className="transition-all duration-300" />
              )}
              {collapsed && (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Logo size="sm" className="transition-all duration-300" />
                </div>
              )}
            </Link>
          </div>
        </div>

        {/* Navegação Principal */}
        <div className="flex-1 overflow-y-auto">
          <SidebarGroup className={`transition-all duration-300 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider">
                {t('menu.dashboard')}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        data-tour={item.tourId}
                        className={`${getNavClass(item.url)} flex items-center gap-3 transition-all duration-200 rounded-lg h-10 ${collapsed ? 'justify-center px-0 w-10 mx-auto' : 'justify-start px-3'
                          }`}
                        title={collapsed ? item.title : undefined}
                        end={false}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className={`transition-all duration-300 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider">
                {t('settings.title')}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {secondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        data-tour={item.tourId}
                        className={`${getNavClass(item.url)} flex items-center gap-3 transition-all duration-200 rounded-lg h-10 ${collapsed ? 'justify-center px-0 w-10 mx-auto' : 'justify-start px-3'
                          }`}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Painel Administrativo - Somente para Presidente (Estrito) */}
          {isPresidente && (
            <SidebarGroup className={`transition-all duration-300 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
              {!collapsed && (
                <SidebarGroupLabel className="text-sidebar-foreground/70 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider">
                  Administração
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={collapsed ? "Painel Admin" : undefined}>
                      <NavLink
                        to="/app/admin/dashboard"
                        className={`${getNavClass('/app/admin/dashboard')} flex items-center gap-3 transition-all duration-200 rounded-lg h-10 ${collapsed ? 'justify-center px-0 w-10 mx-auto' : 'justify-start px-3'
                          }`}
                        title={collapsed ? "Painel Admin" : undefined}
                      >
                        <Shield className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate text-sm font-medium">Painel Admin</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}