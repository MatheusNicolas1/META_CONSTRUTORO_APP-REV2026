import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

// --- Types ---

export interface PerfilSegurancaRecord {
  id: string;
  org_id: string;
  segmento: string;
  principais_riscos: string[];
  nrs_aplicaveis: string[];
  meta_dds_mensal: number;
  created_at?: string;
  updated_at?: string;
}

export interface DDSRegistroRecord {
  id: string;
  org_id: string;
  obra_id?: string | null;
  tema: string;
  conteudo: string;
  data: string;
  horario?: string | null;
  duracao_minutos?: number | null;
  status: 'realizado' | 'pendente' | 'cancelado';
  observacoes?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface DDSParticipanteRecord {
  id: string;
  org_id: string;
  dds_id: string;
  user_id?: string | null;
  nome: string;
  cargo?: string | null;
  presente: boolean;
}

export interface SugestaoTemaRecord {
  id: string;
  org_id: string;
  tema: string;
  segmento?: string | null;
  nrs_relacionadas: string[];
  frequencia: number;
  active: boolean;
}

export interface DDSFiltros {
  obraId?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
}

// --- Hook ---

export function useDDS(filtros?: DDSFiltros) {
  const queryClient = useQueryClient();
  const { userId } = useAuthUserId();
  const { orgId } = useRequireOrg();

  // Perfil de segurança (um por org)
  const perfilQuery = useQuery({
    queryKey: ['dds', 'perfil', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('perfil_empresa_seguranca')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as PerfilSegurancaRecord | null;
    },
    enabled: !!orgId,
  });

  // Registros de DDS com filtros
  const registrosQuery = useQuery({
    queryKey: ['dds', 'registros', orgId, filtros],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('dds_registros')
        .select('*')
        .eq('org_id', orgId);

      if (filtros?.obraId) q = q.eq('obra_id', filtros.obraId);
      if (filtros?.status) q = q.eq('status', filtros.status);
      if (filtros?.dataInicio) q = q.gte('data', filtros.dataInicio);
      if (filtros?.dataFim) q = q.lte('data', filtros.dataFim);

      const { data, error } = await q.order('data', { ascending: false });
      if (error) throw error;
      return (data || []) as DDSRegistroRecord[];
    },
    enabled: !!orgId,
  });

  // Sugestões de temas
  const sugestoesQuery = useQuery({
    queryKey: ['dds', 'sugestoes', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('sugestoes_temas')
        .select('*')
        .eq('org_id', orgId)
        .eq('active', true)
        .order('frequencia', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as SugestaoTemaRecord[];
    },
    enabled: !!orgId,
  });

  // Participantes de um DDS específico
  const useParticipantes = (ddsId?: string) => useQuery({
    queryKey: ['dds', 'participantes', orgId, ddsId],
    queryFn: async () => {
      if (!orgId || !ddsId) return [];
      const { data, error } = await supabase
        .from('dds_participantes')
        .select('*')
        .eq('org_id', orgId)
        .eq('dds_id', ddsId)
        .order('nome');
      if (error) throw error;
      return (data || []) as DDSParticipanteRecord[];
    },
    enabled: !!orgId && !!ddsId,
  });

  // Criar/atualizar perfil de segurança
  const salvarPerfil = useMutation({
    mutationFn: async (perfil: {
      segmento: string;
      principais_riscos: string[];
      nrs_aplicaveis: string[];
      meta_dds_mensal: number;
    }) => {
      if (perfilQuery.data?.id) {
        const { data, error } = await supabase
          .from('perfil_empresa_seguranca')
          .update(perfil)
          .eq('id', perfilQuery.data.id)
          .eq('org_id', orgId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('perfil_empresa_seguranca')
          .insert({ ...perfil, org_id: orgId, created_by: userId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dds', 'perfil', orgId] });
      toast.success('Perfil de segurança salvo');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Falha ao salvar perfil');
    },
  });

  // Criar registro de DDS
  const criarDDS = useMutation({
    mutationFn: async (dds: {
      obra_id?: string;
      tema: string;
      conteudo: string;
      data: string;
      horario?: string;
      duracao_minutos?: number;
      status?: string;
      observacoes?: string;
      participantes?: { nome: string; cargo?: string; presente?: boolean }[];
    }) => {
      const { participantes, ...registroData } = dds;
      const { data: registro, error } = await supabase
        .from('dds_registros')
        .insert({
          ...registroData,
          org_id: orgId,
          created_by: userId,
          status: registroData.status || 'realizado',
        })
        .select()
        .single();
      if (error) throw error;

      // Inserir participantes se houver
      if (participantes && participantes.length > 0) {
        const { error: partError } = await supabase
          .from('dds_participantes')
          .insert(
            participantes.map((p) => ({
              org_id: orgId,
              dds_id: registro.id,
              nome: p.nome,
              cargo: p.cargo || null,
              presente: p.presente !== false,
            }))
          );
        if (partError) throw partError;
      }

      // Incrementar frequência da sugestão de tema usada via RPC
      try {
        await supabase.rpc('incrementar_frequencia_tema', {
          p_org_id: orgId,
          p_tema: dds.tema,
        });
      } catch {
        // non-critical; swallow if RPC doesn't exist yet
      }

      return registro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dds', 'registros', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dds', 'sugestoes', orgId] });
      toast.success('DDS registrado com sucesso');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Falha ao registrar DDS');
    },
  });

  // Contagem de DDS no mês atual (para indicadores)
  const indicadoresMensaisQuery = useQuery({
    queryKey: ['dds', 'indicadores', orgId],
    queryFn: async () => {
      if (!orgId) return { total: 0, realizados: 0, pendentes: 0, cancelados: 0, meta: 0 };
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('dds_registros')
        .select('status')
        .eq('org_id', orgId)
        .gte('data', inicioMes)
        .lte('data', fimMes);

      if (error) throw error;

      const registros = data || [];
      const meta = perfilQuery.data?.meta_dds_mensal || 4;

      return {
        total: registros.length,
        realizados: registros.filter((r) => r.status === 'realizado').length,
        pendentes: registros.filter((r) => r.status === 'pendente').length,
        cancelados: registros.filter((r) => r.status === 'cancelado').length,
        meta,
        percentual: Math.round((registros.filter((r) => r.status === 'realizado').length / meta) * 100),
      };
    },
    enabled: !!orgId,
  });

  return {
    isLoading: perfilQuery.isLoading || registrosQuery.isLoading,
    perfil: perfilQuery.data,
    registros: registrosQuery.data || [],
    sugestoes: sugestoesQuery.data || [],
    indicadores: indicadoresMensaisQuery.data || { total: 0, realizados: 0, pendentes: 0, cancelados: 0, meta: 4, percentual: 0 },
    salvarPerfil,
    criarDDS,
    useParticipantes,
  };
}
