import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useAuthUserId } from './useAuthUserId';

export interface ClientePortalRecord {
  id: string;
  org_id: string;
  obra_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  token_hash: string;
  token_expires_at?: string | null;
  status: 'ativo' | 'revogado' | 'expirado';
  allowed_sections: {
    fotos?: boolean;
    cronograma?: boolean;
    aprovacoes?: boolean;
    mensagens?: boolean;
  };
  last_accessed_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  obras?: {
    id: string;
    nome: string;
  } | null;
}

export interface CreateClientePortalData {
  obra_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  allowed_sections: ClientePortalRecord['allowed_sections'];
}

export interface AprovacaoClienteRecord {
  id: string;
  org_id: string;
  cliente_portal_id: string;
  obra_id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  opcoes: any;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  resposta?: any;
  requested_by: string;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAprovacaoData {
  cliente_portal_id: string;
  obra_id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  opcoes: any;
  status?: string;
}

export interface MensagemPortalRecord {
  id: string;
  cliente_portal_id: string;
  obra_id?: string;
  direction: 'cliente_para_interno' | 'interno_para_cliente';
  author_type: 'cliente' | 'usuario';
  author_user_id?: string | null;
  mensagem: string;
  created_at: string;
}

export function useClientesPortal() {
  const queryClient = useQueryClient();
  const { userId, isLoading: userLoading } = useAuthUserId();
  const { orgId } = useRequireOrg();

  // Lista de links do portal por org
  const clientesQuery = useQuery({
    queryKey: ['clientes-portal', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('clientes_portal')
        .select('id, nome, email, status, obra_id, token_hash, allowed_sections, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Cria novo cliente portal (gera token hash automaticamente)
  const createCliente = useMutation({
    mutationFn: async (data: CreateClientePortalData) => {
      const tokenHash = crypto.randomUUID();
      const { data: result, error } = await supabase
        .from('clientes_portal')
        .insert({
          org_id: orgId,
          obra_id: data.obra_id,
          nome: data.nome,
          email: data.email || null,
          telefone: data.telefone || null,
          token_hash: tokenHash,
          allowed_sections: data.allowed_sections || {},
          status: 'ativo',
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-portal', orgId] });
      toast.success('Link gerado com sucesso');
    },
    onError: (err) => {
      console.error('Erro ao criar cliente portal', err);
      toast.error('Falha ao gerar link do portal');
    },
  });

  // Revogar token
  const revokeCliente = useMutation({
    mutationFn: async (clienteId: string) => {
      const { error } = await supabase
        .from('clientes_portal')
        .update({ status: 'revogado' })
        .eq('id', clienteId)
        .eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-portal', orgId] });
      toast.success('Acesso revogado');
    },
    onError: (err) => {
      console.error('Erro ao revogar cliente portal', err);
      toast.error('Falha ao revogar acesso');
    },
  });

  // ---------------------------
  // Aprovações
  // ---------------------------
  const aprovacoesQuery = useQuery({
    queryKey: ['aprovacoes-cliente', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('aprovacoes_cliente')
        .select('id, titulo, descricao, tipo, status, cliente_portal_id, obra_id, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createAprovacao = useMutation({
    mutationFn: async (item: CreateAprovacaoData) => {
      const { data, error } = await supabase
        .from('aprovacoes_cliente')
        .insert({
          org_id: orgId,
          obra_id: item.obra_id,
          cliente_portal_id: item.cliente_portal_id,
          titulo: item.titulo,
          descricao: item.descricao,
          tipo: item.tipo,
          opcoes: item.opcoes || {},
          status: 'pendente',
          requested_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aprovacoes-cliente', orgId] });
      toast.success('Aprovação enviada ao cliente');
    },
    onError: (err) => {
      console.error('Erro ao criar aprovação cliente', err);
      toast.error('Falha ao criar aprovação');
    },
  });

  // ---------------------------
  // Mensagens
  // ---------------------------
  const mensagensQuery = useQuery({
    queryKey: ['mensagens-portal', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('mensagens_portal')
        .select('id, cliente_portal_id, direction, author_type, mensagem, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const sendMensagem = useMutation({
    mutationFn: async (msg: {
      cliente_portal_id: string;
      obra_id: string;
      mensagem: string;
    }) => {
      const { data, error } = await supabase
        .from('mensagens_portal')
        .insert({
          org_id: orgId,
          cliente_portal_id: msg.cliente_portal_id,
          obra_id: msg.obra_id,
          direction: 'interno_para_cliente',
          author_type: 'usuario',
          author_user_id: userId,
          mensagem: msg.mensagem,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-portal', orgId] });
      toast.success('Mensagem enviada');
    },
    onError: (err) => {
      console.error('Erro ao enviar mensagem', err);
      toast.error('Falha ao enviar mensagem');
    },
  });

  return {
    isLoading: userLoading,
    clientes: clientesQuery.data || [],
    isClientesLoading: clientesQuery.isLoading,
    createCliente,
    revokeCliente,

    aprovacoes: aprovacoesQuery.data || [],
    isAprovacoesLoading: aprovacoesQuery.isLoading,
    createAprovacao,

    mensagens: mensagensQuery.data || [],
    isMensagensLoading: mensagensQuery.isLoading || false,
    sendMensagem,
  };
}
