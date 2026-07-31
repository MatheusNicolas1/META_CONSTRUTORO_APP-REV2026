import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Folder } from "lucide-react";
import { rdoSchema, RDOFormData } from "@/schemas/rdoSchema";
import { CreateRDOData } from "@/types/rdo";
import { RDOFormHeader } from "./RDOFormHeader";
import { RDOActivitiesSection } from "./RDOActivitiesSection";
import { RDOEquipmentSection } from "./RDOEquipmentSection";
import { RDOIssuesSection } from "./RDOIssuesSection";
import { RDOObservationsSection } from "./RDOObservationsSection";
import { RDOAttachmentsSection } from "./RDOAttachmentsSection";
import { RDOWorkPeriodSection } from "./RDOWorkPeriodSection";
import { RDOTeamSection } from "./RDOTeamSection";
import { RDONichoSelect } from "./RDONichoSelect";
import { toastEnhanced } from "@/components/ToastEnhanced";

interface RDONewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRDOData) => Promise<void>;
  isEditing?: boolean;
  initialData?: any;
}

export function RDONewForm({ isOpen, onClose, onSubmit, isEditing = false, initialData }: RDONewFormProps) {
  const form = useForm<RDOFormData>({
    resolver: zodResolver(rdoSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      obraId: "",
      periodo: 'Manhã',
      clima: '',
      equipeOciosa: false,
      tempoOcioso: 0,
      nichoId: "",
      atividadesRealizadas: [],
      atividadesExtras: [],
      equipesPresentes: [],
      equipamentosUtilizados: [],
      equipamentosQuebrados: [],
      acidentes: [],
      materiaisFalta: [],
      estoqueMateriais: [],
      observacoes: '',
    },
  });

  // Populate form when opening in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        data: initialData.data,
        obraId: initialData.obraId,
        periodo: initialData.periodo,
        clima: initialData.clima,
        equipeOciosa: initialData.equipeOciosa,
        tempoOcioso: initialData.tempoOcioso || 0,
        nichoId: initialData.nichoId || "",
        atividadesRealizadas: initialData.atividadesRealizadas || [],
        atividadesExtras: initialData.atividadesExtras || [],
        equipesPresentes: initialData.equipesPresentes || [],
        equipamentosUtilizados: initialData.equipamentosUtilizados || [],
        equipamentosQuebrados: initialData.equipamentosQuebrados || [],
        acidentes: initialData.acidentes || [],
        materiaisFalta: initialData.materiaisFalta || [],
        estoqueMateriais: initialData.estoqueMateriais || [],
        observacoes: initialData.observacoes || '',
      });
    } else if (isOpen && !initialData) {
      form.reset({
        data: new Date().toISOString().split('T')[0],
        obraId: "",
        periodo: 'Manhã',
        clima: '',
        equipeOciosa: false,
        tempoOcioso: 0,
        nichoId: "",
        atividadesRealizadas: [],
        atividadesExtras: [],
        equipesPresentes: [],
        equipamentosUtilizados: [],
        equipamentosQuebrados: [],
        acidentes: [],
        materiaisFalta: [],
        estoqueMateriais: [],
        observacoes: '',
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: RDOFormData) => {
    try {
      const createData: CreateRDOData = {
        data: data.data,
        obraId: data.obraId,
        periodo: data.periodo,
        clima: data.clima,
        equipeOciosa: data.equipeOciosa,
        tempoOcioso: data.equipeOciosa ? data.tempoOcioso : undefined,
        nichoId: data.nichoId,
        atividadesRealizadas: data.atividadesRealizadas as any,
        atividadesExtras: data.atividadesExtras as any,
        equipesPresentes: data.equipesPresentes as any,
        equipamentosUtilizados: data.equipamentosUtilizados as any,
        equipamentosQuebrados: data.equipamentosQuebrados as any,
        acidentes: data.acidentes as any,
        materiaisFalta: data.materiaisFalta as any,
        estoqueMateriais: data.estoqueMateriais as any,
        observacoes: data.observacoes,
        files: data.files,
      };

      await onSubmit(createData);

      toastEnhanced.success("RDO salvo com sucesso!", "O relatório foi criado e está disponível para aprovação.");
      form.reset();
      onClose();
    } catch (error) {
      toastEnhanced.error("Erro ao salvar RDO", "Verifique os dados e tente novamente.");
      console.error("Erro ao salvar RDO:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[900px] h-[95vh] max-h-[95vh] flex flex-col bg-card border-border p-0 gap-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div>
            <DialogTitle className="text-xl text-card-foreground">
              {isEditing ? "Editar RDO" : "Novo Relatório Diário de Obra"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Registre o relatório diário da obra
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator className="flex-shrink-0" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4 md:px-6">
                <div className="space-y-6 py-4 md:py-6">
                  {/* Cabeçalho */}
                  <RDOFormHeader form={form} />

                  {/* Nicho */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      Nicho do RDO
                    </FormLabel>
                    <RDONichoSelect
                      value={form.watch('nichoId')}
                      onChange={(value) => form.setValue('nichoId', value, { shouldValidate: true })}
                    />
                  </div>

                  {/* Períodos de Trabalho */}
                  <RDOWorkPeriodSection form={form} />

                  {/* Equipes */}
                  <RDOTeamSection form={form} />

                  {/* Atividades */}
                  <RDOActivitiesSection form={form} />

                  {/* Equipamentos */}
                  <RDOEquipmentSection form={form} />

                  {/* Problemas e Ocorrências */}
                  <RDOIssuesSection form={form} />

                  {/* Observações */}
                  <RDOObservationsSection form={form} />

                  {/* Anexos */}
                  <RDOAttachmentsSection form={form} />

                </div>
              </ScrollArea>
            </div>

            <Separator className="flex-shrink-0" />

            {/* Footer com botões */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 md:p-6 pt-4 flex-shrink-0">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : isEditing
                    ? "Atualizar RDO"
                    : "Salvar RDO"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
