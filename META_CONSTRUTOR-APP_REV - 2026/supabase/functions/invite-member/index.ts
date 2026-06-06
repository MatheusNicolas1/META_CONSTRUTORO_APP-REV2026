import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type InviteMemberRequest = {
  org_id?: string;
  email?: string;
  name?: string;
  role?: string;
  create_team_member?: boolean;
};

type AuthUser = {
  id: string;
  email?: string;
  invited_at?: string | null;
  confirmed_at?: string | null;
};

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

const createPublicAuthClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendSupabaseMagicLink = async (email: string, appUrl: string) => {
  const authClient = createPublicAuthClient();
  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=/app/dashboard`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { sent: false, provider: "SUPABASE_MAGIC_LINK", reason: "SUPABASE_MAGIC_LINK_ERROR", details: error };
  }

  return { sent: true, provider: "SUPABASE_MAGIC_LINK" };
};

const findUserByEmail = async (admin: ReturnType<typeof createAdminClient>, email: string) => {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((item: AuthUser) => item.email?.toLowerCase() === email);
    if (user) return user as AuthUser;
    if (data.users.length < 1000) return null;
  }

  return null;
};

const sendExistingUserEmail = async (email: string, name: string, orgName: string, appUrl: string) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return await sendSupabaseMagicLink(email, appUrl);
  }

  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
  const safeName = escapeHtml(name || email);
  const safeOrgName = escapeHtml(orgName);
  const loginUrl = `${appUrl}/login`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `Convite para acessar ${orgName} no Meta Construtor`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
          <h2 style="margin:0 0 12px">Convite para o Meta Construtor</h2>
          <p>Ola, ${safeName}.</p>
          <p>Voce foi adicionado como <strong>Colaborador</strong> em <strong>${safeOrgName}</strong>.</p>
          <p>Acesse sua conta para criar RDOs e acompanhar as obras compartilhadas.</p>
          <p><a href="${loginUrl}">Entrar no Meta Construtor</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const fallback = await sendSupabaseMagicLink(email, appUrl);
    return {
      sent: fallback.sent,
      provider: fallback.provider,
      reason: "RESEND_ERROR_FALLBACK",
      resend: { sent: false, details },
      fallback,
    };
  }

  return { sent: true, provider: "RESEND" };
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

    const payload: InviteMemberRequest = await req.json();
    const orgId = payload.org_id?.trim();
    const email = payload.email?.trim().toLowerCase();
    const name = payload.name?.trim() || email || "";
    const role = payload.role?.trim() || "Colaborador";
    const createTeamMember = payload.create_team_member !== false;

    if (!orgId || !email || !isEmail(email)) {
      return jsonResponse(
        { error: { code: "VALIDATION_ERROR", message: "Organizacao e e-mail valido sao obrigatorios" } },
        corsHeaders,
        400,
      );
    }

    if (role !== "Colaborador") {
      return jsonResponse(
        { error: { code: "INVALID_ROLE", message: "Convites pela UI aceitam apenas cargo Colaborador" } },
        corsHeaders,
        400,
      );
    }

    const admin = createAdminClient();
    const { data: org, error: orgError } = await admin
      .from("orgs")
      .select("id, name")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Organizacao nao encontrada" } }, corsHeaders, 404);
    }

    const { data: callerMembership, error: callerMembershipError } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", caller.id)
      .eq("status", "active")
      .maybeSingle();

    if (callerMembershipError || !callerMembership) {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Usuario nao pertence a organizacao" } }, corsHeaders, 403);
    }

    if (!["Presidente", "Administrador", "Gerente"].includes(callerMembership.role)) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Apenas administradores e gerentes podem convidar colaboradores" } },
        corsHeaders,
        403,
      );
    }

    const appUrl = Deno.env.get("APP_URL") ?? req.headers.get("origin") ?? "https://www.metaconstrutor.app.br";
    let invitedUser = await findUserByEmail(admin, email);
    let authInviteSent = false;
    let existingUser = Boolean(invitedUser);

    if (!invitedUser) {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/auth/callback?next=/app/dashboard`,
        data: {
          name,
          invited_org_id: orgId,
          invited_role: role,
        },
      });

      if (inviteError) {
        const maybeExisting = await findUserByEmail(admin, email);
        if (!maybeExisting) throw inviteError;
        invitedUser = maybeExisting;
        existingUser = true;
      } else {
        invitedUser = inviteData.user as AuthUser;
        authInviteSent = true;
      }
    }

    if (!invitedUser?.id) {
      return jsonResponse({ error: { code: "INVITE_FAILED", message: "Nao foi possivel localizar usuario convidado" } }, corsHeaders, 500);
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email")
      .eq("id", invitedUser.id)
      .maybeSingle();

    if (existingProfile) {
      if (!existingProfile.email) {
        await admin
          .from("profiles")
          .update({ email, updated_at: new Date().toISOString() })
          .eq("id", invitedUser.id);
      }
    } else {
      await admin.from("profiles").insert({
        id: invitedUser.id,
        name,
        email,
        plan_type: "free",
        has_seen_onboarding: true,
        updated_at: new Date().toISOString(),
      });
    }

    const targetStatus = existingUser ? "active" : "invited";
    const { data: membership, error: membershipError } = await admin
      .from("org_members")
      .upsert({
        org_id: orgId,
        user_id: invitedUser.id,
        role,
        status: targetStatus,
        invited_by: caller.id,
        invited_at: new Date().toISOString(),
        joined_at: targetStatus === "active" ? new Date().toISOString() : null,
      }, { onConflict: "org_id,user_id" })
      .select("id, status, role")
      .single();

    if (membershipError) {
      return jsonResponse(
        { error: { code: "MEMBERSHIP_FAILED", message: membershipError.message } },
        corsHeaders,
        400,
      );
    }

    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", invitedUser.id)
      .maybeSingle();

    if (!existingRole) {
      await admin.from("user_roles").insert({ user_id: invitedUser.id, role });
    }

    if (createTeamMember) {
      const { data: existingTeamMember } = await admin
        .from("equipes")
        .select("id")
        .eq("org_id", orgId)
        .eq("email", email)
        .maybeSingle();

      if (!existingTeamMember) {
        await admin.from("equipes").insert({
          org_id: orgId,
          user_id: invitedUser.id,
          nome: name,
          funcao: "Colaborador",
          email,
          ativo: true,
        });
      }
    }

    const resendResult = existingUser
      ? await sendExistingUserEmail(email, name, org.name, appUrl)
      : { sent: false, reason: "SUPABASE_AUTH_INVITE" };

    return jsonResponse({
      success: true,
      member: membership,
      user: {
        id: invitedUser.id,
        email,
        existing_user: existingUser,
      },
      email_sent: authInviteSent || resendResult.sent,
      auth_invite_sent: authInviteSent,
      custom_email_sent: resendResult.sent,
      email_delivery: resendResult,
      status: membership.status,
    }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
