import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Settings, Mail, ExternalLink } from "lucide-react";
import { GmailConfig, IntegrationStatus } from "@/types/integration";
import { useToast } from "@/hooks/use-toast";

interface GmailConfigCardProps {
  config?: GmailConfig;
  status?: IntegrationStatus;
  onSave: (config: GmailConfig) => void;
  onTest: (config: GmailConfig) => Promise<boolean>;
  onOAuthConnect: () => Promise<GmailConfig>;
}

export const GmailConfigCard = ({ config, status, onSave, onTest, onOAuthConnect }: GmailConfigCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!config?.clientId);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [formData, setFormData] = useState<GmailConfig>({
    clientId: config?.clientId || '',
    clientSecret: config?.clientSecret || '',
    refreshToken: config?.refreshToken || '',
    accessToken: config?.accessToken || '',
    settings: {
      enableAutoReports: config?.settings?.enableAutoReports || false,
      enableUrgentAlerts: config?.settings?.enableUrgentAlerts || true,
      defaultSender: config?.settings?.defaultSender || '',
      signature: config?.settings?.signature || ''
    }
  });

  const handleSave = async () => {
    try {
      if (!formData.clientId || !formData.clientSecret) {
        toast({
          title: "Campos obrigatórios",
          description: "Client ID e Client Secret são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await onSave(formData);
      setIsEditing(false);
      toast({
        title: "Configuração salva",
        description: "Credenciais salvas. Execute um teste real antes de considerar a integracao conectada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    }
  };

  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    try {
      const newConfig = await onOAuthConnect();
      setFormData(newConfig);
      toast({
        title: "OAuth iniciado",
        description: "Conclua a autorizacao do Gmail na janela aberta antes de considerar a integracao conectada.",
      });
    } catch (error) {
      toast({
        title: "Gmail bloqueado",
        description: error instanceof Error ? error.message : "Secrets OAuth do Gmail ainda nao estao configurados.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const success = await onTest(formData);
      toast({
        title: success ? "Teste realizado" : "Falha no teste",
        description: success 
          ? "Gmail validado com evidencia real persistida." 
          : "Gmail nao enviou e-mail; verifique secrets OAuth, autorizacao e logs persistidos.",
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar a conexão",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Não configurado</Badge>;
    
    if (!status.hasEvidence) return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Sem evidencia</Badge>;

    switch (status.isHealthy) {
      case true:
        return <Badge variant="default" className="bg-construction-green"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
      case false:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const isConfigured = config?.accessToken && config?.refreshToken;
  const formatLastCheck = () => status?.lastCheck ? new Date(status.lastCheck).toLocaleString() : "Sem teste registrado";
  const formatPercent = () => typeof status?.successRate === "number" ? `${status.successRate.toFixed(1)}%` : "-";
  const formatOperationalStatus = () => {
    if (!status?.hasEvidence) return "Sem evidencia real";
    return status.isHealthy ? "Ativo" : "Com erro";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-red-600" />
            <CardTitle>Gmail Integration</CardTitle>
            {getStatusBadge()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {isEditing ? 'Cancelar' : 'Configurar'}
          </Button>
        </div>
        <CardDescription>
          Configure o Gmail para testes reais de envio. Rotinas agendadas dependem de backend ativo.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                placeholder="Client ID do Google Cloud Console"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Client Secret do Google Cloud Console"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
              />
            </div>

            {!isConfigured && (
              <Button 
                onClick={handleOAuthConnect}
                disabled={isConnecting || !formData.clientId || !formData.clientSecret}
                className="w-full gradient-construction border-0"
              >
                {isConnecting ? 'Conectando...' : 'Conectar com Gmail'}
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="defaultSender">E-mail do Remetente</Label>
              <Input
                id="defaultSender"
                placeholder="email@empresa.com"
                value={formData.settings.defaultSender}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  settings: { ...formData.settings, defaultSender: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Assinatura do E-mail</Label>
              <Textarea
                id="signature"
                placeholder="Assinatura padrão para os e-mails..."
                value={formData.settings.signature}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  settings: { ...formData.settings, signature: e.target.value }
                })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableAutoReports">Permitir relatorios quando houver rotina real</Label>
                <Switch
                  id="enableAutoReports"
                  checked={formData.settings.enableAutoReports}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      settings: { ...formData.settings, enableAutoReports: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableUrgentAlerts">Alertas Urgentes</Label>
                <Switch
                  id="enableUrgentAlerts"
                  checked={formData.settings.enableUrgentAlerts}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      settings: { ...formData.settings, enableUrgentAlerts: checked }
                    })
                  }
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleSave}
                className="gradient-construction border-0"
              >
                Salvar Configuração
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={isTesting || !isConfigured}
              >
                {isTesting ? 'Testando...' : 'Enviar Teste'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {status && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{formatOperationalStatus()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última verificação</p>
                  <p className="font-medium">{formatLastCheck()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxa de sucesso</p>
                  <p className="font-medium">{formatPercent()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Eventos reais</p>
                  <p className="font-medium">{status.evidenceCount}</p>
                </div>
              </div>
            )}

            {config?.settings.defaultSender && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Conta configurada</p>
                    <p className="text-sm text-muted-foreground">{config.settings.defaultSender}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://gmail.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir Gmail
                    </a>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch checked={config.settings.enableAutoReports} disabled />
                    <Label className="text-sm">Relatorios condicionados a rotina real</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={config.settings.enableUrgentAlerts} disabled />
                    <Label className="text-sm">Alertas urgentes</Label>
                  </div>
                </div>

                {config.settings.signature && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Assinatura configurada</Label>
                    <p className="text-sm text-muted-foreground mt-1">{config.settings.signature}</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Dica:</strong> Configure as credenciais OAuth2 no Google Cloud Console para habilitar a integração.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
