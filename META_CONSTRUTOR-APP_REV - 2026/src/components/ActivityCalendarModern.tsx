import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Plus, Clock, MapPin, Edit, Trash2, Bell } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useActivitiesSupabase, type Activity } from "@/hooks/useActivitiesSupabase";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthContext";

export function ActivityCalendarModern() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    titulo: '',
    descricao: '',
    obra: '',
    hora: '09:00',
    prioridade: 'media' as Activity['prioridade']
  });

  const { isAuthenticated } = useAuth();
  const {
    activities,
    isLoading,
    saveActivity,
    deleteActivity,
    getActivitiesForDate,
    hasActivitiesOnDate
  } = useActivitiesSupabase();

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  const selectedActivities = selectedDateString ? getActivitiesForDate(selectedDateString) : [];

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
  };

  const resetForm = () => {
    setNewActivity({
      titulo: '',
      descricao: '',
      obra: '',
      hora: '09:00',
      prioridade: 'media'
    });
    setEditingActivity(null);
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: Activity["status"]) => {
    switch (status) {
      case "concluida":
        return <Badge variant="default" className="bg-construction-green text-primary-foreground text-xs">Concluída</Badge>;
      case "em_andamento":
        return <Badge variant="default" className="bg-construction-blue text-primary-foreground text-xs">Em Andamento</Badge>;
      case "cancelada":
        return <Badge variant="destructive" className="text-xs">Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Agendada</Badge>;
    }
  };

  const getPriorityColor = (priority: Activity["prioridade"]) => {
    switch (priority) {
      case "alta":
        return "border-l-destructive";
      case "media":
        return "border-l-construction-orange";
      default:
        return "border-l-construction-green";
    }
  };

  const handleSaveActivity = async () => {
    if (!selectedDateString || !newActivity.titulo.trim() || !newActivity.obra.trim()) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    await saveActivity({
      id: editingActivity?.id,
      titulo: newActivity.titulo.trim(),
      descricao: newActivity.descricao.trim(),
      data: selectedDateString,
      hora: newActivity.hora,
      status: 'agendada',
      prioridade: newActivity.prioridade,
      notificado: false
    });
    resetForm();
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setNewActivity({
      titulo: activity.titulo,
      descricao: activity.descricao || '',
      obra: activity.obra || '',
      hora: activity.hora,
      prioridade: activity.prioridade
    });
    setIsDialogOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!selectedDateString) return;
    await deleteActivity(activityId);
  };

  // Check if date has activities
  const hasActivities = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return hasActivitiesOnDate(dateString);
  };

  // Custom day content with activity indicators
  const modifiedDayContent = (day: Date) => (
    <div className="relative w-full h-full flex items-center justify-center">
      <span>{day.getDate()}</span>
      {hasActivities(day) && (
        <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary shadow-sm" />
      )}
    </div>
  );

  return (
    <Card className="min-w-0 bg-card border-border">
      <CardHeader className="px-4 pb-4 2xl:px-6">
        <CardTitle className="text-card-foreground flex items-center text-lg md:text-xl">
          <CalendarDays className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" />
          Calendário de Atividades
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Agende e acompanhe suas atividades de construção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 2xl:p-6">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* Keep the calendar at a stable readable width; the activities panel absorbs tighter layouts. */}
          <div className="w-full min-w-0 space-y-4 lg:w-80 lg:shrink-0">
            <div className="rounded-lg border border-border p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="w-full"
                modifiers={{
                  hasActivities: (day) => hasActivities(day)
                }}
                modifiersStyles={{
                  hasActivities: {
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    position: 'relative'
                  }
                }}
                components={{
                  DayContent: ({ date: dayDate }) => modifiedDayContent(dayDate)
                }}
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full gradient-construction border-0 hover:opacity-90 text-white font-medium"
                  size="sm"
                  onClick={() => {
                    if (!date) {
                      setDate(new Date());
                    }
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Atividade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto bg-card border-border">
                <DialogHeader>
                  <DialogTitle>
                    {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedDateString && `Atividade para ${format(parseISO(selectedDateString), 'dd/MM/yyyy', { locale: ptBR })}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Concretagem da laje"
                      value={newActivity.titulo}
                      onChange={(e) => setNewActivity({ ...newActivity, titulo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva os detalhes da atividade..."
                      value={newActivity.descricao}
                      onChange={(e) => setNewActivity({ ...newActivity, descricao: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="obra">Obra *</Label>
                    <Input
                      id="obra"
                      placeholder="Ex: Obra A"
                      value={newActivity.obra}
                      onChange={(e) => setNewActivity({ ...newActivity, obra: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="time">Horário</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newActivity.hora}
                        onChange={(e) => setNewActivity({ ...newActivity, hora: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <select
                        id="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newActivity.prioridade}
                        onChange={(e) => setNewActivity({ ...newActivity, prioridade: e.target.value as Activity['prioridade'] })}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
                  <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveActivity} className="w-full sm:w-auto">
                    {editingActivity ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-sm md:text-base font-medium text-card-foreground">
                {selectedDateString
                  ? `Atividades - ${format(parseISO(selectedDateString), 'dd/MM/yyyy', { locale: ptBR })}`
                  : "Selecione uma data"
                }
              </h4>
              {selectedActivities.length > 0 && (
                <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                  {selectedActivities.length} atividade{selectedActivities.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground">
              {selectedActivities.length > 0 ? (
                <div className="grid min-w-0 gap-3 sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-1">
                  {selectedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 bg-card border rounded-lg border-l-4 ${getPriorityColor(activity.prioridade)} hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-card-foreground text-sm md:text-base truncate">
                              {activity.titulo}
                            </h4>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{activity.hora}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>

                        {activity.descricao && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {activity.descricao}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground min-w-0 flex-1">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{activity.obra || 'Sem obra'}</span>
                            {activity.notificado && (
                              <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                                <Bell className="h-2 w-2 mr-1" />
                                Notificado
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent touch-target"
                              onClick={() => handleEditActivity(activity)}
                              title="Editar atividade"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-target"
                              onClick={() => handleDeleteActivity(activity.id)}
                              title="Excluir atividade"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="space-y-2">
                    <p className="text-sm md:text-base font-medium">
                      {selectedDateString
                        ? "Nenhuma atividade agendada"
                        : "Selecione uma data"
                      }
                    </p>
                    <p className="text-xs md:text-sm opacity-75">
                      {selectedDateString
                        ? "Clique em 'Nova Atividade' para criar uma atividade para esta data."
                        : "Clique em uma data no calendário para ver as atividades."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
