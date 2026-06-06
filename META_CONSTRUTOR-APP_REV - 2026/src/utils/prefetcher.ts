// Sistema de prefetch inteligente para reduzir delays
class IntelligentPrefetcher {
  private prefetchQueue = new Set<string>();
  private prefetchedData = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  // Prefetch baseado em padrões de navegação - Melhorado
  async prefetchRoute(route: string, dataFetcher?: () => Promise<any>) {
    if (this.prefetchQueue.has(route)) return;

    this.prefetchQueue.add(route);

    // Mapeamento de rotas mais preciso
    const routeMap: Record<string, string> = {
      'Dashboard': 'Dashboard',
      'Obras': 'Obras',
      'ObraDetalhes': 'ObraDetalhes',
      'RDO': 'RDO',
      'RDOVisualizar': 'RDOVisualizar',
      'Atividades': 'Atividades',
      'Checklist': 'Checklist',
      'ChecklistDetalhes': 'ChecklistDetalhes',
      'Equipes': 'Equipes',
      'Equipamentos': 'Equipamentos',
      'Documentos': 'Documentos',
      'Fornecedores': 'Fornecedores',
      'Relatorios': 'Relatorios',
      'Integracoes': 'Integracoes',
      'Configuracoes': 'Configuracoes',
      'Perfil': 'Perfil',
      'Feedback': 'Feedback',
      'FAQ': 'FAQ',

      'NotFound': 'NotFound'
    };

    const pageRoute = routeMap[route] || route;

    // Preload do componente removido temporariamente para evitar erros de import dinâmico
    /*
    try {
      await import(`../pages/${pageRoute}.tsx`);
    } catch (error) {
       // ...
    }
    */

    // Prefetch dos dados se fornecido
    if (dataFetcher) {
      try {
        const data = await dataFetcher();
        this.prefetchedData.set(route, data);
      } catch (error) {
        console.warn(`⚠️ Failed to prefetch data for route: ${route}`, error);
      }
    }
  }

  // Prefetch de dados reais fornecidos explicitamente pelo chamador.
  async prefetchCriticalData(
    endpoints: Array<{ key: string; fetcher: () => Promise<unknown> }> = []
  ) {
    if (endpoints.length === 0) return;

    // Execução em paralelo com limite de concorrência
    const executeBatch = async (batch: typeof endpoints) => {
      const promises = batch.map(async ({ key, fetcher }) => {
        try {
          const startTime = performance.now();
          const data = await fetcher();
          const endTime = performance.now();

          this.prefetchedData.set(key, data);
        } catch (error) {
          console.warn(`⚠️ Failed to prefetch critical data: ${key}`, error);
        }
      });

      await Promise.allSettled(promises);
    };

    // Executar em lotes para não sobrecarregar
    const batchSize = 3;
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);
      await executeBatch(batch);
    }

  }

  // Prefetch baseado em hover/focus
  onHoverPrefetch(route: string) {
    // Debounce para evitar prefetch excessivo
    setTimeout(() => {
      if (!this.prefetchQueue.has(route)) {
        this.prefetchRoute(route);
      }
    }, 100);
  }

  // Obter dados prefetched
  getPrefetchedData(key: string) {
    return this.prefetchedData.get(key);
  }

  // Limpar cache antigo
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutos

    // Remover dados antigos
    this.prefetchedData.forEach((_, key) => {
      // Implementar lógica de TTL se necessário
    });
  }
}

export const prefetcher = new IntelligentPrefetcher();

// Hook para usar prefetch em componentes
export const usePrefetch = () => {
  return {
    prefetchRoute: prefetcher.prefetchRoute.bind(prefetcher),
    onHoverPrefetch: prefetcher.onHoverPrefetch.bind(prefetcher),
    getPrefetchedData: prefetcher.getPrefetchedData.bind(prefetcher),
  };
};

// Inicializar prefetch crítico quando a app carrega - Otimizado
export const initializePrefetch = () => {

  // Prefetch de rotas populares baseado em prioridade
  setTimeout(() => {
    const routesByPriority = [
      // Prioridade alta - rotas mais acessadas
      { route: 'Dashboard', priority: 1 },
      { route: 'Obras', priority: 1 },
      { route: 'RDO', priority: 1 },

      // Prioridade média
      { route: 'Atividades', priority: 2 },
      { route: 'ObraDetalhes', priority: 2 },
      { route: 'RDOVisualizar', priority: 2 },

      // Prioridade baixa
      { route: 'Checklist', priority: 3 },
      { route: 'Equipamentos', priority: 3 },
      { route: 'Perfil', priority: 3 }
    ];

    // Prefetch por prioridade com delays escalonados
    routesByPriority.forEach(({ route, priority }) => {
      const delay = priority * 1000; // 1s, 2s, 3s
      setTimeout(() => {
        prefetcher.prefetchRoute(route);
      }, delay);
    });
  }, 1500);

  // Prefetch baseado em idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const lowPriorityRoutes = ['Documentos', 'Fornecedores', 'Relatorios', 'Configuracoes'];
      lowPriorityRoutes.forEach(route => {
        prefetcher.prefetchRoute(route);
      });
    }, { timeout: 5000 });
  }

  // Cleanup inteligente baseado em uso de memória
  const smartCleanup = () => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      prefetcher.cleanup();
    }
  };

  // Cleanup periódico inteligente
  setInterval(smartCleanup, 3 * 60 * 1000); // A cada 3 minutos

};
