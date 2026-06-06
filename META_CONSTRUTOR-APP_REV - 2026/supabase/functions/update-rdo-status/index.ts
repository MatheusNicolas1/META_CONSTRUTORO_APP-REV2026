import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RDOAction = "APPROVED" | "REJECTED";

type UpdateRDOStatusRequest = {
  rdoId?: string;
  rdo_id?: string;
  action?: string;
  motivo?: string;
  motivo_rejeicao?: string;
  rejection_reason?: string;
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
    const { rdoId, rdo_id, action, motivo, motivo_rejeicao, rejection_reason }: UpdateRDOStatusRequest = await req.json();
    const targetRdoId = rdoId || rdo_id;
    const nextStatus = normalizeAction(action);

    if (!targetRdoId || !nextStatus) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "rdoId/rdo_id e action sao obrigatorios" } },
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: rdo, error: rdoError } = await supabase
      .from("rdos")
      .select("org_id, status, criado_por_id")
      .eq("id", targetRdoId)
      .single();

    if (rdoError || !rdo) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "RDO nao encontrado" } }, 404);
    }

    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", rdo.org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!member) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Usuario nao pertence a organizacao do RDO" } },
        403,
      );
    }

    const role = member.role ?? "Colaborador";
    const canApprove = ["Presidente", "Administrador", "Gerente"].includes(role);
    if (!canApprove) {
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

    const rejectionReason = rejection_reason || motivo_rejeicao || motivo || "";
    if (nextStatus === "REJECTED" && !rejectionReason.trim()) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "rejection_reason e obrigatorio para rejeitar" } },
        400,
      );
    }

    const now = new Date().toISOString();
    const updateData = {
      status: nextStatus,
      approved_by: user.id,
      approved_at: now,
      rejection_reason: nextStatus === "REJECTED" ? rejectionReason.trim() : null,
      aprovado_por_id: user.id,
      data_aprovacao: now,
      motivo_rejeicao: nextStatus === "REJECTED" ? rejectionReason.trim() : null,
    };

    const { data: updatedRdo, error: updateError } = await supabase
      .from("rdos")
      .update(updateData)
      .eq("id", targetRdoId)
      .select("id, status, approved_by, approved_at, rejection_reason, aprovado_por_id, data_aprovacao, motivo_rejeicao")
      .single();

    if (updateError) {
      return jsonResponse(
        { error: { code: "UPDATE_FAILED", message: "Erro ao atualizar RDO no banco de dados" } },
        500,
      );
    }

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
