import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from "@sentry/react"
import App from './App.tsx'
import './index.css'
import './lib/i18n'; // Import directly to execute side-effects
import { initAnalytics } from './integrations/analytics'

// Initialize Analytics (M9)
initAnalytics()

console.log('Main.tsx loaded - Cache Buster FINAL');

// Basic QueryClient for the root. 
// Note: PerformanceOptimizedApp creates its own client with specific config, which will override this for its children.
// This one ensures App wrapper has a context if needed.
const queryClient = new QueryClient();

// Inicialização do Sentry (Monitoramento)
// Só ativa se DSN estiver presente (produção ou dev com env configurada)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    release: import.meta.env.VITE_APP_VERSION, // Release tracking
    environment: import.meta.env.MODE,
  });
}

// Render da aplicação com StrictMode
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
