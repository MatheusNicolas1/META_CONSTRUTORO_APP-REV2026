import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ChecklistReportItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  status: string;
  requer_anexo: boolean;
  obrigatorio: boolean;
  observacoes: string | null;
  completed_at: string | null;
  attachments: Array<{
    id: string;
    nome: string;
    tipo: string;
    url: string;
    tamanho: number | null;
    created_at: string;
  }>;
};

export type ChecklistReportData = {
  checklist: {
    id: string;
    titulo: string;
    categoria: string;
    descricao: string | null;
    status: string;
    data_vencimento: string | null;
    org_id: string | null;
    responsavel_id: string;
    created_at: string;
    updated_at: string;
    obras: { nome?: string | null } | null;
  };
  responsible: { name: string | null; email: string | null } | null;
  items: ChecklistReportItem[];
};

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const jsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const createUserClient = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

export const createAdminClient = () =>
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

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const normalizePdfText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "Nao informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

export const cleanFileName = (value: string) =>
  normalizePdfText(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "checklist";

export const loadChecklistReport = async (
  admin: ReturnType<typeof createAdminClient>,
  checklistId: string,
  userId: string,
): Promise<ChecklistReportData> => {
  const { data: checklist, error: checklistError } = await admin
    .from("checklists")
    .select("id, titulo, categoria, descricao, status, data_vencimento, org_id, responsavel_id, created_at, updated_at, obras(nome)")
    .eq("id", checklistId)
    .single();

  if (checklistError || !checklist) {
    throw new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Checklist nao encontrado" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!checklist.org_id) {
    throw new Response(JSON.stringify({ error: { code: "INVALID_CHECKLIST", message: "Checklist sem organizacao vinculada" } }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: membership, error: membershipError } = await admin
    .from("org_members")
    .select("id")
    .eq("org_id", checklist.org_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Acesso negado ao checklist" } }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: responsible } = await admin
    .from("profiles")
    .select("name, email")
    .eq("id", checklist.responsavel_id)
    .maybeSingle();

  const { data: items, error: itemsError } = await admin
    .from("checklist_items")
    .select("id, titulo, descricao, prioridade, status, requer_anexo, obrigatorio, observacoes, completed_at")
    .eq("checklist_id", checklistId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Response(JSON.stringify({ error: { code: "ITEMS_ERROR", message: "Erro ao carregar itens do checklist" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const itemIds = (items ?? []).map((item) => item.id);
  const { data: attachments, error: attachmentsError } = itemIds.length
    ? await admin
      .from("documentos")
      .select("id, nome, tipo, url, tamanho, created_at, checklist_item_id")
      .in("checklist_item_id", itemIds)
    : { data: [], error: null };

  if (attachmentsError) {
    throw new Response(JSON.stringify({ error: { code: "ATTACHMENTS_ERROR", message: "Erro ao carregar anexos do checklist" } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const attachmentsByItem = new Map<string, ChecklistReportItem["attachments"]>();
  for (const attachment of attachments ?? []) {
    const itemId = attachment.checklist_item_id as string;
    const current = attachmentsByItem.get(itemId) ?? [];
    current.push({
      id: attachment.id,
      nome: attachment.nome,
      tipo: attachment.tipo,
      url: attachment.url,
      tamanho: attachment.tamanho,
      created_at: attachment.created_at,
    });
    attachmentsByItem.set(itemId, current);
  }

  return {
    checklist: checklist as ChecklistReportData["checklist"],
    responsible: responsible ?? null,
    items: (items ?? []).map((item) => ({
      ...(item as Omit<ChecklistReportItem, "attachments">),
      attachments: attachmentsByItem.get(item.id) ?? [],
    })),
  };
};
