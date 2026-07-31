import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrcamentoAnalitico, AtividadeOrcamento } from "./OrcamentoAnalitico";
import { DocumentosObra } from "./DocumentosObra";
import { useObras } from "@/hooks/useObras";
import { useDocuments } from "@/hooks/useDocuments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NovaObraFormProps {
  isOpen: boolean;
  onClose: () => void;
  obra?: {
    id: string;
    nome?: string;
    cliente?: string;
    localizacao?: string;
    responsavel?: string;
    tipo?: string;
    data_inicio?: string;
    previsao_termino?: string;
    dataInicio?: string;
    previsaoTermino?: string;
    observacoes?: string;
    descricao?: string;
  } | null;
}

const parseDate = (date?: string) => {
  if (!date) return undefined;
  if (date.includes("T")) return new Date(date);
  return new Date(`${date}T00:00:00`);
};

const emptyFormData = {
  nome: "",
  cliente: "",
  localizacao: "",
  responsavel: "",
  tipo: "",
  dataInicio: undefined as Date | undefined,
  previsaoTermino: undefined as Date | undefined,
  observacoes: ""
};

export const NovaObraForm = ({ isOpen, onClose, obra }: NovaObraFormProps) => {
  const { createObra, updateObra } = useObras();
  const { uploadDocument } = useDocuments({ enabled: false });
  const isEditing = Boolean(obra?.id);
  const [atividadesOrcamento, setAtividadesOrcamento] = useState<AtividadeOrcamento[]>([]);
  const [documentosObra, setDocumentosObra] = useState<File[]>([]);
  const [formData, setFormData] = useState(emptyFormData);

  useEffect(() => {
    if (!isOpen) return;

    if (obra) {
      setFormData({
        nome: obra.nome || "",
        cliente: obra.cliente || "",
        localizacao: obra.localizacao || "",
        responsavel: obra.responsavel || "",
        tipo: obra.tipo || "",
        dataInicio: parseDate(obra.data_inicio || obra.dataInicio),
        previsaoTermino: parseDate(obra.previsao_termino || obra.previsaoTermino),
        observacoes: obra.observacoes || obra.descricao || ""
      });
      setAtividadesOrcamento([]);
      setDocumentosObra([]);
      return;
    }

    setFormData(emptyFormData);
    setAtividadesOrcamento([]);
    setDocumentosObra([]);
  }, [isOpen, obra]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadPendingDocuments = async (obraId: string) => {
    for (const file of documentosObra) {
      await uploadDocument.mutateAsync({
        nome: file.name,
        categoria: file.type.startsWith('image/') ? 'Outros' : 'Projeto',
        obra_id: obraId,
        descricao: 'Documento anexado pela tela da obra',
        file,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.cliente || !formData.localizacao ||
      !formData.responsavel || !formData.tipo || !formData.dataInicio ||
      !formData.previsaoTermino) {
      toast.error("Preencha todos os campos obrigatorios da obra.");
      return;
    }

    const payload = {
      nome: formData.nome,
      cliente: formData.cliente,
      localizacao: formData.localizacao,
      responsavel: formData.responsavel,
      tipo: formData.tipo,
      data_inicio: formData.dataInicio ? format(formData.dataInicio, 'yyyy-MM-dd') : '',
      previsao_termino: formData.previsaoTermino ? format(formData.previsaoTermino, 'yyyy-MM-dd') : '',
      observacoes: formData.observacoes || undefined,
      descricao: formData.observacoes || undefined,
    };

    if (isEditing && obra?.id) {
      try {
        await updateObra.mutateAsync({
          id: obra.id,
          ...payload,
        });
        await uploadPendingDocuments(obra.id);
        setDocumentosObra([]);
        onClose();
      } catch {
        // Mutations already show Supabase error context in toasts.
      }
      return;
    }

    try {
      const novaObra = await createObra.mutateAsync({
        ...payload,
        atividades: atividadesOrcamento,
      });
      await uploadPendingDocuments(novaObra.id);
      setAtividadesOrcamento([]);
      setDocumentosObra([]);
      setFormData(emptyFormData);
      onClose();
    } catch {
      // Mutations already show Supabase error context in toasts.
    }
  };

  const isSubmitting = createObra.isPending || updateObra.isPending || uploadDocument.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] bg-card border-border h-[95vh] sm:h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-card-foreground">
            {isEditing ? "Editar Obra" : "Cadastrar Nova Obra"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cadastre os dados da obra
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="basico" className="h-full flex flex-col">
            <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
              <TabsList className="grid h-auto min-h-9 w-full grid-cols-3 sm:min-h-10">
                <TabsTrigger value="basico" className="text-xs sm:text-sm px-2 sm:px-3">Dados Básicos</TabsTrigger>
                <TabsTrigger value="orcamento" className="text-xs sm:text-sm px-2 sm:px-3">Orçamento</TabsTrigger>
                <TabsTrigger value="documentos" className="text-xs sm:text-sm px-2 sm:px-3">Documentos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <TabsContent value="basico" className="space-y-4 sm:space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm font-medium text-card-foreground">Nome da Obra *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Obra A"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente" className="text-sm font-medium text-card-foreground">Cliente *</Label>
                    <Input
                      id="cliente"
                      placeholder="Nome do cliente"
                      value={formData.cliente}
                      onChange={(e) => handleInputChange("cliente", e.target.value)}
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localizacao" className="text-sm font-medium text-card-foreground">Localização *</Label>
                  <Input
                    id="localizacao"
                    placeholder="Endereço completo da obra"
                    value={formData.localizacao}
                    onChange={(e) => handleInputChange("localizacao", e.target.value)}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavel" className="text-sm font-medium text-card-foreground">Responsável Técnico *</Label>
                    <Input
                      id="responsavel"
                      placeholder="Nome do engenheiro responsável"
                      value={formData.responsavel}
                      onChange={(e) => handleInputChange("responsavel", e.target.value)}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-medium text-card-foreground">Tipo de Obra *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue placeholder="Selecione o tipo de obra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residencial">Residencial</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        <SelectItem value="Institucional">Institucional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label htmlFor="dataInicio" className="text-sm font-medium text-card-foreground">Data de Início *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 sm:h-10",
                            !formData.dataInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dataInicio ? format(formData.dataInicio, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dataInicio}
                          onSelect={(date) => handleInputChange("dataInicio", date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previsaoTermino" className="text-sm font-medium text-card-foreground">Previsão de Término *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-9 sm:h-10",
                            !formData.previsaoTermino && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.previsaoTermino ? format(formData.previsaoTermino, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.previsaoTermino}
                          onSelect={(date) => handleInputChange("previsaoTermino", date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-sm font-medium text-card-foreground">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações adicionais sobre a obra"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange("observacoes", e.target.value)}
                    className="min-h-[80px] sm:min-h-[100px] resize-none"
                  />
                </div>
              </TabsContent>

              <TabsContent value="orcamento" className="mt-0">
                <OrcamentoAnalitico
                  atividades={atividadesOrcamento}
                  onAtividadesChange={setAtividadesOrcamento}
                />
              </TabsContent>

              <TabsContent value="documentos" className="mt-0">
                <DocumentosObra onFilesChange={setDocumentosObra} disabled={isSubmitting} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-muted/20 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="gradient-construction border-0 w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alteracoes' : 'Cadastrar Obra'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
