import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, Building, FileText, Calendar, Filter, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  route: string | null;
  is_read: boolean;
  created_at: string;
}

const Notificacoes = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  useEffect(() => {
    loadNotifications();

    // Realtime subscription for new notifications
    let channel: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();
    }).catch(() => undefined);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      // Falha transitoria ao buscar notificacoes nao deve poluir o console.
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationType = (type: string): 'obra' | 'rdo' | 'atividade' | 'other' => {
    if (type.includes('obra') || type === 'success') return 'obra';
    if (type.includes('rdo')) return 'rdo';
    if (type.includes('atividade') || type.includes('activity')) return 'atividade';
    return 'other';
  };

  const getIcon = (type: string) => {
    const notificationType = getNotificationType(type);
    switch (notificationType) {
      case 'obra':
        return <Building className="h-5 w-5 text-primary" />;
      case 'rdo':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'atividade':
        return <Calendar className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filterType !== 'all') {
      const notificationType = getNotificationType(notification.type);
      if (filterType === 'obras' && notificationType !== 'obra') return false;
      if (filterType === 'rdos' && notificationType !== 'rdo') return false;
      if (filterType === 'atividades' && notificationType !== 'atividade') return false;
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const notificationDate = parseISO(notification.created_at);
      const now = new Date();

      switch (filterPeriod) {
        case 'today':
          if (!isAfter(notificationDate, subDays(now, 1))) return false;
          break;
        case 'week':
          if (!isAfter(notificationDate, subDays(now, 7))) return false;
          break;
        case 'month':
          if (!isAfter(notificationDate, subDays(now, 30))) return false;
          break;
      }
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notificação(ões) não lida(s)`
              : 'Todas as notificações foram lidas'
            }
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="rdos">RDOs</SelectItem>
                  <SelectItem value="atividades">Atividades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Todo período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todas ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas ({filteredNotifications.filter(n => !n.is_read).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onNavigate={(route) => navigate(route)}
                getIcon={getIcon}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {filteredNotifications.filter(n => !n.is_read).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Todas as notificações foram lidas</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications
              .filter(n => !n.is_read)
              .map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onNavigate={(route) => navigate(route)}
                  getIcon={getIcon}
                />
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (route: string) => void;
  getIcon: (type: string) => JSX.Element;
}

const NotificationCard = ({ notification, onMarkAsRead, onNavigate, getIcon }: NotificationCardProps) => {
  const handleClick = () => {
    // Sempre marca como lida ao clicar
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    // Navega para a rota salva no banco, se existir
    if (notification.route) {
      onNavigate(notification.route);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        !notification.is_read && "border-l-4 border-l-primary bg-primary/5",
        notification.route && "hover:border-primary/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-medium",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.is_read && (
                <Badge variant="secondary">
                  Nova
                </Badge>
              )}
              {notification.route && (
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(parseISO(notification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Notificacoes;
