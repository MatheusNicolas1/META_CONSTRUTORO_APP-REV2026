import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Calculator } from "lucide-react";

export interface AtividadeOrcamento {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface OrcamentoAnaliticoProps {
  atividades: AtividadeOrcamento[];
  onAtividadesChange: (atividades: AtividadeOrcamento[]) => void;
}

export const OrcamentoAnalitico = ({ atividades, onAtividadesChange }: OrcamentoAnaliticoProps) => {
  const calcularValorTotal = (quantidade: number, valorUnitario: number) => {
    return quantidade * valorUnitario;
  };

  const atualizarAtividade = (id: string, campo: keyof AtividadeOrcamento, valor: any) => {
    const novasAtividades = atividades.map(atividade => {
      if (atividade.id === id) {
        const atividadeAtualizada = { ...atividade, [campo]: valor };

        // Recalcular valor total quando quantidade ou valor unitário mudarem
        if (campo === 'quantidade' || campo === 'valorUnitario') {
          atividadeAtualizada.valorTotal = calcularValorTotal(
            atividadeAtualizada.quantidade,
            atividadeAtualizada.valorUnitario
          );
        }

        return atividadeAtualizada;
      }
      return atividade;
    });
    onAtividadesChange(novasAtividades);
  };

  const adicionarAtividade = () => {
    const novaAtividade: AtividadeOrcamento = {
      id: Date.now().toString(),
      descricao: "",
      unidade: "",
      quantidade: 0,
      valorUnitario: 0,
      valorTotal: 0
    };
    onAtividadesChange([novaAtividade, ...atividades]);
  };

  const removerAtividade = (id: string) => {
    if (atividades.length > 1) {
      onAtividadesChange(atividades.filter(atividade => atividade.id !== id));
    }
  };

  const valorTotalGeral = atividades.reduce((total, atividade) => total + atividade.valorTotal, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 mt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-card-foreground">Orçamento Analítico</h3>
        <Button
          onClick={adicionarAtividade}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Adicionar Atividade
        </Button>
      </div>

      <div className="space-y-4">
        {atividades.map((atividade, index) => (
          <Card key={atividade.id} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-card-foreground">
                  Atividade {atividades.length - index}
                </CardTitle>
                {atividades.length > 1 && (
                  <Button
                    onClick={() => removerAtividade(atividade.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descrição da Atividade</Label>
                <Input
                  placeholder="Ex: Alvenaria de vedação"
                  value={atividade.descricao}
                  onChange={(e) => atualizarAtividade(atividade.id, 'descricao', e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Unidade</Label>
                  <Input
                    placeholder="m², m³, un"
                    value={atividade.unidade}
                    onChange={(e) => atualizarAtividade(atividade.id, 'unidade', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={atividade.quantidade || ''}
                    onChange={(e) => atualizarAtividade(atividade.id, 'quantidade', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Valor Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={atividade.valorUnitario || ''}
                    onChange={(e) => atualizarAtividade(atividade.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Valor Total</Label>
                  <div className="flex items-center gap-2 h-10 px-3 py-2 bg-muted/50 rounded-md border">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">
                      {formatCurrency(atividade.valorTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-lg font-semibold text-card-foreground">
              Total Geral do Orçamento:
            </span>
            <span className="text-xl sm:text-2xl font-bold text-primary">
              {formatCurrency(valorTotalGeral)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};