import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

// ============================================
// Tipos
// ============================================

export interface ObraContrato {
  id: string;
  org_id: string;
  obra_id: string;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  numero: string;
  descricao: string;
  valor_total: number;
  valor_aditivo: number;
  data_inicio: string;
  data_fim?: string | null;
  status: 'ativo' | 'suspenso' | 'encerrado' | 'cancelado';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContratoItem {
  id: string;
  org_id: string;
  contrato_id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface MedicaoContrato {
  id: string;
  org_id: string;
  contrato_id: string;
  numero: number;
  data_medicao: string;
  valor_medido: number;
  percentual_executado: number;
  status: 'rascunho' | 'pendente_campo' | 'aprovado_campo' | 'pendente_financeiro' | 'aprovado_financeiro' | 'rejeitado';
  aprovado_campo_por?: string | null;
  aprovado_campo_em?: string | null;
  aprovado_financeiro_por?: string | null;
  aprovado_financeiro_em?: string | null;
  observacoes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MedicaoItem {
  id: string;
  org_id: string;
  medicao_id: string;
  contrato_item_id?: string | null;
  descricao: string;
  quantidade_medida: number;
  valor_medido: number;
  percentual_item: number;
  observacoes?: string | null;
  created_at: string;
}

export interface BoletimMedicao {
  id: string;
  org_id: string;
  medicao_id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  anexo_path?: string | null;
  created_by: string;
  created_at: string;
}

export interface AditivoContrato {
  id: string;
  org_id: string;
  contrato_id: string;
  numero: number;
  tipo: 'valor' | 'prazo' | 'escopo' | 'reajuste' | 'outro';
  descricao: string;
  valor: number;
  data_inicio_nova?: string | null;
  data_fim_nova?: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por?: string | null;
  aprovado_em?: string | null;
  created_by: string;
  created_at: string;
}

// ============================================
// Hook principal
// ============================================

export function useContratosMedicoes(obraId?: string, fornecedorId?: string, statusFilter?: string) {
  const queryClient = useQueryClient();
  const { userId } = useAuthUserId();
  const { orgId } = useRequireOrg();

  // --- Contratos ---
  const contratosQuery = useQuery({
    queryKey: ['obra-contratos', orgId, obraId, fornecedorId, statusFilter],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from('obra_contratos').select('*').eq('org_id', orgId);
      if (obraId) q = q.eq('obra_id', obraId);
      if (fornecedorId) q = q.eq('fornecedor_id', fornecedorId);
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ObraContrato[];
    },
    enabled: !!orgId,
  });

  // --- Itens de um contrato específico ---
  const useContratoItens = (contratoId?: string) => useQuery({
    queryKey: ['contrato-itens', orgId, contratoId],
    queryFn: async () => {
      if (!orgId || !contratoId) return [];
      const { data, error } = await supabase
        .from('contrato_itens')
        .select('*')
        .eq('org_id', orgId)
        .eq('contrato_id', contratoId)
        .order('created_at');
      if (error) throw error;
      return (data || []) as ContratoItem[];
    },
    enabled: !!orgId && !!contratoId,
  });

  // --- Medições de um contrato ---
  const useMedicoes = (contratoId?: string) => useQuery({
    queryKey: ['medicoes-contrato', orgId, contratoId],
    queryFn: async () => {
      if (!orgId || !contratoId) return [];
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .select('*')
        .eq('org_id', orgId)
        .eq('contrato_id', contratoId)
        .order('numero', { ascending: false });
      if (error) throw error;
      return (data || []) as MedicaoContrato[];
    },
    enabled: !!orgId && !!contratoId,
  });

  // --- Itens de uma medição ---
  const useMedicaoItens = (medicaoId?: string) => useQuery({
    queryKey: ['medicao-itens', orgId, medicaoId],
    queryFn: async () => {
      if (!orgId || !medicaoId) return [];
      const { data, error } = await supabase
        .from('medicao_itens')
        .select('*')
        .eq('org_id', orgId)
        .eq('medicao_id', medicaoId)
        .order('created_at');
      if (error) throw error;
      return (data || []) as MedicaoItem[];
    },
    enabled: !!orgId && !!medicaoId,
  });

  // --- Boletins de uma medição ---
  const useBoletins = (medicaoId?: string) => useQuery({
    queryKey: ['boletins-medicao', orgId, medicaoId],
    queryFn: async () => {
      if (!orgId || !medicaoId) return [];
      const { data, error } = await supabase
        .from('boletins_medicao')
        .select('*')
        .eq('org_id', orgId)
        .eq('medicao_id', medicaoId)
        .order('data', { ascending: false });
      if (error) throw error;
      return (data || []) as BoletimMedicao[];
    },
    enabled: !!orgId && !!medicaoId,
  });

  // --- Aditivos de um contrato ---
  const useAditivos = (contratoId?: string) => useQuery({
    queryKey: ['aditivos-contrato', orgId, contratoId],
    queryFn: async () => {
      if (!orgId || !contratoId) return [];
      const { data, error } = await supabase
        .from('aditivos_contrato')
        .select('*')
        .eq('org_id', orgId)
        .eq('contrato_id', contratoId)
        .order('numero', { ascending: false });
      if (error) throw error;
      return (data || []) as AditivoContrato[];
    },
    enabled: !!orgId && !!contratoId,
  });

  // --- Mutações ---
  const createContrato = useMutation({
    mutationFn: async (input: {
      obra_id: string;
      fornecedor_id?: string;
      fornecedor_nome?: string;
      numero: string;
      descricao: string;
      valor_total: number;
      data_inicio: string;
      data_fim?: string;
      itens?: { descricao: string; unidade: string; quantidade: number; valor_unitario: number }[];
    }) => {
      // 1. Criar contrato
      const { data: contrato, error: errContrato } = await supabase
        .from('obra_contratos')
        .insert({
          org_id: orgId,
          obra_id: input.obra_id,
          fornecedor_id: input.fornecedor_id,
          fornecedor_nome: input.fornecedor_nome,
          numero: input.numero,
          descricao: input.descricao,
          valor_total: input.valor_total,
          data_inicio: input.data_inicio,
          data_fim: input.data_fim,
          created_by: userId,
        })
        .select()
        .single();
      if (errContrato) throw errContrato;

      // 2. Criar itens se fornecidos
      if (input.itens && input.itens.length > 0) {
        const { error: errItens } = await supabase.from('contrato_itens').insert(
          input.itens.map((item) => ({
            org_id: orgId,
            contrato_id: contrato.id,
            ...item,
          }))
        );
        if (errItens) throw errItens;
      }

      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra-contratos', orgId] });
      toast.success('Contrato criado com sucesso');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao criar contrato');
    },
  });

  const createMedicao = useMutation({
    mutationFn: async (input: {
      contrato_id: string;
      numero: number;
      data_medicao: string;
      valor_medido: number;
      percentual_executado: number;
      observacoes?: string;
      itens?: { contrato_item_id?: string; descricao: string; quantidade_medida: number; valor_medido: number; percentual_item?: number }[];
    }) => {
      // 1. Criar medição
      const { data: medicao, error: errMedicao } = await supabase
        .from('medicoes_contrato')
        .insert({
          org_id: orgId,
          contrato_id: input.contrato_id,
          numero: input.numero,
          data_medicao: input.data_medicao,
          valor_medido: input.valor_medido,
          percentual_executado: input.percentual_executado,
          observacoes: input.observacoes,
          created_by: userId,
        })
        .select()
        .single();
      if (errMedicao) throw errMedicao;

      // 2. Criar itens da medição
      if (input.itens && input.itens.length > 0) {
        const { error: errItens } = await supabase.from('medicao_itens').insert(
          input.itens.map((item) => ({
            org_id: orgId,
            medicao_id: medicao.id,
            ...item,
          }))
        );
        if (errItens) throw errItens;
      }

      return medicao;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId, variables.contrato_id] });
      toast.success('Medição criada com sucesso');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao criar medição');
    },
  });

  const aprovarMedicaoCampo = useMutation({
    mutationFn: async (medicaoId: string) => {
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .update({
          status: 'aprovado_campo',
          aprovado_campo_por: userId,
          aprovado_campo_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicaoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId] });
      toast.success('Medição aprovada (campo)');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao aprovar medição');
    },
  });

  const aprovarMedicaoFinanceiro = useMutation({
    mutationFn: async (medicaoId: string) => {
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .update({
          status: 'aprovado_financeiro',
          aprovado_financeiro_por: userId,
          aprovado_financeiro_em: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicaoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId] });
      toast.success('Medição aprovada (financeiro)');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao aprovar medição');
    },
  });

  const rejeitarMedicao = useMutation({
    mutationFn: async ({ medicaoId, motivo }: { medicaoId: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .update({
          status: 'rejeitado',
          observacoes: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicaoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId] });
      toast.success('Medição rejeitada');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao rejeitar medição');
    },
  });

  const submeterMedicaoCampo = useMutation({
    mutationFn: async (medicaoId: string) => {
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .update({
          status: 'pendente_campo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicaoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId] });
      toast.success('Medição submetida para aprovação de campo');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao submeter medição');
    },
  });

  const submeterMedicaoFinanceiro = useMutation({
    mutationFn: async (medicaoId: string) => {
      const { data, error } = await supabase
        .from('medicoes_contrato')
        .update({
          status: 'pendente_financeiro',
          updated_at: new Date().toISOString(),
        })
        .eq('id', medicaoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes-contrato', orgId] });
      toast.success('Medição submetida para aprovação financeira');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao submeter medição');
    },
  });

  const createAditivo = useMutation({
    mutationFn: async (input: {
      contrato_id: string;
      numero: number;
      tipo: AditivoContrato['tipo'];
      descricao: string;
      valor: number;
      data_inicio_nova?: string;
      data_fim_nova?: string;
    }) => {
      const { data, error } = await supabase
        .from('aditivos_contrato')
        .insert({
          org_id: orgId,
          contrato_id: input.contrato_id,
          numero: input.numero,
          tipo: input.tipo,
          descricao: input.descricao,
          valor: input.valor,
          data_inicio_nova: input.data_inicio_nova,
          data_fim_nova: input.data_fim_nova,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aditivos-contrato', orgId, variables.contrato_id] });
      queryClient.invalidateQueries({ queryKey: ['obra-contratos', orgId] });
      toast.success('Aditivo criado com sucesso');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao criar aditivo');
    },
  });

  const createBoletim = useMutation({
    mutationFn: async (input: {
      medicao_id: string;
      titulo: string;
      descricao?: string;
      data?: string;
      anexo_path?: string;
    }) => {
      const { data, error } = await supabase
        .from('boletins_medicao')
        .insert({
          org_id: orgId,
          medicao_id: input.medicao_id,
          titulo: input.titulo,
          descricao: input.descricao,
          data: input.data || new Date().toISOString().split('T')[0],
          anexo_path: input.anexo_path,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boletins-medicao', orgId, variables.medicao_id] });
      toast.success('Boletim adicionado');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Falha ao adicionar boletim');
    },
  });

  // Resumo financeiro
  const valorTotalContratos = (contratosQuery.data || []).reduce(
    (acc, c) => acc + Number(c.valor_total) + Number(c.valor_aditivo),
    0
  );

  return {
    isLoading: contratosQuery.isLoading,
    contratos: contratosQuery.data || [],
    valorTotalContratos,
    createContrato,
    createMedicao,
    createAditivo,
    createBoletim,
    aprovarMedicaoCampo,
    aprovarMedicaoFinanceiro,
    rejeitarMedicao,
    submeterMedicaoCampo,
    submeterMedicaoFinanceiro,
    // Sub-hooks (chame com ID para obter dados relacionados)
    useContratoItens,
    useMedicoes,
    useMedicaoItens,
    useBoletins,
    useAditivos,
  };
}
