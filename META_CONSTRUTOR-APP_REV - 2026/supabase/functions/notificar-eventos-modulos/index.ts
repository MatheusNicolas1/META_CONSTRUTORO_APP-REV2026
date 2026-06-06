// notificar-eventos-modulos/index.ts
// Edge Function centralizada para notificações dos 6 módulos:
// fluxo_caixa, ordem_servico, dds, contratos, portal_cliente, erp
// Pode ser chamada por trigger do banco ou manualmente via API.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders();

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Modulo =
  | "fluxo_caixa"
  | "ordem_servico"
  | "dds"
  | "contratos"
  | "portal_cliente"
  | "erp";

type TipoEvento =
  | "alerta"
  | "lembrete"
  | "aprovacao_pendente"
  | "concluido"
  | "erro_sync";

interface NotificarPayload {
  org_id: string;
  modulo: Modulo;
  tipo_evento: TipoEvento;
  dados_referencia: Record<string, unknown>;
  usuarios_destino?: string[]; // opcional – UUIDs dos usuários
}

interface NotificacaoInsert {
  org_id: string;
  user_id: string;
  modulo: string;
  tipo_evento: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dados_referencia: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Gera título e mensagem em português com base no módulo e tipo de evento. */
function gerarTextoNotificacao(
  modulo: Modulo,
  tipo_evento: TipoEvento,
  dados: Record<string, unknown>,
): { titulo: string; mensagem: string } {
  const labels: Record<Modulo, string> = {
    fluxo_caixa: "Fluxo de Caixa",
    ordem_servico: "Ordem de Serviço",
    dds: "DDS",
    contratos: "Contratos",
    portal_cliente: "Portal do Cliente",
    erp: "ERP",
  };

  const label = labels[modulo];
  const ref = (dados?.referencia ?? dados?.id ?? "") as string;
  const descricao = (dados?.descricao ?? dados?.titulo ?? "") as string;

  switch (tipo_evento) {
    case "alerta":
      return {
        titulo: `⚠️ Alerta — ${label}`,
        mensagem: descricao
          ? `Alerta em ${label}: ${descricao}`
          : `Alerta registrado no módulo ${label}.`,
      };

    case "lembrete":
      return {
        titulo: `🔔 Lembrete — ${label}`,
        mensagem: descricao
          ? `Lembrete de ${label}: ${descricao}`
          : `Você tem um lembrete pendente no módulo ${label}.`,
      };

    case "aprovacao_pendente":
      return {
        titulo: `✅ Aprovação Pendente — ${label}`,
        mensagem: ref
          ? `Há uma solicitação de aprovação pendente em ${label} (ref: ${ref}).`
          : `Há uma solicitação de aprovação pendente no módulo ${label}.`,
      };

    case "concluido":
      return {
        titulo: `✔️ Concluído — ${label}`,
        mensagem: ref
          ? `O item ${ref} foi concluído em ${label}.`
          : `Um processo foi concluído no módulo ${label}.`,
      };

    case "erro_sync":
      return {
        titulo: `❌ Erro de Sincronização — ${label}`,
        mensagem: descricao
          ? `Erro ao sincronizar ${label}: ${descricao}`
          : `Ocorreu um erro de sincronização no módulo ${label}.`,
      };
  }
}

/** Busca os user_ids dos membros ativos da org que têm permissão para o módulo. */
async function buscarMembrosDaOrg(
  adm: ReturnType<typeof createAdminClient>,
  org_id: string,
  modulo: Modulo,
): Promise<string[]> {
  // Mapeamento de módulo para role mínima.
  // Usamos a role como proxy simples de permissão:
  // - fluxo_caixa / erp → Gerente+
  // - demais módulos → qualquer role ativo pode receber
  const rolesPermitidas: string[] =
    modulo === "fluxo_caixa" || modulo === "erp"
      ? ["Administrador", "Gerente"]
      : ["Administrador", "Gerente", "Colaborador"];

  const { data, error } = await adm
    .from("org_members")
    .select("user_id")
    .eq("org_id", org_id)
    .eq("status", "active")
    .in("role", rolesPermitidas);

  if (error) {
    console.error("Erro ao buscar org_members:", error);
    return [];
  }

  return (data ?? []).map((r: { user_id: string }) => r.user_id);
}

/** Busca webhooks pendentes da org (webhook_queue com status='pendente'). */
async function buscarWebhooksPendentes(
  adm: ReturnType<typeof createAdminClient>,
  org_id: string,
  modulo: Modulo,
): Promise<Array<Record<string, unknown>>> {
  const { data, error } = await adm
    .from("webhook_queue")
    .select("id, config_id, evento, payload, tentativas, max_tentativas, prioridade")
    .eq("org_id", org_id)
    .eq("status", "pendente")
    .order("prioridade", { ascending: true })
    .limit(50);

  if (error) {
    if (error.code === "42P01") {
      console.log("Tabela webhook_queue não existe ainda — ignorando.");
      return [];
    }
    console.error("Erro ao buscar webhook_queue:", error);
    return [];
  }

  return data ?? [];
}

/** Tenta enviar um webhook e atualiza o status na fila. */
async function tentarEnviarWebhook(
  adm: ReturnType<typeof createAdminClient>,
  item: Record<string, unknown>,
): Promise<boolean> {
  const webhookId = item.id as string;
  const payload = item.payload as Record<string, unknown>;
  const url = payload?.webhook_url as string | undefined;

  if (!url) {
    console.warn(`webhook_queue ${webhookId} sem webhook_url no payload — ignorando.`);
    // Marca como cancelado para não travar a fila
    await adm
      .from("webhook_queue")
      .update({ status: "cancelado", erro_ultima_tentativa: "URL do webhook não informada" })
      .eq("id", webhookId);
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await adm
        .from("webhook_queue")
        .update({
          status: "sucesso",
          tentativas: (item.tentativas as number) + 1,
          ultima_tentativa: new Date().toISOString(),
        })
        .eq("id", webhookId);
      return true;
    } else {
      const erroTexto = await response.text().catch(() => "Erro desconhecido");
      throw new Error(`HTTP ${response.status}: ${erroTexto}`);
    }
  } catch (err) {
    const tentativas = (item.tentativas as number) + 1;
    const maxTentativas = (item.max_tentativas as number) ?? 3;
    const erroMsg = err instanceof Error ? err.message : "Falha na requisição";

    if (tentativas >= maxTentativas) {
      await adm
        .from("webhook_queue")
        .update({
          status: "falha",
          tentativas,
          ultima_tentativa: new Date().toISOString(),
          erro_ultima_tentativa: erroMsg,
        })
        .eq("id", webhookId);
    } else {
      // Agenda próxima tentativa com backoff exponencial
      const backoffMinutos = Math.min(60, Math.pow(2, tentativas) * 5);
      const proxima = new Date(Date.now() + backoffMinutos * 60_000).toISOString();
      await adm
        .from("webhook_queue")
        .update({
          status: "pendente",
          tentativas,
          ultima_tentativa: new Date().toISOString(),
          proxima_tentativa: proxima,
          erro_ultima_tentativa: erroMsg,
        })
        .eq("id", webhookId);
    }
    return false;
  }
}

/** Verifica se a tabela `notifications` existe no schema. */
async function tabelaNotificacoesExiste(
  adm: ReturnType<typeof createAdminClient>,
): Promise<boolean> {
  try {
    const { error } = await adm.from("notifications").select("id").limit(1);
    if (error && error.code === "42P01") return false;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body: NotificarPayload = await req.json().catch(() => ({}));

    // Validação dos campos obrigatórios
    const { org_id, modulo, tipo_evento, dados_referencia, usuarios_destino } = body;

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    const modulosValidos: Modulo[] = [
      "fluxo_caixa",
      "ordem_servico",
      "dds",
      "contratos",
      "portal_cliente",
      "erp",
    ];
    if (!modulo || !modulosValidos.includes(modulo)) {
      return jsonResponse({
        error: `modulo inválido. Valores aceitos: ${modulosValidos.join(", ")}`,
      }, 400);
    }

    const tiposValidos: TipoEvento[] = [
      "alerta",
      "lembrete",
      "aprovacao_pendente",
      "concluido",
      "erro_sync",
    ];
    if (!tipo_evento || !tiposValidos.includes(tipo_evento)) {
      return jsonResponse({
        error: `tipo_evento inválido. Valores aceitos: ${tiposValidos.join(", ")}`,
      }, 400);
    }

    if (!dados_referencia || typeof dados_referencia !== "object") {
      return jsonResponse({ error: "dados_referencia é obrigatório (objeto)" }, 400);
    }

    // --- 1. Determinar usuários destino ---
    let userIds: string[] = [];
    if (usuarios_destino && Array.isArray(usuarios_destino) && usuarios_destino.length > 0) {
      userIds = usuarios_destino;
    } else {
      userIds = await buscarMembrosDaOrg(adm, org_id, modulo);
    }

    if (userIds.length === 0) {
      return jsonResponse({
        notificacoes_criadas: 0,
        webhooks_enviados: 0,
        erros: [],
        mensagem: "Nenhum usuário destino encontrado para esta org/módulo.",
      });
    }

    // --- 2. Gerar texto da notificação ---
    const { titulo, mensagem } = gerarTextoNotificacao(modulo, tipo_evento, dados_referencia);

    // --- 3. Buscar webhooks pendentes ---
    const webhooksPendentes = await buscarWebhooksPendentes(adm, org_id, modulo);

    // --- 4. Inserir notificações ---
    const tabelaExiste = await tabelaNotificacoesExiste(adm);
    const notificacoesCriadas: string[] = [];

    if (tabelaExiste) {
      const inserts: NotificacaoInsert[] = userIds.map((user_id) => ({
        org_id,
        user_id,
        modulo,
        tipo_evento,
        titulo,
        mensagem,
        lida: false,
        dados_referencia,
        created_at: new Date().toISOString(),
      }));

      const { data: inserted, error: insertErr } = await adm
        .from("notifications")
        .insert(inserts)
        .select("id");

      if (insertErr) {
        console.error("Erro ao inserir notificações:", insertErr);
        // Fallback: log
        console.log("Notificações não inseridas — fallback para console:", {
          quantidade: userIds.length,
          modulo,
          tipo_evento,
          titulo,
          mensagem,
        });
      } else {
        notificacoesCriadas.push(
          ...(inserted ?? []).map((n: { id: string }) => n.id),
        );
      }
    } else {
      console.log(
        "Tabela 'notifications' não existe. Notificações registradas no console:",
        { quantidade: userIds.length, modulo, tipo_evento, titulo, mensagem },
      );
    }

    // --- 5. Tentar enviar webhooks ---
    const webhooksEnviados: string[] = [];
    const erros: string[] = [];

    for (const item of webhooksPendentes) {
      try {
        const enviado = await tentarEnviarWebhook(adm, item);
        if (enviado) {
          webhooksEnviados.push(item.id as string);
        }
      } catch (err) {
        const erroMsg = err instanceof Error ? err.message : "Falha ao processar webhook";
        erros.push(`webhook ${item.id}: ${erroMsg}`);
      }
    }

    // --- 6. Resposta ---
    return jsonResponse({
      notificacoes_criadas: notificacoesCriadas.length,
      usuarios_notificados: userIds.length,
      webhooks_enviados: webhooksEnviados.length,
      webhooks_pendentes_restantes: webhooksPendentes.length - webhooksEnviados.length,
      erros: erros.length > 0 ? erros : undefined,
      mensagem: `Notificações enviadas com sucesso para ${userIds.length} usuário(s) no módulo ${modulo}.`,
    });
  } catch (err) {
    console.error("Erro em notificar-eventos-modulos:", err);
    const message = err instanceof Error
      ? err.message
      : "Erro interno ao processar notificações dos módulos";
    return jsonResponse({ error: message }, 500);
  }
});
