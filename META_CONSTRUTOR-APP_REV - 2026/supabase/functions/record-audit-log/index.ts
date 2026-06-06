import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type RecordAuditLogRequest = {
  org_id?: string | null;
  action?: string;
  entity?: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
};

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

const cleanText = (value: unknown, fallback: string, maxLength = 120) => {
  if (typeof value !== "string") return fallback;
  const clean = value.trim();
  return clean ? clean.slice(0, maxLength) : fallback;
};

const getRequestIp = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
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
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Login obrigatorio" } }, corsHeaders, 401);
    }

    const payload: RecordAuditLogRequest = await req.json().catch(() => ({}));
    const admin = createAdminClient();

    let orgId = payload.org_id?.trim() || null;
    if (orgId && !UUID_PATTERN.test(orgId)) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Organizacao invalida" } }, corsHeaders, 400);
    }

    let membershipQuery = admin
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (orgId) {
      membershipQuery = membershipQuery.eq("org_id", orgId);
    }

    const { data: memberships, error: membershipError } = await membershipQuery;

    if (membershipError) {
      return jsonResponse(
        { error: { code: "MEMBERSHIP_CHECK_FAILED", message: "Nao foi possivel validar organizacao" } },
        corsHeaders,
        500,
      );
    }

    const membership = memberships?.[0];
    if (!membership?.org_id) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Usuario nao pertence a organizacao informada" } },
        corsHeaders,
        403,
      );
    }

    orgId = membership.org_id;

    const rawEntityId = payload.entity_id?.trim() || null;
    const details = {
      ...(payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {}),
      org_id: orgId,
      raw_entity_id: rawEntityId,
    };

    const { data: audit, error: auditError } = await admin
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: cleanText(payload.action, "system.event"),
        entity: cleanText(payload.entity, "system"),
        entity_id: rawEntityId,
        details: {
          ...details,
          request_id: crypto.randomUUID(),
          ip: getRequestIp(req),
          user_agent: req.headers.get("user-agent"),
        },
        created_at: new Date().toISOString(),
      })
      .select("id, action, entity, created_at")
      .single();

    if (auditError) {
      throw new Error(`Failed to write audit log: ${auditError.message}`);
    }

    return jsonResponse({ success: true, audit }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
