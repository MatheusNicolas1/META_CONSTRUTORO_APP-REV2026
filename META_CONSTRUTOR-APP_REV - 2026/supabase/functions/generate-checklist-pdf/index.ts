import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1?target=deno";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  cleanFileName,
  createAdminClient,
  createUserClient,
  formatDate,
  jsonResponse,
  loadChecklistReport,
  normalizePdfText,
  UUID_PATTERN,
} from "../_shared/checklist-report.ts";

type GenerateChecklistPdfRequest = {
  checklist_id?: string;
};

const wrapText = (text: string, maxChars = 92) => {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
};

const buildPdf = async (report: Awaited<ReturnType<typeof loadChecklistReport>>) => {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 42;
  const lineHeight = 15;
  let page = pdfDoc.addPage(pageSize);
  let y = page.getHeight() - margin;

  const addPage = () => {
    page = pdfDoc.addPage(pageSize);
    y = page.getHeight() - margin;
  };

  const drawLine = (text: string, options: { size?: number; font?: typeof bold; color?: ReturnType<typeof rgb> } = {}) => {
    if (y < margin + lineHeight) addPage();
    page.drawText(normalizePdfText(text), {
      x: margin,
      y,
      size: options.size ?? 10,
      font: options.font ?? regular,
      color: options.color ?? rgb(0.08, 0.09, 0.11),
    });
    y -= lineHeight;
  };

  const drawWrapped = (text: string, size = 10) => {
    for (const line of wrapText(text)) {
      drawLine(line, { size });
    }
  };

  const completed = report.items.filter((item) => item.status === "Concluido" || item.status === "Concluído").length;
  const progress = report.items.length ? Math.round((completed / report.items.length) * 100) : 0;
  const obraName = report.checklist.obras?.nome ?? "Obra nao informada";
  const responsibleName = report.responsible?.name ?? "Responsavel nao informado";

  drawLine("Checklist - Meta Construtor", { size: 18, font: bold, color: rgb(0.1, 0.28, 0.22) });
  y -= 6;
  drawWrapped(report.checklist.titulo, 14);
  y -= 8;
  drawLine(`Obra: ${obraName}`);
  drawLine(`Categoria: ${report.checklist.categoria}`);
  drawLine(`Status: ${report.checklist.status}`);
  drawLine(`Responsavel: ${responsibleName}`);
  drawLine(`Prazo: ${formatDate(report.checklist.data_vencimento)}`);
  drawLine(`Progresso: ${completed}/${report.items.length} itens (${progress}%)`);

  if (report.checklist.descricao) {
    y -= 8;
    drawLine("Descricao", { font: bold });
    drawWrapped(report.checklist.descricao);
  }

  y -= 12;
  drawLine("Itens", { size: 13, font: bold });

  report.items.forEach((item, index) => {
    y -= 6;
    drawWrapped(`${index + 1}. ${item.titulo}`, 11);
    drawLine(`Status: ${item.status} | Prioridade: ${item.prioridade} | Obrigatorio: ${item.obrigatorio ? "sim" : "nao"}`);

    if (item.descricao) drawWrapped(`Descricao: ${item.descricao}`);
    if (item.observacoes) drawWrapped(`Observacoes: ${item.observacoes}`);
    if (item.completed_at) drawLine(`Concluido em: ${formatDate(item.completed_at)}`);
    drawLine(`Evidencias anexadas: ${item.attachments.length}`);
  });

  const pages = pdfDoc.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawText(`Gerado em ${formatDate(new Date().toISOString())} - Pagina ${index + 1}/${pages.length}`, {
      x: margin,
      y: 24,
      size: 8,
      font: regular,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return await pdfDoc.save();
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

    const payload: GenerateChecklistPdfRequest = await req.json().catch(() => ({}));
    const checklistId = payload.checklist_id?.trim();

    if (!checklistId || !UUID_PATTERN.test(checklistId)) {
      return jsonResponse({ error: { code: "VALIDATION_ERROR", message: "checklist_id invalido" } }, corsHeaders, 400);
    }

    const report = await loadChecklistReport(createAdminClient(), checklistId, user.id);
    const pdfBytes = await buildPdf(report);
    const filename = `${cleanFileName(report.checklist.titulo)}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      const body = await error.json().catch(() => ({ error: { code: "INTERNAL_ERROR", message: "Erro interno" } }));
      return jsonResponse(body, corsHeaders, error.status);
    }

    const message = error instanceof Error ? error.message : "Erro interno";
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message } }, corsHeaders, 500);
  }
});
