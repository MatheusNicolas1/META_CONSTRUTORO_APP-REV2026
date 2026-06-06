import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Settings, MessageCircle, ExternalLink } from "lucide-react";
import { WhatsAppConfig, IntegrationStatus } from "@/types/integration";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppConfigCardProps {
  config?: WhatsAppConfig;
  status?: IntegrationStatus;
  onSave: (config: WhatsAppConfig) => void;
  onTest: (config: WhatsAppConfig) => Promise<boolean>;
}

export const WhatsAppConfigCard = ({ config, status, onSave, onTest }: WhatsAppConfigCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!config?.phoneNumberId);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState<WhatsAppConfig>({
    phoneNumberId: config?.phoneNumberId || '',
    businessAccountId: config?.businessAccountId || '',
    accessToken: config?.accessToken || '',
    webhookVerifyToken: config?.webhookVerifyToken || '',
    settings: {
      enableNotifications: config?.settings?.enableNotifications || true,
      enableReports: config?.settings?.enableReports || false,
      templateIds: config?.settings?.templateIds || []
    }
  });

  const handleSave = async () => {
    try {
      if (!formData.phoneNumberId || !formData.accessToken) {
        toast({
          title: "Campos obrigatórios",
          description: "Phone Number ID e Access Token são obrigatórios",
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

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const success = await onTest(formData);
      toast({
        title: success ? "Teste realizado" : "Falha no teste",
        description: success 
          ? "Conexão com WhatsApp Business estabelecida com sucesso" 
          : "Não foi possível conectar com o WhatsApp Business",
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
            <MessageCircle className="h-5 w-5 text-green-600" />
            <CardTitle>WhatsApp Business API</CardTitle>
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
          Configure a integração com WhatsApp Business API para envio de notificações e relatórios
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
              <Input
                id="phoneNumberId"
                placeholder="ID do número de telefone do WhatsApp Business"
                value={formData.phoneNumberId}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAccountId">Business Account ID</Label>
              <Input
                id="businessAccountId"
                placeholder="ID da conta business do WhatsApp"
                value={formData.businessAccountId}
                onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Token de acesso do WhatsApp Business API"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
              <Input
                id="webhookVerifyToken"
                placeholder="Token de verificação do webhook"
                value={formData.webhookVerifyToken}
                onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableNotifications">Notificações Automáticas</Label>
                <Switch
                  id="enableNotifications"
                  checked={formData.settings.enableNotifications}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      settings: { ...formData.settings, enableNotifications: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableReports">Relatórios por WhatsApp</Label>
                <Switch
                  id="enableReports"
                  checked={formData.settings.enableReports}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      settings: { ...formData.settings, enableReports: checked }
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateIds">IDs dos Templates (opcional)</Label>
              <Textarea
                id="templateIds"
                placeholder="Digite os IDs dos templates separados por vírgula"
                value={formData.settings.templateIds.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  settings: {
                    ...formData.settings,
                    templateIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                  }
                })}
              />
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
                disabled={isTesting || !formData.phoneNumberId || !formData.accessToken}
              >
                {isTesting ? 'Testando...' : 'Testar Conexão'}
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

            {config?.phoneNumberId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Número configurado</p>
                    <p className="text-sm text-muted-foreground">ID: {config.phoneNumberId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch checked={config.settings.enableNotifications} disabled />
                    <Label className="text-sm">Notificações</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={config.settings.enableReports} disabled />
                    <Label className="text-sm">Relatórios</Label>
                  </div>
                </div>

                {config.settings.templateIds.length > 0 && (
                  <div>
                    <Label>Templates Configurados</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {config.settings.templateIds.map((id, index) => (
                        <Badge key={index} variant="outline">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Dica:</strong> Para usar o WhatsApp Business API, você precisa ter uma conta verificada e aprovada pelo Meta.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
