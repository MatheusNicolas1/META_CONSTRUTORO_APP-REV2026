import { supabase } from '@/integrations/supabase/client';
import { getActiveOrgIdLocal } from '@/helpers/storage';
import { EventPayload, IntegrationEvent, ApiResponse } from '@/types/integration';

export interface EventManager {
  dispatch(payload: EventPayload): Promise<ApiResponse>;
  subscribe(event: IntegrationEvent, callback: (payload: EventPayload) => void): void;
  unsubscribe(event: IntegrationEvent): void;
}

class EventManagerService implements EventManager {
  private subscribers: Map<IntegrationEvent, ((payload: EventPayload) => void)[]> = new Map();

  async dispatch(payload: EventPayload): Promise<ApiResponse> {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      await this.logEvent(payload, 'processing');

      const callbacks = this.subscribers.get(payload.event) || [];
      callbacks.forEach(callback => callback(payload));

      const n8nResponse = await this.sendToN8N(payload);

      if (n8nResponse?.error) {
        await this.logEvent(payload, 'error', n8nResponse.error, startedAt);
        return {
          success: false,
          error: n8nResponse.error,
          data: { n8nResponse }
        };
      }

      if (n8nResponse?.skipped) {
        const reason = n8nResponse.reason || 'N8N not configured';
        await this.logEvent(payload, 'error', reason, startedAt);
        return {
          success: false,
          error: reason,
          message: `Event ${payload.event} recorded, but external dispatch is blocked until N8N is configured`,
          data: { n8nResponse }
        };
      }

      await this.logEvent(payload, 'success', undefined, startedAt);

      return {
        success: true,
        message: `Event ${payload.event} dispatched successfully`,
        data: { n8nResponse }
      };
    } catch (error) {
      console.error('Event dispatch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  subscribe(event: IntegrationEvent, callback: (payload: EventPayload) => void): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)?.push(callback);
  }

  unsubscribe(event: IntegrationEvent): void {
    this.subscribers.delete(event);
  }

  private async sendToN8N(payload: EventPayload): Promise<any> {
    const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      return { skipped: true, reason: 'N8N not configured' };
    }

    try {
      const { data, error } = await supabase.functions.invoke('n8n-integration', {
        body: {
          action: 'trigger',
          webhookUrl: n8nWebhookUrl,
          payload: {
            ...payload,
            source: 'metaconstrutor-web',
            version: '1.0'
          }
        },
      });

      if (error) {
        return { error: error.message || 'N8N edge function failed' };
      }

      if (data?.success === false) {
        return { error: data?.error || 'N8N webhook failed' };
      }

      return { success: true, data: data?.data };
    } catch (error) {
      console.error('N8N communication error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async logEvent(
    payload: EventPayload,
    status: 'processing' | 'success' | 'error',
    error?: string,
    startedAt?: number
  ): Promise<void> {
    const orgId = getActiveOrgIdLocal();
    const { data: { session } } = await supabase.auth.getSession();
    const duration = startedAt
      ? Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt)
      : undefined;

    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      integrationId: 'event-manager',
      integrationType: 'webhook' as const,
      event: payload.event,
      status: status === 'processing' ? 'pending' as const : status,
      message: status === 'success' ? `Event ${payload.event} processed successfully` :
               status === 'error' ? `Event ${payload.event} failed: ${error}` :
               `Processing event ${payload.event}`,
      data: payload.data,
      error,
      timestamp: new Date().toISOString(),
      duration
    };

    const { error: insertError } = await supabase
      .from('analytics_events' as any)
      .insert({
        event: `integrations.event_manager.${payload.event}`,
        org_id: orgId,
        user_id: session?.user?.id,
        source: 'frontend',
        success: log.status === 'success',
        error,
        properties: {
          orgId,
          userId: session?.user?.id,
          source: 'event-manager',
          integrationId: log.integrationId,
          integrationType: log.integrationType,
          originalEvent: payload.event,
          status: log.status,
          message: log.message,
          data: payload.data,
          entityId: payload.entityId,
          entityType: payload.entityType,
          metadata: payload.metadata,
          duration,
          error
        }
      });

    if (insertError) {
      throw new Error(`Failed to persist integration event: ${insertError.message}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('integration-log-added', { detail: log }));
    }
  }

  async dispatchObraCreated(obraId: string, data: any): Promise<ApiResponse> {
    return this.dispatch({
      event: 'obra.created',
      entityId: obraId,
      entityType: 'obra',
      data,
      timestamp: new Date().toISOString()
    });
  }

  async dispatchRDOApproved(rdoId: string, data: any): Promise<ApiResponse> {
    return this.dispatch({
      event: 'rdo.approved',
      entityId: rdoId,
      entityType: 'rdo',
      data,
      timestamp: new Date().toISOString()
    });
  }

  async dispatchAtividadeCompleted(atividadeId: string, data: any): Promise<ApiResponse> {
    return this.dispatch({
      event: 'atividade.completed',
      entityId: atividadeId,
      entityType: 'atividade',
      data,
      timestamp: new Date().toISOString()
    });
  }

  async dispatchDocumentoUploaded(documentoId: string, data: any): Promise<ApiResponse> {
    return this.dispatch({
      event: 'documento.uploaded',
      entityId: documentoId,
      entityType: 'documento',
      data,
      timestamp: new Date().toISOString()
    });
  }
}

export const eventManager = new EventManagerService();
export default eventManager;
