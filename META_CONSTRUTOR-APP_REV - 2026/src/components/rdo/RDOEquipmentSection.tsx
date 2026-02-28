import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Wrench, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RDOFormData } from "@/schemas/rdoSchema";
import { useEquipamentosSupabase } from "@/hooks/useEquipamentosSupabase";

interface RDOEquipmentSectionProps {
  form: UseFormReturn<RDOFormData>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Operacional":
      return <Settings className="h-4 w-4 text-construction-green" />;
    case "Manutenção":
      return <Wrench className="h-4 w-4 text-construction-orange" />;
    case "Parado":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Settings className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Operacional":
      return "bg-construction-green text-white";
    case "Manutenção":
      return "bg-construction-orange text-white";
    case "Parado":
      return "bg-destructive text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RDOEquipmentSection({ form }: RDOEquipmentSectionProps) {
  const [isEquipamentosOpen, setIsEquipamentosOpen] = useState(false);
  const { equipamentos, isLoading } = useEquipamentosSupabase();

  const {
    fields: equipamentosFields,
    append: appendEquipamento,
    remove: removeEquipamento,
    update: updateEquipamento,
  } = useFieldArray({
    control: form.control,
    name: "equipamentosUtilizados",
  });

  const adicionarEquipamento = (equipamentoId: string) => {
    const equipamento = equipamentos.find(e => e.id === equipamentoId); // ID is UUID string directly
    if (equipamento && !equipamentosFields.find(e => e.nome === equipamento.nome)) {
      appendEquipamento({
        id: equipamento.id,
        nome: equipamento.nome,
        categoria: equipamento.categoria,
        horasUso: 8,
        status: 'Operacional',
        observacoes: '',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Equipamentos Utilizados */}
      <Collapsible open={isEquipamentosOpen} onOpenChange={setIsEquipamentosOpen}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg text-card-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-construction-blue" />
                  Equipamentos Utilizados
                  {equipamentosFields.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {equipamentosFields.length}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isEquipamentosOpen ? "Recolher" : "Expandir"}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Adicionar Equipamento */}
              <div className="flex gap-2">
                <Select onValueChange={adicionarEquipamento}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={isLoading ? "Carregando..." : "Adicionar equipamento utilizado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentos
                      .filter(equipamento => !equipamentosFields.find(e => e.nome === equipamento.nome))
                      .map((equipamento) => (
                        <SelectItem key={equipamento.id} value={equipamento.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{equipamento.nome}</span>
                            <span className="text-sm text-muted-foreground">{equipamento.categoria}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Equipamentos */}
              <div className="space-y-3">
                {equipamentosFields.map((equipamento, index) => (
                  <div key={equipamento.id} className="p-4 bg-muted/20 rounded-lg border space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(equipamento.status)}
                        <div>
                          <p className="font-medium text-card-foreground">{equipamento.nome}</p>
                          <Badge variant="outline" className="text-xs">{equipamento.categoria}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEquipamento(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Horas de Uso */}
                      <div>
                        <Label className="text-sm">Horas de Uso</Label>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={equipamento.horasUso}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            updateEquipamento(index, { ...equipamento, horasUso: newValue });
                          }}
                          className="mt-1"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <Label className="text-sm">Status</Label>
                        <Select
                          value={equipamento.status}
                          onValueChange={(value) => {
                            updateEquipamento(index, { ...equipamento, status: value as any });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Operacional">
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-construction-green" />
                                Operacional
                              </div>
                            </SelectItem>
                            <SelectItem value="Manutenção">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-construction-orange" />
                                Manutenção
                              </div>
                            </SelectItem>
                            <SelectItem value="Parado">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                Parado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-end">
                        <Badge className={getStatusColor(equipamento.status)}>
                          {equipamento.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <Label className="text-sm">Observações (optional)</Label>
                      <Textarea
                        placeholder="Observações sobre o equipamento..."
                        value={equipamento.observacoes || ''}
                        onChange={(e) => {
                          updateEquipamento(index, { ...equipamento, observacoes: e.target.value });
                        }}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {equipamentosFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum equipamento registrado</p>
                  <p className="text-sm">Use o campo acima para adicionar equipamentos utilizados</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}