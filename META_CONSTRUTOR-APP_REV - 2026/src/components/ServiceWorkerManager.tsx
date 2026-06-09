import { useEffect } from 'react';

export const ServiceWorkerManager = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Gerenciamento seguro de Service Worker
      // Evita race conditions no iOS/Safari onde cache.put() e unregister()
      // concorrem pelo mesmo lock do Cache API, causando:
      // "AbortError: Lock was stolen by another request"

      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          // Aguarda o SW estar idle (sem fetch em andamento) antes de desregistrar
          if (registration.active) {
            registration.active.postMessage({ type: 'SKIP_WAITING' });
          }
          // Pequeno delay para evitar race condition com fetch handlers ativos
          setTimeout(() => {
            registration.unregister().catch(() => {
              // Falha silenciosa — unregister pode falhar em iOS se cache está em uso
              console.warn('[SW] Unregister falhou — possível cache lock concorrente');
            });
          }, 500);
        }
      }).catch(() => {
        // getRegistrations pode falhar em iOS com erro de permissão/timing
        console.warn('[SW] Não foi possível listar registrations');
      });
    }
  }, []);

  return null;
};
