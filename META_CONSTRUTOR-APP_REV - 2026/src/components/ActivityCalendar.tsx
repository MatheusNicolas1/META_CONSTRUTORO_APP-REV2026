"use client";

import { Calendar } from "@/components/ui/calendar-rac";
import { getLocalTimeZone, today } from "@internationalized/date";
import { useState, useEffect } from "react";
import type { DateValue } from "react-aria-components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Plus, Clock, MapPin, Edit, Trash2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  description: string;
  obra: string;
  date: string;
  time: string;
  status: "agendada" | "em_andamento" | "concluida" | "cancelada";
  priority: "baixa" | "media" | "alta";
  notified?: boolean;
}

// Storage utilities
const ACTIVITIES_STORAGE_KEY = 'construction-activities';

const loadActivities = (): Record<string, Activity[]> => {
  try {
    const stored = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveActivities = (activities: Record<string, Activity[]>) => {
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch {
    console.error('Failed to save activities to localStorage');
  }
};

const getStatusBadge = (status: Activity["status"]) => {
  switch (status) {
    case "concluida":
      return <Badge variant="default" className="bg-construction-green text-white text-xs">Concluída</Badge>;
    case "em_andamento":
      return <Badge variant="default" className="bg-construction-blue text-white text-xs">Em Andamento</Badge>;
    case "cancelada":
      return <Badge variant="destructive" className="text-xs">Cancelada</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Agendada</Badge>;
  }
};

const getPriorityColor = (priority: Activity["priority"]) => {
  switch (priority) {
    case "alta":
      return "border-l-destructive";
    case "media":
      return "border-l-construction-orange";
    default:
      return "border-l-construction-green";
  }
};

export function ActivityCalendar() {
  const [date, setDate] = useState<DateValue | null>(today(getLocalTimeZone()));
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    obra: '',
    time: '09:00',
    priority: 'media' as Activity['priority']
  });
  const { toast } = useToast();

  const selectedDateString = date?.toString();
  const selectedActivities = selectedDateString ? activities[selectedDateString] || [] : [];

  // Load activities on mount
  useEffect(() => {
    setActivities(loadActivities());
  }, []);

  // Check for notifications daily
  useEffect(() => {
    const checkNotifications = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      const tomorrowActivities = activities[tomorrowString] || [];

      tomorrowActivities.forEach(activity => {
        if (!activity.notified && activity.status === 'agendada') {
          // Mark as notified
          const updatedActivities = { ...activities };
          updatedActivities[tomorrowString] = updatedActivities[tomorrowString].map(a =>
            a.id === activity.id ? { ...a, notified: true } : a
          );
          setActivities(updatedActivities);
          saveActivities(updatedActivities);

          // Show notification
          toast({
            title: "Lembrete de Atividade",
            description: `${activity.title} - ${activity.obra} está programada para amanhã às ${activity.time}`,
            duration: 10000,
          });

          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('Lembrete de Atividade', {
              body: `${activity.title} - ${activity.obra} está programada para amanhã às ${activity.time}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    // Request notification permission on first load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check immediately and then every hour
    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activities, toast]);

  const handleDateSelect = (newDate: DateValue | null) => {
    setDate(newDate);
    // Não abre o diálogo automaticamente - apenas seleciona a data
  };

  const handleSaveActivity = () => {
    if (!selectedDateString || !newActivity.title || !newActivity.obra) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const activity: Activity = {
      id: editingActivity?.id || Date.now().toString(),
      title: newActivity.title,
      description: newActivity.description,
      obra: newActivity.obra,
      date: selectedDateString,
      time: newActivity.time,
      status: 'agendada',
      priority: newActivity.priority,
      notified: false
    };

    const updatedActivities = { ...activities };
    if (!updatedActivities[selectedDateString]) {
      updatedActivities[selectedDateString] = [];
    }

    if (editingActivity) {
      updatedActivities[selectedDateString] = updatedActivities[selectedDateString].map(a =>
        a.id === editingActivity.id ? activity : a
      );
    } else {
      updatedActivities[selectedDateString].push(activity);
    }

    setActivities(updatedActivities);
    saveActivities(updatedActivities);

    toast({
      title: editingActivity ? "Atividade atualizada" : "Atividade criada",
      description: `${activity.title} foi ${editingActivity ? 'atualizada' : 'criada'} com sucesso`,
    });

    resetForm();
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      description: activity.description,
      obra: activity.obra,
      time: activity.time,
      priority: activity.priority
    });
    setIsDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (!selectedDateString) return;

    const updatedActivities = { ...activities };
    updatedActivities[selectedDateString] = updatedActivities[selectedDateString].filter(a => a.id !== activityId);

    if (updatedActivities[selectedDateString].length === 0) {
      delete updatedActivities[selectedDateString];
    }

    setActivities(updatedActivities);
    saveActivities(updatedActivities);

    toast({
      title: "Atividade excluída",
      description: "A atividade foi removida com sucesso",
    });
  };

  const resetForm = () => {
    setNewActivity({
      title: '',
      description: '',
      obra: '',
      time: '09:00',
      priority: 'media'
    });
    setEditingActivity(null);
    setIsDialogOpen(false);
  };

  // Check if a date has activities
  const hasActivities = (dateString: string) => {
    return activities[dateString] && activities[dateString].length > 0;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4 px-4 md:px-6">
        <CardTitle className="text-card-foreground flex items-center text-lg md:text-xl">
          <CalendarDays className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" />
          Calendário de Atividades
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Agende e acompanhe suas atividades de construção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          {/* Calendar - takes 2 columns on xl screens */}
          <div className="space-y-4 lg:col-span-1 xl:col-span-2">
            <Calendar
              className="rounded-lg border border-border p-2"
              value={date}
              onChange={handleDateSelect}
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="w-full gradient-construction border-0 hover:opacity-90 text-white font-medium"
                  size="sm"
                  onClick={() => {
                    if (!date) {
                      setDate(today(getLocalTimeZone()));
                    }
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Atividade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedDateString && `Atividade para ${new Date(selectedDateString).toLocaleDateString()}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Concretagem da laje"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva os detalhes da atividade..."
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
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
                        value={newActivity.time}
                        onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade</Label>
                      <select
                        id="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newActivity.priority}
                        onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value as Activity['priority'] })}
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

          {/* Activities for selected date - takes 3 columns on xl screens */}
          <div className="space-y-4 lg:col-span-1 xl:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-sm md:text-base font-medium text-card-foreground">
                {selectedDateString
                  ? `Atividades - ${new Date(selectedDateString).toLocaleDateString('pt-BR')}`
                  : "Selecione uma data"
                }
              </h4>
              {selectedActivities.length > 0 && (
                <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                  {selectedActivities.length} atividade{selectedActivities.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedActivities.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-1">
                  {selectedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-4 bg-card border rounded-lg border-l-4 ${getPriorityColor(activity.priority)} hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-card-foreground text-sm md:text-base truncate">
                              {activity.title}
                            </h4>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>{activity.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>

                        {activity.description && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground min-w-0 flex-1">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{activity.obra}</span>
                            {activity.notified && (
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