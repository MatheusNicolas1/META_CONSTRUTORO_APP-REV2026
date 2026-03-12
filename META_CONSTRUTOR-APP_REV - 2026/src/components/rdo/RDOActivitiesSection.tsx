import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, CheckCircle, Clock, PlayCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { RDOFormData } from "@/schemas/rdoSchema";
import { useActivitiesSupabase } from "@/hooks/useActivitiesSupabase";

interface RDOActivitiesSectionProps {
  form: UseFormReturn<RDOFormData>;
}

// const atividadesDisponiveis = [
//   { id: 1, nome: "Escavação de Fundação", categoria: "Terraplanagem", unidadeMedida: "m³" },
//   { id: 2, nome: "Concretagem de Laje", categoria: "Estrutura", unidadeMedida: "m²" },
//   { id: 3, nome: "Instalação Elétrica", categoria: "Instalações", unidadeMedida: "m" },
//   { id: 4, nome: "Alvenaria de Vedação", categoria: "Alvenaria", unidadeMedida: "m²" },
//   { id: 5, nome: "Aplicação de Argamassa", categoria: "Acabamento", unidadeMedida: "m²" },
//   { id: 6, nome: "Instalação Hidráulica", categoria: "Instalações", unidadeMedida: "m" },
// ];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Concluída":
      return <CheckCircle className="h-4 w-4 text-construction-green" />;
    case "Em Andamento":
      return <Clock className="h-4 w-4 text-construction-orange" />;
    case "Iniciada":
      return <PlayCircle className="h-4 w-4 text-construction-blue" />;
    default:
      return <PlayCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Concluída":
      return "bg-construction-green text-white";
    case "Em Andamento":
      return "bg-construction-orange text-white";
    case "Iniciada":
      return "bg-construction-blue text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RDOActivitiesSection({ form }: RDOActivitiesSectionProps) {
  const [isAtividadesOpen, setIsAtividadesOpen] = useState(true);
  const [isExtrasOpen, setIsExtrasOpen] = useState(false);

  const obraId = form.watch("obraId");
  const { activitiesList, isLoading } = useActivitiesSupabase({ obraId });

  // Use real activities or empty if loading/none
  const atividadesDisponiveis = activitiesList || [];

  const {
    fields: atividadesFields,
    append: appendAtividade,
    remove: removeAtividade,
    update: updateAtividade,
  } = useFieldArray({
    control: form.control,
    name: "atividadesRealizadas",
  });

  const {
    fields: extrasFields,
    append: appendExtra,
    remove: removeExtra,
  } = useFieldArray({
    control: form.control,
    name: "atividadesExtras",
  });

  const adicionarAtividade = (atividadeId: string) => {
    const atividade = atividadesDisponiveis.find(a => a.id.toString() === atividadeId);
    if (atividade && !atividadesFields.find(a => a.nome === atividade.titulo)) {
      appendAtividade({
        id: atividade.id, // Keep the ID for reference
        nome: atividade.titulo,
        categoria: atividade.categoria || 'Geral',
        quantidade: atividade.quantidade_prevista || 1,
        unidadeMedida: atividade.unidade_medida || 'un',
        percentualConcluido: 0,
        status: 'Iniciada',
        observacoes: '',
      });
    }
  };

  const adicionarAtividadeExtra = () => {
    appendExtra({
      nome: "",
      descricao: "",
      categoria: "",
      quantidade: 1,
      unidadeMedida: "",
      percentualConcluido: 0,
      justificativa: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Atividades Planejadas */}
      <Collapsible open={isAtividadesOpen} onOpenChange={setIsAtividadesOpen}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg text-card-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-construction-green" />
                  Atividades Planejadas
                  {atividadesFields.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {atividadesFields.length}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isAtividadesOpen ? "Recolher" : "Expandir"}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Feedback contextual */}
              {!obraId ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Selecione a <strong>obra</strong> no campo acima para carregar as atividades disponíveis.</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  <span>Carregando atividades da obra...</span>
                </div>
              ) : atividadesDisponiveis.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Nenhuma atividade cadastrada para esta obra.{" "}
                    <Link to="/app/atividades" className="font-medium underline underline-offset-2 hover:text-amber-900">
                      Cadastrar atividade →
                    </Link>
                  </span>
                </div>
              ) : (
                /* Adicionar Atividade */
                <div className="flex gap-2">
                  <Select onValueChange={adicionarAtividade}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar atividade do cronograma" />
                    </SelectTrigger>
                    <SelectContent>
                      {atividadesDisponiveis
                        .filter(atividade => !atividadesFields.find(a => a.nome === atividade.titulo))
                        .map((atividade) => (
                          <SelectItem key={atividade.id} value={atividade.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{atividade.titulo}</span>
                              <span className="text-sm text-muted-foreground">{atividade.categoria || 'Sem categoria'}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Lista de Atividades */}
              <div className="space-y-3">
                {atividadesFields.map((atividade, index) => (
                  <div key={atividade.id} className="p-4 bg-muted/20 rounded-lg border space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(atividade.status)}
                        <div>
                          <p className="font-medium text-card-foreground">{atividade.nome}</p>
                          <Badge variant="outline" className="text-xs">{atividade.categoria}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAtividade(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Quantidade */}
                      <div>
                        <Label className="text-sm">Quantidade</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="number"
                            min="0"
                            value={atividade.quantidade}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value) || 0;
                              updateAtividade(index, { ...atividade, quantidade: newValue });
                            }}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {atividade.unidadeMedida}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <Label className="text-sm">Status</Label>
                        <Select
                          value={atividade.status}
                          onValueChange={(value) => {
                            updateAtividade(index, { ...atividade, status: value as any });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Iniciada">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="h-4 w-4 text-construction-blue" />
                                Iniciada
                              </div>
                            </SelectItem>
                            <SelectItem value="Em Andamento">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-construction-orange" />
                                Em Andamento
                              </div>
                            </SelectItem>
                            <SelectItem value="Concluída">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-construction-green" />
                                Concluída
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Percentual */}
                      <div className="md:col-span-2">
                        <Label className="text-sm">
                          Progresso: {atividade.percentualConcluido}%
                        </Label>
                        <div className="mt-2 flex items-center gap-3">
                          <Slider
                            value={[atividade.percentualConcluido]}
                            onValueChange={(value) => {
                              updateAtividade(index, { ...atividade, percentualConcluido: value[0] });
                            }}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <Badge className={getStatusColor(atividade.status)}>
                            {atividade.percentualConcluido}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <Label className="text-sm">Observações (opcional)</Label>
                      <Textarea
                        placeholder="Observações sobre esta atividade..."
                        value={atividade.observacoes || ''}
                        onChange={(e) => {
                          updateAtividade(index, { ...atividade, observacoes: e.target.value });
                        }}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {atividadesFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma atividade selecionada</p>
                  <p className="text-sm">Use o campo acima para adicionar atividades do cronograma</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Atividades Extras */}
      <Collapsible open={isExtrasOpen} onOpenChange={setIsExtrasOpen}>
        <Card className="bg-card border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-lg text-card-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-construction-orange" />
                  Atividades Extras
                  {extrasFields.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {extrasFields.length}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isExtrasOpen ? "Recolher" : "Expandir"}
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Atividades não previstas realizadas no dia
                </p>
                <Button onClick={adicionarAtividadeExtra} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atividade Extra
                </Button>
              </div>

              {extrasFields.map((extra, index) => (
                <div key={extra.id} className="p-4 bg-muted/20 rounded-lg border space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-card-foreground">Atividade Extra #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExtra(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Nome da Atividade *</Label>
                      <Input
                        placeholder="Ex: Limpeza de entulhos"
                        value={extra.nome}
                        onChange={(e) => {
                          const currentExtras = form.getValues("atividadesExtras");
                          const updatedExtras = [...currentExtras];
                          updatedExtras[index] = { ...updatedExtras[index], nome: e.target.value };
                          form.setValue("atividadesExtras", updatedExtras);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Categoria</Label>
                      <Input
                        placeholder="Ex: Limpeza"
                        value={extra.categoria}
                        onChange={(e) => {
                          const currentExtras = form.getValues("atividadesExtras");
                          const updatedExtras = [...currentExtras];
                          updatedExtras[index] = { ...updatedExtras[index], categoria: e.target.value };
                          form.setValue("atividadesExtras", updatedExtras);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Descrição da Atividade</Label>
                    <Textarea
                      placeholder="Descreva a atividade realizada..."
                      value={extra.descricao}
                      onChange={(e) => {
                        const currentExtras = form.getValues("atividadesExtras");
                        const updatedExtras = [...currentExtras];
                        updatedExtras[index] = { ...updatedExtras[index], descricao: e.target.value };
                        form.setValue("atividadesExtras", updatedExtras);
                      }}
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Justificativa *</Label>
                    <Textarea
                      placeholder="Por que esta atividade foi necessária?"
                      value={extra.justificativa}
                      onChange={(e) => {
                        const currentExtras = form.getValues("atividadesExtras");
                        const updatedExtras = [...currentExtras];
                        updatedExtras[index] = { ...updatedExtras[index], justificativa: e.target.value };
                        form.setValue("atividadesExtras", updatedExtras);
                      }}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              {extrasFields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma atividade extra registrada</p>
                  <p className="text-sm">Use o botão acima para adicionar atividades não previstas</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}