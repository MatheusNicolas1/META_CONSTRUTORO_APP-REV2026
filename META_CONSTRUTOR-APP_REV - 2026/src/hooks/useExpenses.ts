import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Expense, CreateExpenseData, ApproveExpenseData } from '@/types/expense';
import { toast } from 'sonner';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useMemo } from 'react';

export const useExpenses = (obraId?: string) => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // Construct queryKey without undefined
  const expensesQueryKey = useMemo(
    () => obraId ? ['expenses', orgId, obraId] as const : ['expenses', orgId] as const,
    [orgId, obraId]
  );

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (obraId) {
        query = query.eq('obra_id', obraId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Expense[];
    },
    enabled: !orgLoading && !!orgId,
  });

  const createExpense = useMutation({
    mutationFn: async (expenseData: CreateExpenseData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          org_id: orgId,
          user_submitting_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar notificação para gestores e gerentes
      const { data: obra } = await supabase
        .from('obras')
        .select('nome')
        .eq('id', expenseData.obra_id)
        .eq('org_id', orgId)
        .single();

      // Buscar usuários com roles de Gerente ou Administrador na org ativa
      const { data: managers } = await (supabase as any)
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .in('role', ['Gerente', 'Administrador']);

      if (managers && managers.length > 0) {
        const notifications = managers.map((manager) => ({
          user_id: manager.user_id,
          title: 'Nova Despesa para Aprovação',
          message: `Uma nova despesa de R$ ${expenseData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi submetida na obra "${obra?.nome || 'N/A'}" e aguarda sua aprovação.`,
          type: 'expense_approval',
          route: '/app/despesas',
        }));

        await supabase.from('notifications').insert(notifications);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific query variant that was affected
      const createdObraId = variables.obra_id;
      if (createdObraId) {
        queryClient.invalidateQueries({ queryKey: ['expenses', orgId, createdObraId] });
      }
      // Also invalidate the general query
      queryClient.invalidateQueries({ queryKey: ['expenses', orgId] });
      toast.success('Despesa cadastrada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cadastrar despesa');
    },
  });

  const approveExpense = useMutation({
    mutationFn: async ({ id, approval_status, rejection_reason }: ApproveExpenseData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: any = { approval_status };

      if (approval_status === 'Rejected' && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      if (approval_status === 'Pending General Manager') {
        updateData.manager_approver_id = user.id;
        updateData.manager_approved_at = new Date().toISOString();
      } else if (approval_status === 'Approved') {
        updateData.general_manager_approver_id = user.id;
        updateData.general_manager_approved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select('*, obra_id')
        .single();

      if (error) throw error;

      // Buscar informações da despesa e obra
      const { data: expense } = await supabase
        .from('expenses')
        .select('*, obra_id')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      const { data: obra } = await supabase
        .from('obras')
        .select('nome, user_id')
        .eq('id', expense?.obra_id)
        .eq('org_id', orgId)
        .single();

      // Criar notificações baseadas no status
      if (approval_status === 'Pending General Manager') {
        // Notificar Gerente Geral/Administrador da org ativa
        const { data: admins } = await (supabase as any)
          .from('org_members')
          .select('user_id')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .eq('role', 'Administrador');

        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.user_id,
            title: 'Despesa Aguardando Aprovação Final',
            message: `Uma despesa de R$ ${expense?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na obra "${obra?.nome || 'N/A'}" foi aprovada pelo gestor e aguarda sua aprovação final.`,
            type: 'expense_approval',
            route: '/app/despesas',
          }));

          await supabase.from('notifications').insert(notifications);
        }
      } else if (approval_status === 'Approved' || approval_status === 'Rejected') {
        // Notificar o usuário que submeteu a despesa
        const statusText = approval_status === 'Approved' ? 'aprovada' : 'rejeitada';
        await supabase.from('notifications').insert({
          user_id: expense?.user_submitting_id,
          title: `Despesa ${statusText}`,
          message: `Sua despesa de R$ ${expense?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na obra "${obra?.nome || 'N/A'}" foi ${statusText}.`,
          type: 'expense_status',
          route: '/app/despesas',
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as unknown[];
          return key?.[0] === 'expenses' && key?.[1] === orgId;
        }
      });
      const statusMap = {
        'Pending General Manager': 'aprovada para o Gerente Geral',
        'Approved': 'aprovada',
        'Rejected': 'rejeitada',
      };
      toast.success(`Despesa ${statusMap[variables.approval_status]}!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao processar aprovação');
    },
  });

  const uploadInvoice = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    expenses,
    isLoading,
    error,
    createExpense,
    approveExpense,
    uploadInvoice,
  };
};
