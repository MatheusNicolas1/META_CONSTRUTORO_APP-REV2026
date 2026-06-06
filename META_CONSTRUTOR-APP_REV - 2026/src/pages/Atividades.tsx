import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Edit, Plus, Search, Trash2, X } from "lucide-react";
import { NovaAtividadeModal } from "@/components/NovaAtividadeModal";
import { Activity, ActivityFilters, useActivitiesSupabase } from "@/hooks/useActivitiesSupabase";
import { useObras } from "@/hooks/useObras";
import { useOrgResponsibles } from "@/hooks/useOrgResponsibles";

type EditingActivity = {
  id: string;
  titulo: string;
  status: Activity["status"];
  prioridade: Activity["prioridade"];
  data: string;
  responsavel: string | null;
  obra_id: string | null;
};

const statusLabels: Record<Activity["status"], string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

const prioridadeLabels: Record<Activity["prioridade"], string> = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
};

const Atividades = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ id: string; nome: string } | null>(null);
  const [editingActivity, setEditingActivity] = useState<EditingActivity | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({
    obraId: "all",
    status: "all",
    responsavel: "all",
    prioridade: "all",
    dateStart: "",
    dateEnd: "",
  });

  const { activitiesList, deleteActivity, saveActivity, isLoading } = useActivitiesSupabase(filters);
  const { obras } = useObras();
  const { responsibles } = useOrgResponsibles();

  const obraOptions = obras || [];

  const filteredAtividades = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activitiesList;

    return activitiesList.filter((atividade) => {
      const obraNome = atividade.obras?.nome || atividade.obra || "";
      const responsavelNome = responsibles.find((item) => item.id === atividade.responsavel)?.nome || "";
      return [
        atividade.titulo,
        atividade.categoria,
        statusLabels[atividade.status],
        prioridadeLabels[atividade.prioridade],
        obraNome,
        responsavelNome,
      ].some((value) => (value || "").toLowerCase().includes(term));
    });
  }, [activitiesList, responsibles, searchTerm]);

  const updateFilter = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      obraId: "all",
      status: "all",
      responsavel: "all",
      prioridade: "all",
      dateStart: "",
      dateEnd: "",
    });
  };

  const handleConfirmDelete = () => {
    if (!activityToDelete) return;
    deleteActivity(activityToDelete.id);
    setActivityToDelete(null);
  };

  const startEdit = (activity: Activity) => {
    setEditingActivity({
      id: activity.id,
      titulo: activity.titulo,
      status: activity.status,
      prioridade: activity.prioridade,
      data: activity.data,
      responsavel: activity.responsavel || null,
      obra_id: activity.obra_id || null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingActivity) return;

    const updated = await saveActivity({
      id: editingActivity.id,
      titulo: editingActivity.titulo,
      status: editingActivity.status,
      prioridade: editingActivity.prioridade,
      data: editingActivity.data,
      responsavel: editingActivity.responsavel || undefined,
      obra_id: editingActivity.obra_id || undefined,
    });

    if (updated) setEditingActivity(null);
  };

  const getStatusColor = (status: Activity["status"]) => {
    switch (status) {
      case "agendada":
        return "bg-construction-blue text-white";
      case "em_andamento":
        return "bg-construction-orange text-white";
      case "concluida":
        return "bg-construction-green text-white";
      case "cancelada":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (prioridade: Activity["prioridade"]) => {
    switch (prioridade) {
      case "alta":
        return "bg-red-600 text-white";
      case "media":
        return "bg-yellow-500 text-white";
      case "baixa":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="responsive-spacing">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">Gestao de Atividades</h1>
            <p className="text-muted-foreground text-sm md:text-base">Gerencie atividades padrao e vinculacoes com obras</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto sm:flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Atividade</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>

          <NovaAtividadeModal
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
          />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Filtros</CardTitle>
            <CardDescription>Encontre atividades por obra, responsavel, periodo, prioridade e status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="activity-search">Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="activity-search"
                    placeholder="Buscar atividades, obra ou status..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Obra</Label>
                <Select value={filters.obraId || "all"} onValueChange={(value) => updateFilter("obraId", value)}>
                  <SelectTrigger aria-label="Filtrar por obra">
                    <SelectValue placeholder="Todas as obras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obraOptions.map((obra: any) => (
                      <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => updateFilter("status", value as ActivityFilters["status"])}
                >
                  <SelectTrigger aria-label="Filtrar por status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsavel</Label>
                <Select value={filters.responsavel || "all"} onValueChange={(value) => updateFilter("responsavel", value)}>
                  <SelectTrigger aria-label="Filtrar por responsavel">
                    <SelectValue placeholder="Todos os responsaveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsaveis</SelectItem>
                    {responsibles.map((responsavel) => (
                      <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={filters.prioridade || "all"}
                  onValueChange={(value) => updateFilter("prioridade", value as ActivityFilters["prioridade"])}
                >
                  <SelectTrigger aria-label="Filtrar por prioridade">
                    <SelectValue placeholder="Todas as prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    {Object.entries(prioridadeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-date-start">Inicio</Label>
                <Input
                  id="activity-date-start"
                  type="date"
                  value={filters.dateStart || ""}
                  onChange={(event) => updateFilter("dateStart", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-date-end">Fim</Label>
                <Input
                  id="activity-date-end"
                  type="date"
                  value={filters.dateEnd || ""}
                  onChange={(event) => updateFilter("dateEnd", event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={clearFilters} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Lista de Atividades</CardTitle>
            <CardDescription>
              Atividades cadastradas a partir dos dados reais da organizacao
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando atividades...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-muted-foreground">Obra</TableHead>
                      <TableHead className="text-muted-foreground">Categoria</TableHead>
                      <TableHead className="text-muted-foreground">Data</TableHead>
                      <TableHead className="text-muted-foreground">Responsavel</TableHead>
                      <TableHead className="text-muted-foreground">Prioridade</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtividades.map((atividade) => {
                      const responsavel = responsibles.find((item) => item.id === atividade.responsavel);
                      return (
                        <TableRow key={atividade.id}>
                          <TableCell className="font-medium text-card-foreground">
                            {atividade.titulo}
                          </TableCell>
                          <TableCell className="text-card-foreground">
                            {atividade.obras?.nome || atividade.obra || "-"}
                          </TableCell>
                          <TableCell className="text-card-foreground">
                            {atividade.categoria || "Atividade"}
                          </TableCell>
                          <TableCell className="text-card-foreground">
                            {atividade.data || "-"}
                          </TableCell>
                          <TableCell className="text-card-foreground">
                            {responsavel?.nome || "Nao informado"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(atividade.prioridade)}>
                              {prioridadeLabels[atividade.prioridade]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(atividade.status)}>
                              {statusLabels[atividade.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                title={`Editar atividade ${atividade.titulo}`}
                                aria-label={`Editar atividade ${atividade.titulo}`}
                                onClick={() => startEdit(atividade)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title={`Excluir atividade ${atividade.titulo}`}
                                aria-label={`Excluir atividade ${atividade.titulo}`}
                                onClick={() => setActivityToDelete({ id: atividade.id, nome: atividade.titulo })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {!isLoading && filteredAtividades.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-card-foreground">Nenhuma atividade encontrada</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? "Tente ajustar os termos de busca" : "Comece cadastrando sua primeira atividade"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-activity-title">Nome</Label>
                <Input
                  id="edit-activity-title"
                  value={editingActivity.titulo}
                  onChange={(event) => setEditingActivity((current) => current ? { ...current, titulo: event.target.value } : current)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingActivity.status}
                    onValueChange={(value) => setEditingActivity((current) => current ? { ...current, status: value as Activity["status"] } : current)}
                  >
                    <SelectTrigger aria-label="Editar status da atividade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={editingActivity.prioridade}
                    onValueChange={(value) => setEditingActivity((current) => current ? { ...current, prioridade: value as Activity["prioridade"] } : current)}
                  >
                    <SelectTrigger aria-label="Editar prioridade da atividade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(prioridadeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-activity-date">Data</Label>
                  <Input
                    id="edit-activity-date"
                    type="date"
                    value={editingActivity.data}
                    onChange={(event) => setEditingActivity((current) => current ? { ...current, data: event.target.value } : current)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsavel</Label>
                  <Select
                    value={editingActivity.responsavel || "none"}
                    onValueChange={(value) => setEditingActivity((current) => current ? { ...current, responsavel: value === "none" ? null : value } : current)}
                  >
                    <SelectTrigger aria-label="Editar responsavel da atividade">
                      <SelectValue placeholder="Nao informado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nao informado</SelectItem>
                      {responsibles.map((responsavel) => (
                        <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingActivity(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!activityToDelete} onOpenChange={(open) => !open && setActivityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao move a atividade {activityToDelete?.nome || "selecionada"} para a Lixeira.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Mover para Lixeira</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Atividades;
