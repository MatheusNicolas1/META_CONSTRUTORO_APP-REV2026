import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SecurityHeadersProps {
  nonce?: string;
  title?: string;
  description?: string;
}

// Componente para aplicar headers de segurança e CSP
export const SecurityHeaders: React.FC<SecurityHeadersProps> = ({
  nonce,
  title = "Meta Construtor",
  description = "Sistema de gestão de obras e RDOs"
}) => {
  // Gerar nonce se não fornecido
  const scriptNonce = nonce || generateNonce();

  useEffect(() => {
    // Configurar headers de segurança via meta tags
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      cspMeta.setAttribute('content', buildCSP(scriptNonce));
      document.head.appendChild(cspMeta);
    }
  }, [scriptNonce]);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Security Headers */}
      {/* Security Headers - Note: Frame-Ancestors is ignored in meta tags in modern browsers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />

      {/* HSTS for HTTPS */}
      <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />

      {/* CSP */}
      <meta
        httpEquiv="Content-Security-Policy"
        content={buildCSP(scriptNonce)}
      />

      {/* Prevent MIME sniffing */}
      <meta httpEquiv="X-Download-Options" content="noopen" />

      {/* Disable DNS prefetching for privacy */}
      <meta httpEquiv="x-dns-prefetch-control" content="off" />
    </Helmet>
  );
};

// Gerar nonce para scripts
const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Construir Content Security Policy
const buildCSP = (nonce: string): string => {
  const isDevelopment = import.meta.env.DEV;

  // Stripe só precisa ser permitido em rotas de pagamento/checkout
  const policies = [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      'https://js.stripe.com',
      'https://www.googletagmanager.com',
      'https://us-assets.i.posthog.com',
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ].join(' '),
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    [
      "connect-src",
      "'self'",
      "https://api.stripe.com",
      "https://maps.googleapis.com",
      // Google Analytics
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://www.google.com",
      // PostHog
      "https://app.posthog.com",
      "https://us-assets.i.posthog.com",
      "https://us.i.posthog.com",
      "https://eu.i.posthog.com",
      // Supabase project (REST, Auth, Realtime)
      import.meta.env.VITE_SUPABASE_URL || "https://bgdvlhttyjeuprrfxgun.supabase.co",
      (import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.replace('https://', 'wss://') : "wss://bgdvlhttyjeuprrfxgun.supabase.co"),
      "https://o4511422743576576.ingest.us.sentry.io",
      // Local dev (only used when isDevelopment === true)
      ...(isDevelopment ? ["ws://localhost:*", "http://localhost:*"] : []),
    ].join(' '),
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ];

  return policies.join('; ');
};

export default SecurityHeaders;
