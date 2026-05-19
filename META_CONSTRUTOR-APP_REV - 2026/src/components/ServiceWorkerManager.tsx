import { useEffect } from 'react';

export const ServiceWorkerManager = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // DESATIVAR/REMOVER Service Worker para evitar erros de rede/cache
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    // Service Worker registration only
    // Preloading removed to avoid 404s on non-existent API routes
  }, []);

  return null;
};
