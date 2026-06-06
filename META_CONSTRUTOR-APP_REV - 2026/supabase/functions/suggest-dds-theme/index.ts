// suggest-dds-theme/index.ts
// Suggests a DDS (Dialogo Diario de Seguranca) theme based on obra risks

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

const DDS_THEMES: Array<{
  risk: string;
  theme: string;
  description: string;
  category: string;
}> = [
  { risk: "altura", theme: "Trabalho em Altura", description: "Uso correto de cinto de segurança, linha de vida e escadas", category: "altura" },
  { risk: "eletrico", theme: "Segurança Elétrica", description: "Riscos de choque elétrico, uso de EPIs e desenergização", category: "eletrico" },
  { risk: "escavacao", theme: "Escavação e Valas", description: "Sinalização, escoramento e procedimentos para escavação", category: "escavacao" },
  { risk: "incendio", theme: "Prevenção de Incêndios", description: "Uso de extintores, rotas de fuga e armazenamento de inflamáveis", category: "incendio" },
  { risk: "maquinas", theme: "Operação de Máquinas", description: "Procedimentos seguros para operação de equipamentos pesados", category: "maquinas" },
  { risk: "quimico", theme: "Produtos Químicos", description: "Manuseio, armazenamento e descarte de substâncias químicas", category: "quimico" },
  { risk: "ruido", theme: "Controle de Ruído", description: "Uso de protetores auriculares e medição de ruído ambiente", category: "ergonomico" },
  { risk: "ergonomico", theme: "Ergonomia no Trabalho", description: "Postura correta, pausas e evitar movimentos repetitivos", category: "ergonomico" },
  { risk: "sinalizacao", theme: "Sinalização de Obra", description: "Placas, fitas de demarcação e cones de segurança", category: "sinalizacao" },
  { risk: "epi", theme: "Uso de EPIs", description: "Uso correto de capacete, óculos, luvas e botas de segurança", category: "epi" },
  { risk: "geral", theme: "Segurança Geral", description: "Boas práticas de segurança no canteiro de obras", category: "geral" },
  { risk: "emergencia", theme: "Procedimentos de Emergência", description: "Primeiros socorros, evacuação e contatos de emergência", category: "emergencia" },
  { risk: "ferramentas", theme: "Ferramentas Manuais", description: "Inspeção e uso seguro de ferramentas manuais e elétricas", category: "ferramentas" },
  { risk: "andaine", theme: "Montagem de Andaimes", description: "Inspeção, montagem e uso seguro de andaimes", category: "altura" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adm = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { org_id, obra_id, risco_atividade } = body as {
      org_id: string;
      obra_id?: string;
      risco_atividade?: string;
    };

    if (!org_id || typeof org_id !== "string") {
      return jsonResponse({ error: "org_id é obrigatório" }, 400);
    }

    // If a specific risk is provided, use it to filter; otherwise pick a random theme
    let suggestedTheme: typeof DDS_THEMES[0];

    if (risco_atividade) {
      const riscoKey = risco_atividade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matching = DDS_THEMES.filter((t) => t.risk === riscoKey);
      if (matching.length > 0) {
        suggestedTheme = matching[Math.floor(Math.random() * matching.length)];
      } else {
        suggestedTheme = DDS_THEMES.find((t) => t.risk === "geral")!;
      }
    } else {
      // Try to find risks associated with the obra from atividades or similar tables
      let foundRisk: string | null = null;
      if (obra_id) {
        try {
          const { data: atividades } = await adm
            .from("atividades")
            .select("titulo, descricao")
            .eq("org_id", org_id)
            .eq("obra_id", obra_id)
            .limit(10);

          if (atividades && atividades.length > 0) {
            const allText = atividades.map((a) => `${a.titulo} ${a.descricao}`).join(" ").toLowerCase();
            for (const theme of DDS_THEMES) {
              if (allText.includes(theme.risk) || allText.includes(theme.theme.toLowerCase().slice(0, 10))) {
                foundRisk = theme.risk;
                break;
              }
            }
          }
        } catch {
          // If table doesn't exist, proceed to random selection
        }
      }

      if (foundRisk) {
        suggestedTheme = DDS_THEMES.find((t) => t.risk === foundRisk)!;
      } else {
        // Random theme
        suggestedTheme = DDS_THEMES[Math.floor(Math.random() * DDS_THEMES.length)];
      }
    }

    return jsonResponse({
      theme: suggestedTheme.theme,
      description: suggestedTheme.description,
      risk_category: suggestedTheme.category,
    });
  } catch (err) {
    console.error("Erro em suggest-dds-theme", err);
    const message = err instanceof Error ? err.message : "Erro interno ao sugerir tema de DDS";
    return jsonResponse({ error: message }, 500);
  }
});
