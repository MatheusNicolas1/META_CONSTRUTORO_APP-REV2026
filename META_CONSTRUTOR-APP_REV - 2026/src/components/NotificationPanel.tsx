import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  route?: string;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-construction-green" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-construction-orange" />;
    case "error":
      return <X className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-construction-blue" />;
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return "Agora há pouco";
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h atrás`;
  } else {
    return `${Math.floor(diffInHours / 24)}d atrás`;
  }
};

const LEGACY_APP_ROUTE_PREFIXES = [
  '/dashboard',
  '/obras',
  '/rdo',
  '/atividades',
  '/checklist',
  '/equipes',
  '/colaboradores',
  '/equipamentos',
  '/mais',
  '/documentos',
  '/fornecedores',
  '/despesas',
  '/relatorios',
  '/integracoes',
  '/configuracoes',
  '/notificacoes',
  '/feedback',
  '/faq',
  '/seguranca',
];

const normalizeNotificationRoute = (route: string) => {
  if (route.startsWith('/app/') || route === '/home') {
    return route;
  }

  const shouldUseAppShell = LEGACY_APP_ROUTE_PREFIXES.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`)
  );

  return shouldUseAppShell ? `/app${route}` : route;
};

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();

    // Set up realtime subscription com tratamento de erros
    let channel: any = null;

    try {
      // Obter user ID primeiro para filtrar
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;

        channel = supabase
          .channel('notifications-changes')
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
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              // Silently handle channel error as it's expected in some dev environments
              // console.warn('Realtime subscription error - continuing without realtime updates');
            }
          });
      }).catch(() => undefined);
    } catch (error) {
      // Realtime indisponivel nao bloqueia o painel.
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing channel:', error);
        }
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
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      // Falha transitoria ao buscar notificacoes nao deve poluir o console.
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.route) {
      navigate(normalizeNotificationRoute(notification.route));
      setIsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar notificações');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-sidebar-foreground hover:text-sidebar-accent-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center z-10"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] max-h-screen overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Notificações</SheetTitle>
          <SheetDescription>
            Suas atualizações mais recentes
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate('/app/notificacoes');
              setIsOpen(false);
            }}
          >
            Ver histórico completo
          </Button>
        </div>

        <ScrollArea className="mt-6 flex-1 min-h-0 h-full pr-2">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${notification.is_read
                      ? "bg-muted/50"
                      : "bg-accent/50 border border-accent"
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-construction-blue rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(new Date(notification.created_at))}
                        </p>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-2" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
