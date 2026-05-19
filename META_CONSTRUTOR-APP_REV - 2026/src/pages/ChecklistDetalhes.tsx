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
import { ChecklistItem } from "@/types/checklist";
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
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toastEnhanced } from "@/components/ToastEnhanced";
import "../styles/print.css";
import { useChecklist } from "@/hooks/useChecklist";

const ChecklistDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useChecklistDetail, updateChecklistItem, uploadChecklistItemAttachment } = useChecklist();

  const { data: checklist, isLoading, error } = useChecklistDetail(id || "");

  const [isSaving, setSaving] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

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
    // Since we are auto-saving on interaction, this is just a manual trigger or confirmation
    // Or we could use this to verify all required items are done
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay for UX
    toastEnhanced.success("Checklist sincronizado", "Todas as alterações foram salvas.");
    setSaving(false);
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
    toastEnhanced.info("Exportando PDF", "Funcionalidade em desenvolvimento...");
  };

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) {
      toastEnhanced.error("Erro", "Informe pelo menos um destinatário.");
      return;
    }
    toastEnhanced.info("Enviando e-mail", "Funcionalidade em desenvolvimento...");
    setIsEmailDialogOpen(false);
    setEmailRecipients("");
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
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
                    <Button onClick={handleSendEmail}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                    Prazo: {checklist.dueDate ? format(new Date(checklist.dueDate), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
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
                <span>{checklist.progress.completed} de {checklist.progress.total} itens concluídos</span>
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
