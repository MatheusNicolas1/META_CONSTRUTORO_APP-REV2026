// Sistema de prefetch inteligente para reduzir delays
class IntelligentPrefetcher {
  private prefetchQueue = new Set<string>();
  private prefetchedData = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  // Prefetch baseado em padrÃµes de navegaÃ§Ã£o - Melhorado
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

    // Preload do componente removido temporariamente para evitar erros de import dinÃ¢mico
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
        console.warn(`âš ï¸ Failed to prefetch data for route: ${route}`, error);
      }
    }
  }

  // Prefetch de dados crÃ­ticos otimizado
  async prefetchCriticalData() {
    const criticalEndpoints = [
      {
        key: 'dashboard-stats',
        fetcher: () => Promise.resolve({
          totalObras: 24,
          obrasAtivas: 18,
          rdosGerados: 156,
          equipamentosAtivos: 42
        })
      },
      {
        key: 'user-profile',
        fetcher: () => {
          try {
            const authUser = localStorage.getItem("auth_user");
            const user = authUser ? JSON.parse(authUser) : null;
            return Promise.resolve({
              name: user?.name || "UsuÃ¡rio",
              role: user?.role || "Colaborador",
              email: user?.email || "",
              avatar: user?.avatar || ""
            });
          } catch {
            return Promise.resolve({
              name: "UsuÃ¡rio",
              role: "Colaborador",
              email: "",
              avatar: ""
            });
          }
        }
      },
      {
        key: 'recent-obras',
        fetcher: () => Promise.resolve([
          { id: 1, nome: "Obra Centro", status: "Ativa", progresso: 75, dataInicio: "2024-01-15" },
          { id: 2, nome: "Obra Norte", status: "Ativa", progresso: 45, dataInicio: "2024-02-01" },
          { id: 3, nome: "Obra Sul", status: "Pausada", progresso: 30, dataInicio: "2024-01-20" },
          { id: 4, nome: "Obra Oeste", status: "Concluida", progresso: 100, dataInicio: "2023-12-01" }
        ])
      },
      {
        key: 'recent-rdos',
        fetcher: () => Promise.resolve([
          { id: 1, obra: "Obra Centro", data: "2024-09-02", status: "Aprovado" },
          { id: 2, obra: "Obra Norte", data: "2024-09-01", status: "Pendente" },
          { id: 3, obra: "Obra Sul", data: "2024-08-31", status: "Aprovado" }
        ])
      },
      {
        key: 'notifications',
        fetcher: () => Promise.resolve([
          { id: 1, titulo: "RDO Pendente", descricao: "RDO da Obra Norte precisa de aprovaÃ§Ã£o", tipo: "warning" },
          { id: 2, titulo: "Equipamento DisponÃ­vel", descricao: "Escavadeira retornou da manutenÃ§Ã£o", tipo: "info" }
        ])
      }
    ];

    // ExecuÃ§Ã£o em paralelo com limite de concorrÃªncia
    const executeBatch = async (batch: typeof criticalEndpoints) => {
      const promises = batch.map(async ({ key, fetcher }) => {
        try {
          const startTime = performance.now();
          const data = await fetcher();
          const endTime = performance.now();

          this.prefetchedData.set(key, data);
        } catch (error) {
          console.warn(`âš ï¸ Failed to prefetch critical data: ${key}`, error);
        }
      });

      await Promise.allSettled(promises);
    };

    // Executar em lotes para nÃ£o sobrecarregar
    const batchSize = 3;
    for (let i = 0; i < criticalEndpoints.length; i += batchSize) {
      const batch = criticalEndpoints.slice(i, i + batchSize);
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
      // Implementar lÃ³gica de TTL se necessÃ¡rio
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

// Inicializar prefetch crÃ­tico quando a app carrega - Otimizado
export const initializePrefetch = () => {

  // Prefetch de dados crÃ­ticos imediatamente para reduzir delay inicial
  setTimeout(() => {
    prefetcher.prefetchCriticalData();
  }, 300);

  // Prefetch de rotas populares baseado em prioridade
  setTimeout(() => {
    const routesByPriority = [
      // Prioridade alta - rotas mais acessadas
      { route: 'Dashboard', priority: 1 },
      { route: 'Obras', priority: 1 },
      { route: 'RDO', priority: 1 },

      // Prioridade mÃ©dia
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

  // Cleanup inteligente baseado em uso de memÃ³ria
  const smartCleanup = () => {
    const memoryInfo = (performance as any).memory;
    if (memoryInfo && memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      prefetcher.cleanup();
    }
  };

  // Cleanup periÃ³dico inteligente
  setInterval(smartCleanup, 3 * 60 * 1000); // A cada 3 minutos

};
