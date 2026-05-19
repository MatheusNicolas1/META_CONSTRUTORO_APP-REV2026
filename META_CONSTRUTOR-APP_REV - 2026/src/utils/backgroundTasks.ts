// Sistema de tarefas em background para nÃ£o bloquear UI
class BackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private taskQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private maxConcurrentTasks = 2;
  private currentTasks = 0;

  static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  // Adicionar tarefa Ã  fila
  addTask<T>(task: () => Promise<T>, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      };

      // Inserir baseado na prioridade
      if (priority === 'high') {
        this.taskQueue.unshift(wrappedTask);
      } else if (priority === 'medium') {
        // Inserir no meio
        const middleIndex = Math.floor(this.taskQueue.length / 2);
        this.taskQueue.splice(middleIndex, 0, wrappedTask);
      } else {
        this.taskQueue.push(wrappedTask);
      }

      this.processQueue();
    });
  }

  // Processar fila de tarefas
  private async processQueue() {
    if (this.isProcessing || this.currentTasks >= this.maxConcurrentTasks) {
      return;
    }

    if (this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.currentTasks++;

    const task = this.taskQueue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error('Background task failed:', error);
      } finally {
        this.currentTasks--;
        this.isProcessing = false;
        
        // Processar prÃ³xima tarefa
        if (this.taskQueue.length > 0) {
          // Pequeno delay para nÃ£o sobrecarregar
          setTimeout(() => this.processQueue(), 10);
        }
      }
    }
  }

  // Limpar fila
  clearQueue() {
    this.taskQueue = [];
  }

  // EstatÃ­sticas
  getStats() {
    return {
      queueLength: this.taskQueue.length,
      currentTasks: this.currentTasks,
      isProcessing: this.isProcessing
    };
  }
}

export const backgroundTaskManager = BackgroundTaskManager.getInstance();

// UtilitÃ¡rios para uso comum
export const runInBackground = <T>(
  task: () => Promise<T>, 
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<T> => {
  return backgroundTaskManager.addTask(task, priority);
};

// Tarefas especÃ­ficas para otimizaÃ§Ã£o
export const backgroundOptimizations = {
  // Limpeza de cache antigo
  cleanupOldCache: () => runInBackground(async () => {
    const keys = Object.keys(localStorage);
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    
    keys.forEach(key => {
      if (key.startsWith('cache_') || key.startsWith('prefetch_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && data.timestamp < cutoff) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove se nÃ£o conseguir parsear
          localStorage.removeItem(key);
        }
      }
    });
    
  }, 'low'),

  // Preload de recursos crÃ­ticos
  preloadCriticalResources: () => runInBackground(async () => {
    const criticalUrls = [
      '/api/dashboard/stats',
      '/api/user/profile',
      '/api/obras/recent'
    ];

    const promises = criticalUrls.map(url => 
      fetch(url, { method: 'HEAD' }).catch(() => {
        // Ignorar erros - Ã© apenas preload
      })
    );

    await Promise.allSettled(promises);
  }, 'high'),

  // OtimizaÃ§Ã£o de imagens carregadas
  optimizeLoadedImages: () => runInBackground(async () => {
    const images = document.querySelectorAll('img[src]');
    
    images.forEach((img: any) => {
      // Lazy load para imagens que nÃ£o estÃ£o visÃ­veis
      if (!img.loading && !isElementInViewport(img)) {
        img.loading = 'lazy';
      }
      
      // Adicionar decode="async" para performance
      if (!img.decode) {
        img.decoding = 'async';
      }
    });
    
  }, 'low'),

  // AnÃ¡lise de performance da pÃ¡gina
  analyzePagePerformance: () => runInBackground(async () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      };
      
      // Log apenas se performance estiver ruim
      if (metrics.totalLoadTime > 3000) {
        console.warn('âš ï¸ Performance da pÃ¡gina baixa:', metrics);
      } else {
      }
      
      return metrics;
    }
  }, 'low'),

  // Limpeza de event listeners nÃ£o utilizados
  cleanupEventListeners: () => runInBackground(async () => {
    // Remover listeners de elementos que nÃ£o existem mais
    const elements = document.querySelectorAll('[data-cleanup-listeners]');
    elements.forEach(element => {
      element.removeAttribute('data-cleanup-listeners');
    });
    
  }, 'low')
};

// FunÃ§Ã£o auxiliar para verificar se elemento estÃ¡ no viewport
function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Inicializar otimizaÃ§Ãµes em background
export const initializeBackgroundOptimizations = () => {
  
  // Executar otimizaÃ§Ãµes iniciais
  setTimeout(() => {
    backgroundOptimizations.preloadCriticalResources();
    backgroundOptimizations.optimizeLoadedImages();
  }, 2000);
  
  // Executar limpezas periÃ³dicas
  setTimeout(() => {
    backgroundOptimizations.cleanupOldCache();
    backgroundOptimizations.analyzePagePerformance();
  }, 5000);
  
  // Limpezas periÃ³dicas
  setInterval(() => {
    backgroundOptimizations.cleanupEventListeners();
    backgroundOptimizations.optimizeLoadedImages();
  }, 60000); // A cada minuto
  
  setInterval(() => {
    backgroundOptimizations.cleanupOldCache();
  }, 300000); // A cada 5 minutos
  
};
