import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Settings, Zap, ExternalLink } from "lucide-react";
import { N8NConfig, IntegrationStatus } from "@/types/integration";
import { useToast } from "@/hooks/use-toast";

interface N8NConfigCardProps {
  config?: N8NConfig;
  status?: IntegrationStatus;
  onSave: (config: N8NConfig) => void;
  onTest: (config: N8NConfig) => Promise<boolean>;
}

export const N8NConfigCard = ({ config, status, onSave, onTest }: N8NConfigCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!config?.n8nUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState<N8NConfig>({
    n8nUrl: config?.n8nUrl || '',
    apiKey: config?.apiKey || '',
    workflowIds: config?.workflowIds || [],
    settings: config?.settings || {}
  });

  const handleSave = async () => {
    try {
      if (!formData.n8nUrl || !formData.apiKey) {
        toast({
          title: "Campos obrigatórios",
          description: "URL do N8N e API Key são obrigatórios",
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
          ? "Conexão com N8N estabelecida com sucesso" 
          : "Não foi possível conectar com o N8N",
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
  const formatLatency = () => typeof status?.latency === "number" ? `${status.latency}ms` : "-";
  const formatOperationalStatus = () => {
    if (!status?.hasEvidence) return "Sem evidencia real";
    return status.isHealthy ? "Ativo" : "Com erro";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-construction-blue" />
            <CardTitle>N8N Automation Platform</CardTitle>
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
          Configure a conexão com sua instância do N8N para automações avançadas de workflow
        </CardDescription>
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs text-green-700 dark:text-green-300">
            <strong>✓ Conexão Segura:</strong> Suas credenciais são processadas através de um servidor seguro e nunca armazenadas no navegador.
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="n8nUrl">URL do N8N *</Label>
              <Input
                id="n8nUrl"
                placeholder="https://n8n.example.com"
                value={formData.n8nUrl}
                onChange={(e) => setFormData({ ...formData, n8nUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua API Key do N8N"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflowIds">IDs dos Workflows (opcional)</Label>
              <Textarea
                id="workflowIds"
                placeholder="Digite os IDs separados por vírgula: workflow1, workflow2"
                value={formData.workflowIds?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  workflowIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
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
                disabled={isTesting || !formData.n8nUrl || !formData.apiKey}
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
                  <p className="text-muted-foreground">Latência</p>
                  <p className="font-medium">{formatLatency()}</p>
                </div>
              </div>
            )}

            {config?.n8nUrl && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Instância N8N</p>
                  <p className="text-sm text-muted-foreground">{config.n8nUrl}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={config.n8nUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir N8N
                  </a>
                </Button>
              </div>
            )}

            {config?.workflowIds && config.workflowIds.length > 0 && (
              <div>
                <Label>Workflows Configurados</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.workflowIds.map((id, index) => (
                    <Badge key={index} variant="outline">
                      {id}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
