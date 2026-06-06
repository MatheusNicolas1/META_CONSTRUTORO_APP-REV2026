import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type PortalClientBootstrapRequest = {
  token?: string;
};

type AllowedSections = {
  fotos?: boolean;
  cronograma?: boolean;
  aprovacoes?: boolean;
  mensagens?: boolean;
};

type PublicDashboardPayload = {
  obra: {
    id: string;
    nome: string;
    endereco?: string | null;
    status?: string | null;
  };
  cliente: {
    nome: string;
    allowed_sections: AllowedSections;
  };
  progresso: {
    etapas_concluidas: number;
    etapas_pendentes: number;
    percentual_concluido?: number;
  };
  fotos: Array<{
    id: string;
    url: string;
    descricao?: string | null;
    data?: string | null;
  }>;
  aprovacoes_pendentes: Array<{
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    opcoes: any;
    created_at: string;
  }>;
  mensagens_recentes: Array<{
    id: string;
    direction: string;
    author_type: string;
    mensagem: string;
    created_at: string;
  }>;
};

const corsHeaders = getCorsHeaders();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const createAdminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

const createPublicClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const maskSensitive = (payload: Record<string, unknown>) => {
  const clone = JSON.parse(JSON.stringify(payload));
  delete clone.token_hash as void;
  delete (clone as any).token as void;
  return clone;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const pub = createPublicClient();

    let token: string | undefined;
    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as PortalClientBootstrapRequest;
      token = body.token;
    } else {
      const url = new URL(req.url);
      token = url.searchParams.get("token") || undefined;
    }

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return jsonResponse({ error: "Token obrigatorio" }, 400);
    }

    const tokenHash = token.trim();

    const { data: cliente, error: clienteError } = await adm
      .from("clientes_portal")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (clienteError) {
      return jsonResponse({ error: "Falha ao consultar portal" }, 500);
    }

    if (!cliente) {
      return jsonResponse({ error: "Portal invalido" }, 404);
    }

    if (cliente.status !== "ativo") {
      return jsonResponse({ error: "Portal inativo" }, 403);
    }

    if (cliente.token_expires_at && new Date(cliente.token_expires_at) < new Date()) {
      return jsonResponse({ error: "Token expirado" }, 403);
    }

    // Atualiza ultimo acesso de forma tolerante (não bloqueia fluxo se falhar)
    const { error: updateError } = await adm
      .from("clientes_portal")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", cliente.id);

    if (updateError) {
      console.error("Falha ao atualizar last_accessed_at", updateError);
    }

    const allowedSections =
      (cliente.allowed_sections as Record<string, unknown> | null) || {};

    // Obra
    const { data: obra, error: obraError } = await adm
      .from("obras")
      .select("id, nome, endereco, status")
      .eq("id", cliente.obra_id)
      .maybeSingle();

    if (obraError) {
      return jsonResponse({ error: "Falha ao carregar obra" }, 500);
    }

    const response: PublicDashboardPayload = {
      obra: obra as any,
      cliente: {
        nome: cliente.nome as string,
        allowed_sections: (allowedSections as any) || {},
      } as any,
      progresso: {
        etapas_concluidas: 0,
        etapas_pendentes: 0,
      },
      fotos: [],
      aprovacoes_pendentes: [],
      mensagens_recentes: [],
    };

    // Seção de progresso/fotos usando tabelas existentes sem expor internas financeiras.
    if (
      allowedSections.fotos === true ||
      allowedSections.cronograma === true
    ) {
      const { data: atividades, error: atividadesError } =
        await adm
          .from("atividades")
          .select("status")
          .eq("org_id", cliente.org_id)
          .eq("obra_id", cliente.obra_id);

      if (atividadesError) {
        return jsonResponse({ error: "Falha ao carregar atividades" }, 500);
      }

      const atividadesList = (atividades || []) as any[];
      const etapasConcluidas = atividadesList.filter(
        (atividade) => atividade.status === "concluida"
      ).length;
      const etapasPendentes = atividadesList.filter(
        (atividade) => atividade.status !== "concluida"
      ).length;

      response.progresso = {
        etapas_concluidas: etapasConcluidas,
        etapas_pendentes: etapasPendentes,
        percentual_concluido:
          atividadesList.length > 0
            ? Number(
                (
                  (etapasConcluidas / atividadesList.length) *
                  100
                ).toFixed(2)
              )
            : 0,
      };
    }

    if (allowedSections.fotos === true) {
      const { data: documentos, error: documentosError } =
        await adm
          .from("documentos")
          .select("id, storage_path, descricao, created_at")
          .eq("org_id", cliente.org_id)
          .eq("obra_id", cliente.obra_id)
          .order("created_at", { ascending: false })
          .limit(20);

      if (documentosError) {
        return jsonResponse({ error: "Falha ao carregar fotos" }, 500);
      }

      const docs = documentos || [];
      const fotos = docs.map((doc: any) => ({
        id: doc.id as string,
        url: doc.storage_path as string,
        descricao: (doc.descricao as string | null) ?? null,
        data: (doc.created_at as string | null) ?? null,
      }));

      response.fotos = fotos;
    }

    if (allowedSections.aprovacoes === true) {
      const { data: aprovacoes, error: aprovacoesError } =
        await adm
          .from("aprovacoes_cliente")
          .select("id, titulo, descricao, tipo, opcoes, created_at")
          .eq("cliente_portal_id", cliente.id)
          .eq("status", "pendente")
          .order("created_at", { ascending: false });

      if (aprovacoesError) {
        return jsonResponse({ error: "Falha ao carregar aprovacoes" }, 500);
      }

      response.aprovacoes_pendentes = (aprovacoes || []).map(
        (item: any) => ({
          id: item.id as string,
          titulo: item.titulo as string,
          descricao: item.descricao as string,
          tipo: item.tipo as string,
          opcoes: item.opcoes,
          created_at: item.created_at as string,
        })
      );
    }

    if (allowedSections.mensagens === true) {
      const { data: mensagens, error: mensagensError } =
        await adm
          .from("mensagens_portal")
          .select("id, direction, author_type, mensagem, created_at")
          .eq("cliente_portal_id", cliente.id)
          .order("created_at", { ascending: false })
          .limit(50);

      if (mensagensError) {
        return jsonResponse({ error: "Falha ao carregar mensagens" }, 500);
      }

      response.mensagens_recentes = (mensagens || []).map(
        (item: any) => ({
          id: item.id as string,
          direction: item.direction as string,
          author_type: item.author_type as string,
          mensagem: item.mensagem as string,
          created_at: item.created_at as string,
        })
      );
    }

    const sanitized = maskSensitive(response as unknown as Record<string, unknown>);

    return jsonResponse(sanitized as unknown as PublicDashboardPayload);
  } catch (error) {
    console.error("Erro em portal-client-bootstrap", error);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});
