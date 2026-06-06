import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type SuspendUserRequest = {
  user_id?: string;
  action?: "suspend" | "unsuspend";
  reason?: string;
  ban_duration?: string;
};

const DEFAULT_BAN_DURATION = "876000h";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const jsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const createUserClient = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

const sanitizeReason = (value?: string) => {
  const reason = value?.trim();
  if (!reason) return null;
  return reason.slice(0, 500);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, corsHeaders, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createUserClient(authHeader);
    const {
      data: { user: caller },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !caller) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Login obrigatorio" } }, corsHeaders, 401);
    }

    const payload: SuspendUserRequest = await req.json().catch(() => ({}));
    const targetUserId = payload.user_id?.trim();
    const action = payload.action === "unsuspend" ? "unsuspend" : "suspend";
    const reason = sanitizeReason(payload.reason);
    const banDuration = action === "unsuspend" ? "none" : (payload.ban_duration?.trim() || DEFAULT_BAN_DURATION);

    if (!targetUserId || !UUID_PATTERN.test(targetUserId)) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Usuario alvo invalido" } },
        corsHeaders,
        400,
      );
    }

    if (targetUserId === caller.id) {
      return jsonResponse(
        { error: { code: "SELF_SUSPEND_BLOCKED", message: "Voce nao pode suspender a propria conta" } },
        corsHeaders,
        400,
      );
    }

    const admin = createAdminClient();
    const { data: callerRole, error: roleError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "Presidente")
      .maybeSingle();

    if (roleError) {
      return jsonResponse(
        { error: { code: "ROLE_CHECK_FAILED", message: "Nao foi possivel validar permissao administrativa" } },
        corsHeaders,
        500,
      );
    }

    if (!callerRole) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Apenas Presidente pode suspender usuarios" } },
        corsHeaders,
        403,
      );
    }

    const { data: targetUserData, error: targetUserError } = await admin.auth.admin.getUserById(targetUserId);
    const targetUser = targetUserData?.user;

    if (targetUserError || !targetUser) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Usuario alvo nao encontrado" } }, corsHeaders, 404);
    }

    const previousAppMetadata = targetUser.app_metadata ?? {};
    const suspensionMetadata = action === "suspend"
      ? {
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_by: caller.id,
          suspension_reason: reason,
        }
      : {
          suspended: false,
          unsuspended_at: new Date().toISOString(),
          unsuspended_by: caller.id,
          suspension_reason: null,
        };

    const { data: updatedUserData, error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: banDuration,
      app_metadata: {
        ...previousAppMetadata,
        ...suspensionMetadata,
      },
    });

    if (updateError || !updatedUserData?.user) {
      return jsonResponse(
        { error: { code: "AUTH_UPDATE_FAILED", message: updateError?.message ?? "Falha ao atualizar usuario" } },
        corsHeaders,
        500,
      );
    }

    const auditAction = action === "suspend" ? "SUSPEND_USER" : "UNSUSPEND_USER";
    await admin.from("admin_audit_logs").insert({
      admin_id: caller.id,
      action: auditAction,
      target_user_id: targetUserId,
      details: {
        ban_duration: banDuration,
        reason,
        target_email: targetUser.email ?? null,
      },
    });

    return jsonResponse({
      success: true,
      action,
      user: {
        id: updatedUserData.user.id,
        email: updatedUserData.user.email,
        banned_until: updatedUserData.user.banned_until ?? null,
      },
    }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
