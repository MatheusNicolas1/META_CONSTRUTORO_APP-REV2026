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

  // Preload de rota com import dinâmico
  async preloadRoute(routePath: string): Promise<void> {
    if (this.preloadedRoutes.has(routePath) || this.preloadPromises.has(routePath)) {
      return this.preloadPromises.get(routePath) || Promise.resolve();
    }

    const routeMap: Record<string, () => Promise<any>> = {
      '/dashboard': () => import('@/pages/Dashboard'),
      '/obras': () => import('@/pages/Obras'),
      '/obra-detalhes': () => import('@/pages/ObraDetalhes'),
      '/rdo': () => import('@/pages/RDO'),
      '/rdo-visualizar': () => import('@/pages/RDOVisualizar'),
      '/atividades': () => import('@/pages/Atividades'),
      '/checklist': () => import('@/pages/Checklist'),
      '/checklist-detalhes': () => import('@/pages/ChecklistDetalhes'),
      '/equipes': () => import('@/pages/Equipes'),
      '/equipamentos': () => import('@/pages/Equipamentos'),
      '/documentos': () => import('@/pages/Documentos'),
      '/fornecedores': () => import('@/pages/Fornecedores'),
      '/relatorios': () => import('@/pages/Relatorios'),
      '/integracoes': () => import('@/pages/Integracoes'),
      '/configuracoes': () => import('@/pages/Configuracoes'),
      '/perfil': () => import('@/pages/Perfil'),
      '/feedback': () => import('@/pages/Feedback'),
      '/faq': () => import('@/pages/FAQ'),

    };

    const importFn = routeMap[routePath];
    if (!importFn) {
      console.warn(`Route preloader: Rota não encontrada: ${routePath}`);
      return;
    }

    const preloadPromise = importFn()
      .then((module) => {
        this.preloadedRoutes.add(routePath);
        console.log(`✅ Rota preloaded: ${routePath}`);
        return module;
      })
      .catch((error) => {
        console.error(`❌ Erro ao preload da rota ${routePath}:`, error);
        throw error;
      })
      .finally(() => {
        this.preloadPromises.delete(routePath);
      });

    this.preloadPromises.set(routePath, preloadPromise);
    return preloadPromise;
  }

  // Preload inteligente baseado em padrões de navegação
  async intelligentPreload(currentRoute: string): Promise<void> {
    // Adicionar rota atual ao histórico
    this.addToHistory(currentRoute);

    // Preload de rotas relacionadas baseado na atual
    const relatedRoutes = this.getRelatedRoutes(currentRoute);

    // Preload de rotas frequentes
    const frequentRoutes = this.getFrequentRoutes();

    // Combinar e preload
    const routesToPreload = [...new Set([...relatedRoutes, ...frequentRoutes])];

    // Preload em background com delay para não impactar performance
    setTimeout(() => {
      routesToPreload.forEach(route => {
        this.preloadRoute(route).catch(() => {
          // Ignorar erros de preload
        });
      });
    }, 100);
  }

  private addToHistory(route: string): void {
    // Remover rota se já existe
    const index = this.navigationHistory.indexOf(route);
    if (index > -1) {
      this.navigationHistory.splice(index, 1);
    }

    // Adicionar no início
    this.navigationHistory.unshift(route);

    // Manter tamanho do histórico
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.pop();
    }
  }

  private getRelatedRoutes(currentRoute: string): string[] {
    // Mapeamento de rotas relacionadas
    const relatedRoutesMap: Record<string, string[]> = {
      '/dashboard': ['/obras', '/rdo', '/atividades'],
      '/obras': ['/obra-detalhes', '/rdo', '/atividades', '/equipes'],
      '/obra-detalhes': ['/obras', '/rdo', '/documentos', '/checklist'],
      '/rdo': ['/rdo-visualizar', '/obras', '/atividades', '/equipamentos'],
      '/rdo-visualizar': ['/rdo', '/obras'],
      '/atividades': ['/obras', '/rdo', '/checklist', '/equipes'],
      '/checklist': ['/checklist-detalhes', '/atividades', '/obras'],
      '/checklist-detalhes': ['/checklist', '/obras'],
      '/equipes': ['/obras', '/atividades', '/rdo'],
      '/equipamentos': ['/obras', '/rdo', '/atividades'],
      '/documentos': ['/obras', '/obra-detalhes'],
      '/fornecedores': ['/obras', '/documentos'],
      '/relatorios': ['/obras', '/rdo', '/atividades'],
      '/integracoes': ['/configuracoes'],
      '/configuracoes': ['/integracoes', '/perfil'],
      '/perfil': ['/configuracoes'],
      '/feedback': ['/faq'],
      '/faq': ['/feedback'],

    };

    return relatedRoutesMap[currentRoute] || [];
  }

  private getFrequentRoutes(): string[] {
    // Rotas mais frequentemente acessadas (baseado no histórico)
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

  // Preload de rotas críticas na inicialização
  async preloadCriticalRoutes(): Promise<void> {
    const criticalRoutes = ['/dashboard', '/obras', '/rdo'];

    const promises = criticalRoutes.map(route =>
      this.preloadRoute(route).catch(() => {
        // Ignorar erros para não bloquear a inicialização
      })
    );

    await Promise.allSettled(promises);
    console.log('📦 Rotas críticas preloaded');
  }

  // Preload baseado em hover/focus
  onRouteHover(routePath: string): void {
    // Delay pequeno para evitar preload desnecessário
    setTimeout(() => {
      this.preloadRoute(routePath).catch(() => {
        // Ignorar erros
      });
    }, 200);
  }

  // Limpar cache quando necessário
  clearCache(): void {
    this.preloadedRoutes.clear();
    this.preloadPromises.clear();
    this.navigationHistory = [];
    console.log('🧹 Cache de rotas limpo');
  }

  // Estatísticas
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

// Inicializar preload crítico
export const initializeRoutePreloader = () => {
  // Preload de rotas críticas após inicialização
  setTimeout(() => {
    routePreloader.preloadCriticalRoutes();
  }, 1500);

  // Preload adicional baseado em idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const additionalRoutes = ['/atividades', '/checklist', '/equipamentos'];
      additionalRoutes.forEach(route => {
        routePreloader.preloadRoute(route).catch(() => { });
      });
    });
  }
};