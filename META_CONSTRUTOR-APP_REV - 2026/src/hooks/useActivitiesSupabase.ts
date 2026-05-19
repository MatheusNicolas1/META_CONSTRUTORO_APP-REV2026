import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { notifyActivityChange } from '@/utils/notificationService';
import { useRequireOrg } from '@/hooks/requireOrg';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

export interface Activity {
  id: string;
  user_id: string;
  org_id: string;
  obra_id?: string;
  titulo: string;
  descricao?: string;
  data: string;
  hora: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta';
  categoria?: string;
  unidade_medida?: string;
  quantidade_prevista?: number;
  responsavel?: string;
  notificado?: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for compatibility
  title?: string;
  description?: string;
  obra?: string;
  date?: string;
  time?: string;
  priority?: 'baixa' | 'media' | 'alta';
}

// Global Singleton Registry (stored in globalThis to survive HMR/React Refresh)
const REGISTRY_KEY = '__meta_activities_realtime_registry__';
type RegistryEntry = {
  channel: RealtimeChannel;
  refCount: number;
  cleanupTimeout: number | null; // window.setTimeout returns number
  status: 'CONNECTING' | 'SUBSCRIBED' | 'ERROR';
};

const ENABLE_ACTIVITY_REALTIME = import.meta.env.VITE_ENABLE_ACTIVITY_REALTIME === 'true';

const getRegistry = (): Map<string, RegistryEntry> => {
  if (!(globalThis as any)[REGISTRY_KEY]) {
    (globalThis as any)[REGISTRY_KEY] = new Map<string, RegistryEntry>();
  }
  return (globalThis as any)[REGISTRY_KEY];
};

export function useActivitiesSupabase(filters?: { obraId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const queryClient = useQueryClient();

  // Refs for component stability
  const isMountedRef = useRef(true);
  const loadActivitiesRef = useRef<(() => Promise<void>) | null>(null);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    setActivities([]); // Clear activities on org switch to prevent bleeding
    return () => {
      isMountedRef.current = false;
    };
  }, [orgId, isAuthenticated]);

  // Carregar atividades do Supabase
  const loadActivities = useCallback(async () => {
    // Prevent load if auth not ready or not mounted
    if (!isAuthenticated || !user?.id) {
      if (isMountedRef.current) {
        setActivities([]);
        setIsLoading(false);
      }
      return;
    }

    if (orgLoading || !orgId) {
      if (isMountedRef.current) {
        setActivities([]);
        setIsLoading(orgLoading);
      }
      return;
    }

    // Checking mount ref before state updates
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('atividades')
        .select('*')
        .eq('org_id', orgId)
        .eq('user_id', user.id);

      if (filters?.obraId) {
        query = query.eq('obra_id', filters.obraId);
      }

      const { data, error } = await query
        .order('data', { ascending: true })
        .order('hora', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (isMountedRef.current) {
        // Cast the data to Activity type
        const typedData = (data || []).map(item => ({
          ...item,
          status: item.status as Activity['status'],
          prioridade: item.prioridade as Activity['prioridade'],
        })) as Activity[];

        setActivities(typedData);
      }
    } catch (error: any) {
      // Suppress AbortError — it's normal during React re-renders / StrictMode
      const isAbortError =
        error?.name === 'AbortError' ||
        error?.message?.includes('aborted') ||
        error?.message?.includes('signal');

      if (!isAbortError) {
        console.error('Error loading activities:', error);
        if (isMountedRef.current) {
          toast({
            title: 'Erro ao carregar atividades',
            description: 'Não foi possível carregar as atividades do servidor.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user?.id, orgId, orgLoading, toast, filters?.obraId]);

  // Keep loadActivities ref updated
  useEffect(() => {
    loadActivitiesRef.current = loadActivities;
  }, [loadActivities]);

  // Debounced reload helper
  const reloadTimeoutRef = useRef<number | null>(null);
  const debouncedReload = useCallback(() => {
    if (reloadTimeoutRef.current) {
      window.clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = window.setTimeout(() => {
      if (loadActivitiesRef.current && isMountedRef.current) {
        loadActivitiesRef.current();
      }
      reloadTimeoutRef.current = null;
    }, 1000);
  }, []);

  // Initial load effect (respecting orgLoading)
  useEffect(() => {
    if (!orgLoading && isAuthenticated && user?.id) {
      loadActivities();
    }
  }, [orgLoading, isAuthenticated, user?.id, loadActivities, filters?.obraId]);

  // --------------------------------------------------------------------------
  // ROBUST REALTIME SUBSCRIPTION (Global Singleton + Grace Period)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1. Validate preconditions
    if (!ENABLE_ACTIVITY_REALTIME || !isAuthenticated || !user?.id || !orgId || orgLoading) {
      return;
    }

    const registry = getRegistry();
    // Unique key dependent ONLY on user and org
    const channelKey = `atividades-realtime-${orgId}-${user.id}`;

    let didSubscribe = false;

    const setup = () => {
      let entry = registry.get(channelKey);

      if (!entry) {
        // Setup new channel
        const channel = supabase.channel(channelKey)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'atividades',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              // Broadcast event to ALL hooks
              window.dispatchEvent(new CustomEvent(`activities-changed-${channelKey}`));
            }
          )
          .subscribe((status) => {
            const currentEntry = registry.get(channelKey);
            if (!currentEntry) return;

            if (status === 'SUBSCRIBED') {
              currentEntry.status = 'SUBSCRIBED';
            } else if (status === 'CHANNEL_ERROR') {
              currentEntry.status = 'ERROR';
              // Optional: Implement backoff retry here if needed
            } else if (status === 'TIMED_OUT') {
              currentEntry.status = 'ERROR';
            }
          });

        entry = {
          channel,
          refCount: 0,
          cleanupTimeout: null,
          status: 'CONNECTING'
        };
        registry.set(channelKey, entry);
      }

      // CANCEL any pending cleanup (The Grace Period logic)
      if (entry.cleanupTimeout) {
        window.clearTimeout(entry.cleanupTimeout);
        entry.cleanupTimeout = null;
      }

      // Increment refCount
      entry.refCount++;
      didSubscribe = true;
    };

    setup();

    // Setup local event listener
    const handleRemoteChange = () => debouncedReload();
    window.addEventListener(`activities-changed-${channelKey}`, handleRemoteChange);

    // Cleanup
    return () => {
      window.removeEventListener(`activities-changed-${channelKey}`, handleRemoteChange);

      if (didSubscribe) {
        const entry = registry.get(channelKey);
        if (entry) {
          entry.refCount--;

          if (entry.refCount <= 0) {
            // GRACE PERIOD: Don't remove immediately! Wait 1000ms.
            // If another component mounts (or StrictMode remounts) within this time, 
            // the cleanup will be canceled.

            entry.cleanupTimeout = window.setTimeout(() => {
              // Double check refCount is STILL 0
              if (entry.refCount <= 0) {
                supabase.removeChannel(entry.channel);
                registry.delete(channelKey);
              }
            }, 1000);
          }
        }
      }
    };
  }, [isAuthenticated, user?.id, orgId, orgLoading, debouncedReload]);

  // Salvar ou atualizar atividade
  const saveActivity = useCallback(async (activity: Partial<Activity>) => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar atividades.',
        variant: 'destructive',
      });
      return null;
    }

    if (orgLoading || !orgId) {
      toast({
        title: 'Organizacao nao carregada',
        description: 'Aguarde a organizacao carregar antes de salvar a atividade.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Normalizar dados para o formato do banco
      const activityData = {
        user_id: user.id,
        org_id: orgId,
        obra_id: activity.obra_id || null,
        titulo: activity.titulo || activity.title || '',
        descricao: activity.descricao || activity.description || '',
        data: activity.data || activity.date || new Date().toISOString().split('T')[0],
        hora: activity.hora || activity.time || '09:00',
        status: activity.status || 'agendada',
        prioridade: activity.prioridade || activity.priority || 'media',
        categoria: activity.categoria || null,
        unidade_medida: activity.unidade_medida || null,
        quantidade_prevista: activity.quantidade_prevista || null,
        responsavel: activity.responsavel || null,
        notificado: activity.notificado || false,
      };

      let result;
      const isUpdate = activity.id && !activity.id.toString().match(/^\d+$/);

      if (isUpdate) {
        const { data, error } = await supabase
          .from('atividades')
          .update(activityData)
          .eq('id', activity.id)
          .eq('org_id', orgId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        await notifyActivityChange(user.id, activityData.titulo, 'updated', activityData.obra_id || undefined, orgId);
        toast({ title: 'Atividade atualizada', description: `${activityData.titulo} foi atualizada com sucesso.` });
      } else {
        const { data, error } = await supabase
          .from('atividades')
          .insert(activityData)
          .select()
          .single();

        if (error) throw error;
        result = data;

        await notifyActivityChange(user.id, activityData.titulo, 'created', activityData.obra_id || undefined, orgId);
        toast({ title: 'Atividade criada', description: `${activityData.titulo} foi criada com sucesso.` });
      }

      await loadActivities();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      return result;
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: 'Erro ao salvar atividade',
        description: 'Não foi possível salvar a atividade.',
        variant: 'destructive',
      });
      return null;
    }
  }, [isAuthenticated, user?.id, orgLoading, toast, loadActivities, orgId, queryClient]);

  // Deletar atividade
  const deleteActivity = useCallback(async (activityId: string) => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const activityToDelete = activities.find(a => a.id === activityId);
      const { error } = await supabase
        .from('atividades')
        .delete()
        .eq('id', activityId)
        .eq('org_id', orgId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (activityToDelete) {
        await notifyActivityChange(user.id, activityToDelete.titulo, 'deleted', activityToDelete.obra_id, orgId);
      }

      toast({ title: 'Atividade excluída', description: 'A atividade foi removida com sucesso.' });
      await loadActivities();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erro ao excluir atividade',
        description: 'Não foi possível excluir a atividade.',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, user?.id, activities, toast, loadActivities, orgId, queryClient]);

  // Helpers
  const getActivitiesForDate = useCallback((date: string): Activity[] => {
    return activities.filter(a => a.data === date);
  }, [activities]);

  const hasActivitiesOnDate = useCallback((date: string): boolean => {
    return activities.some(a => a.data === date);
  }, [activities]);

  const activitiesByDate = useCallback((): Record<string, Activity[]> => {
    return activities.reduce((acc, activity) => {
      const date = activity.data;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, Activity[]>);
  }, [activities]);

  return {
    activities: activitiesByDate(),
    activitiesList: activities,
    isLoading,
    saveActivity,
    deleteActivity,
    getActivitiesForDate,
    hasActivitiesOnDate,
    refetch: loadActivities,
  };
}
