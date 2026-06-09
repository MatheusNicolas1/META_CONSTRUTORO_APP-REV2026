import * as Sentry from '@sentry/react';

const SENSITIVE_FIELD_PATTERN = /(authorization|cookie|token|secret|password|senha|email|phone|telefone|cpf|cnpj|document|documento|address|endereco)/i;
const REDACTED_VALUE = '[Filtered]';
const PROD_ORIGIN = 'https://metaconstrutor.app.br';
const PROD_WWW_ORIGIN = 'https://www.metaconstrutor.app.br';

declare global {
  interface Window {
    __META_SENTRY_TEST__?: () => string;
  }
}

const redactSensitiveData = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      SENSITIVE_FIELD_PATTERN.test(key) ? REDACTED_VALUE : redactSensitiveData(nestedValue),
    ]),
  );
};

const sanitizeEvent = <T extends Sentry.Event>(event: T): T => {
  const request = event.request
    ? {
        ...event.request,
        cookies: undefined,
        headers: redactSensitiveData(event.request.headers) as Record<string, string>,
      }
    : undefined;

  return {
    ...event,
    user: event.user?.id ? { id: event.user.id } : undefined,
    request,
    contexts: redactSensitiveData(event.contexts) as Sentry.Event['contexts'],
    extra: redactSensitiveData(event.extra) as Sentry.Event['extra'],
    tags: event.tags,
  } as T;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

  if (!dsn) {
    return false;
  }

  // Validar formato do DSN: apenas formato clássico https://...@o....ingest...sentry.io
  // ignorar sntrys_ (novo formato que exige tunnel/proxy server)
  const isValidDsn = /^https:\/\/[^@]+@o\d+\.ingest\.sentry\.io\/\d+$/.test(dsn);
  if (!isValidDsn) {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] DSN inválido ou formato sntrys_ ignorado:', dsn.slice(0, 20) + '...');
    }
    return false;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    tracePropagationTargets: ['localhost', PROD_ORIGIN, PROD_WWW_ORIGIN],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    tunnel: undefined, // Desabilita preflight DSN (sntrys) que viola CSP
    release: import.meta.env.VITE_APP_VERSION || undefined,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend: sanitizeEvent,
    beforeSendTransaction: sanitizeEvent,
  });

  window.__META_SENTRY_TEST__ = () => {
    Sentry.addBreadcrumb({
      category: 'qa',
      level: 'info',
      message: 'User triggered Sentry test error',
      data: { action: 'sentry_test_console' },
    });

    Sentry.captureException(new Error('Meta Construtor Sentry validation error'));
    return 'Sentry validation error captured';
  };

  return true;
};
