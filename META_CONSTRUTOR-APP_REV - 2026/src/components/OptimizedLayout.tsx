import React, { memo, useMemo, useEffect, useState } from "react";
import { SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationPanel } from "./NotificationPanel";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserProfile } from "./UserProfile";
import { GlobalSearch } from "./GlobalSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { I18nProvider } from "react-aria-components";
import Logo from "./Logo";
import { useOptimizedCallback } from "@/hooks/useOptimizedCallback";
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
  // const { i18n } = useTranslation(); // Removed to avoid error

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
      <div className="flex h-14 sm:h-16 items-center gap-2 px-3 sm:px-4 lg:px-6 w-full border-b border-border">
        {/* Left section - Sidebar trigger and logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <SidebarTrigger className="shrink-0" />

          {/* Logo - Visível apenas no mobile quando sidebar está fechada */}
          {isMobile && (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              title="Dashboard"
            >
              <Logo size="sm" />
            </Link>
          )}
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="w-full max-w-md lg:max-w-lg">
            <GlobalSearch />
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationPanel />
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

// Main content memoizado
const MainContent = memo(({ children }: { children: React.ReactNode }) => (
  <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto w-full pb-20 lg:pb-8">
    <div className="mx-auto max-w-7xl w-full">
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
      '/dashboard': 'view_dashboard',
      '/obras': 'view_obras',
      '/rdos': 'view_rdos',
      '/equipes': 'view_equipes',
      '/equipamentos': 'view_equipamentos',
      '/fornecedores': 'view_fornecedores',
      '/checklist': 'view_checklist',
      '/documentos': 'view_documentos',
      '/relatorios': 'view_relatorios',
      '/integracoes': 'view_integracoes',
      '/configuracoes': 'view_configuracoes',
      '/perfil': 'view_perfil',
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
    <SidebarProvider>
      <I18nProvider locale={locale}>
        <div className="flex h-screen w-full bg-background overflow-hidden">
          {/* Sidebar - oculta em PWA mobile, visível em desktop/tablet */}
          {!useMobileLayout && (
            <AppSidebar />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header - sempre visível exceto em PWA mobile */}
            {!useMobileLayout && <Header />}

            {/* Em PWA mobile, adicionar espaço no topo */}
            {useMobileLayout && <div className="h-4 bg-background" />}

            <MainContent>
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