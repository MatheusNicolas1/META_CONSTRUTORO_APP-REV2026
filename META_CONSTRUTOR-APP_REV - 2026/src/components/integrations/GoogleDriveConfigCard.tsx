import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Settings, Cloud, ExternalLink, Folder } from "lucide-react";
import { GoogleDriveConfig, IntegrationStatus } from "@/types/integration";
import { useToast } from "@/hooks/use-toast";

interface GoogleDriveConfigCardProps {
  config?: GoogleDriveConfig;
  status?: IntegrationStatus;
  onSave: (config: GoogleDriveConfig) => void;
  onTest: (config: GoogleDriveConfig) => Promise<boolean>;
  onOAuthConnect: () => Promise<GoogleDriveConfig>;
}

export const GoogleDriveConfigCard = ({ config, status, onSave, onTest, onOAuthConnect }: GoogleDriveConfigCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!config?.clientId);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [formData, setFormData] = useState<GoogleDriveConfig>({
    clientId: config?.clientId || '',
    clientSecret: config?.clientSecret || '',
    refreshToken: config?.refreshToken || '',
    accessToken: config?.accessToken || '',
    settings: {
      autoSync: config?.settings?.autoSync || true,
      rootFolderId: config?.settings?.rootFolderId || '',
      folderStructure: config?.settings?.folderStructure || {
        obras: 'Obras',
        rdos: 'RDOs',
        documentos: 'Documentos',
        checklists: 'Checklists'
      }
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
        description: "Conclua a autorizacao do Google Drive na janela aberta antes de considerar a integracao conectada.",
      });
    } catch (error) {
      toast({
        title: "Google Drive bloqueado",
        description: error instanceof Error ? error.message : "Falha ao conectar com o Google Drive",
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
          ? "Google Drive validado com evidencia real persistida." 
          : "Google Drive nao sincronizou arquivo; verifique secrets OAuth e autorizacao real.",
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
            <Cloud className="h-5 w-5 text-blue-600" />
            <CardTitle>Google Drive Integration</CardTitle>
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
          Configure o Google Drive para organizar arquivos quando o fluxo real estiver conectado.
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
                {isConnecting ? 'Conectando...' : 'Conectar com Google Drive'}
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="rootFolderId">ID da Pasta Raiz (opcional)</Label>
              <Input
                id="rootFolderId"
                placeholder="ID da pasta onde os arquivos serão organizados"
                value={formData.settings.rootFolderId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  settings: { ...formData.settings, rootFolderId: e.target.value }
                })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSync">Permitir sincronizacao quando houver rotina real</Label>
                <Switch
                  id="autoSync"
                  checked={formData.settings.autoSync}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      settings: { ...formData.settings, autoSync: checked }
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Estrutura de Pastas</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="folderObras" className="text-sm">Pasta Obras</Label>
                  <Input
                    id="folderObras"
                    value={formData.settings.folderStructure.obras}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      settings: { 
                        ...formData.settings, 
                        folderStructure: { ...formData.settings.folderStructure, obras: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="folderRdos" className="text-sm">Pasta RDOs</Label>
                  <Input
                    id="folderRdos"
                    value={formData.settings.folderStructure.rdos}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      settings: { 
                        ...formData.settings, 
                        folderStructure: { ...formData.settings.folderStructure, rdos: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="folderDocumentos" className="text-sm">Pasta Documentos</Label>
                  <Input
                    id="folderDocumentos"
                    value={formData.settings.folderStructure.documentos}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      settings: { 
                        ...formData.settings, 
                        folderStructure: { ...formData.settings.folderStructure, documentos: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="folderChecklists" className="text-sm">Pasta Checklists</Label>
                  <Input
                    id="folderChecklists"
                    value={formData.settings.folderStructure.checklists}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      settings: { 
                        ...formData.settings, 
                        folderStructure: { ...formData.settings.folderStructure, checklists: e.target.value }
                      }
                    })}
                  />
                </div>
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
                  <p className="text-muted-foreground">Última sincronização</p>
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

            {isConfigured && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Google Drive conectado</p>
                    <p className="text-sm text-muted-foreground">
                      {config?.settings.autoSync ? 'Sincronizacao condicionada a rotina real' : 'Sincronizacao manual'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir Drive
                    </a>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(config?.settings?.folderStructure || {}).map(([key, folder]) => (
                    <div key={key} className="flex items-center space-x-2 p-2 bg-muted rounded">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium capitalize">{key}</p>
                        <p className="text-xs text-muted-foreground">{folder}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {config?.settings?.rootFolderId && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Pasta raiz configurada</Label>
                    <p className="text-sm text-muted-foreground mt-1">ID: {config.settings.rootFolderId}</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Dica:</strong> Configure as credenciais OAuth2 no Google Cloud Console e habilite a Google Drive API.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
