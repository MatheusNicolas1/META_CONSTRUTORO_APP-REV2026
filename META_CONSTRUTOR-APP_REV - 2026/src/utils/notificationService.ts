import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  route?: string;
}

// Enviar notificação para um usuário específico
export async function sendNotification({
  userId,
  title,
  message,
  type = 'info',
  route
}: NotificationOptions): Promise<boolean> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      route
    } as any);

    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

// Enviar notificação para múltiplos usuários
export async function sendNotificationToMultiple(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType = 'info',
  route?: string
): Promise<void> {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type,
    route
  }));

  try {
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications as any);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

// Buscar usuários pertinentes a uma obra (Admins e Gerentes da org ativa)
export async function getRelevantUsersForObra(
  obraOwnerId: string,
  orgId: string,
  excludeUserId?: string
): Promise<string[]> {
  try {
    const { data: adminsAndManagers } = await (supabase as any)
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .in('role', ['Administrador', 'Gerente']);

    const userIds = new Set<string>();

    // Adicionar owner da obra
    userIds.add(obraOwnerId);

    // Adicionar admins e gerentes
    if (adminsAndManagers) {
      adminsAndManagers.forEach(u => userIds.add(u.user_id));
    }

    // Remover usuário atual se especificado
    if (excludeUserId) {
      userIds.delete(excludeUserId);
    }

    return Array.from(userIds);
  } catch (error) {
    console.error('Error fetching relevant users:', error);
    return [];
  }
}

// Notificações para Obras
export async function notifyObraChange(
  currentUserId: string,
  obraName: string,
  action: 'created' | 'updated' | 'deleted',
  obraId?: string,
  orgId?: string
): Promise<void> {
  const actionTexts = {
    created: { title: 'Nova obra criada', verb: 'foi criada' },
    updated: { title: 'Obra atualizada', verb: 'foi atualizada' },
    deleted: { title: 'Obra removida', verb: 'foi removida' }
  };

  const { title, verb } = actionTexts[action];
  const message = `A obra "${obraName}" ${verb}.`;
  const route = obraId ? `/app/obras/${obraId}` : '/app/obras';

  // Notificar o próprio usuário
  await sendNotification({
    userId: currentUserId,
    title,
    message,
    type: action === 'deleted' ? 'warning' : 'success',
    route
  });

  // Notificar admins e gerentes (se orgId fornecido)
  if (orgId) {
    const relevantUsers = await getRelevantUsersForObra(currentUserId, orgId, currentUserId);
    if (relevantUsers.length > 0) {
      await sendNotificationToMultiple(
        relevantUsers,
        title,
        message,
        'info',
        route
      );
    }
  }
}

// Notificações para RDOs
export async function notifyRDOChange(
  currentUserId: string,
  obraName: string,
  rdoDate: string,
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'deleted',
  rdoId?: string,
  orgId?: string
): Promise<void> {
  const actionTexts = {
    created: { title: 'Novo RDO criado', verb: 'foi criado' },
    updated: { title: 'RDO atualizado', verb: 'foi atualizado' },
    submitted: { title: 'RDO enviado para aprovação', verb: 'foi enviado para aprovação' },
    approved: { title: 'RDO aprovado', verb: 'foi aprovado' },
    rejected: { title: 'RDO rejeitado', verb: 'foi rejeitado' },
    deleted: { title: 'RDO removido', verb: 'foi removido' }
  };

  const { title, verb } = actionTexts[action];
  const formattedDate = new Date(rdoDate).toLocaleDateString('pt-BR');
  const message = `RDO de ${formattedDate} da obra "${obraName}" ${verb}.`;
  const route = rdoId ? `/app/rdo/${rdoId}/visualizar` : '/app/rdo';

  // Notificar o próprio usuário
  await sendNotification({
    userId: currentUserId,
    title,
    message,
    type: action === 'approved' ? 'success' : action === 'rejected' ? 'warning' : 'info',
    route
  });

  // Notificar admins e gerentes (especialmente para submissão) (se orgId fornecido)
  if (orgId) {
    const relevantUsers = await getRelevantUsersForObra(currentUserId, orgId, currentUserId);
    if (relevantUsers.length > 0) {
      await sendNotificationToMultiple(
        relevantUsers,
        title,
        message,
        action === 'submitted' ? 'warning' : 'info',
        route
      );
    }
  }
}

// Notificações para Atividades
export async function notifyActivityChange(
  currentUserId: string,
  activityTitle: string,
  action: 'created' | 'updated' | 'deleted',
  obraId?: string,
  orgId?: string
): Promise<void> {
  const actionTexts = {
    created: { title: 'Nova atividade criada', verb: 'foi criada' },
    updated: { title: 'Atividade atualizada', verb: 'foi atualizada' },
    deleted: { title: 'Atividade removida', verb: 'foi removida' }
  };

  const { title, verb } = actionTexts[action];
  const message = `A atividade "${activityTitle}" ${verb}.`;

  // Notificar o próprio usuário
  await sendNotification({
    userId: currentUserId,
    title,
    message,
    type: action === 'deleted' ? 'warning' : 'success',
    route: '/app/dashboard'
  });

  // Se houver obra associada e orgId, notificar usuários relevantes
  if (obraId && orgId) {
    const relevantUsers = await getRelevantUsersForObra(currentUserId, orgId, currentUserId);
    if (relevantUsers.length > 0) {
      await sendNotificationToMultiple(
        relevantUsers,
        title,
        message,
        'info',
        '/app/dashboard'
      );
    }
  }
}
