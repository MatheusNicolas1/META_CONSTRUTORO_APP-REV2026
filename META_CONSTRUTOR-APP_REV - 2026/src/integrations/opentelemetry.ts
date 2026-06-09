/**
 * OpenTelemetry Logs exporter via OTLP HTTP.
 * Sends browser-side telemetry to PostHog's OTLP endpoint.
 */
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SeverityNumber } from '@opentelemetry/api-logs';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const IS_DEV = import.meta.env.DEV;

let loggerProvider: LoggerProvider | null = null;

/**
 * Initialize the OpenTelemetry logger provider and export logs to PostHog OTLP endpoint.
 */
export const initOpenTelemetry = () => {
  if (!POSTHOG_KEY) {
    if (IS_DEV) {
      console.debug('[OpenTelemetry] Skipping init: no VITE_POSTHOG_KEY');
    }
    return;
  }

  try {
    const resource = resourceFromAttributes({
      'service.name': 'meta-construtor-app',
      'service.version': import.meta.env.VITE_APP_VERSION || 'unknown',
      'deployment.environment': IS_DEV ? 'development' : 'production',
    });

    const exporter = new OTLPLogExporter({
      url: `${POSTHOG_HOST}/otlp/v1/logs`,
      headers: {
        Authorization: `Bearer ${POSTHOG_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    loggerProvider = new LoggerProvider({
      resource,
      processors: [new SimpleLogRecordProcessor(exporter)],
    });

    if (IS_DEV) {
      console.debug('[OpenTelemetry] Logger initialized, exporting to', `${POSTHOG_HOST}/otlp/v1/logs`);
    }
  } catch (error) {
    if (IS_DEV) {
      console.warn('[OpenTelemetry] Failed to initialize:', error);
    }
  }
};

/**
 * Log a message with structured severity and attributes.
 */
export const logToPostHog = (
  message: string,
  severity: 'debug' | 'info' | 'warn' | 'error' = 'info',
  attributes: Record<string, unknown> = {}
) => {
  if (!loggerProvider) return;

  const severityMap: Record<string, { number: SeverityNumber; text: string }> = {
    debug: { number: SeverityNumber.DEBUG, text: 'DEBUG' },
    info: { number: SeverityNumber.INFO, text: 'INFO' },
    warn: { number: SeverityNumber.WARN, text: 'WARN' },
    error: { number: SeverityNumber.ERROR, text: 'ERROR' },
  };

  const sev = severityMap[severity] || severityMap.info;

  try {
    const logger = loggerProvider.getLogger('meta-construtor-app', import.meta.env.VITE_APP_VERSION || 'unknown');
    logger.emit({
      severityNumber: sev.number,
      severityText: sev.text,
      body: message,
      attributes: {
        ...attributes,
        source: 'frontend',
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (IS_DEV) {
      console.warn('[OpenTelemetry] Log emission failed:', error);
    }
  }
};

export default {
  init: initOpenTelemetry,
  log: logToPostHog,
};
