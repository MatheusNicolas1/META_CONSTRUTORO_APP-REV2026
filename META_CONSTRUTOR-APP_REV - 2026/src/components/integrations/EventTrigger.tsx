import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { eventManager } from "@/services/eventManager";
import { integrationService } from "@/services/integrationService";
import { IntegrationEvent } from "@/types/integration";
import {
  Send,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface EventTriggerProps {
  onEventSent?: (event: IntegrationEvent) => void;
}

export const EventTrigger = ({ onEventSent }: EventTriggerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    event: '' as IntegrationEvent,
    entityId: '',
    entityType: '',
    data: '{}',
    testType: 'whatsapp' as 'whatsapp' | 'gmail' | 'googledrive' | 'n8n',
    phoneNumber: '',
    emailRecipient: '',
    subject: '',
    message: '',
    fileName: ''
  });

  const eventTypes: { value: IntegrationEvent; label: string; description: string }[] = [
    { value: 'obra.created', label: 'Nova Obra Criada', description: 'Disparado quando uma nova obra é cadastrada' },
    { value: 'obra.updated', label: 'Obra Atualizada', description: 'Disparado quando uma obra é modificada' },
    { value: 'obra.completed', label: 'Obra Concluída', description: 'Disparado quando uma obra é finalizada' },
    { value: 'rdo.created', label: 'RDO Criado', description: 'Disparado quando um novo RDO é criado' },
    { value: 'rdo.approved', label: 'RDO Aprovado', description: 'Disparado quando um RDO é aprovado' },
    { value: 'atividade.created', label: 'Atividade Criada', description: 'Disparado quando uma nova atividade é cadastrada' },
    { value: 'atividade.completed', label: 'Atividade Concluída', description: 'Disparado quando uma atividade é finalizada' },
    { value: 'checklist.completed', label: 'Checklist Concluído', description: 'Disparado quando um checklist é completado' },
    { value: 'documento.uploaded', label: 'Documento Enviado', description: 'Disparado quando um documento é carregado' },
    { value: 'notification.urgent', label: 'Notificação Urgente', description: 'Disparado para alertas importantes' },
    { value: 'report.daily', label: 'Relatório Diário', description: 'Disparado para relatórios automáticos diários' },
    { value: 'colaborador.added', label: 'Colaborador Adicionado', description: 'Disparado quando um novo colaborador é cadastrado' }
  ];

  const handleEventTrigger = async () => {
    if (!formData.event || !formData.entityId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo de evento e ID da entidade",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let eventData = {};
      try {
        eventData = JSON.parse(formData.data);
      } catch {
        eventData = { message: formData.data };
      }

      const result = await eventManager.dispatch({
        event: formData.event,
        entityId: formData.entityId,
        entityType: formData.entityType || 'generic',
        data: eventData,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'manual-trigger',
          user: 'admin'
        }
      });

      if (result.success) {
        toast({
          title: "Evento disparado",
          description: `Evento ${formData.event} enviado com sucesso`,
        });
        onEventSent?.(formData.event);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao disparar evento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao disparar evento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectTest = async () => {
    setIsLoading(true);

    try {
      let result;

      switch (formData.testType) {
        case 'whatsapp':
          if (!formData.phoneNumber || !formData.message) {
            throw new Error('Número de telefone e mensagem são obrigatórios');
          }
          result = await integrationService.sendWhatsAppMessage(formData.phoneNumber, formData.message);
          break;

        case 'gmail':
          if (!formData.emailRecipient || !formData.subject || !formData.message) {
            throw new Error('Destinatário, assunto e mensagem são obrigatórios');
          }
          result = await integrationService.sendEmail([formData.emailRecipient], formData.subject, formData.message);
          break;

        case 'googledrive':
          // Create a mock file for testing
          const testFile = new File(['Test file content'], formData.fileName || 'test-file.txt', { type: 'text/plain' });
          result = await integrationService.uploadToGoogleDrive(testFile, '/MetaConstrutor/Uploads');
          break;

        default:
          throw new Error('Tipo de teste não suportado');
      }

      if (result.success) {
        toast({
          title: "Teste realizado",
          description: result.message,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro no teste direto:', error);
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Falha no teste",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEventInfo = eventTypes.find(e => e.value === formData.event);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Disparar Evento do Sistema
          </CardTitle>
          <CardDescription>
            Dispare eventos manualmente para testar integrações e fluxos automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-type">Tipo de Evento</Label>
              <Select
                value={formData.event}
                onValueChange={(value: IntegrationEvent) => setFormData(prev => ({ ...prev, event: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((eventType) => (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      {eventType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEventInfo && (
                <p className="text-sm text-muted-foreground">{selectedEventInfo.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-id">ID da Entidade</Label>
              <Input
                id="entity-id"
                value={formData.entityId}
                onChange={(e) => setFormData(prev => ({ ...prev, entityId: e.target.value }))}
                placeholder="ex: obra-123, rdo-456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-type">Tipo da Entidade</Label>
            <Input
              id="entity-type"
              value={formData.entityType}
              onChange={(e) => setFormData(prev => ({ ...prev, entityType: e.target.value }))}
              placeholder="ex: obra, rdo, atividade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-data">Dados do Evento (JSON)</Label>
            <Textarea
              id="event-data"
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
              placeholder='{"nome": "Obra Teste", "responsavel": "João Silva"}'
              className="min-h-[100px]"
            />
          </div>

          <Button onClick={handleEventTrigger} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Disparar Evento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Teste Direto de Integrações
          </CardTitle>
          <CardDescription>
            Teste integrações individuais sem disparar eventos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Teste</Label>
            <Select
              value={formData.testType}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, testType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="googledrive">Google Drive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.testType === 'whatsapp' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+5511999999999"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Teste de mensagem via WhatsApp"
                />
              </div>
            </div>
          )}

          {formData.testType === 'gmail' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Input
                  value={formData.emailRecipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailRecipient: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Teste de e-mail"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Corpo do e-mail de teste"
                />
              </div>
            </div>
          )}

          {formData.testType === 'googledrive' && (
            <div className="space-y-2">
              <Label>Nome do Arquivo</Label>
              <Input
                value={formData.fileName}
                onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                placeholder="arquivo-teste.txt"
              />
            </div>
          )}

          <Button onClick={handleDirectTest} disabled={isLoading} variant="outline" className="w-full">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
            Executar Teste Direto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventTrigger;