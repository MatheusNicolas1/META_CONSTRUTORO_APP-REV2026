import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { initAnalytics } from './integrations/analytics';
import { initSentry } from './integrations/sentry';
import { initGA } from './integrations/ga4';

initAnalytics();
initGA();
initSentry();

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
