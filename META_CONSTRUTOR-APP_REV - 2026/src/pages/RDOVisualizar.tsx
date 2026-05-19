import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Mail, Printer, Calendar, User, Building2, Clock,
  FileText, Paperclip, Trash2, Image as ImageIcon, FileType, ExternalLink,
  Loader2, CheckCircle2, XCircle, Shield, AlertTriangle
} from "lucide-react";
import { useRDODetails } from "@/hooks/useRDODetails";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSignedUrl, deleteDocumento } from "@/utils/storageUtils";
import { RDONotasSection } from "@/components/rdo/RDONotasSection";
import { useRDODownload } from "@/hooks/useRDODownload";
import { useRequireOrg } from "@/hooks/requireOrg";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


const RDOVisualizar = () => {
  const { id } = useParams();
  const rdoId = id as string;
  const { data: rdoRaw, isLoading, error } = useRDODetails(id);
  const { downloadRDO, isDownloading: isPdfDownloading } = useRDODownload();
  const { role, orgId } = useRequireOrg();
  const rdo = rdoRaw as any;
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  const canApprove = ['Administrador', 'Gerente', 'Presidente'].includes(role);

  const handleApproveRDO = async () => {
    if (!window.confirm('Aprovar este RDO? Esta ação não pode ser desfeita.')) return;
    setIsApproving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-rdo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ rdo_id: rdoId, action: 'aprovar' }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Erro ao aprovar');

      toast.success(`RDO aprovado por ${result.aprovador?.nome || 'você'}`);
      queryClient.invalidateQueries({ queryKey: ['rdo', rdoId] });
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar RDO');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectRDO = async () => {
    if (!motivoRejeicao.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    setIsRejecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-rdo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            rdo_id: rdoId,
            action: 'rejeitar',
            motivo_rejeicao: motivoRejeicao.trim(),
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Erro ao rejeitar');

      toast.success('RDO rejeitado');
      setShowRejectDialog(false);
      setMotivoRejeicao('');
      queryClient.invalidateQueries({ queryKey: ['rdo', rdoId] });
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao rejeitar RDO');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDownload = async (doc: any) => {
    setDownloadingId(doc.id);
    const viewer = window.open('about:blank', '_blank');
    const url = await getSignedUrl('documentos', doc.url);
    setDownloadingId(null);
    if (!url) {
      viewer?.close();
      toast.error('NÃ£o foi possÃ­vel gerar o link de download.');
      return;
    }

    if (viewer) {
      viewer.location.href = url;
    } else {
      toast.error('O navegador bloqueou a nova aba. Permita pop-ups para visualizar o arquivo.');
    }
  };

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Excluir "${doc.nome}"? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`)) return;
    setDeletingId(doc.id);
    const ok = await deleteDocumento(doc.id, doc.url);
    setDeletingId(null);
    if (ok) {
      toast.success('Arquivo excluÃ­do.');
      queryClient.invalidateQueries({ queryKey: ['rdo', id] });
    } else {
      toast.error('Erro ao excluir arquivo.');
    }
  };

  const getDocIcon = (tipo: string) => {
    if (!tipo) return <FileText className="h-4 w-4 text-muted-foreground" />;
    const t = tipo.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(t))
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (t === 'pdf')
      return <FileText className="h-4 w-4 text-red-500" />;
    return <FileType className="h-4 w-4 text-muted-foreground" />;
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !rdo) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">RDO nÃ£o encontrado</h2>
        <Link to="/app/rdo">
          <Button variant="outline">Voltar para RDOs</Button>
        </Link>
      </div>
    );
  }

  // Convert DB data to UI compatible structure if needed, or use directly
  const rdoData = {
    id: rdo.id,
    numeroRDO: `RDO-${new Date(rdo.data).getFullYear()}-${rdo.id.slice(0, 4)}`,
    obra: rdo.obras?.nome || "Obra nÃ£o informada",
    responsavel: "ResponsÃ¡vel (TBD)", // Need auth user or responsible field
    data: new Date(rdo.data),
    status: rdo.status || 'DRAFT',
    periodo: {
      inicio: rdo.periodo || "07:00",
      fim: "17:00", // TBD
      intervalos: "12:00 - 13:00" // TBD: Add to schema
    },
    clima: rdo.clima,
    temperatura: "N/A", // TBD
    atividades: rdo.rdo_atividades?.map((a: any) => ({
      id: a.id,
      descricao: a.nome,
      equipe: "Equipe", // TBD
      quantidade: `${a.quantidade} ${a.unidade_medida}`,
      status: a.status
    })) || [],
    equipamentos: rdo.rdo_equipamentos?.map((e: any) => ({
      id: e.id,
      nome: "Equipamento",
      horas: `${e.horas_uso}h`,
      status: e.status
    })) || [],
    documentos: (rdo.documentos || []) as any[],
    observacoes: rdo.observacoes || "Sem observações.",
    aprovadoPorId: rdo.aprovado_por_id,
    aprovadoPorNome: rdo.profiles_aprovador?.full_name || null,
    dataAprovacao: rdo.data_aprovacao ? new Date(rdo.data_aprovacao) : null,
    motivoRejeicao: rdo.motivo_rejeicao || null,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprovado":
        return <Badge variant="default" className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "Rejeitado":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "Aguardando aprovação":
      case "Enviado":
        return <Badge variant="secondary" className="bg-blue-600 text-white"><Clock className="h-3 w-3 mr-1" />Aguardando Aprovação</Badge>;
      case "Rascunho":
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pendente'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link to="/app/rdo">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center space-x-3">
              <FileText className="h-8 w-8 text-construction-orange" />
              <span>{rdoData.numeroRDO}</span>
              {getStatusBadge(rdoData.status)}
            </h1>
            <p className="text-muted-foreground">{rdoData.obra}</p>
          </div>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" />
            Enviar por Email
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => downloadRDO(rdoId)}
            disabled={isPdfDownloading}
          >
            {isPdfDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Baixar PDF
          </Button>
          <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* InformaÃ§Ãµes Gerais */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">InformaÃ§Ãµes Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Data</span>
              </div>
              <p className="font-medium text-card-foreground">{rdoData.data.toLocaleDateString()}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>ResponsÃ¡vel</span>
              </div>
              <p className="font-medium text-card-foreground">{rdoData.responsavel}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Obra</span>
              </div>
              <p className="font-medium text-card-foreground">{rdoData.obra}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>PerÃ­odo</span>
              </div>
              <p className="font-medium text-card-foreground">{rdoData.periodo.inicio} - {rdoData.periodo.fim}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atividades Realizadas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Atividades Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rdoData.atividades.map((atividade) => (
              <div key={atividade.id} className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 flex-1">
                  <p className="font-medium text-card-foreground">{atividade.descricao}</p>
                  <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                    <span>Equipe: {atividade.equipe}</span>
                    <span>Quantidade: {atividade.quantidade}</span>
                  </div>
                </div>
                <Badge variant={atividade.status === "ConcluÃ­da" ? "default" : "secondary"} className={atividade.status === "ConcluÃ­da" ? "bg-construction-green text-white" : ""}>
                  {atividade.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipamentos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Equipamentos Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {rdoData.equipamentos.map((equipamento) => (
              <div key={equipamento.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-card-foreground">{equipamento.nome}</p>
                  <p className="text-sm text-muted-foreground">Horas trabalhadas: {equipamento.horas}</p>
                </div>
                <Badge variant="outline" className="text-construction-green border-construction-green">
                  {equipamento.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-construction-orange" />
            Anexos
            {rdoData.documentos.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rdoData.documentos.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rdoData.documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum anexo neste RDO.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rdoData.documentos.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getDocIcon(doc.tipo)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.tipo?.toUpperCase()}
                        {doc.tamanho ? ` â€¢ ${formatBytes(doc.tamanho)}` : ''}
                        {doc.created_at ? ` â€¢ ${new Date(doc.created_at).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Baixar / Visualizar"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {downloadingId === doc.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ExternalLink className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Excluir anexo"
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ObservaÃ§Ãµes */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">ObservaÃ§Ãµes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-card-foreground">{rdoData.observacoes}</p>
        </CardContent>
      </Card>

      {/* Seção de Aprovação / Assinatura Digital */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aprovação / Assinatura Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Status: Aprovado */}
          {rdoData.status === 'Aprovado' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400 text-lg">RDO Aprovado</p>
                  <p className="text-sm text-muted-foreground">
                    Aprovado por <strong>{rdoData.aprovadoPorNome || 'Administrador'}</strong>
                    {rdoData.dataAprovacao && (
                      <> em {rdoData.dataAprovacao.toLocaleDateString('pt-BR')} às {rdoData.dataAprovacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status: Rejeitado */}
          {rdoData.status === 'Rejeitado' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400 text-lg">RDO Rejeitado</p>
                  <p className="text-sm text-muted-foreground">
                    Rejeitado por <strong>{rdoData.aprovadoPorNome || 'Administrador'}</strong>
                    {rdoData.dataAprovacao && (
                      <> em {rdoData.dataAprovacao.toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                  {rdoData.motivoRejeicao && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-sm">
                      <strong>Motivo:</strong> {rdoData.motivoRejeicao}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status: Pendente de aprovação - botões de ação */}
          {(rdoData.status === 'Aguardando aprovação' || rdoData.status === 'Enviado') && (
            <div>
              {canApprove ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Este RDO aguarda sua aprovação.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleApproveRDO}
                      disabled={isApproving}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Aprovar RDO
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isRejecting}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar RDO
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  Este RDO está aguardando aprovação de um Administrador ou Gerente.
                </div>
              )}
            </div>
          )}

          {/* Status: Rascunho */}
          {rdoData.status === 'Rascunho' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Este RDO está em rascunho. Envie-o para aprovação para iniciar o processo de assinatura.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Notas Múltiplas */}
      <RDONotasSection rdoId={rdoData.id} />

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar RDO</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O responsável será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Descreva o motivo da rejeição..."
            value={motivoRejeicao}
            onChange={(e) => setMotivoRejeicao(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleRejectRDO}
              disabled={isRejecting || !motivoRejeicao.trim()}
            >
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RDOVisualizar;
