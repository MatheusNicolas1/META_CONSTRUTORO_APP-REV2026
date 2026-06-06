import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RDOAction = "APPROVED" | "REJECTED";

type ApproveRDORequest = {
  rdo_id?: string;
  rdoId?: string;
  action?: string;
  rejection_reason?: string;
  motivo_rejeicao?: string;
  motivo?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeAction = (action?: string): RDOAction | null => {
  const normalized = action?.trim().toLowerCase();
  if (["approve", "approved", "aprovar", "aprovado", "aprovada"].includes(normalized ?? "")) {
    return "APPROVED";
  }
  if (["reject", "rejected", "rejeitar", "rejeitado", "rejeitada"].includes(normalized ?? "")) {
    return "REJECTED";
  }
  return null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, 405);
  }

  try {
    const payload: ApproveRDORequest = await req.json();
    const rdoId = payload.rdo_id || payload.rdoId;
    const action = normalizeAction(payload.action);
    const rejectionReason = (
      payload.rejection_reason ||
      payload.motivo_rejeicao ||
      payload.motivo ||
      ""
    ).trim();

    if (!rdoId || !action) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "rdo_id e action sao obrigatorios" } },
        400,
      );
    }

    if (action === "REJECTED" && !rejectionReason) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "rejection_reason e obrigatorio para rejeitar" } },
        400,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "").trim();

    if (!jwt) {
      return jsonResponse({ error: { code: "UNAUTHENTICATED", message: "Nao autenticado" } }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(jwt);

    if (authError || !user) {
      return jsonResponse({ error: { code: "UNAUTHENTICATED", message: "Nao autenticado" } }, 401);
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: rdo, error: rdoError } = await admin
      .from("rdos")
      .select("id, org_id, status, criado_por_id")
      .eq("id", rdoId)
      .single();

    if (rdoError || !rdo) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "RDO nao encontrado" } }, 404);
    }

    const { data: membership } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", rdo.org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Usuario nao pertence a organizacao do RDO" } },
        403,
      );
    }

    const role = membership.role ?? "Colaborador";
    if (!["Presidente", "Administrador", "Gerente"].includes(role)) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Permissao negada para aprovar ou rejeitar RDOs" } },
        403,
      );
    }

    if (["APPROVED", "Aprovado"].includes(rdo.status)) {
      return jsonResponse(
        { error: { code: "INVALID_STATUS", message: "RDOs aprovados nao podem ser aprovados ou rejeitados novamente" } },
        409,
      );
    }

    const now = new Date().toISOString();
    const updateData = {
      status: action,
      approved_by: user.id,
      approved_at: now,
      rejection_reason: action === "REJECTED" ? rejectionReason : null,
      aprovado_por_id: user.id,
      data_aprovacao: now,
      motivo_rejeicao: action === "REJECTED" ? rejectionReason : null,
    };

    const { data: updatedRdo, error: updateError } = await admin
      .from("rdos")
      .update(updateData)
      .eq("id", rdoId)
      .select("id, status, approved_by, approved_at, rejection_reason, aprovado_por_id, data_aprovacao, motivo_rejeicao, criado_por_id")
      .single();

    if (updateError) {
      return jsonResponse(
        { error: { code: "UPDATE_FAILED", message: updateError.message } },
        500,
      );
    }

    const notificationTitle = action === "APPROVED" ? "RDO aprovado" : "RDO rejeitado";
    const notificationMessage = action === "APPROVED"
      ? "Seu RDO foi aprovado."
      : `Seu RDO foi rejeitado. Motivo: ${rejectionReason}`;

    await admin.from("notifications").insert({
      user_id: rdo.criado_por_id,
      title: notificationTitle,
      message: notificationMessage,
      type: action === "APPROVED" ? "success" : "warning",
      route: `/app/rdo/${rdoId}`,
    });

    return jsonResponse({
      success: true,
      rdo: updatedRdo,
      status: updatedRdo.status,
      aprovador: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, 500);
  }
});
