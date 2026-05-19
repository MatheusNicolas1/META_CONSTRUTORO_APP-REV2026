// Sistema inteligente de preload de rotas
class RoutePreloader {
  private static instance: RoutePreloader;
  private preloadedRoutes = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();
  private navigationHistory: string[] = [];
  private maxHistorySize = 10;

  static getInstance(): RoutePreloader {
    if (!RoutePreloader.instance) {
      RoutePreloader.instance = new RoutePreloader();
    }
    return RoutePreloader.instance;
  }

  // Preload de rota com import dinÃ¢mico
  async preloadRoute(routePath: string): Promise<void> {
    if (this.preloadedRoutes.has(routePath) || this.preloadPromises.has(routePath)) {
      return this.preloadPromises.get(routePath) || Promise.resolve();
    }

    const routeMap: Record<string, () => Promise<any>> = {
      '/app/dashboard': () => import('@/pages/Dashboard'),
      '/app/obras': () => import('@/pages/Obras'),
      '/app/obra-detalhes': () => import('@/pages/ObraDetalhes'),
      '/app/rdo': () => import('@/pages/RDO'),
      '/app/rdo-visualizar': () => import('@/pages/RDOVisualizar'),
      '/app/atividades': () => import('@/pages/Atividades'),
      '/app/checklist': () => import('@/pages/Checklist'),
      '/app/checklist-detalhes': () => import('@/pages/ChecklistDetalhes'),
      '/app/equipes': () => import('@/pages/Equipes'),
      '/app/equipamentos': () => import('@/pages/Equipamentos'),
      '/app/documentos': () => import('@/pages/Documentos'),
      '/app/fornecedores': () => import('@/pages/Fornecedores'),
      '/app/relatorios': () => import('@/pages/Relatorios'),
      '/app/integracoes': () => import('@/pages/Integracoes'),
      '/app/configuracoes': () => import('@/pages/Configuracoes'),
      '/app/perfil': () => import('@/pages/Perfil'),
      '/app/feedback': () => import('@/pages/Feedback'),
      '/app/faq': () => import('@/pages/FAQ'),

    };

    const importFn = routeMap[routePath];
    if (!importFn) {
      console.warn(`Route preloader: Rota nÃ£o encontrada: ${routePath}`);
      return;
    }

    const preloadPromise = importFn()
      .then((module) => {
        this.preloadedRoutes.add(routePath);
        return module;
      })
      .catch((error) => {
        console.error(`âŒ Erro ao preload da rota ${routePath}:`, error);
        throw error;
      })
      .finally(() => {
        this.preloadPromises.delete(routePath);
      });

    this.preloadPromises.set(routePath, preloadPromise);
    return preloadPromise;
  }

  // Preload inteligente baseado em padrÃµes de navegaÃ§Ã£o
  async intelligentPreload(currentRoute: string): Promise<void> {
    // Adicionar rota atual ao histÃ³rico
    this.addToHistory(currentRoute);

    // Preload de rotas relacionadas baseado na atual
    const relatedRoutes = this.getRelatedRoutes(currentRoute);

    // Preload de rotas frequentes
    const frequentRoutes = this.getFrequentRoutes();

    // Combinar e preload
    const routesToPreload = [...new Set([...relatedRoutes, ...frequentRoutes])];

    // Preload em background com delay para nÃ£o impactar performance
    setTimeout(() => {
      routesToPreload.forEach(route => {
        this.preloadRoute(route).catch(() => {
          // Ignorar erros de preload
        });
      });
    }, 100);
  }

  private addToHistory(route: string): void {
    // Remover rota se jÃ¡ existe
    const index = this.navigationHistory.indexOf(route);
    if (index > -1) {
      this.navigationHistory.splice(index, 1);
    }

    // Adicionar no inÃ­cio
    this.navigationHistory.unshift(route);

    // Manter tamanho do histÃ³rico
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.pop();
    }
  }

  private getRelatedRoutes(currentRoute: string): string[] {
    // Mapeamento de rotas relacionadas
    const relatedRoutesMap: Record<string, string[]> = {
      '/app/dashboard': ['/app/obras', '/app/rdo', '/app/atividades'],
      '/app/obras': ['/app/obra-detalhes', '/app/rdo', '/app/atividades', '/app/equipes'],
      '/app/obra-detalhes': ['/app/obras', '/app/rdo', '/app/documentos', '/app/checklist'],
      '/app/rdo': ['/app/rdo-visualizar', '/app/obras', '/app/atividades', '/app/equipamentos'],
      '/app/rdo-visualizar': ['/app/rdo', '/app/obras'],
      '/app/atividades': ['/app/obras', '/app/rdo', '/app/checklist', '/app/equipes'],
      '/app/checklist': ['/app/checklist-detalhes', '/app/atividades', '/app/obras'],
      '/app/checklist-detalhes': ['/app/checklist', '/app/obras'],
      '/app/equipes': ['/app/obras', '/app/atividades', '/app/rdo'],
      '/app/equipamentos': ['/app/obras', '/app/rdo', '/app/atividades'],
      '/app/documentos': ['/app/obras', '/app/obra-detalhes'],
      '/app/fornecedores': ['/app/obras', '/app/documentos'],
      '/app/relatorios': ['/app/obras', '/app/rdo', '/app/atividades'],
      '/app/integracoes': ['/app/configuracoes'],
      '/app/configuracoes': ['/app/integracoes', '/app/perfil'],
      '/app/perfil': ['/app/configuracoes'],
      '/app/feedback': ['/app/faq'],
      '/app/faq': ['/app/feedback'],

    };

    return relatedRoutesMap[currentRoute] || [];
  }

  private getFrequentRoutes(): string[] {
    // Rotas mais frequentemente acessadas (baseado no histÃ³rico)
    const routeFrequency: Record<string, number> = {};

    this.navigationHistory.forEach(route => {
      routeFrequency[route] = (routeFrequency[route] || 0) + 1;
    });

    // Retornar top 3 rotas mais frequentes (excluindo a atual)
    return Object.entries(routeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([route]) => route);
  }

  // Preload de rotas crÃ­ticas na inicializaÃ§Ã£o
  async preloadCriticalRoutes(): Promise<void> {
    const criticalRoutes = ['/app/dashboard', '/app/obras', '/app/rdo'];

    const promises = criticalRoutes.map(route =>
      this.preloadRoute(route).catch(() => {
        // Ignorar erros para nÃ£o bloquear a inicializaÃ§Ã£o
      })
    );

    await Promise.allSettled(promises);
  }

  // Preload baseado em hover/focus
  onRouteHover(routePath: string): void {
    // Delay pequeno para evitar preload desnecessÃ¡rio
    setTimeout(() => {
      this.preloadRoute(routePath).catch(() => {
        // Ignorar erros
      });
    }, 200);
  }

  // Limpar cache quando necessÃ¡rio
  clearCache(): void {
    this.preloadedRoutes.clear();
    this.preloadPromises.clear();
    this.navigationHistory = [];
  }

  // EstatÃ­sticas
  getStats() {
    return {
      preloadedRoutes: Array.from(this.preloadedRoutes),
      preloadingRoutes: Array.from(this.preloadPromises.keys()),
      navigationHistory: [...this.navigationHistory],
      totalPreloaded: this.preloadedRoutes.size,
      currentlyPreloading: this.preloadPromises.size
    };
  }
}

export const routePreloader = RoutePreloader.getInstance();

// Hook para usar preloader em componentes
export const useRoutePreloader = () => {
  return {
    preloadRoute: (route: string) => routePreloader.preloadRoute(route),
    intelligentPreload: (currentRoute: string) => routePreloader.intelligentPreload(currentRoute),
    onRouteHover: (route: string) => routePreloader.onRouteHover(route),
    getStats: () => routePreloader.getStats(),
    clearCache: () => routePreloader.clearCache()
  };
};

// Inicializar preload crÃ­tico
export const initializeRoutePreloader = () => {
  // Preload de rotas crÃ­ticas apÃ³s inicializaÃ§Ã£o
  setTimeout(() => {
    routePreloader.preloadCriticalRoutes();
  }, 1500);

  // Preload adicional baseado em idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const additionalRoutes = ['/app/atividades', '/app/checklist', '/app/equipamentos'];
      additionalRoutes.forEach(route => {
        routePreloader.preloadRoute(route).catch(() => { });
      });
    });
  }
};
