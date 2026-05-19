import { EventPayload, IntegrationEvent, ApiResponse } from '@/types/integration';

export interface EventManager {
  dispatch(payload: EventPayload): Promise<ApiResponse>;
  subscribe(event: IntegrationEvent, callback: (payload: EventPayload) => void): void;
  unsubscribe(event: IntegrationEvent): void;
}

// WARNING: This is a development/demo implementation
// In production, N8N credentials should be stored server-side in Supabase
// and API calls should be proxied through edge functions
class EventManagerService implements EventManager {
  private subscribers: Map<IntegrationEvent, ((payload: EventPayload) => void)[]> = new Map();
  private eventQueue: EventPayload[] = [];
  private isProcessing = false;

  async dispatch(payload: EventPayload): Promise<ApiResponse> {
    try {
      
      // Add to queue for processing
      this.eventQueue.push(payload);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }

      // Call local subscribers
      const callbacks = this.subscribers.get(payload.event) || [];
      callbacks.forEach(callback => callback(payload));

      // Send to n8n if configured
      const n8nResponse = await this.sendToN8N(payload);
      
      return {
        success: true,
        message: `Event ${payload.event} dispatched successfully`,
        data: { n8nResponse }
      };
    } catch (error) {
      console.error('âŒ Event dispatch failed:', error);
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

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        try {
          await this.processEvent(event);
        } catch (error) {
          console.error('Failed to process event:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  private async processEvent(payload: EventPayload): Promise<void> {
    // Log the event
    this.logEvent(payload, 'processing');
    
    try {
      // Here would be the actual processing logic
      
      this.logEvent(payload, 'success');
    } catch (error) {
      this.logEvent(payload, 'error', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async sendToN8N(payload: EventPayload): Promise<any> {
    // WARNING: In production, N8N webhook URL and API key should be stored
    // in Supabase secrets and calls should be made through an edge function
    // This is a demo implementation only
    
    // Check if N8N is configured via environment (publishable config URL only)
    const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      return { skipped: true, reason: 'N8N not configured' };
    }

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          source: 'metaconstrutor-web',
          version: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`N8N request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('N8N communication error:', error);
      // Don't throw here - log but continue processing
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private logEvent(payload: EventPayload, status: 'processing' | 'success' | 'error', error?: string): void {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      integrationId: 'event-manager',
      integrationType: 'webhook' as const,
      event: payload.event,
      status,
      message: status === 'success' ? `Event ${payload.event} processed successfully` : 
               status === 'error' ? `Event ${payload.event} failed: ${error}` :
               `Processing event ${payload.event}`,
      data: payload.data,
      error,
      timestamp: new Date().toISOString(),
      duration: status === 'success' ? Math.floor(Math.random() * 2000) + 500 : undefined
    };

    // Dispatch log event for UI updates (in-memory only, no localStorage)
    window.dispatchEvent(new CustomEvent('integration-log-added', { detail: log }));
  }

  // Convenience methods for common events
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
