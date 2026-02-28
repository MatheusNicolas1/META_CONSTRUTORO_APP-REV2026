import { useState } from "react";
import { NavigationSafety } from "@/utils/navigationSafety";
import { useNavigationTransition } from "@/hooks/useNavigationTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistForm } from "@/components/checklist/ChecklistForm";
import { DigitalSignatureComponent } from "@/components/checklist/DigitalSignature";
import { Checklist as ChecklistType, ChecklistFormData, ChecklistFilters, ChecklistCategory, ChecklistStatus, DigitalSignature } from "@/types/checklist";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckSquare, Search, Plus, Filter, Calendar as CalendarIcon, Download, FileCheck, Users, AlertCircle, Clock, X, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useChecklist } from "@/hooks/useChecklist";
import { useObras } from "@/hooks/useObras";
import { useEquipesSupabase } from "@/hooks/useEquipesSupabase";

const ChecklistPage = () => {
  const { toast } = useToast();
  const { navigate } = useNavigationTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const [filters, setFilters] = useState<ChecklistFilters>({
    search: "",
    obra: "all",
    category: "all",
    status: "all",
    responsible: "all",
    dateRange: {}
  });

  const { checklistsQuery, createChecklist, deleteChecklist } = useChecklist();

  // Debounce filter changes if necessary, but for now direct passing is fine
  const { data: checklists = [], isLoading } = checklistsQuery(filters);

  const handleCreateChecklist = async (formData: ChecklistFormData) => {
    try {
      await createChecklist.mutateAsync(formData);
      // Toast is handled in the hook
    } catch (error) {
      console.error("Error creating checklist:", error);
      // Toast handled in hook
    }
  };

  const handleSignChecklist = (checklistId: string, signature: DigitalSignature) => {
    // Implementar assinatura real depois
    console.log("Signing checklist", checklistId, signature);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A assinatura digital será implementada em breve no backend."
    });
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      await deleteChecklist.mutateAsync(id);
      toast({
        title: "Checklist excluído",
        description: "O checklist foi removido com sucesso."
      });
    } catch (error) {
      console.error("Error deleting checklist:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o checklist.",
        variant: "destructive"
      });
    }
  };

  // Data hooks for filters
  const { obras } = useObras();
  const { equipes } = useEquipesSupabase();

  const clearFilters = () => {
    setFilters({
      search: "",
      obra: "all",
      category: "all",
      status: "all",
      responsible: "all",
      dateRange: {}
    });
  };

  const hasActiveFilters = filters.search || (filters.obra && filters.obra !== "all") || filters.category !== "all" ||
    filters.status !== "all" || (filters.responsible && filters.responsible !== "all");

  const activeChecklists = checklists.filter(c =>
    c.status === "Em Andamento" || c.status === "Rascunho" || c.status === "Pendente"
  );
  const completedChecklists = checklists.filter(c => c.status === "Concluído");
  const allChecklists = checklists;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="responsive-spacing">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">Gestão de Checklists</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Gerencie listas de verificação para controle de qualidade e segurança
            </p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto sm:flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo Checklist</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="w-full transition-all duration-300 hover:shadow-lg bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </span>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar checklists..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value: ChecklistCategory | "all") =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Segurança">Segurança</SelectItem>
                    <SelectItem value="Qualidade">Qualidade</SelectItem>
                    <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="Documentação">Documentação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value: ChecklistStatus | "all") =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Rascunho">Rascunho</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Obra</Label>
                <Select
                  value={filters.obra}
                  onValueChange={(value) => setFilters({ ...filters, obra: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obras.map((obra) => (
                      <SelectItem key={obra.id} value={obra.id}>
                        {obra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={filters.responsible}
                  onValueChange={(value) => setFilters({ ...filters, responsible: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    {equipes.map((membro) => (
                      <SelectItem key={membro.id} value={membro.id || "unknown"}>
                        {membro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="transition-all duration-300 hover:shadow-lg bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{checklists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold">{activeChecklists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold">{completedChecklists.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsáveis</p>
                  <p className="text-2xl font-bold">{equipes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklists Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ativos ({activeChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Concluídos ({completedChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Todos ({allChecklists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeChecklists.map((checklist) => (
                <ChecklistCard
                  key={checklist.id}
                  checklist={checklist}
                  onSign={handleSignChecklist}
                  onDelete={handleDeleteChecklist}
                />
              ))}
            </div>

            {activeChecklists.length === 0 && (
              <EmptyState
                title="Nenhum checklist ativo"
                description="Todos os checklists foram concluídos ou não há checklists criados."
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {completedChecklists.map((checklist) => (
                <ChecklistCard
                  key={checklist.id}
                  checklist={checklist}
                  onSign={handleSignChecklist}
                  onDelete={handleDeleteChecklist}
                />
              ))}
            </div>

            {completedChecklists.length === 0 && (
              <EmptyState
                title="Nenhum checklist concluído"
                description="Complete seus primeiros checklists para vê-los aqui."
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {allChecklists.map((checklist) => (
                <ChecklistCard
                  key={checklist.id}
                  checklist={checklist}
                  onSign={handleSignChecklist}
                  onDelete={handleDeleteChecklist}
                />
              ))}
            </div>

            {allChecklists.length === 0 && (
              <EmptyState
                title="Nenhum checklist encontrado"
                description="Tente ajustar os filtros ou crie seu primeiro checklist."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Form Dialog */}
        <ChecklistForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateChecklist}
          isLoading={createChecklist.isPending}
        />
      </div>
    </div>
  );
};

// Componente de Card individual do Checklist
interface ChecklistCardProps {
  checklist: ChecklistType;
  onSign: (checklistId: string, signature: DigitalSignature) => void;
  onDelete: (id: string) => void;
}

function ChecklistCard({ checklist, onSign, onDelete }: ChecklistCardProps) {
  const { navigate } = useNavigationTransition();
  const getStatusIcon = (status: ChecklistStatus) => {
    switch (status) {
      case "Rascunho":
        return <FileCheck className="h-4 w-4" />;
      case "Em Andamento":
        return <Clock className="h-4 w-4" />;
      case "Concluído":
        return <CheckSquare className="h-4 w-4" />;
      case "Pendente":
        return <AlertCircle className="h-4 w-4" />;
      case "Cancelado":
        return <X className="h-4 w-4" />;
      default:
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ChecklistStatus) => {
    switch (status) {
      case "Rascunho":
        return "secondary";
      case "Em Andamento":
        return "default";
      case "Concluído":
        return "default";
      case "Pendente":
        return "destructive";
      case "Cancelado":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="w-full cursor-pointer transition-all duration-300 hover:shadow-lg bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusColor(checklist.status) as any} className="flex items-center gap-1">
            {getStatusIcon(checklist.status)}
            {checklist.status}
          </Badge>
          <Badge variant="outline">{checklist.category}</Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2">{checklist.title}</CardTitle>
        <CardDescription>
          <div className="space-y-1">
            <p className="font-medium">{checklist.obra.name}</p>
            <p className="text-sm">Responsável: {checklist.responsible.name}</p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{checklist.progress.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${checklist.progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {checklist.progress.completed} de {checklist.progress.total} itens concluídos
          </p>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Prazo: {format(new Date(checklist.dueDate), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>

        {/* Template Used */}
        {checklist.templateUsed && (
          <div className="text-xs text-muted-foreground">
            Template: {checklist.templateUsed.name}
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/checklist/${checklist.id}`)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Visualizar
          </Button>
          {checklist.status === "Em Andamento" && checklist.progress.percentage === 100 && !checklist.signature && (
            <DigitalSignatureComponent
              onSign={(signature) => onSign(checklist.id, signature)}
              signerName={checklist.responsible.name}
              signerEmail={checklist.responsible.email}
            />
          )}
          {checklist.status === "Concluído" && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Checklist</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o checklist "{checklist.title}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(checklist.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Signature Info */}
        {checklist.signature && (
          <div className="bg-muted/30 p-2 rounded text-xs">
            <p className="font-medium">Assinado por: {checklist.signature.signerName}</p>
            <p className="text-muted-foreground">
              {format(new Date(checklist.signature.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de Estado Vazio
interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

export default ChecklistPage;