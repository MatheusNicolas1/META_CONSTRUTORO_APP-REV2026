export interface LogContext {
    request_id: string;
    function_name: string;
    user_id?: string;
    org_id?: string | null;
    latency_ms?: number;
    method?: string;
    status_code?: number;
}

const formatLog = (level: 'INFO' | 'WARN' | 'ERROR', message: string, context: LogContext, extra?: any) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
        extra: extra ? sanitize(extra) : undefined,
    });
};

// Simple sanitization to avoid logging secrets
const sanitize = (data: any): any => {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const sensitiveKeys = ['token', 'secret', 'password', 'key', 'measurements']; // measurements might be huge, but maybe safe. Secrets are key.

    if (Array.isArray(data)) {
        return data.map(sanitize);
    }

    const cleaned: any = {};
    for (const key in data) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
            cleaned[key] = '[REDACTED]';
        } else {
            cleaned[key] = sanitize(data[key]);
        }
    }
    return cleaned;
};

export const logger = {
    info: (message: string, context: LogContext, data?: any) => {
        console.info(formatLog('INFO', message, context, data));
    },
    warn: (message: string, context: LogContext, data?: any) => {
        console.warn(formatLog('WARN', message, context, data));
    },
    error: (message: string, context: LogContext, error?: any) => {
        console.error(formatLog('ERROR', message, context, {
            error_message: error?.message || error,
            stack: error?.stack
        }));
    }
};
