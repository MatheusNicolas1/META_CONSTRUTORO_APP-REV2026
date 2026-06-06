// portal-client-final-report/index.ts
// Gera relatório final PDF com dados permitidos ao cliente, sem expôr dados financeiros internos.
// Reutiliza a função de geração PDF já existente no projeto

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

const escapeHtml = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const token = body.token as string | undefined;

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Token obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Valida cliente
    const { data: cliente, error: clienteErr } = await adm
      .from("clientes_portal")
      .select("*")
      .eq("token_hash", token)
      .maybeSingle();

    if (clienteErr || !cliente || cliente.status !== "ativo") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca obras e atividades permitidas
    const { data: obra } = await adm
      .from("obras")
      .select("id, nome, endereco, status")
      .eq("id", cliente.obra_id)
      .maybeSingle();

    const { data: atividades } = await adm
      .from("atividades")
      .select("titulo, descricao, status")
      .eq("org_id", cliente.org_id)
      .eq("obra_id", cliente.obra_id)
      .order("created_at", { ascending: false });

    const { data: fotos } = await adm
      .from("documentos")
      .select("storage_path, descricao")
      .eq("org_id", cliente.org_id)
      .eq("obra_id", cliente.obra_id)
      .limit(20);

    // Gera HTML do relatório (sem dados financeiros)
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Relatório Final - ${escapeHtml(obra?.nome ?? "Obra")}</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; max-width: 700px; margin: auto; padding: 24px; }
  h1 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 14px; }
  th { background: #f9fafb; }
  .foto { display: inline-block; width: 45%; margin: 8px; }
  .foto img { max-width: 100%; height: auto; border-radius: 8px; }
</style></head>
<body>
<h1>Relatório Final - ${escapeHtml(obra?.nome ?? "Obra")}</h1>
<p><strong>Endereço:</strong> ${escapeHtml(obra?.endereco ?? "Não informado")}</p>
<p><strong>Status:</strong> ${escapeHtml(obra?.status ?? "-")}</p>

<h2>Atividades</h2>
<table><thead><tr><th>Atividade</th><th>Status</th></tr></thead><tbody>
${(atividades ?? []).map((a: any) => `<tr><td>${escapeHtml(a.titulo ?? "-")}</td><td>${escapeHtml(a.status ?? "-")}</td></tr>`).join("\n")}
</tbody></table>

<h2>Fotos da obra</h2>
<div>${(fotos ?? []).map((f: any) => `<div class="foto"><img src="${escapeHtml(f.storage_path ?? "")}" alt="${escapeHtml(f.descricao ?? "Foto")}"/><p style="font-size:12px;color:#666">${escapeHtml(f.descricao ?? "")}</p></div>`).join("\n")}</div>

<p style="margin-top:32px;font-size:11px;color:#999">Gerado pelo Meta Construtor — Portal do Cliente</p>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Erro em portal-client-final-report", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
