import * as Sentry from '@sentry/react';

const SENSITIVE_FIELD_PATTERN = /(authorization|cookie|token|secret|password|senha|email|phone|telefone|cpf|cnpj|document|documento|address|endereco)/i;
const REDACTED_VALUE = '[Filtered]';

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
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend: sanitizeEvent,
    beforeSendTransaction: sanitizeEvent,
  });

  return true;
};
