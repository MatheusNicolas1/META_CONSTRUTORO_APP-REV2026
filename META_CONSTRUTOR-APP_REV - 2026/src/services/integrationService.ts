import { 
  N8NConfig, 
  WhatsAppConfig, 
  GmailConfig, 
  GoogleDriveConfig, 
  WebhookConfig,
  ApiResponse,
  IntegrationLog
} from '@/types/integration';
import { supabase } from '@/integrations/supabase/client';

// Integration service using secure server-side edge functions
// All sensitive API calls are proxied through Supabase edge functions

export interface IntegrationService {
  // N8N Integration
  testN8NConnection(config: N8NConfig): Promise<boolean>;
  saveN8NConfig(config: N8NConfig): Promise<ApiResponse>;
  triggerN8NWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<ApiResponse>;
  
  // WhatsApp Integration
  testWhatsAppConnection(config: WhatsAppConfig): Promise<boolean>;
  sendWhatsAppMessage(phoneNumber: string, message: string): Promise<ApiResponse>;
  sendWhatsAppTemplate(phoneNumber: string, templateName: string, templateParams?: string[]): Promise<ApiResponse>;
  
  // Gmail Integration
  testGmailConnection(config: GmailConfig): Promise<boolean>;
  getGmailOAuthUrl(redirectUri: string): Promise<ApiResponse>;
  sendEmail(to: string[], subject: string, body: string): Promise<ApiResponse>;
  
  // Google Drive Integration
  testGoogleDriveConnection(config: GoogleDriveConfig): Promise<boolean>;
  getGoogleDriveOAuthUrl(redirectUri: string): Promise<ApiResponse>;
  uploadToGoogleDrive(file: File, folderId?: string): Promise<ApiResponse>;
  createGoogleDriveFolder(folderName: string, parentId?: string): Promise<ApiResponse>;
}

class IntegrationServiceImpl implements IntegrationService {
  
  // N8N Integration - Uses secure edge function
  async testN8NConnection(config: N8NConfig): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('n8n-integration', {
        body: {
          action: 'test',
          n8nUrl: config.n8nUrl,
          apiKey: config.apiKey
        }
      });

      if (error) {
        console.error('N8N connection test error:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('N8N connection test failed:', error);
      return false;
    }
  }

  async saveN8NConfig(config: N8NConfig): Promise<ApiResponse> {
    try {
      // Test connection first via edge function
      const isConnected = await this.testN8NConnection(config);
      
      if (!isConnected) {
        return {
          success: false,
          error: 'Falha na conexão com N8N. Verifique a URL e API Key.'
        };
      }

      return {
        success: true,
        message: 'Configuração N8N validada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async triggerN8NWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('n8n-integration', {
        body: {
          action: 'trigger',
          webhookUrl,
          payload
        }
      });

      if (error) {
        console.error('N8N webhook trigger error:', error);
        return {
          success: false,
          error: 'Falha ao acionar webhook N8N'
        };
      }

      return {
        success: data?.success === true,
        data: data?.data,
        error: data?.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // WhatsApp Integration - Uses secure edge function
  async testWhatsAppConnection(_config: WhatsAppConfig): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration', {
        body: { action: 'test' }
      });

      if (error) {
        console.error('WhatsApp connection test error:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      return false;
    }
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration', {
        body: {
          action: 'send-message',
          to: phoneNumber,
          message
        }
      });

      if (error) {
        console.error('WhatsApp send error:', error);
        return {
          success: false,
          error: 'Falha ao enviar mensagem WhatsApp'
        };
      }

      return {
        success: data?.success === true,
        data: data?.messageId,
        error: data?.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async sendWhatsAppTemplate(phoneNumber: string, templateName: string, templateParams?: string[]): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-integration', {
        body: {
          action: 'send-template',
          to: phoneNumber,
          templateName,
          templateParams
        }
      });

      if (error) {
        console.error('WhatsApp template error:', error);
        return {
          success: false,
          error: 'Falha ao enviar template WhatsApp'
        };
      }

      return {
        success: data?.success === true,
        data: data?.messageId,
        error: data?.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Gmail Integration - Uses secure edge function
  async testGmailConnection(_config: GmailConfig): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { action: 'test' }
      });

      if (error) {
        console.error('Gmail connection test error:', error);
        return false;
      }

      return data?.success === true && data?.configured === true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }

  async getGmailOAuthUrl(redirectUri: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: {
          action: 'oauth-url',
          redirectUri
        }
      });

      if (error) {
        return { success: false, error: 'Falha ao gerar URL OAuth' };
      }

      if (data?.success !== true || !data?.oauthUrl) {
        return {
          success: false,
          error: data?.error || 'Gmail bloqueado ate configurar secrets OAuth'
        };
      }

      return {
        success: true,
        data: data?.oauthUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async sendEmail(to: string[], subject: string, body: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: {
          action: 'send',
          to,
          subject,
          body,
          isHtml: false
        }
      });

      if (error) {
        console.error('Gmail send error:', error);
        return {
          success: false,
          error: 'Falha ao enviar email'
        };
      }

      return {
        success: data?.success === true,
        message: data?.message,
        error: data?.error || (data?.success === false ? data?.message : undefined)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Google Drive Integration - Uses secure edge function
  async testGoogleDriveConnection(_config: GoogleDriveConfig): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: { action: 'test' }
      });

      if (error) {
        console.error('Google Drive connection test error:', error);
        return false;
      }

      return data?.success === true && data?.configured === true;
    } catch (error) {
      console.error('Google Drive connection test failed:', error);
      return false;
    }
  }

  async getGoogleDriveOAuthUrl(redirectUri: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          action: 'oauth-url',
          redirectUri
        }
      });

      if (error) {
        return { success: false, error: 'Falha ao gerar URL OAuth' };
      }

      if (data?.success !== true || !data?.oauthUrl) {
        return {
          success: false,
          error: data?.error || data?.message || 'Google Drive bloqueado ate configurar secrets OAuth'
        };
      }

      return {
        success: true,
        data: data.oauthUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async uploadToGoogleDrive(file: File, folderId?: string): Promise<ApiResponse> {
    try {
      // Convert file to base64 for transmission
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          action: 'upload',
          fileName: file.name,
          fileContent,
          mimeType: file.type,
          folderId
        }
      });

      if (error) {
        console.error('Google Drive upload error:', error);
        return {
          success: false,
          error: 'Falha ao fazer upload para Google Drive'
        };
      }

      if (data?.success !== true) {
        return {
          success: false,
          message: data?.message,
          error: data?.error || data?.message || 'Google Drive bloqueado ate concluir OAuth real'
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data?.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async createGoogleDriveFolder(folderName: string, parentId?: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          action: 'create-folder',
          folderName,
          parentId
        }
      });

      if (error) {
        console.error('Google Drive folder creation error:', error);
        return {
          success: false,
          error: 'Falha ao criar pasta no Google Drive'
        };
      }

      if (data?.success !== true) {
        return {
          success: false,
          message: data?.message,
          error: data?.error || data?.message || 'Google Drive bloqueado ate concluir OAuth real'
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data?.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Utility method to create integration logs
  createLog(
    integrationId: string, 
    integrationType: string, 
    event: string, 
    status: 'success' | 'error' | 'pending',
    message: string,
    data?: any,
    error?: string
  ): IntegrationLog {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      integrationId,
      integrationType: integrationType as any,
      event,
      status,
      message,
      data,
      error,
      timestamp: new Date().toISOString(),
      duration: typeof data?.duration === 'number' ? data.duration : undefined
    };
  }
}

export const integrationService = new IntegrationServiceImpl();
export default integrationService;
