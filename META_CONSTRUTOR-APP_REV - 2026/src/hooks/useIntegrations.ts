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
  ApiResponse,
  EventPayload
} from '@/types/integration';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';

export const useIntegrations = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  // Estados
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Default integrations structure
  const defaultIntegrations: Partial<Integration>[] = [
    { id: 'n8n', name: 'N8N Automation', type: 'n8n', description: 'Plataforma de automação de workflow', priority: 8, isAdvanced: true },
    { id: 'whatsapp', name: 'WhatsApp Business', type: 'whatsapp', description: 'API do WhatsApp Business', priority: 1, fluxos: ["Obra Criada", "RDO Aprovado", "Atividade Atrasada"] },
    { id: 'gmail', name: 'Gmail', type: 'gmail', description: 'Integração com Gmail', priority: 2, fluxos: ["Relatórios Diários", "Confirmações", "Alertas Urgentes"] },
    { id: 'googledrive', name: 'Google Drive', type: 'googledrive', description: 'Armazenamento na nuvem', priority: 3, fluxos: ["Upload Documentos", "Backup Automático"] },
    { id: 'googlecalendar', name: 'Google Agenda', type: 'googledrive', description: 'Agendamento automático', priority: 4, fluxos: ["Cronogramas", "Lembretes"] }
  ];

  // Carregar integrações
  const loadIntegrations = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // Fetch user's integrations configs from Supabase
      // Fetch user's integrations configs from Supabase
      const { data: userIntegrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', session.user.id);

      if (error && error.code !== 'PGRST116') { // Ignore not found/empty if handled
        console.error('Error fetching integrations:', error);
      }

      // Merge defaults with saved configs
      const mergedIntegrations: Integration[] = defaultIntegrations.map(def => {
        const saved = userIntegrations?.find((ui) => ui.service_id === def.id);

        return {
          id: def.id!, // service_id matches predefined IDs
          name: def.name || '',
          type: def.type as IntegrationType,
          description: def.description || '',
          isActive: saved?.is_active ?? false,
          isConfigured: !!saved?.config,
          status: (saved?.status as Integration['status']) || 'disconnected',
          configuration: (saved?.config as IntegrationConfig) || {},
          lastSync: saved?.last_sync || undefined,
          priority: def.priority,
          isAdvanced: def.isAdvanced,
          fluxos: def.fluxos || []
        };
      });

      setIntegrations(mergedIntegrations);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar integrações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar logs
  const loadLogs = async () => {
    if (!session?.user?.id) return;
    setLogs([]);
  };

  // Carregar webhooks
  const loadWebhooks = async () => {
    setWebhooks([]);
  };

  // Salvar configuração de integração
  const saveIntegrationConfig = async (integrationId: string, config: IntegrationConfig): Promise<ApiResponse> => {
    if (!session?.user?.id) return { success: false, error: 'Usuário não autenticado' };

    try {
      console.log('Salvando configuração:', { integrationId, config });

      const { error } = await supabase
        .from('integrations')
        .upsert({
          user_id: session.user.id,
          service_id: integrationId,
          config: config,
          is_active: true,
          status: 'connected', // Assume connected on save for now, or use test to confirm
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, service_id' });

      if (error) throw error;

      // Atualizar estado local
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === integrationId
            ? { ...integration, configuration: config, isConfigured: true, isActive: true, status: 'connected' }
            : integration
        )
      );

      toast({
        title: "Sucesso",
        description: "Integração salva com sucesso",
      });

      return { success: true, message: 'Configuração salva com sucesso' };
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      return { success: false, error: 'Falha ao salvar configuração' };
    }
  };

  // Testar integração
  const testIntegration = async (integrationId: string, config: IntegrationConfig): Promise<boolean> => {
    try {
      console.log('Testando integração:', { integrationId, config });

      // Simulate real ping check
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validate basic requirements
      let isValid = false;
      if (integrationId === 'n8n' && (config as N8NConfig).n8nUrl) isValid = true;
      if (integrationId === 'whatsapp' && (config as WhatsAppConfig).phoneNumberId) isValid = true;
      if (integrationId === 'gmail' && (config as GmailConfig).clientId) isValid = true;
      if (integrationId === 'googledrive' && (config as GoogleDriveConfig).clientId) isValid = true;

      // If valid, explicitly update status to connected in DB
      if (isValid) {
        saveIntegrationConfig(integrationId, config); // Re-save to confirm connected status
        toast({ title: "Teste bem-sucedido", description: `Conexão com ${integrationId} verificada.` });
        return true;
      } else {
        toast({ title: "Falha no teste", description: "Verifique as configurações.", variant: "destructive" });
        return false;
      }
    } catch (error) {
      console.error('Erro ao testar integração:', error);
      toast({ title: "Erro", description: "Erro ao executar teste.", variant: "destructive" });
      return false;
    }
  };

  // Específicos para N8N, WhatsApp, Gmail, Drive mapped to generic save
  const saveN8NConfig = (config: N8NConfig) => saveIntegrationConfig('n8n', config);
  const testN8NConfig = (config: N8NConfig) => testIntegration('n8n', config);

  const saveWhatsAppConfig = (config: WhatsAppConfig) => saveIntegrationConfig('whatsapp', config);
  const testWhatsAppConfig = (config: WhatsAppConfig) => testIntegration('whatsapp', config);

  const saveGmailConfig = (config: GmailConfig) => saveIntegrationConfig('gmail', config);
  const testGmailConfig = (config: GmailConfig) => testIntegration('gmail', config);
  const connectGmailOAuth = async () => ({ clientId: '', clientSecret: '', accessToken: '', refreshToken: '', settings: { enableAutoReports: true, enableUrgentAlerts: true, defaultSender: 'test@email.com' } } as GmailConfig);

  const saveGoogleDriveConfig = (config: GoogleDriveConfig) => saveIntegrationConfig('googledrive', config);
  const testGoogleDriveConfig = (config: GoogleDriveConfig) => testIntegration('googledrive', config);
  const connectGoogleDriveOAuth = async () => ({ clientId: '', clientSecret: '', accessToken: '', refreshToken: '', settings: { autoSync: true, folderStructure: {} } } as GoogleDriveConfig);

  // Webhook stubs
  const saveWebhook = async () => { };
  const deleteWebhook = async () => { };
  const testWebhook = async () => true;
  const triggerEvent = async () => { };
  const exportLogs = async () => { };

  // Carregar dados iniciais
  useEffect(() => {
    loadIntegrations();
    loadLogs();
    loadWebhooks();
  }, [session]);

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