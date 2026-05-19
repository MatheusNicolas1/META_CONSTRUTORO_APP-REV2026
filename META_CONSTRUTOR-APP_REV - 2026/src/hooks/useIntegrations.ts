import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Integration,
  IntegrationType,
  IntegrationConfig,
  IntegrationLog,
  IntegrationStatus,
  WebhookConfig,
  N8NConfig,
  WhatsAppConfig,
  GmailConfig,
  GoogleDriveConfig,
  ApiResponse
} from '@/types/integration';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { useRequireOrg } from '@/hooks/requireOrg';

type DbIntegration = {
  id: string;
  service: string;
  credentials: IntegrationConfig;
  status: Integration['status'];
  last_sync?: string;
};

const defaultIntegrations: Partial<Integration>[] = [
  { id: 'n8n', name: 'N8N Automation', type: 'n8n', description: 'Plataforma de automacao de workflow', priority: 8, isAdvanced: true },
  { id: 'whatsapp', name: 'WhatsApp Business', type: 'whatsapp', description: 'API do WhatsApp Business', priority: 1, fluxos: ['Obra Criada', 'RDO Aprovado', 'Atividade Atrasada'] },
  { id: 'gmail', name: 'Gmail', type: 'gmail', description: 'Integracao com Gmail', priority: 2, fluxos: ['Relatorios Diarios', 'Confirmacoes', 'Alertas Urgentes'] },
  { id: 'googledrive', name: 'Google Drive', type: 'googledrive', description: 'Armazenamento na nuvem', priority: 3, fluxos: ['Upload Documentos', 'Backup Automatico'] }
];

const serviceToDb = (integrationId: string) => integrationId === 'googledrive' ? 'drive' : integrationId;
const serviceFromDb = (service: string) => ['drive', 'google_drive'].includes(service) ? 'googledrive' : service;

const functionForIntegration = (integrationId: string) => {
  switch (integrationId) {
    case 'whatsapp':
      return 'whatsapp-integration';
    case 'gmail':
      return 'gmail-integration';
    case 'googledrive':
      return 'google-drive-integration';
    case 'n8n':
      return 'n8n-integration';
    default:
      return null;
  }
};

export const useIntegrations = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const { orgId } = useRequireOrg();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (log: Omit<IntegrationLog, 'id' | 'timestamp'>) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    }, ...prev].slice(0, 100));
  };

  const mergeIntegrations = (savedRows: DbIntegration[] = []) => {
    const merged = defaultIntegrations.map(def => {
      const saved = savedRows.find(row => serviceFromDb(row.service) === def.id);
      const isConnected = saved?.status === 'connected';

      return {
        id: def.id!,
        name: def.name || '',
        type: def.type as IntegrationType,
        description: def.description || '',
        isActive: isConnected,
        isConfigured: !!saved?.credentials && Object.keys(saved.credentials || {}).length > 0,
        status: saved?.status || 'disconnected',
        configuration: saved?.credentials || {},
        lastSync: saved?.last_sync,
        priority: def.priority,
        isAdvanced: def.isAdvanced,
        fluxos: def.fluxos || []
      };
    });

    setIntegrations(merged);
    setStatuses(Object.fromEntries(merged.map(integration => [
      integration.id,
      {
        integrationId: integration.id,
        name: integration.name,
        type: integration.type,
        isHealthy: integration.status === 'connected',
        lastCheck: integration.lastSync || new Date().toISOString(),
        errorCount: integration.status === 'error' ? 1 : 0,
        successRate: integration.status === 'connected' ? 100 : 0,
        uptime: integration.status === 'connected' ? 100 : 0
      }
    ])));
  };

  const loadIntegrations = async () => {
    if (!session?.user?.id || !orgId) {
      mergeIntegrations([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, service, credentials, status, last_sync')
        .eq('org_id', orgId);

      if (error) throw error;
      mergeIntegrations((data || []) as DbIntegration[]);
    } catch (error: any) {
      addLog({
        integrationId: 'integrations',
        integrationType: 'webhook',
        event: 'integrations.load',
        status: 'error',
        message: 'Falha ao carregar integracoes',
        error: error.message
      });
      toast({ title: 'Erro', description: 'Falha ao carregar integracoes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    return Promise.resolve();
  };

  const loadWebhooks = async () => {
    setWebhooks([]);
  };

  const saveIntegrationConfig = async (integrationId: string, config: IntegrationConfig): Promise<ApiResponse> => {
    if (!session?.user?.id || !orgId) return { success: false, error: 'Usuario ou organizacao nao autenticados' };

    try {
      const status: Integration['status'] = 'connected';
      const { error } = await supabase
        .from('integrations')
        .upsert({
          org_id: orgId,
          user_id: session.user.id,
          service: serviceToDb(integrationId),
          credentials: config,
          status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'org_id, service' });

      if (error) throw error;

      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, configuration: config, isConfigured: true, isActive: true, status }
          : integration
      ));

      addLog({
        integrationId,
        integrationType: integrationId as IntegrationType,
        event: 'integration.config.saved',
        status: 'success',
        message: 'Configuracao salva no Supabase'
      });

      return { success: true, message: 'Configuracao salva com sucesso' };
    } catch (error: any) {
      addLog({
        integrationId,
        integrationType: integrationId as IntegrationType,
        event: 'integration.config.save_failed',
        status: 'error',
        message: 'Falha ao salvar configuracao',
        error: error.message
      });
      return { success: false, error: error.message || 'Falha ao salvar configuracao' };
    }
  };

  const updateIntegrationStatus = async (integrationId: string, status: Integration['status']) => {
    if (!orgId) return;
    await supabase
      .from('integrations')
      .update({ status, last_sync: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('service', serviceToDb(integrationId));
  };

  const testIntegration = async (integrationId: string, config: IntegrationConfig): Promise<boolean> => {
    const functionName = functionForIntegration(integrationId);
    if (!functionName) return false;

    const startedAt = performance.now();
    try {
      const payload = integrationId === 'n8n'
        ? { action: 'test', n8nUrl: (config as N8NConfig).n8nUrl, apiKey: (config as N8NConfig).apiKey }
        : { action: 'test' };

      const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
      if (error) throw error;

      const success = data?.success === true;
      await updateIntegrationStatus(integrationId, success ? 'connected' : 'error');

      addLog({
        integrationId,
        integrationType: integrationId as IntegrationType,
        event: 'integration.test',
        status: success ? 'success' : 'error',
        message: data?.message || data?.error || 'Teste executado via Edge Function',
        data,
        duration: Math.round(performance.now() - startedAt)
      });

      await loadIntegrations();
      return success;
    } catch (error: any) {
      await updateIntegrationStatus(integrationId, 'error');
      addLog({
        integrationId,
        integrationType: integrationId as IntegrationType,
        event: 'integration.test_failed',
        status: 'error',
        message: 'Falha ao executar Edge Function de teste',
        error: error.message,
        duration: Math.round(performance.now() - startedAt)
      });
      return false;
    }
  };

  const saveN8NConfig = (config: N8NConfig) => saveIntegrationConfig('n8n', config);
  const testN8NConfig = (config: N8NConfig) => testIntegration('n8n', config);

  const saveWhatsAppConfig = (config: WhatsAppConfig) => saveIntegrationConfig('whatsapp', config);
  const testWhatsAppConfig = (config: WhatsAppConfig) => testIntegration('whatsapp', config);

  const saveGmailConfig = (config: GmailConfig) => saveIntegrationConfig('gmail', config);
  const testGmailConfig = (config: GmailConfig) => testIntegration('gmail', config);
  const connectGmailOAuth = async () => {
    const redirectUri = `${window.location.origin}/integracoes`;
    const { data, error } = await supabase.functions.invoke('gmail-integration', { body: { action: 'oauth-url', redirectUri } });
    if (error) throw error;
    if (data?.oauthUrl) window.open(data.oauthUrl, '_blank', 'noopener,noreferrer');
    return { clientId: '', clientSecret: '', accessToken: '', refreshToken: '', settings: { enableAutoReports: true, enableUrgentAlerts: true, defaultSender: '' } } as GmailConfig;
  };

  const saveGoogleDriveConfig = (config: GoogleDriveConfig) => saveIntegrationConfig('googledrive', config);
  const testGoogleDriveConfig = (config: GoogleDriveConfig) => testIntegration('googledrive', config);
  const connectGoogleDriveOAuth = async () => {
    const redirectUri = `${window.location.origin}/integracoes`;
    const { data, error } = await supabase.functions.invoke('google-drive-integration', { body: { action: 'oauth-url', redirectUri } });
    if (error) throw error;
    if (data?.oauthUrl) window.open(data.oauthUrl, '_blank', 'noopener,noreferrer');
    return { clientId: '', clientSecret: '', accessToken: '', refreshToken: '', settings: { autoSync: true, folderStructure: { obras: 'Obras', rdos: 'RDOs', documentos: 'Documentos', checklists: 'Checklists' } } } as GoogleDriveConfig;
  };

  const saveWebhook = async () => undefined;
  const deleteWebhook = async () => undefined;
  const testWebhook = async () => true;
  const triggerEvent = async () => undefined;
  const exportLogs = async () => {
    const headers = ['Timestamp', 'Integracao', 'Evento', 'Status', 'Mensagem', 'Erro'];
    const csv = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp,
        log.integrationType,
        log.event,
        log.status,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${(log.error || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `integration_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadIntegrations();
    loadLogs();
    loadWebhooks();
  }, [session?.user?.id, orgId]);

  return {
    integrations,
    logs,
    webhooks,
    statuses,
    isLoading,
    loadIntegrations,
    loadLogs,
    saveIntegrationConfig,
    testIntegration,
    saveN8NConfig,
    testN8NConfig,
    saveWhatsAppConfig,
    testWhatsAppConfig,
    saveGmailConfig,
    testGmailConfig,
    connectGmailOAuth,
    saveGoogleDriveConfig,
    testGoogleDriveConfig,
    connectGoogleDriveOAuth,
    saveWebhook,
    deleteWebhook,
    testWebhook,
    triggerEvent,
    exportLogs
  };
};
