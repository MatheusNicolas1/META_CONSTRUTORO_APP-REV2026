import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChecklistFormData, ChecklistCategory, ChecklistTemplate, ChecklistItem } from "@/types/checklist";
import { ChecklistTemplates } from "./ChecklistTemplates";
import { ChecklistItemManager } from "./ChecklistItemManager";
import { CalendarIcon, Save, X, FileText, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useObras } from "@/hooks/useObras";
import { useOrgResponsibles } from "@/hooks/useOrgResponsibles";

interface ChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChecklistFormData) => Promise<void>;
  initialData?: Partial<ChecklistFormData>;
  isLoading?: boolean;
  dialogTitle?: string;
  dialogDescription?: string;
  submitLabel?: string;
}

export function ChecklistForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  dialogTitle = "Novo Checklist",
  dialogDescription = "Configure um novo checklist para controle de qualidade e segurança",
  submitLabel = "Criar Checklist"
}: ChecklistFormProps) {
  const { toast } = useToast();
  const { obras } = useObras();
  const { responsibles } = useOrgResponsibles();

  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<ChecklistFormData>({
    title: "",
    category: "",
    description: "",
    obraId: "",
    responsibleId: "",
    dueDate: "",
    templateId: undefined,
    items: []
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setActiveTab("basic");
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen || formData.responsibleId || responsibles.length === 0) return;
    setFormData(prev => ({
      ...prev,
      responsibleId: prev.responsibleId || responsibles[0].id,
    }));
  }, [formData.responsibleId, isOpen, responsibles]);

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      description: "",
      obraId: "",
      responsibleId: "",
      dueDate: "",
      templateId: undefined,
      items: []
    });
    setActiveTab("basic");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título do checklist é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma categoria para o checklist.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.obraId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma obra para o checklist.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.responsibleId && responsibles.length > 0) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um responsável para o checklist.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: "Campo obrigatório",
        description: "Defina um prazo de execução para o checklist.",
        variant: "destructive"
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Itens necessários",
        description: "Adicione pelo menos um item ao checklist.",
        variant: "destructive"
      });
      return;
    }

    await onSubmit(formData);
    handleClose();
  };

  const handleTemplateSelect = (template: ChecklistTemplate) => {
    const templateItems: ChecklistItem[] = template.items.map(item => ({
      ...item,
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temp ID
      status: "Não iniciado" as const,
      attachments: []
    }));

    setFormData({
      ...formData,
      templateId: template.id,
      category: template.category,
      items: templateItems
    });

    setActiveTab("items");

    toast({
      title: "Template aplicado",
      description: `${template.items.length} itens foram adicionados do template "${template.name}".`,
    });
  };

  const isFormValid = () => {
    return formData.title.trim() &&
      formData.category &&
      formData.obraId &&
      (formData.responsibleId || responsibles.length === 0) &&
      formData.dueDate &&
      formData.items.length > 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="items">Itens do Checklist</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 min-h-0 pr-2">
            <TabsContent value="basic" className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  <CardDescription>
                    Configure as informações principais do checklist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Checklist *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Checklist de Segurança - Início de Obra"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: ChecklistCategory) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger aria-label="Categoria do checklist">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Segurança">Segurança</SelectItem>
                          <SelectItem value="Qualidade">Qualidade</SelectItem>
                          <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                          <SelectItem value="Documentação">Documentação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="obra">Obra *</Label>
                      <Select
                        value={formData.obraId}
                        onValueChange={(value) => setFormData({ ...formData, obraId: value })}
                      >
                        <SelectTrigger aria-label="Obra do checklist">
                          <SelectValue placeholder="Selecione a obra" />
                        </SelectTrigger>
                        <SelectContent>
                          {obras.map((obra) => (
                            <SelectItem key={obra.id} value={obra.id}>
                              {obra.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsible">Responsável *</Label>
                      <Select
                        value={formData.responsibleId}
                        onValueChange={(value) => setFormData({ ...formData, responsibleId: value })}
                      >
                        <SelectTrigger aria-label="Responsavel do checklist">
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {responsibles.map((membro) => (
                            <SelectItem key={membro.id} value={membro.id || "unknown"}>
                              {membro.nome} - {membro.funcao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="due-date">Prazo de Execução *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            aria-label="Prazo do checklist"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.dueDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dueDate
                              ? format(new Date(formData.dueDate), "PPP", { locale: ptBR })
                              : "Selecione a data"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                            onSelect={(date) =>
                              setFormData({
                                ...formData,
                                dueDate: date ? date.toISOString().split('T')[0] : ""
                              })
                            }
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do checklist..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Templates de Checklist
                  </CardTitle>
                  <CardDescription>
                    Escolha um template pronto ou continue para adicionar itens manualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChecklistTemplates
                    onSelectTemplate={handleTemplateSelect}
                    selectedCategory={formData.category || undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-6">
              <ChecklistItemManager
                items={formData.items}
                onChange={(items) => setFormData({ ...formData, items })}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between pt-4 border-t bg-card border-border flex-shrink-0">
          <div className="flex gap-2">
            {activeTab === "basic" && (
              <Button
                variant="outline"
                onClick={() => setActiveTab("template")}
              >
                Próximo: Template
              </Button>
            )}
            {activeTab === "template" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("basic")}
                >
                  Voltar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("items")}
                >
                  Próximo: Itens
                </Button>
              </>
            )}
            {activeTab === "items" && (
              <Button
                variant="outline"
                onClick={() => setActiveTab("template")}
              >
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isLoading}
              className="gradient-construction"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
