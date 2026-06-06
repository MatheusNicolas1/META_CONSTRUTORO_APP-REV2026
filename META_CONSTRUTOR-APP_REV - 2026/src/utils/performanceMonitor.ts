// Monitor de performance em tempo real
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observer: PerformanceObserver | null = null;
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start() {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;

    // Observar Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(entry.name, entry.startTime);
        });
      });

      this.observer.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] 
      });
    }

    // Monitor de FPS
    this.startFPSMonitor();

    // Monitor de memory usage
    this.startMemoryMonitor();

  }

  private startFPSMonitor() {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps);
        frames = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private startMemoryMonitor() {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024); // MB
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024); // MB
      }
    };

    // Medir memória a cada 10 segundos
    setInterval(measureMemory, 10000);
    measureMemory(); // Primeira medição
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Manter apenas os últimos 100 valores
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics() {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const latest = values[values.length - 1];
        
        result[name] = {
          average: Math.round(avg * 100) / 100,
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
          latest: Math.round(latest * 100) / 100,
          count: values.length
        };
      }
    });
    
    return result;
  }

  // Alertas de performance baixa
  checkPerformanceAlerts() {
    const metrics = this.getMetrics();
    const alerts: string[] = [];

    // FPS baixo
    if (metrics.fps && metrics.fps.latest < 30) {
      alerts.push(`FPS baixo: ${metrics.fps.latest}`);
    }

    // Memória alta
    if (metrics.memory_used && metrics.memory_used.latest > 100) {
      alerts.push(`Uso de memória alto: ${metrics.memory_used.latest}MB`);
    }

    // Layout shifts
    if (metrics['layout-shift'] && metrics['layout-shift'].latest > 0.1) {
      alerts.push(`Layout instável detectado`);
    }

    return alerts;
  }

  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // Penalizar FPS baixo
    if (metrics.fps && metrics.fps.average < 60) {
      score -= (60 - metrics.fps.average) * 0.5;
    }

    // Penalizar uso alto de memória
    if (metrics.memory_used && metrics.memory_used.latest > 50) {
      score -= (metrics.memory_used.latest - 50) * 0.3;
    }

    // Penalizar LCP alto
    if (metrics['largest-contentful-paint'] && metrics['largest-contentful-paint'].latest > 2500) {
      score -= (metrics['largest-contentful-paint'].latest - 2500) / 50;
    }

    return Math.max(0, Math.round(score));
  }

  stop() {
    this.isMonitoring = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  reset() {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook para usar o monitor em componentes
export const usePerformanceMonitor = () => {
  return {
    start: () => performanceMonitor.start(),
    stop: () => performanceMonitor.stop(),
    getMetrics: () => performanceMonitor.getMetrics(),
    getScore: () => performanceMonitor.getPerformanceScore(),
    getAlerts: () => performanceMonitor.checkPerformanceAlerts(),
    recordMetric: (name: string, value: number) => performanceMonitor.recordMetric(name, value)
  };
};

// Utilitário para medir performance de operações
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  name: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performanceMonitor.recordMetric(`operation_${name}`, duration);
    
    if (duration > 1000) {
      console.warn(`⚠️ Operação lenta detectada: ${name} (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    performanceMonitor.recordMetric(`operation_${name}_error`, duration);
    throw error;
  }
};

// Auto-inicializar em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    performanceMonitor.start();
  }, 1000);
}
