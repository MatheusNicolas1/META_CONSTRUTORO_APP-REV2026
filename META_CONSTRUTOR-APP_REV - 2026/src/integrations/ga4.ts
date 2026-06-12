/**
 * Google Analytics 4 — gtag.js direto
 * Usa o script exato fornecido pelo Google, gerenciado via ambiente.
 */
const GA_MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_DEV = import.meta.env.DEV;

let initialized = false;

export const initGA = () => {
  if (initialized) return;
  if (!GA_MEASUREMENT_ID) {
    if (IS_DEV) {
      console.warn('[GA4] VITE_GA_MEASUREMENT_ID não definido. Pulei.');
    }
    return;
  }

  // Injeta o script gtag.js igual ao fornecido pelo Google
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;
  document.head.appendChild(script2);

  initialized = true;

  if (IS_DEV) {
    console.log('[GA4] Inicializado com ID:', GA_MEASUREMENT_ID);
  }
};

export const trackPageView = (path: string, _title?: string) => {
  if (!initialized) return;
  // O gtag.js já rastreia pageviews automaticamente no SPA
  // via history.pushState. Mas forçamos pra garantir:
  window.gtag?.('config', GA_MEASUREMENT_ID!, {
    page_path: path,
  });
};

export const trackEvent = (
  action: string,
  params?: Record<string, any>
) => {
  if (!initialized) return;
  window.gtag?.('event', action, params);
};

// Tipagem global pro gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export default {
  init: initGA,
  pageView: trackPageView,
  event: trackEvent,
};
