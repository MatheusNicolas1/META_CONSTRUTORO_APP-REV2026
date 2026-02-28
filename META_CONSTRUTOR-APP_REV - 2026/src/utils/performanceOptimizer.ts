// Utilitários para otimização de performance
export const performanceOptimizer = {
  // Debounce para reduzir chamadas desnecessárias
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttle para limitar frequência de execução
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let lastFunc: NodeJS.Timeout;
    let lastRan: number;
    return (...args: Parameters<T>) => {
      if (!lastRan) {
        func.apply(null, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(null, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  },

  // Lazy loading de componentes
  lazyLoad: (importFunc: () => Promise<any>) => {
    return React.lazy(() =>
      importFunc().then(module => ({
        default: module.default || module
      }))
    );
  },

  // Otimização de imagens
  optimizeImage: (src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'original';
  } = {}) => {
    const { width, height, quality = 85, format = 'webp' } = options;

    // Se for uma URL externa, retornar como está
    if (src.startsWith('http')) {
      return src;
    }

    // Para imagens locais, aplicar otimizações
    let optimizedSrc = src;

    // Adicionar parâmetros de otimização se necessário
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality < 100) params.set('q', quality.toString());
    if (format !== 'original') params.set('f', format);

    if (params.toString()) {
      optimizedSrc += `?${params.toString()}`;
    }

    return optimizedSrc;
  },

  // Preload de recursos críticos
  preloadResource: (href: string, as: 'script' | 'style' | 'image' | 'fetch' = 'fetch') => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;

    if (as === 'fetch') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  },

  // Prefetch de recursos para navegação futura
  prefetchResource: (href: string) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Intersection Observer otimizado
  createOptimizedObserver: (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) => {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  },

  // Verificar se o dispositivo tem recursos limitados
  isLowEndDevice: (): boolean => {
    if (typeof navigator === 'undefined') return false;

    // Verificar memória disponível
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryGB = memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
      if (memoryGB < 2) return true;
    }

    // Verificar número de cores de CPU
    if ('hardwareConcurrency' in navigator) {
      if (navigator.hardwareConcurrency <= 2) return true;
    }

    // Verificar conexão lenta
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const slowConnections = ['slow-2g', '2g'];
      if (slowConnections.includes(connection.effectiveType)) return true;
    }

    return false;
  },

  // Bundle splitting inteligente
  splitBundle: (chunkName: string) => {
    // Vite cannot analyze dynamic imports with variables directly. 
    // This requires a precise glob or similar. Disabling for now to remove warning.
    console.warn('Dynamic bundle splitting not supported in Vite without glob imports');
    return Promise.resolve(null);
  }
};

// React import para lazy loading
import React from 'react';