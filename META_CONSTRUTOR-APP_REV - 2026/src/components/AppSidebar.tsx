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
  DollarSign,
  CreditCard,
  Plus,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import i18n from "@/lib/i18n";
import { useAuth } from "./auth/AuthContext";
import { Sidebar, SidebarContent, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "./NotificationPanel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "./UserProfile";
import Logo from "./Logo";

type NavigationItem = {
  title: string;
  shortTitle?: string;
  url: string;
  icon: LucideIcon;
  tourId?: string;
};

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { roles } = useAuth();
  const collapsed = state === "collapsed";

  const t = (key: string) => i18n.t(key);
  const canManageBilling = roles.some((role) => ["Presidente", "Administrador"].includes(role));

  const primaryItems: NavigationItem[] = [
    { title: t("menu.dashboard"), shortTitle: "Inicio", url: "/app/dashboard", icon: Home, tourId: "dashboard" },
    { title: t("menu.obras"), shortTitle: "Obras", url: "/app/obras", icon: Briefcase, tourId: "obras" },
    { title: t("menu.rdo"), shortTitle: "RDO", url: "/app/rdo", icon: FileText, tourId: "rdo" },
    { title: t("menu.checklist"), shortTitle: "Check", url: "/app/checklist", icon: CheckSquare, tourId: "checklist" },
  ];

  const operationItems: NavigationItem[] = [
    { title: t("menu.atividades"), url: "/app/atividades", icon: Calendar, tourId: "atividades" },
    { title: t("menu.equipes"), url: "/app/equipes", icon: Users, tourId: "equipes" },
    { title: t("menu.equipamentos"), url: "/app/equipamentos", icon: Wrench, tourId: "equipamentos" },
    { title: t("menu.documentos"), url: "/app/documentos", icon: Folder, tourId: "documentos" },
  ];

  const moreItems: NavigationItem[] = [
    { title: t("menu.fornecedores"), url: "/app/fornecedores", icon: Truck, tourId: "fornecedores" },
    { title: "Despesas", url: "/app/despesas", icon: DollarSign, tourId: "despesas" },
    ...(canManageBilling ? [{ title: "Planos", url: "/app/planos", icon: CreditCard, tourId: "planos" }] : []),
    { title: t("menu.relatorios"), url: "/app/relatorios", icon: BarChart3, tourId: "relatorios" },
    { title: t("menu.integracoes"), url: "/app/integracoes", icon: Zap, tourId: "integracoes" },
    { title: "Lixeira", url: "/app/lixeira", icon: Trash2, tourId: "lixeira" },
  ];

  const detailItems = [...operationItems, ...moreItems];

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  const isActive = (path: string) =>
    path === "/app/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const isMoreActive = moreItems.some((item) => isActive(item.url));

  const railLinkClass = (active: boolean) =>
    [
      "flex h-[4.4rem] w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-all duration-150 ease-out",
      active
        ? "bg-primary/10 text-primary ring-1 ring-primary/15 scale-[1.02]"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]",
    ].join(" ");

  const detailLinkClass = (active: boolean) =>
    [
      "flex h-11 min-w-0 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-all duration-150 ease-out",
      active
        ? "bg-primary/10 text-primary ring-1 ring-primary/15 scale-[1.02]"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]",
    ].join(" ");

  const renderRailLink = (item: NavigationItem) => (
    <NavLink
      key={item.title}
      to={item.url}
      data-tour={item.tourId}
      className={railLinkClass(isActive(item.url))}
      title={item.title}
      end={item.url === "/app/dashboard"}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="max-w-[4rem] truncate leading-tight">{item.shortTitle || item.title}</span>
    </NavLink>
  );

  const renderDetailLink = (item: NavigationItem) => (
    <NavLink
      key={item.title}
      to={item.url}
      data-tour={item.tourId}
      className={detailLinkClass(isActive(item.url))}
      title={item.title}
      end={item.url === "/app/dashboard"}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 truncate">{item.title}</span>
    </NavLink>
  );

  return (
    <Sidebar
      className={`border-r border-sidebar-border/70 bg-sidebar transition-[width] duration-300 ease-out ${collapsed ? "w-[5.5rem]" : "w-[25.5rem]"}`}
      collapsible="icon"
      side="left"
    >
      <SidebarContent className="overflow-hidden bg-sidebar">
        <div className="flex h-full min-h-0">
          <aside className="flex h-full w-[5.5rem] shrink-0 flex-col items-center border-r border-sidebar-border/70 bg-sidebar">
            <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-sidebar-border/70">
              <SidebarTrigger className="h-11 w-11 rounded-2xl text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.05] transition-all duration-150" />
            </div>

            <div className="flex w-full shrink-0 justify-center border-b border-sidebar-border/70 py-3">
              <Link
                to="/app/rdo/novo"
                className="flex h-[4.4rem] w-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 ease-out hover:bg-primary/90 hover:scale-[1.05] active:scale-[0.98]"
                title="Criar novo RDO"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs font-bold leading-tight">Criar</span>
              </Link>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-hidden py-3">
              {primaryItems.map(renderRailLink)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={railLinkClass(isMoreActive)}
                    title="Mais"
                  >
                    <MoreHorizontal className="h-5 w-5 shrink-0" />
                    <span className="max-w-[4rem] truncate leading-tight">Mais</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-64" sideOffset={12}>
                  <DropdownMenuLabel>Mais ferramentas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <NavLink to={item.url} className="cursor-pointer">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <div className="flex w-full shrink-0 flex-col items-center gap-2 border-t border-sidebar-border/70 px-2 py-3">
              <div className="flex h-10 w-10 items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-2xl [&_button]:px-0">
                <NotificationPanel />
              </div>

              <div className="flex h-10 w-10 items-center justify-center [&_button]:h-10 [&_button]:w-10 [&_button]:rounded-2xl [&_button]:px-0">
                <ThemeToggle />
              </div>
              <UserProfile compact align="start" />
            </div>
          </aside>

          {!collapsed && (
            <aside className="flex h-full min-w-0 flex-1 flex-col bg-sidebar">
              <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border/70 px-5">
                <Logo size="lg" />
              </div>

              <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">

                <div className="mt-5 px-2 text-xs font-bold uppercase tracking-normal text-sidebar-foreground/55">
                  Ferramentas
                </div>
                <nav className="mt-2 grid grid-cols-2 gap-2">
                  {detailItems.map(renderDetailLink)}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
