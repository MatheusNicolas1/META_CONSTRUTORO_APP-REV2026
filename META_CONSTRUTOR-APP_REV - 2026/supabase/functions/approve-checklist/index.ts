import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type ApproveChecklistRequest = {
  checklist_id: string;
  signature?: {
    signerName?: string;
    signerEmail?: string;
    signatureData?: string;
    signedAt?: string;
  };
};

const scopedClient = (req: Request) => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
);

const adminClient = () => createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { checklist_id, signature }: ApproveChecklistRequest = await req.json();
    if (!checklist_id) throw new Error("checklist_id e obrigatorio");

    const userClient = scopedClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Usuario nao autenticado" } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = adminClient();
    const { data: checklist, error: checklistError } = await admin
      .from("checklists")
      .select("id, org_id, status, titulo")
      .eq("id", checklist_id)
      .single();

    if (checklistError || !checklist) {
      return new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "Checklist nao encontrado" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: membership, error: memberError } = await admin
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", checklist.org_id)
      .eq("status", "active")
      .single();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: { code: "FORBIDDEN", message: "Voce nao pertence a esta organizacao" } }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date().toISOString();
    const { data: updatedChecklist, error: updateError } = await admin
      .from("checklists")
      .update({
        aprovado_por_id: user.id,
        data_aprovacao: now,
        status: "Concluído",
        completed_at: now,
        signature_name: signature?.signerName ?? user.email,
        signature_email: signature?.signerEmail ?? user.email,
        signature_data: signature?.signatureData ?? null,
        signed_at: signature?.signedAt ?? now,
        updated_at: now,
      })
      .eq("id", checklist_id)
      .select("id, titulo, status, aprovado_por_id, data_aprovacao, signed_at")
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        checklist: updatedChecklist,
        aprovador: { id: user.id, email: user.email },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
