import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChecklistTemplate, ChecklistCategory } from "@/types/checklist";
import { FileText, Shield, Wrench, FileCheck, Package, Eye, Plus } from "lucide-react";

interface ChecklistTemplatesProps {
  onSelectTemplate: (template: ChecklistTemplate) => void;
  selectedCategory?: ChecklistCategory;
}

export function ChecklistTemplates({ onSelectTemplate, selectedCategory }: ChecklistTemplatesProps) {
  const [previewTemplate, setPreviewTemplate] = useState<ChecklistTemplate | null>(null);

  // Templates padrao locais usados para iniciar checklists reais no Supabase.
  const templates: ChecklistTemplate[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Segurança no Início da Obra",
      category: "Segurança",
      description: "Checklist completo para verificações de segurança antes do início de qualquer obra",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      items: [
        {
          title: "Verificar EPIs da equipe",
          description: "Conferir se todos os trabalhadores possuem e estão usando EPIs adequados",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Inspeção de equipamentos de segurança",
          description: "Verificar extintores, saídas de emergência e equipamentos de primeiros socorros",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Verificar sinalização de segurança",
          description: "Conferir se toda sinalização necessária está instalada e visível",
          priority: "Alta",
          requiresAttachment: false,
          isObligatory: true
        },
        {
          title: "Teste de equipamentos elétricos",
          description: "Verificar funcionamento de equipamentos elétricos e instalações temporárias",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        }
      ]
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Controle de Qualidade - Concreto",
      category: "Qualidade",
      description: "Verificações para garantir a qualidade da concretagem",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      items: [
        {
          title: "Verificar slump do concreto",
          description: "Medir consistência do concreto através do ensaio de abatimento",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Conferir armação da estrutura",
          description: "Verificar posicionamento, espaçamento e cobrimento das armaduras",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Verificar nivelamento das formas",
          description: "Conferir alinhamento e nivelamento das formas antes da concretagem",
          priority: "Alta",
          requiresAttachment: false,
          isObligatory: true
        },
        {
          title: "Coletar amostras para ensaio",
          description: "Coletar corpos de prova para ensaio de resistência",
          priority: "Crítica",
          requiresAttachment: false,
          isObligatory: true
        }
      ]
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Verificação de Equipamentos",
      category: "Equipamentos",
      description: "Checklist para inspeção e manutenção preventiva de equipamentos",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      items: [
        {
          title: "Verificar funcionamento de máquinas",
          description: "Testar operação e funcionamento geral dos equipamentos",
          priority: "Alta",
          requiresAttachment: false,
          isObligatory: true
        },
        {
          title: "Inspeção visual de desgastes",
          description: "Verificar sinais de desgaste, vazamentos ou danos visíveis",
          priority: "Média",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Verificar níveis de fluidos",
          description: "Conferir óleo, combustível e outros fluidos dos equipamentos",
          priority: "Alta",
          requiresAttachment: false,
          isObligatory: true
        }
      ]
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Documentação da Obra",
      category: "Documentação",
      description: "Verificação de documentos e licenças necessárias",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      items: [
        {
          title: "Verificar licenças vigentes",
          description: "Conferir validade de todas as licenças e autorizações",
          priority: "Crítica",
          requiresAttachment: true,
          isObligatory: true
        },
        {
          title: "Conferir documentação da equipe",
          description: "Verificar ASO, certificados e treinamentos da equipe",
          priority: "Alta",
          requiresAttachment: false,
          isObligatory: true
        },
        {
          title: "Organizar arquivo técnico",
          description: "Verificar se toda documentação técnica está organizada e acessível",
          priority: "Média",
          requiresAttachment: false,
          isObligatory: false
        }
      ]
    }
  ];

  const getCategoryIcon = (category: ChecklistCategory) => {
    switch (category) {
      case 'Segurança':
        return <Shield className="h-4 w-4" />;
      case 'Qualidade':
        return <FileCheck className="h-4 w-4" />;
      case 'Equipamentos':
        return <Wrench className="h-4 w-4" />;
      case 'Documentação':
        return <FileText className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Crítica':
        return 'destructive';
      case 'Alta':
        return 'default';
      case 'Média':
        return 'secondary';
      case 'Baixa':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </div>
                <Badge variant="outline">
                  {template.items.length} itens
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                  className="flex-1"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Usar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-2 text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum template disponível para esta categoria
            </p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate && getCategoryIcon(previewTemplate.category)}
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description || "Visualização detalhada dos itens do checklist."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Itens do Template:</span>
                <Badge variant="outline">
                  {previewTemplate?.items.length} itens
                </Badge>
              </div>

              <div className="space-y-3">
                {previewTemplate?.items.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <Badge
                              variant={getPriorityColor(item.priority) as any}
                              className="text-xs"
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            {item.isObligatory && (
                              <Badge variant="outline" className="text-xs">
                                Obrigatório
                              </Badge>
                            )}
                            {item.requiresAttachment && (
                              <Badge variant="secondary" className="text-xs">
                                Anexo Obrigatório
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Fechar
            </Button>
            {previewTemplate && (
              <Button onClick={() => {
                onSelectTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}>
                Usar Este Template
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
