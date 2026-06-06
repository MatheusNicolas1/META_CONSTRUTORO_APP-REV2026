import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

// --- Tipos ---

export type ErpProvider = 'sienge' | 'totvs' | 'protheus' | 'sap' | 'megasoft' | 'sieng' | 'personalizado';
export type ErpAuthType = 'api_key' | 'oauth2' | 'basic' | 'token';
export type ErpStatus = 'conectado' | 'desconectado' | 'erro' | 'pendente' | 'sincronizando';

export interface ErpConfigRecord {
  id: string;
  org_id: string;
  provider: ErpProvider;
  nome: string;
  base_url: string;
  api_key?: string | null;
  api_secret?: string | null;
  tenant_id?: string | null;
  auth_type: ErpAuthType;
  auth_payload?: Record<string, any> | null;
  endpoints: Record<string, string>;
  field_mapping: Record<string, string>;
  sync_interval_minutes: number;
  entidades_sincronizar: string[];
  status: ErpStatus;
  ultima_sincronizacao?: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLogRecord {
  id: string;
  org_id: string;
  config_id: string;
  entidade: string;
  acao: 'import' | 'export' | 'sync' | 'test' | 'error';
  status: 'sucesso' | 'falha' | 'pendente' | 'parcial' | 'em_andamento';
  registros_processados: number;
  registros_erro: number;
  mensagem?: string | null;
  detalhes?: Record<string, any> | null;
  duracao_ms?: number | null;
  iniciado_em: string;
  finalizado_em?: string | null;
  triggered_by?: string | null;
  created_at: string;
}

export type WebhookQueueStatus = 'pendente' | 'processando' | 'sucesso' | 'falha' | 'cancelado';

export interface WebhookQueueRecord {
  id: string;
  org_id: string;
  config_id: string;
  evento: string;
  payload: Record<string, any>;
  tentativas: number;
  max_tentativas: number;
  status: WebhookQueueStatus;
  ultima_tentativa?: string | null;
  proxima_tentativa: string;
  erro_ultima_tentativa?: string | null;
  prioridade: number;
  created_at: string;
  updated_at: string;
}

export interface ErpConfigInput {
  provider: ErpProvider;
  nome: string;
  base_url: string;
  api_key?: string;
  api_secret?: string;
  tenant_id?: string;
  auth_type: ErpAuthType;
  auth_payload?: Record<string, any>;
  endpoints?: Record<string, string>;
  field_mapping?: Record<string, string>;
  sync_interval_minutes?: number;
  entidades_sincronizar?: string[];
}

// --- Hook ---

export function useIntegracaoERP(configId?: string) {
  const queryClient = useQueryClient();
  const { userId } = useAuthUserId();
  const { orgId } = useRequireOrg();

  // Query: lista de configurações ERP da org
  const configsQuery = useQuery({
    queryKey: ['erp-configs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('integracao_erp_config')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ErpConfigRecord[];
    },
    enabled: !!orgId,
  });

  // Query: configuração única
  const configQuery = useQuery({
    queryKey: ['erp-config', orgId, configId],
    queryFn: async () => {
      if (!orgId || !configId) return null;
      const { data, error } = await supabase
        .from('integracao_erp_config')
        .select('*')
        .eq('id', configId)
        .eq('org_id', orgId)
        .single();
      if (error) throw error;
      return data as ErpConfigRecord;
    },
    enabled: !!orgId && !!configId,
  });

  // Query: logs de sincronização
  const logsQuery = useQuery({
    queryKey: ['erp-sync-logs', orgId, configId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('sync_logs')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (configId) q = q.eq('config_id', configId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as SyncLogRecord[];
    },
    enabled: !!orgId,
  });

  // Query: fila de webhooks
  const queueQuery = useQuery({
    queryKey: ['erp-webhook-queue', orgId, configId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('webhook_queue')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (configId) q = q.eq('config_id', configId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as WebhookQueueRecord[];
    },
    enabled: !!orgId,
  });

  // Mutation: salvar/atualizar configuração
  const saveConfig = useMutation({
    mutationFn: async (input: ErpConfigInput & { id?: string }) => {
      const { id, ...fields } = input;
      const payload = {
        ...fields,
        org_id: orgId,
        endpoints: fields.endpoints || {},
        field_mapping: fields.field_mapping || {},
        sync_interval_minutes: fields.sync_interval_minutes ?? 60,
        entidades_sincronizar: fields.entidades_sincronizar || ['obras', 'clientes', 'fornecedores', 'medicoes', 'financeiro'],
      };

      if (id) {
        const { data, error } = await supabase
          .from('integracao_erp_config')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('org_id', orgId)
          .select()
          .single();
        if (error) throw error;
        return data as ErpConfigRecord;
      } else {
        const { data, error } = await supabase
          .from('integracao_erp_config')
          .insert({ ...payload, created_by: userId, status: 'desconectado', ativo: false })
          .select()
          .single();
        if (error) throw error;
        return data as ErpConfigRecord;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-configs', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-config', orgId] });
      toast.success('Configuração ERP salva');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao salvar configuração ERP');
    },
  });

  // Mutation: testar conexão
  const testConnection = useMutation({
    mutationFn: async (configId: string) => {
      const config = configsQuery.data?.find(c => c.id === configId) || configQuery.data;
      if (!config) throw new Error('Configuração não encontrada');

      const startedAt = performance.now();

      // Invoca Edge Function de teste ERP
      const { data, error } = await supabase.functions.invoke('erp-integration', {
        body: {
          action: 'test',
          provider: config.provider,
          base_url: config.base_url,
          api_key: config.api_key,
          api_secret: config.api_secret,
          tenant_id: config.tenant_id,
          auth_type: config.auth_type,
          auth_payload: config.auth_payload,
          endpoints: config.endpoints,
        },
      });

      const duracao = Math.round(performance.now() - startedAt);

      if (error) {
        // Registra log de erro
        await supabase.from('sync_logs').insert({
          org_id: orgId,
          config_id: configId,
          entidade: 'conexao',
          acao: 'test',
          status: 'falha',
          mensagem: error.message,
          duracao_ms: duracao,
          triggered_by: userId,
        });
        throw error;
      }

      const success = data?.success === true;

      // Atualiza status da config
      await supabase
        .from('integracao_erp_config')
        .update({ status: success ? 'conectado' : 'erro', updated_at: new Date().toISOString() })
        .eq('id', configId)
        .eq('org_id', orgId);

      // Registra log
      await supabase.from('sync_logs').insert({
        org_id: orgId,
        config_id: configId,
        entidade: 'conexao',
        acao: 'test',
        status: success ? 'sucesso' : 'falha',
        mensagem: data?.message || (success ? 'Conexão bem-sucedida' : 'Falha na conexão'),
        detalhes: data,
        duracao_ms: duracao,
        triggered_by: userId,
      });

      return success;
    },
    onSuccess: (success) => {
      queryClient.invalidateQueries({ queryKey: ['erp-configs', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-config', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-sync-logs', orgId] });
      if (success) {
        toast.success('Conexão ERP testada com sucesso');
      } else {
        toast.error('Falha no teste de conexão ERP');
      }
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(`Erro ao testar conexão: ${err.message}`);
    },
  });

  // Mutation: disparar sincronização manual
  const triggerSync = useMutation({
    mutationFn: async (params: { configId: string; entidades?: string[] }) => {
      const { configId, entidades } = params;
      const config = configsQuery.data?.find(c => c.id === configId) || configQuery.data;
      if (!config) throw new Error('Configuração não encontrada');

      const syncEntidades = entidades || config.entidades_sincronizar;

      // Atualiza status
      await supabase
        .from('integracao_erp_config')
        .update({ status: 'sincronizando', updated_at: new Date().toISOString() })
        .eq('id', configId)
        .eq('org_id', orgId);

      const startedAt = performance.now();

      const { data, error } = await supabase.functions.invoke('erp-integration', {
        body: {
          action: 'sync',
          config_id: configId,
          provider: config.provider,
          base_url: config.base_url,
          api_key: config.api_key,
          api_secret: config.api_secret,
          tenant_id: config.tenant_id,
          auth_type: config.auth_type,
          auth_payload: config.auth_payload,
          endpoints: config.endpoints,
          field_mapping: config.field_mapping,
          entidades: syncEntidades,
        },
      });

      const duracao = Math.round(performance.now() - startedAt);

      if (error) {
        await supabase.from('sync_logs').insert({
          org_id: orgId,
          config_id: configId,
          entidade: 'sync',
          acao: 'sync',
          status: 'falha',
          mensagem: error.message,
          duracao_ms: duracao,
          triggered_by: userId,
        });
        await supabase
          .from('integracao_erp_config')
          .update({ status: 'erro', updated_at: new Date().toISOString() })
          .eq('id', configId)
          .eq('org_id', orgId);
        throw error;
      }

      const success = data?.success === true;

      await supabase.from('sync_logs').insert({
        org_id: orgId,
        config_id: configId,
        entidade: 'sync',
        acao: 'sync',
        status: success ? 'sucesso' : 'parcial',
        registros_processados: data?.registros_processados || 0,
        registros_erro: data?.registros_erro || 0,
        mensagem: data?.message || 'Sincronização concluída',
        detalhes: data,
        duracao_ms: duracao,
        triggered_by: userId,
      });

      await supabase
        .from('integracao_erp_config')
        .update({
          status: success ? 'conectado' : 'erro',
          ultima_sincronizacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId)
        .eq('org_id', orgId);

      return { success, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-configs', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-config', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-sync-logs', orgId] });
      toast.success('Sincronização disparada');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(`Falha na sincronização: ${err.message}`);
      queryClient.invalidateQueries({ queryKey: ['erp-configs', orgId] });
      queryClient.invalidateQueries({ queryKey: ['erp-sync-logs', orgId] });
    },
  });

  // Mutation: reenfileirar webhook
  const retryWebhook = useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('webhook_queue')
        .update({
          status: 'pendente',
          tentativas: 0,
          proxima_tentativa: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', webhookId)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-webhook-queue', orgId] });
      toast.success('Webhook reenfileirado');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao reenfileirar webhook');
    },
  });

  // Mutation: cancelar webhook
  const cancelWebhook = useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('webhook_queue')
        .update({ status: 'cancelado', updated_at: new Date().toISOString() })
        .eq('id', webhookId)
        .eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-webhook-queue', orgId] });
      toast.success('Webhook cancelado');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao cancelar webhook');
    },
  });

  // Gate de plano: verifica se o plano atual permite ERP
  const planGateQuery = useQuery({
    queryKey: ['erp-plan-gate', orgId],
    queryFn: async () => {
      if (!orgId) return { allowed: false, plan: 'Nenhum', message: 'Organização não encontrada' };
      const { data, error } = await supabase
        .from('orgs')
        .select('plan_id')
        .eq('id', orgId)
        .single();
      if (error) return { allowed: false, plan: 'Desconhecido', message: 'Falha ao verificar plano' };
      const planId = data?.plan_id || 'free';
      // Planos que permitem ERP: business, enterprise
      const allowedPlans = ['business', 'enterprise', 'pro'];
      const allowed = allowedPlans.includes(planId);
      return {
        allowed,
        plan: planId,
        message: allowed
          ? 'Seu plano permite integração com ERP'
          : 'Integração ERP disponível nos planos Business e Enterprise',
      };
    },
    enabled: !!orgId,
  });

  return {
    isLoading: configsQuery.isLoading,
    configs: configsQuery.data || [],
    config: configQuery.data || null,
    logs: logsQuery.data || [],
    queue: queueQuery.data || [],
    planGate: planGateQuery.data || { allowed: false, plan: '', message: '' },
    isLogsLoading: logsQuery.isLoading,
    isQueueLoading: queueQuery.isLoading,
    saveConfig,
    testConnection,
    triggerSync,
    retryWebhook,
    cancelWebhook,
  };
}
