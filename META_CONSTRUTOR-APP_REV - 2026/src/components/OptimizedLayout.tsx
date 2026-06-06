import React, { memo, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CreditBadge } from "./CreditBadge";
import { GlobalSearch } from "./GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { I18nProvider } from "react-aria-components";
import Logo from "./Logo";
import { Link, useLocation } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import i18n from "@/lib/i18n"; // Import i18n instance directly
import { trackActivity, ActivityEvent } from "@/utils/activityTracker";

interface LayoutProps {
  children: React.ReactNode;
}

// Componente de header memoizado para evitar re-renders desnecessários
const Header = memo(() => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isDashboard = location.pathname === "/app/dashboard";
  // const { i18n } = useTranslation(); // Removed to avoid error

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
      <div className="flex h-14 sm:h-16 items-center gap-2 px-3 sm:px-4 lg:px-6 w-full border-b border-border">
        {/* Left section - Sidebar trigger and logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <SidebarTrigger className="h-10 w-10 shrink-0 rounded-xl md:hidden" />

          {/* Logo - Visível apenas no mobile quando sidebar está fechada */}
          <Link
            to="/app/dashboard"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80 md:hidden"
            title="Dashboard"
          >
            <Logo size={isMobile ? "sm" : "md"} />
          </Link>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex justify-center min-w-0">
          {!isDashboard && (
            <div className="w-full max-w-md lg:max-w-lg">
              <GlobalSearch />
            </div>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <CreditBadge />
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

// Main content memoizado
const MainContent = memo(({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
  <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto w-full pb-20 lg:pb-8">
    <div className={`mx-auto w-full ${wide ? "max-w-none" : "max-w-7xl"}`}>
      {children}
    </div>
  </main>
));

MainContent.displayName = "MainContent";

const OptimizedLayout = memo(({ children }: LayoutProps) => {
  const [isPWA, setIsPWA] = useState(false);
  const isMobile = useIsMobile();
  // const { i18n } = useTranslation(); // Removed to avoid error
  const location = useLocation();

  useEffect(() => {
    // Detectar se está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    setIsPWA(isStandalone);
  }, []);

  // Rastreamento de navegação
  useEffect(() => {
    const path = location.pathname;
    const eventMap: Record<string, ActivityEvent> = {
      '/app/dashboard': 'view_dashboard',
      '/app/obras': 'view_obras',
      '/app/rdo': 'view_rdos',
      '/app/equipes': 'view_equipes',
      '/app/equipamentos': 'view_equipamentos',
      '/app/fornecedores': 'view_fornecedores',
      '/app/checklist': 'view_checklist',
      '/app/documentos': 'view_documentos',
      '/app/relatorios': 'view_relatorios',
      '/app/integracoes': 'view_integracoes',
      '/app/configuracoes': 'view_configuracoes',
      '/app/perfil': 'view_perfil',
    };

    const event = eventMap[path];
    if (event) {
      trackActivity(event);
    }
  }, [location.pathname]);

  // Em dispositivos móveis no modo PWA, usar bottom navigation
  const useMobileLayout = isPWA && isMobile;

  // Get current language locale for I18nProvider
  const locale = i18n.language || 'pt-BR';

  return (
    <SidebarProvider className="overflow-hidden max-w-full">
      <I18nProvider locale={locale}>
        <div className="flex h-screen w-full max-w-full bg-background overflow-hidden">
          {/* Sidebar - oculta em PWA mobile, visível em desktop/tablet */}
          {!useMobileLayout && (
            <AppSidebar />
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header - sempre visível exceto em PWA mobile */}
            {!useMobileLayout && <Header />}

            {/* Em PWA mobile, adicionar espaço no topo */}
            {useMobileLayout && <div className="h-4 bg-background" />}

            <MainContent wide={location.pathname === "/app/dashboard"}>
              {children}
            </MainContent>
          </div>

          {/* Bottom Navigation - visível apenas em PWA mobile */}
          {useMobileLayout && <BottomNavigation />}
        </div>
      </I18nProvider>
    </SidebarProvider>
  );
});

OptimizedLayout.displayName = "OptimizedLayout";

export default OptimizedLayout;
