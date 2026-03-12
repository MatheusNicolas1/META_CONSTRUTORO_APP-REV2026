/* eslint-disable react-refresh/only-export-components */
import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export type AuditEvent =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.mfa_enabled'
  | 'auth.mfa_disabled'
  | 'auth.password_changed'
  | 'auth.route_access'
  | 'rdo.created'
  | 'rdo.updated'
  | 'rdo.approved'
  | 'rdo.deleted'
  | 'rdo.exported'
  | 'obra.created'
  | 'obra.updated'
  | 'obra.deleted'
  | 'file.uploaded'
  | 'file.downloaded'
  | 'file.deleted'
  | 'permission.granted'
  | 'permission.denied'
  | 'config.updated'
  | 'integration.connected'
  | 'integration.disconnected'
  | 'backup.created'
  | 'backup.restored'
  | 'system.error'
  | 'suspicious.activity';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: AuditEvent;
  userId?: string;
  userName?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  success: boolean;
  sessionId?: string;
}

// Hook para logging de auditoria
export const useAuditLogger = () => {
  const { user, isAuthenticated } = useAuth();

  const logEvent = useCallback((
    event: AuditEvent,
    details: Record<string, any> = {},
    options: {
      severity?: AuditLogEntry['severity'];
      success?: boolean;
      resource?: string;
      resourceId?: string;
    } = {}
  ) => {
    const entry: AuditLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      event,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      ip: getClientIP(),
      userAgent: navigator.userAgent,
      resource: options.resource,
      resourceId: options.resourceId,
      details: {
        ...details,
        // Mascarar dados sensíveis
        ...maskSensitiveData(details),
      },
      severity: options.severity || getSeverityForEvent(event),
      success: options.success ?? true,
      sessionId: getSessionId(),
    };

    // Armazenar log localmente (em produção, enviar para backend)
    storeAuditLog(entry);

    // Enviar para backend se configurado
    sendToAuditService(entry);

    // Log crítico no console para desenvolvimento
    if (entry.severity === 'critical' || entry.severity === 'error') {
      console.error('AUDIT LOG:', entry);
    }
  }, [user]);

  return { logEvent };
};

// Componente Provider para auditoria automática
export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logEvent } = useAuditLogger();

  // Listener global para eventos de erro
  window.addEventListener('error', (event) => {
    // Ignorar erros irrelevantes (AdBlockers, extensões, ResizeObserver)
    if (
      event.message?.includes('ResizeObserver') ||
      event.filename?.includes('extension') ||
      event.message?.includes('stripe.com')
    ) {
      return;
    }

    logEvent('system.error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, {
      severity: 'error',
      success: false,
    });
  });

  // Listener para rejeições de Promise não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason?.toString() || '';
    const isAbortError = event.reason?.name === 'AbortError' || reasonStr.includes('aborted');
    const isStripeError = reasonStr.includes('stripe.com') || reasonStr.includes('Failed to fetch');

    // Se for erro inofensivo de rede/abort, impedimos spam no console de Audit
    if (isAbortError || isStripeError) {
      // Usar preventDefault previne que apareça "Uncaught (in promise)" no DevTools
      event.preventDefault();
      return;
    }

    logEvent('system.error', {
      reason: reasonStr,
      stack: event.reason?.stack,
    }, {
      severity: 'error',
      success: false,
    });
  });

  return <>{children}</>;
};

// Utilities
const generateId = (): string => {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getClientIP = (): string => {
  // Em produção, obter do backend ou headers
  return 'unknown';
};

const getSessionId = (): string => {
  return sessionStorage.getItem('session_id') || 'unknown';
};

const getSeverityForEvent = (event: AuditEvent): AuditLogEntry['severity'] => {
  const severityMap: Record<string, AuditLogEntry['severity']> = {
    'auth.failed_login': 'warning',
    'auth.login': 'info',
    'auth.logout': 'info',
    'auth.password_changed': 'info',
    'permission.denied': 'warning',
    'file.deleted': 'warning',
    'rdo.deleted': 'warning',
    'obra.deleted': 'warning',
    'system.error': 'error',
    'suspicious.activity': 'critical',
    'backup.restored': 'warning',
  };

  return severityMap[event] || 'info';
};

const maskSensitiveData = (data: Record<string, any>): Record<string, any> => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
  const masked = { ...data };

  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***';
    }
  });

  return masked;
};

const storeAuditLog = (entry: AuditLogEntry): void => {
  try {
    const logs = getStoredLogs();
    logs.push(entry);

    // Manter apenas os últimos 1000 logs no localStorage
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    localStorage.setItem('audit_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to store audit log:', error);
  }
};

const getStoredLogs = (): AuditLogEntry[] => {
  try {
    const stored = localStorage.getItem('audit_logs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const sendToAuditService = async (entry: AuditLogEntry): Promise<void> => {
  // TODO: Implementar envio para serviço de auditoria externo
  // Por enquanto, apenas armazenar localmente

  // Exemplo de integração futura:
  /*
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    console.error('Failed to send audit log:', error);
  }
  */
};

// API para consulta de logs (para página de segurança)
export const getAuditLogs = (filters?: {
  event?: AuditEvent[];
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: AuditLogEntry['severity'][];
  limit?: number;
}): AuditLogEntry[] => {
  let logs = getStoredLogs();

  if (filters) {
    if (filters.event) {
      logs = logs.filter(log => filters.event!.includes(log.event));
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.dateFrom) {
      logs = logs.filter(log => log.timestamp >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      logs = logs.filter(log => log.timestamp <= filters.dateTo!);
    }

    if (filters.severity) {
      logs = logs.filter(log => filters.severity!.includes(log.severity));
    }
  }

  // Ordenar por timestamp decrescente
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Aplicar limite
  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
};

export const exportAuditLogs = (format: 'json' | 'csv' = 'json'): string => {
  const logs = getAuditLogs();

  if (format === 'csv') {
    const headers = ['timestamp', 'event', 'userName', 'userRole', 'severity', 'success', 'resource', 'details'];
    const rows = logs.map(log => [
      log.timestamp,
      log.event,
      log.userName || '',
      log.userRole || '',
      log.severity,
      log.success.toString(),
      log.resource || '',
      JSON.stringify(log.details),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  return JSON.stringify(logs, null, 2);
};