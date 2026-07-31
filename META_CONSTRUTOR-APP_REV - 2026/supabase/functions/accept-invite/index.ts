import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requirePlanLimit } from "../_shared/guards.ts";

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
  );

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

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // First, find the pending invitation to get org_id
    const { data: pending, error: pendingError } = await admin
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("status", "invited")
      .maybeSingle();

    if (pendingError || !pending) {
      return jsonResponse({ error: { code: "NO_INVITE", message: "Nenhum convite pendente encontrado" } }, corsHeaders, 404);
    }

    // Check plan limit before activating
    await requirePlanLimit(admin, pending.org_id, "max_users");

    const { data, error } = await admin
      .from("org_members")
      .update({
        status: "active",
        joined_at: now,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .eq("status", "invited")
      .select("id, org_id, role, status");

    if (error) {
      return jsonResponse({ error: { code: "ACCEPT_FAILED", message: error.message } }, corsHeaders, 400);
    }

    return jsonResponse({
      success: true,
      activated: data?.length ?? 0,
      memberships: data ?? [],
    }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
