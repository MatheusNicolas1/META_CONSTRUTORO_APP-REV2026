import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  FileDown,
  Mail,
  Printer
} from "lucide-react";
import { RDOStatus } from "@/types/rdo";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface RDOApprovalSectionProps {
  rdoId: number | string;
  status: RDOStatus;
  criadoPorId?: string;
  criadoPorNome: string;
  criadoEm: string;
  aprovadoPorNome?: string;
  dataAprovacao?: string;
  motivoRejeicao?: string;
  onApprove?: (observacoes?: string) => void;
  onReject?: (motivo: string) => void;
  onExport?: (format: 'pdf') => void;
  onSendEmail?: (emails: string[]) => void;
}

const statusConfig = {
  'Em elaboração': {
    color: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
    label: 'Em Elaboração'
  },
  'Aguardando aprovação': {
    color: 'bg-accent/10 text-accent-foreground border-accent',
    icon: Clock,
    label: 'Aguardando Aprovação'
  },
  'Aprovado': {
    color: 'bg-success/10 text-success-foreground border-success',
    icon: CheckCircle,
    label: 'Aprovado'
  },
  'Rejeitado': {
    color: 'bg-destructive/10 text-destructive-foreground border-destructive',
    icon: XCircle,
    label: 'Rejeitado'
  }
};

export function RDOApprovalSection(props: RDOApprovalSectionProps) {
  const {
    rdoId,
    status,
    criadoPorId,
    criadoPorNome,
    criadoEm,
    aprovadoPorNome,
    dataAprovacao,
    motivoRejeicao,
    onApprove,
    onReject,
    onExport,
    onSendEmail
  } = props;

  const { currentUser, canApproveRDO, canExportRDO } = useUserPermissions();
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState('');
  const [motivoRejeicaoInput, setMotivoRejeicaoInput] = useState('');
  const [emailList, setEmailList] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const StatusIcon = statusConfig[status].icon;
  const canApprove = canApproveRDO(criadoPorId || '');
  const canExport = canExportRDO(status);

  const submitApproval = async (action: 'aprovar' | 'rejeitar', motivo?: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessao expirada');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-rdo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          rdo_id: String(rdoId),
          action,
          motivo_rejeicao: motivo,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Erro ao atualizar RDO');

      queryClient.invalidateQueries({ queryKey: ['rdo', String(rdoId)] });
      queryClient.invalidateQueries({ queryKey: ['rdos'] });
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      await submitApproval('aprovar');
      onApprove?.(observacoes);
      toast.success("RDO aprovado com sucesso!");
      setObservacoes('');
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar RDO");
    }
  };

  const handleReject = async () => {
    if (!motivoRejeicaoInput.trim()) {
      toast.error("Informe o motivo da rejeicao");
      return;
    }
    try {
      await submitApproval('rejeitar', motivoRejeicaoInput);
      onReject?.(motivoRejeicaoInput);
      toast.success("RDO rejeitado");
      setMotivoRejeicaoInput('');
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar RDO");
    }
  };
  const handleExport = (format: 'pdf') => {
    if (!onExport) return;
    onExport(format);
    toast.success(`Exportando RDO em ${format.toUpperCase()}...`);
  };

  const handleSendEmail = () => {
    if (!onSendEmail || !emailList.trim()) {
      toast.error("Informe pelo menos um e-mail");
      return;
    }
    
    const emails = emailList.split(',').map(e => e.trim()).filter(e => e);
    onSendEmail(emails);
    toast.success("E-mail enviado com sucesso!");
    setEmailList('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Status e Aprovação
          </span>
          <Badge className={statusConfig[status].color}>
            {statusConfig[status].label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações do RDO */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Criado por:</span>
            <span className="font-medium">{criadoPorNome}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Data de criação:</span>
            <span>{new Date(criadoEm).toLocaleDateString('pt-BR')}</span>
          </div>

          {aprovadoPorNome && dataAprovacao && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-muted-foreground">Aprovado por:</span>
                <span className="font-medium">{aprovadoPorNome}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Data de aprovação:</span>
                <span>{new Date(dataAprovacao).toLocaleDateString('pt-BR')}</span>
              </div>
            </>
          )}

          {motivoRejeicao && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <XCircle className="h-4 w-4" />
                Motivo da Rejeição
              </div>
              <p className="text-sm text-destructive-foreground">{motivoRejeicao}</p>
            </div>
          )}
        </div>

        {/* Ações de Aprovação */}
        {status === 'Aguardando aprovação' && canApprove && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Ações de Aprovação</h4>
              
              {/* Observações para aprovação */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a aprovação..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleApprove}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar RDO
                </Button>
              </div>

              {/* Seção de rejeição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-destructive">Rejeitar RDO</label>
                <Textarea
                  value={motivoRejeicaoInput}
                  onChange={(e) => setMotivoRejeicaoInput(e.target.value)}
                  placeholder="Informe o motivo da rejeição..."
                  rows={2}
                  className="border-destructive/50 focus:border-destructive"
                />
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting || !motivoRejeicaoInput.trim()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Ações de Exportação (apenas para RDOs aprovados) */}
        {status === 'Aprovado' && canExport && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Exportação e Compartilhamento</h4>
              
              {/* Botões de exportação */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              {/* Envio por e-mail */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Enviar por E-mail</label>
                <Textarea
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  placeholder="Digite os e-mails separados por vírgula..."
                  rows={2}
                />
                <Button 
                  onClick={handleSendEmail}
                  disabled={!emailList.trim()}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por E-mail
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Informações sobre permissões */}
        {!canApprove && status === 'Aguardando aprovação' && (
          <div className="p-3 bg-muted border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Apenas Gerentes e Administradores podem aprovar RDOs.
            </p>
          </div>
        )}

        {!canExport && (
          <div className="p-3 bg-accent/10 border border-accent rounded-lg">
            <p className="text-sm text-accent-foreground">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Exportação disponível apenas para RDOs aprovados e usuários com permissão.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
