// erp-sync-dispatcher/index.ts
// Processes the next batch of pending ERP sync queue items

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
    const batchSize = 10;
    let queueRemaining = 0;
    let processed = 0;

    // Check if erp_sync_queue table exists
    try {
      const { count, error: countErr } = await adm
        .from("erp_sync_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (countErr) throw countErr;
      queueRemaining = count || 0;
    } catch {
      // If table doesn't exist, return empty stats
      return jsonResponse({
        processed: 0,
        queue_remaining: 0,
        message: "Nenhuma fila de sincronização encontrada.",
      });
    }

    if (queueRemaining === 0) {
      return jsonResponse({
        processed: 0,
        queue_remaining: 0,
        message: "Fila de sincronização vazia.",
      });
    }

    // Get next batch
    const { data: queueItems, error: queueErr } = await adm
      .from("erp_sync_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (queueErr) throw queueErr;

    if (!queueItems || queueItems.length === 0) {
      return jsonResponse({
        processed: 0,
        queue_remaining: 0,
        message: "Nenhum item pendente encontrado.",
      });
    }

    // Process each item
    for (const item of queueItems) {
      try {
        // Mark as processing
        await adm
          .from("erp_sync_queue")
          .update({ status: "processing" })
          .eq("id", item.id);

        // Simulate processing (actual ERP calls would happen here)
        const { data: config } = await adm
          .from("integracao_erp_config")
          .select("api_url, api_key")
          .eq("org_id", item.org_id)
          .single();

        let success = true;
        let resultMsg = "";

        if (config) {
          try {
            const erpEndpoint = `${config.api_url.replace(/\/?$/, "")}/api/${item.entidade}`;
            if (item.action === "send_to_erp") {
              const erpResp = await fetch(erpEndpoint, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${config.api_key}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(item.payload || {}),
                signal: AbortSignal.timeout(15000),
              });
              success = erpResp.ok;
              resultMsg = `ERP ${erpResp.ok ? "ok" : `error ${erpResp.status}`}`;
            } else {
              // For import, just log
              resultMsg = "Import action logged";
            }
          } catch (fetchErr) {
            success = false;
            resultMsg = fetchErr instanceof Error ? fetchErr.message : "ERP fetch failed";
          }
        } else {
          resultMsg = "Sem config de ERP, simulando processamento";
        }

        // Mark as processed
        await adm
          .from("erp_sync_queue")
          .update({
            status: success ? "completed" : "failed",
            processed_at: new Date().toISOString(),
            payload: { ...(item.payload as Record<string, unknown> || {}), result: resultMsg },
          })
          .eq("id", item.id);

        processed++;
      } catch (itemErr) {
        console.error(`Error processing sync queue item ${item.id}:`, itemErr);
        // Mark as failed
        try {
          await adm
            .from("erp_sync_queue")
            .update({ status: "failed", processed_at: new Date().toISOString() })
            .eq("id", item.id);
        } catch {
          // Ignore secondary errors
        }
        processed++;
      }
    }

    // Get remaining queue count
    const { count: remainingCount } = await adm
      .from("erp_sync_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    queueRemaining = remainingCount || 0;

    return jsonResponse({
      processed,
      queue_remaining: queueRemaining,
      batch_size: batchSize,
    });
  } catch (err) {
    console.error("Erro em erp-sync-dispatcher", err);
    const message = err instanceof Error ? err.message : "Erro interno ao processar fila de sincronização ERP";
    return jsonResponse({ error: message }, 500);
  }
});
