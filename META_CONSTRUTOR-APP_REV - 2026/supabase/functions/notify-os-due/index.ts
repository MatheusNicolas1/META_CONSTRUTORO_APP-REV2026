// notify-os-due/index.ts
// Notifies about OS (Ordem de Servico) that are due within 3 days or overdue

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { org_id } = body as { org_id: string };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Buscar OS não finalizadas com vencimento próximo ou vencidas
    const { data: osList, error: osErr } = await adm
      .from("ordens_servico")
      .select("id, titulo, descricao, data_vencimento, status, responsavel_nome, obra_id")
      .eq("org_id", org_id)
      .not("status", "in", "('aprovado','rejeitado','cancelado','concluido')")
      .not("data_vencimento", "is", null)
      .lte("data_vencimento", threeDaysFromNow.toISOString());

    if (osErr) {
      // If table doesn't exist, return gracefully
      if (osErr.code === "42P01") {
        return jsonResponse({ notifications_sent: 0, message: "Tabela ordens_servico não encontrada. Crie a migration primeiro." });
      }
      throw osErr;
    }

    if (!osList || osList.length === 0) {
      return jsonResponse({ notifications_sent: 0, notifications: [] });
    }

    // Check if notifications table exists
    let notificationsTableExists = true;
    try {
      const { error: testErr } = await adm.from("notifications").select("id").limit(1);
      if (testErr && testErr.code === "42P01") {
        notificationsTableExists = false;
      }
    } catch {
      notificationsTableExists = false;
    }

    const notifications: Array<unknown> = [];
    const notificationsData: Array<Record<string, unknown>> = [];

    for (const os of osList) {
      const dueDate = os.data_vencimento ? new Date(os.data_vencimento) : null;
      const isOverdue = dueDate && dueDate < now;
      const daysUntilDue = dueDate
        ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let title: string;
      let message: string;

      if (isOverdue) {
        title = "OS Vencida";
        message = `A OS "${os.titulo}" está vencida desde ${os.data_vencimento?.slice(0, 10)}.`;
      } else {
        title = "OS Próxima do Vencimento";
        message = `A OS "${os.titulo}" vence em ${daysUntilDue} dia(s) (${os.data_vencimento?.slice(0, 10)}).`;
      }

      const notification = {
        os_id: os.id,
        titulo: os.titulo,
        is_overdue: !!isOverdue,
        days_until_due: isOverdue ? 0 : daysUntilDue,
        data_vencimento: os.data_vencimento,
        message,
      };

      notifications.push(notification);

      if (notificationsTableExists) {
        notificationsData.push({
          org_id,
          obra_id: os.obra_id,
          type: "os_due",
          title,
          message,
          metadata: { os_id: os.id, is_overdue: !!isOverdue, days_until_due: isOverdue ? 0 : daysUntilDue },
        });
      }
    }

    if (notificationsTableExists && notificationsData.length > 0) {
      await adm.from("notifications").insert(notificationsData);
    } else if (!notificationsTableExists) {
      console.log("Tabela 'notifications' não encontrada. Notificações registradas no console:", notifications);
    }

    return jsonResponse({
      notifications_sent: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error("Erro em notify-os-due", err);
    const message = err instanceof Error ? err.message : "Erro interno ao notificar OS próximas do vencimento";
    return jsonResponse({ error: message }, 500);
  }
});
