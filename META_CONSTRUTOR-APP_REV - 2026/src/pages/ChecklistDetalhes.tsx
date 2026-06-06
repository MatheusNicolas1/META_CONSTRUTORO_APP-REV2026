import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Printer,
  Download,
  Mail,
  Calendar,
  User,
  Building,
  CheckSquare,
  AlertCircle,
  FileCheck,
  Camera,
  Paperclip,
  Loader2,
  RotateCcw,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toastEnhanced } from "@/components/ToastEnhanced";
import "../styles/print.css";
import { useChecklist } from "@/hooks/useChecklist";
import { supabase } from "@/integrations/supabase/client";
import { DigitalSignatureComponent } from "@/components/checklist/DigitalSignature";
import { DigitalSignature } from "@/types/checklist";
import { useRole } from "@/hooks/usePermissions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseRecipients = (value: string) =>
  [...new Set(value.split(/[,\n;]/).map((email) => email.trim().toLowerCase()).filter(Boolean))];

const getDownloadFileName = (contentDisposition: string | null, fallback: string) => {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
};

const readFunctionError = async (response: Response) => {
  const body = await response.json().catch(() => null);
  return body?.error?.message || body?.message || `Falha na requisicao (${response.status})`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ChecklistDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useChecklistDetail, updateChecklistItem, updateChecklistStatus, uploadChecklistItemAttachment } = useChecklist();
  const { isPresidente, isAdmin, isGerente } = useRole();

  const { data: checklist, isLoading, error, refetch } = useChecklistDetail(id || "");

  const [isSaving, setSaving] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const canApproveChecklist = isPresidente || isAdmin || isGerente;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Crítica':
        return <Badge variant="destructive" className="text-xs">Crítica</Badge>;
      case 'Alta':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">Alta</Badge>;
      case 'Média':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Média</Badge>;
      case 'Baixa':
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-800 text-xs">Concluído</Badge>;
      case 'Não conforme':
        return <Badge className="bg-red-100 text-red-800 text-xs">Não conforme</Badge>;
      case 'Em andamento':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Em andamento</Badge>;
      case 'Não iniciado':
        return <Badge variant="outline" className="text-xs">Não iniciado</Badge>;
      case 'Não aplicável':
        return <Badge variant="secondary" className="text-xs">Não aplicável</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const handleItemStatusChange = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem.mutateAsync({
        itemId,
        updates: {
          status: completed ? "Concluído" : "Não iniciado",
          completedAt: completed ? new Date().toISOString() : null,
          // completedBy logic handled by backend or trigger preferred, but sending null/reset for now
        }
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleItemObservationBlur = async (itemId: string, observation: string) => {
    // Only update if changed - handled by onBlur logic typically, checking vs original
    // For simplicity, we just send the update. Optimization: compare with current data.
    const currentItem = checklist?.items.find(i => i.id === itemId);
    if (currentItem?.observations === observation) return;

    try {
      await updateChecklistItem.mutateAsync({
        itemId,
        updates: { observations: observation }
      });
      toastEnhanced.success("Salvo", "Observação atualizada.");
    } catch (error) {
      console.error("Failed to update observation", error);
    }
  };

  const handleFileUpload = async (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !checklist) return;

    setUploadingItemId(itemId);
    try {
      await uploadChecklistItemAttachment.mutateAsync({
        itemId,
        file,
        checklistId: checklist.id
      });
    } catch (error) {
      console.error("Erro ao fazer upload da evidência", error);
    } finally {
      setUploadingItemId(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await refetch();
      if (result.error) throw result.error;
      toastEnhanced.success("Checklist sincronizado", "Dados recarregados do Supabase.");
    } catch (error) {
      console.error("Erro ao sincronizar checklist", error);
      toastEnhanced.error("Erro", "Nao foi possivel confirmar a sincronizacao do checklist.");
    } finally {
      setSaving(false);
    }
  };

  const handleItemStatusSelect = async (itemId: string, status: string) => {
    try {
      await updateChecklistItem.mutateAsync({
        itemId,
        updates: {
          status,
          completedAt: status === "Concluído" ? new Date().toISOString() : null,
        }
      });
      toastEnhanced.success("Salvo", "Status do item atualizado.");
    } catch (error) {
      console.error("Failed to update status", error);
      toastEnhanced.error("Erro", "Nao foi possivel atualizar o status do item.");
    }
  };

  const handleFinalize = async () => {
    if (!checklist) return;

    if (checklist.progress.total === 0 || checklist.progress.percentage < 100) {
      toastEnhanced.error("Checklist incompleto", "Conclua todos os itens antes de finalizar.");
      return;
    }

    try {
      const now = new Date().toISOString();
      await updateChecklistStatus.mutateAsync({
        checklistId: checklist.id,
        updates: {
          status: "Em Andamento",
          startedAt: checklist.startedAt || now,
        },
      });
      await refetch();
      toastEnhanced.success("Checklist finalizado", "Checklist pronto para aprovacao.");
    } catch (error) {
      console.error("Erro ao finalizar checklist", error);
      toastEnhanced.error("Erro", "Nao foi possivel finalizar o checklist.");
    }
  };

  const handleApprove = async (signature: DigitalSignature) => {
    if (!checklist) return;

    try {
      const { data, error } = await supabase.functions.invoke("approve-checklist", {
        body: {
          checklist_id: checklist.id,
          signature,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message || "Falha ao aprovar checklist.");

      await refetch();
      toastEnhanced.success("Checklist aprovado", "Assinatura digital registrada.");
    } catch (error) {
      console.error("Erro ao aprovar checklist", error);
      toastEnhanced.error("Erro ao aprovar", "Nao foi possivel registrar a aprovacao.");
    }
  };

  const handleReject = async () => {
    if (!checklist) return;

    try {
      await updateChecklistStatus.mutateAsync({
        checklistId: checklist.id,
        updates: {
          status: "Pendente",
          completedAt: null,
          approvedById: null,
          approvedAt: null,
          signatureName: null,
          signatureEmail: null,
          signatureData: null,
          signedAt: null,
        },
      });
      await refetch();
      toastEnhanced.success("Checklist reprovado", "Checklist retornou como pendente.");
    } catch (error) {
      console.error("Erro ao reprovar checklist", error);
      toastEnhanced.error("Erro", "Nao foi possivel reprovar o checklist.");
    }
  };

  const handleReopen = async () => {
    if (!checklist) return;

    try {
      await updateChecklistStatus.mutateAsync({
        checklistId: checklist.id,
        updates: {
          status: "Rascunho",
          completedAt: null,
          approvedById: null,
          approvedAt: null,
          signatureName: null,
          signatureEmail: null,
          signatureData: null,
          signedAt: null,
        },
      });
      await refetch();
      toastEnhanced.success("Checklist reaberto", "Checklist voltou para edicao.");
    } catch (error) {
      console.error("Erro ao reabrir checklist", error);
      toastEnhanced.error("Erro", "Nao foi possivel reabrir o checklist.");
    }
  };

  const handlePrint = () => {
    const printStyles = `
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .print-hidden { display: none !important; }
        .print-break { page-break-before: always; }
        .print-no-break { page-break-inside: avoid; }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    window.print();

    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 1000);
  };

  const handleExportPDF = async () => {
    if (!checklist) return;

    setIsExportingPDF(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!supabaseUrl || !anonKey || !accessToken) {
        throw new Error("Sessao autenticada ou configuracao do Supabase indisponivel.");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-checklist-pdf`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "apikey": anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checklist_id: checklist.id }),
      });

      if (!response.ok) {
        throw new Error(await readFunctionError(response));
      }

      const blob = await response.blob();
      const filename = getDownloadFileName(response.headers.get("content-disposition"), `checklist-${checklist.id}.pdf`);
      downloadBlob(blob, filename);
      toastEnhanced.success("PDF gerado", "Download do checklist iniciado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar PDF.";
      console.error("Erro ao exportar PDF do checklist", error);
      toastEnhanced.error("Erro ao gerar PDF", message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!checklist) return;

    const recipients = parseRecipients(emailRecipients);
    if (!recipients.length) {
      toastEnhanced.error("Erro", "Informe pelo menos um destinatario.");
      return;
    }

    if (recipients.some((email) => !EMAIL_PATTERN.test(email))) {
      toastEnhanced.error("Erro", "Informe apenas e-mails validos.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-checklist-email", {
        body: {
          checklist_id: checklist.id,
          emails: recipients,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message || "Falha ao enviar e-mail.");

      toastEnhanced.success("E-mail enviado", `Checklist enviado para ${recipients.length} destinatario(s).`);
      setIsEmailDialogOpen(false);
      setEmailRecipients("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar e-mail.";
      console.error("Erro ao enviar checklist por e-mail", error);
      toastEnhanced.error("Erro ao enviar e-mail", message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="responsive-spacing">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="responsive-spacing">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Checklist não encontrado</h3>
            <p className="text-muted-foreground mb-4">O checklist solicitado não foi encontrado ou ocorreu um erro.</p>
            <Button onClick={() => NavigationSafety.safeNavigate(navigate, '/app/checklist')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Checklists
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="responsive-spacing print-area print:p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 print:mb-4 print-hidden">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => NavigationSafety.safeNavigate(navigate, '/app/checklist')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExportingPDF}>
              {isExportingPDF ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isExportingPDF ? "Gerando..." : "Exportar PDF"}
            </Button>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isSendingEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Checklist por E-mail</DialogTitle>
                  <DialogDescription>
                    Insira os e-mails dos destinatários (separados por vírgula)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Destinatários</Label>
                    <Input
                      placeholder="email1@exemplo.com, email2@exemplo.com"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSendEmail} disabled={isSendingEmail || !emailRecipients.trim()}>
                      {isSendingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isSendingEmail ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {checklist.progress.percentage === 100 && checklist.status !== "Em Andamento" && checklist.status !== "Concluído" && (
              <Button
                variant="outline"
                onClick={handleFinalize}
                disabled={updateChecklistStatus.isPending}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Finalizar Checklist
              </Button>
            )}
            {canApproveChecklist && checklist.status === "Em Andamento" && !checklist.signature && (
              <>
                <DigitalSignatureComponent
                  onSign={handleApprove}
                  signerName={checklist.responsible.name}
                  signerEmail={checklist.responsible.email}
                />
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={updateChecklistStatus.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reprovar
                </Button>
              </>
            )}
            {canApproveChecklist && (checklist.status === "Concluído" || checklist.status === "Pendente") && (
              <Button
                variant="outline"
                onClick={handleReopen}
                disabled={updateChecklistStatus.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gradient-construction border-0 hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Cabeçalho do Checklist */}
      <Card className="print-no-break">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl md:text-2xl mb-2">{checklist.title}</CardTitle>
              <CardDescription className="text-base">{checklist.description}</CardDescription>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{checklist.obra.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{checklist.responsible.name} ({checklist.responsible.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Prazo: {checklist.dueDate ? format(new Date(checklist.dueDate), "dd/MM/yyyy", { locale: ptBR }) : 'Sem prazo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="w-fit">{checklist.category}</Badge>
              {checklist.status === 'Concluído' ? (
                <Badge className="bg-green-100 text-green-800 w-fit">Concluído</Badge>
              ) : checklist.status === 'Em Andamento' ? (
                <Badge className="bg-blue-100 text-blue-800 w-fit">Em Andamento</Badge>
              ) : (
                <Badge variant="outline" className="w-fit">{checklist.status}</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progresso Geral</span>
                <span className="text-sm font-semibold">{checklist.progress.percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-construction-green h-3 rounded-full transition-all duration-300"
                  style={{ width: `${checklist.progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{checklist.progress.completed} de {checklist.progress.total} itens verificados</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Itens do Checklist */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Itens do Checklist
        </h2>

        {checklist.items.map((item, index) => (
          <Card key={item.id} className="transition-all hover:shadow-lg print-no-break">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header do Item */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={item.status === "Concluído"}
                      onCheckedChange={(checked) => handleItemStatusChange(item.id, checked === true)}
                      className="mt-1 print-hidden"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground mb-1">
                        {index + 1}. {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {getPriorityBadge(item.priority)}
                        {getStatusBadge(item.status)}
                        {item.isObligatory && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                            Obrigatório
                          </Badge>
                        )}
                        {item.requiresAttachment && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                            Requer Evidência
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 max-w-xs print-hidden">
                        <Label className="text-xs text-muted-foreground">Status do item</Label>
                        <Select
                          value={item.status}
                          onValueChange={(status) => handleItemStatusSelect(item.id, status)}
                        >
                          <SelectTrigger className="mt-1" aria-label={`Status do item ${item.title}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Não iniciado">Não iniciado</SelectItem>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                            <SelectItem value="Não conforme">Não conforme</SelectItem>
                            <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre este item..."
                    defaultValue={item.observations || ''}
                    onBlur={(e) => handleItemObservationBlur(item.id, e.target.value)}
                    className="mt-1 print-hidden"
                    rows={2}
                  />
                  {item.observations && (
                    <div className="hidden print:block mt-2 p-2 bg-muted rounded text-sm">
                      {item.observations}
                    </div>
                  )}
                </div>

                {/* Upload de Evidências */}
                {item.requiresAttachment && (
                  <div className="print-hidden">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Evidências (Requerido)
                    </Label>
                    <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Adicione fotos ou documentos como evidência
                        </p>

                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex flex-col gap-2 mb-4">
                            {item.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                <span className="text-sm truncate">{att.name || 'Anexo'}</span>
                                <Badge variant="outline" className="text-xs">Salvo</Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                          disabled={uploadingItemId === item.id}
                        >
                          {uploadingItemId === item.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                          {uploadingItemId === item.id ? "Enviando..." : "Adicionar Evidência"}
                        </Button>
                        <input
                          type="file"
                          id={`upload-${item.id}`}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(item.id, e)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações de Conclusão */}
                {item.completedAt && (
                  /* item.completedBy might be null, but we can show time */
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3 w-3" />
                      Concluído em {format(new Date(item.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChecklistDetalhes;
