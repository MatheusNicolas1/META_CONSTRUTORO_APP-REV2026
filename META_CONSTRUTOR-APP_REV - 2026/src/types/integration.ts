// Tipos para integração com serviços externos
export type IntegrationType = 'n8n' | 'whatsapp' | 'gmail' | 'googledrive' | 'webhook';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description: string;
  isActive: boolean;
  isConfigured: boolean;
  lastSync?: string;
  configuration: IntegrationConfig;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  errorMessage?: string;
  priority?: number;
  fluxos?: string[];
  isAdvanced?: boolean;
}

export interface IntegrationConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  baseUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  settings?: Record<string, any>;
}

// N8N Integration
export interface N8NConfig extends IntegrationConfig {
  n8nUrl: string;
  apiKey: string;
  workflowIds?: string[];
}

export interface N8NWebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  source: string;
}

// WhatsApp Business API
export interface WhatsAppConfig extends IntegrationConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
  settings: {
    enableNotifications: boolean;
    enableReports: boolean;
    templateIds: string[];
  };
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document' | 'audio';
  content: {
    text?: string;
    templateName?: string;
    templateParams?: string[];
    mediaUrl?: string;
    filename?: string;
  };
}

// Gmail Integration
export interface GmailConfig extends IntegrationConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  settings: {
    enableAutoReports: boolean;
    enableUrgentAlerts: boolean;
    defaultSender: string;
    signature?: string;
  };
}

export interface GmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: {
    filename: string;
    content: string;
    mimeType: string;
  }[];
}

// Google Drive Integration
export interface GoogleDriveConfig extends IntegrationConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  settings: {
    autoSync: boolean;
    rootFolderId?: string;
    folderStructure: {
      obras: string;
      rdos: string;
      documentos: string;
      checklists: string;
    };
  };
}

export interface DriveUpload {
  filename: string;
  content: string | File;
  mimeType: string;
  folderId?: string;
  parentPath?: string;
}

// Integration Logs
export interface IntegrationLog {
  id: string;
  integrationId: string;
  integrationType: IntegrationType;
  event: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: Record<string, any>;
  error?: string;
  timestamp: string;
  duration?: number;
}

// Webhook Configuration
export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  events: string[];
  isActive: boolean;
  secret?: string;
  retryCount: number;
  timeout: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  attempts: number;
  lastAttempt?: string;
  nextRetry?: string;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Integration Events
export type IntegrationEvent =
  | 'obra.created'
  | 'obra.updated'
  | 'obra.completed'
  | 'rdo.created'
  | 'rdo.approved'
  | 'checklist.completed'
  | 'atividade.created'
  | 'atividade.completed'
  | 'colaborador.added'
  | 'equipe.created'
  | 'documento.uploaded'
  | 'notification.urgent'
  | 'report.daily'
  | 'report.weekly'
  | 'backup.completed';

export interface EventPayload {
  event: IntegrationEvent;
  entityId: string;
  entityType: string;
  data: Record<string, any>;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Integration Status
export interface IntegrationStatus {
  integrationId: string;
  name: string;
  type: IntegrationType;
  isHealthy: boolean;
  hasEvidence: boolean;
  lastCheck: string;
  latency?: number;
  errorCount: number;
  successRate?: number;
  uptime?: number;
  evidenceCount: number;
  successfulEvents: number;
}

// Configuration Validation
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}
