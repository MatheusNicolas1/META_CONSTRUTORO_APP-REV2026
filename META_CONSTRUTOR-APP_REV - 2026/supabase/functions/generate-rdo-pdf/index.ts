import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1?target=deno";
import { rdoTemplateHtml } from "./template.ts";
import { buildGenericReportHtml, makeReportFilename } from "./report-template.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'Content-Disposition',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { rdoId, reportType, report } = requestBody;

    if (!rdoId && !reportType && !report) {
      return new Response(JSON.stringify({ error: 'rdoId or reportType is required' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader || '',
        },
      },
    });

    // Extrair user_id do JWT para validação multi-tenant
    const jwt = authHeader?.replace('Bearer ', '').trim() || '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado', details: authError?.message }), { status: 401, headers: corsHeaders });
    }

    if (!rdoId) {
      const reportPayload = report || requestBody;
      const generatedAt = reportPayload.generatedAt || new Date().toLocaleString('pt-BR');
      const templateHtml = buildGenericReportHtml({
        ...reportPayload,
        reportType: reportPayload.reportType || reportType,
        generatedAt,
      });
      const filename = makeReportFilename(reportPayload.reportType || reportType, generatedAt);
      return await convertHtmlToPdf(templateHtml, filename, generatedAt);
    }

    // 1. Fetch RDO with all relationships (incluindo rdo_notas)
    const { data: rdo, error } = await supabase
      .from('rdos')
      .select(`
        *,
        obras (nome, localizacao, data_inicio, previsao_termino, responsavel),
        rdo_atividades (*),
        rdo_equipes (*, equipes(*)),
        rdo_equipamentos (*, equipamentos(*)),
        rdo_notas (*, profiles:user_id(name)),
        documentos (*)
      `)
      .eq('id', rdoId)
      .single();

    if (error || !rdo) {
      console.error('Fetch RDO error:', error?.message);
      throw new Error(`RDO não encontrado: ${error?.message}`);
    }

    // Validar que o usuário pertence à mesma org do RDO (multi-tenant)
    if (rdo.org_id) {
      const { data: membership, error: memberError } = await supabase
        .from('org_members')
        .select('id')
        .eq('org_id', rdo.org_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError || !membership) {
        console.error('Multi-tenant violation attempt:', { userId: user.id, orgId: rdo.org_id });
        return new Response(JSON.stringify({ error: 'Acesso negado: você não pertence a esta organização' }), {
          status: 403,
          headers: corsHeaders
        });
      }
    }

    const detalhes = (rdo as Record<string, unknown>).detalhes as Record<string, unknown> || {};
    const safeArray = (val: unknown) => Array.isArray(val) ? val : [];

    // 2. Fetch creator profile
    let responsavelNome = 'Usuário';
    let responsavelCargo = 'Responsável';
    const creatorId = rdo.criado_por_id || (rdo as Record<string, unknown>).user_id;
    if (creatorId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, bio, position')
        .eq('id', creatorId)
        .single();
      if (profile) {
        if (profile.name) responsavelNome = profile.name;
        if (profile.position) responsavelCargo = profile.position;
        else if (profile.bio) responsavelCargo = profile.bio;
      }
    }

    // 3. Fetch approver profile (if approved)
    let aprovadorNome = 'Aprovador';
    let aprovadorCargo = 'Gerente';
    if (rdo.aprovado_por_id) {
      const { data: aprovadorProfile } = await supabase
        .from('profiles')
        .select('name, bio, position')
        .eq('id', rdo.aprovado_por_id)
        .single();
      if (aprovadorProfile) {
        if (aprovadorProfile.name) aprovadorNome = aprovadorProfile.name;
        if (aprovadorProfile.position) aprovadorCargo = aprovadorProfile.position;
        else if (aprovadorProfile.bio) aprovadorCargo = aprovadorProfile.bio;
      }
    }

    // 4. Start template replacements
    let templateHtml = rdoTemplateHtml;

    const formatData = (d: string | null | undefined): string => {
      if (!d) return '';
      try {
        return new Date(d).toLocaleDateString('pt-BR');
      } catch {
        return String(d);
      }
    };

    const numStr = rdo.numero || rdo.id.substring(0, 8);

    // --- Header replacements ---
    templateHtml = templateHtml.replace(/\{\{rdo\.numero\}\}/g, String(numStr));
    templateHtml = templateHtml.replace(/\{\{obra\.codigo\}\}/g, (rdo.obras as Record<string, string>)?.codigo || 'N/A');
    templateHtml = templateHtml.replace(/\{\{rdo\.data_emissao\}\}/g, formatData(rdo.created_at));
    templateHtml = templateHtml.replace(/\{\{rdo\.data\}\}/g, formatData(rdo.data) || formatData(rdo.created_at));
    templateHtml = templateHtml.replace(/\{\{obra\.nome\}\} - \{\{obra\.endereco\}\}/g,
      `${(rdo.obras as Record<string, string>)?.nome || 'Obra'} - ${(rdo.obras as Record<string, string>)?.localizacao || 'Endereço não informado'}`);

    // --- Seção 1: Clima ---
    const climaManha = (detalhes.climaManha as string) || rdo.clima || '☀️ Claro';
    const climaTarde = (detalhes.climaTarde as string) || rdo.clima || '☀️ Claro';
    templateHtml = templateHtml.replace(/\{\{rdo\.clima_manha\}\} \| \{\{rdo\.clima_tarde\}\}/g,
      `Manhã: ${climaManha} | Tarde: ${climaTarde}`);

    templateHtml = templateHtml.replace(/\{\{rdo\.equipe_ociosa\}\}/g,
      rdo.equipe_ociosa === true ? 'Sim' : 'Não');

    // --- Seção 7: Observações ---
    templateHtml = templateHtml.replace(/\{\{rdo\.observacoes\}\}/g, rdo.observacoes || 'Sem observações gerais.');

    // 5. Table Generations
    const emptyMsg = `<div class="empty-message">NENHUM REGISTRO NESTA SE&Ccedil;&Atilde;O</div>`;

    // --- Seção 2: Períodos de Trabalho ---
    const periodosData = safeArray(detalhes.periodos);
    let periodosHtml: string;
    if (periodosData.length > 0) {
      periodosHtml = periodosData.map((p: Record<string, string>) => `
        <tr>
          <td>${p.tipo || 'Hora Comum'}</td>
          <td>${p.horarioInicio || '-'}</td>
          <td>${p.horarioFim || '-'}</td>
          <td>-</td>
        </tr>
      `).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.periodos\}\}/g, periodosHtml);
    } else if (rdo.periodo) {
      periodosHtml = `
        <tr>
          <td>Período Geral</td>
          <td colspan="2">${rdo.periodo}</td>
          <td>${rdo.equipe_ociosa ? `Equipe ociosa: ${rdo.tempo_ocioso || 0}h` : '-'}</td>
        </tr>
      `;
      templateHtml = templateHtml.replace(/\{\{rdo\.periodos\}\}/g, periodosHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.periodos\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    // --- Seção 3: Equipes Presentes ---
    const equipesDB = safeArray(rdo.rdo_equipes).map((e: Record<string, unknown>) => ({
      nome: (e.equipes as Record<string, string>)?.nome || 'Equipe',
      funcao: (e.equipes as Record<string, string>)?.funcao || 'Operacional',
      horasTrabalho: e.horas_trabalho,
      presente: e.presente
    }));

    if (equipesDB.length) {
      const equipesHtml = equipesDB.map((e: Record<string, unknown>) => `
        <tr>
          <td>${e.nome || '-'}</td>
          <td>-</td>
          <td>${e.horasTrabalho ? e.horasTrabalho + 'h' : '-'}</td>
          <td>${e.funcao || 'Operacional'}</td>
        </tr>
      `).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.equipes\}\}/g, equipesHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.equipes\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    // --- Seção 4: Atividades Realizadas ---
    const todasAtividades = safeArray(rdo.rdo_atividades);
    const atividadesPlanejadas = todasAtividades.filter((a: Record<string, unknown>) => !a.is_extra);
    const atividadesExtras = todasAtividades.filter((a: Record<string, unknown>) => a.is_extra);

    if (atividadesPlanejadas.length) {
      const atividadesPlanejadasHtml = atividadesPlanejadas.map((a: Record<string, unknown>) => {
        const statusClass = getStatusClass(a.status as string);
        return `
          <tr>
            <td>${a.nome || a.descricao || '-'}</td>
            <td>-</td>
            <td><span class="status-badge ${statusClass}">${a.status || 'Pendente'}</span></td>
            <td>${a.percentual_concluido || '0'}%</td>
            <td>${a.observacoes || '-'}</td>
          </tr>
        `;
      }).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.atividades_planejadas\}\}/g, atividadesPlanejadasHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.atividades_planejadas\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    if (atividadesExtras.length) {
      const extrasHtml = atividadesExtras.map((a: Record<string, unknown>) => `
        <tr>
          <td>${a.nome || a.descricao || '-'}</td>
          <td>${a.justificativa || '-'}</td>
          <td>-</td>
          <td>-</td>
        </tr>
      `).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.atividades_extras\}\}/g, extrasHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.atividades_extras\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    // --- Seção 5: Equipamentos Utilizados ---
    const eqDB = safeArray(rdo.rdo_equipamentos);
    const eqOperacionais = eqDB.filter((e: Record<string, unknown>) => e.status !== 'Quebrado');

    if (eqOperacionais.length) {
      const equipamentosHtml = eqOperacionais.map((e: Record<string, unknown>) => `
        <tr>
          <td>${(e.equipamentos as Record<string, string>)?.nome || 'Equipamento'}</td>
          <td>1</td>
          <td>${e.horas_uso ? e.horas_uso + 'h' : '-'}</td>
          <td>-</td>
          <td>${e.observacoes || '-'}</td>
        </tr>
      `).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.equipamentos\}\}/g, equipamentosHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.equipamentos\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    // --- Seção 6: Problemas e Ocorrências ---
    // Fonte 1: Equipamentos com status "Quebrado" da tabela rdo_equipamentos
    const eqQuebrados = eqDB
      .filter((e: Record<string, unknown>) => e.status === 'Quebrado')
      .map((e: Record<string, unknown>) => ({
        tipo: 'Equipamento Quebrado',
        descricao: e.descricao_problema || `${(e.equipamentos as Record<string, string>)?.nome || 'Equipamento'} com defeito`,
        envolvidos: '-',
        acoes: e.observacoes || '-',
        status: 'Registrado',
        horario: e.horas_parada ? `${e.horas_parada}h parado` : '-'
      }));

    // Fonte 2: Dados JSONB (acidentes e ocorrências manuais)
    const ocorrenciasJSON = safeArray(detalhes.equipamentosQuebrados).map((o: Record<string, unknown>) => ({
      tipo: (o.tipoOcorrencia as string) || (o.issueType as string) || 'Geral',
      descricao: (o.descricaoProblema as string) || (o.descricao as string) || '-',
      envolvidos: Array.isArray(o.envolvidos) ? o.envolvidos.join(', ') : ((o.envolvidos as string) || '-'),
      acoes: (o.acoesTomadas as string) || '-',
      status: 'Registrado',
      horario: o.horasParada ? `${o.horasParada}h` : '-'
    }));

    const acidentesJSON = safeArray(detalhes.acidentes).map((ac: Record<string, unknown>) => ({
      tipo: 'Acidente',
      descricao: (ac.descricao as string) || '-',
      envolvidos: Array.isArray(ac.colaboradoresEnvolvidos) ? ac.colaboradoresEnvolvidos.join(', ') : '-',
      acoes: (ac.providenciasTomadas as string) || '-',
      status: (ac.gravidade as string) || 'Registrado',
      horario: (ac.horaOcorrencia as string) || '-'
    }));

    const ocorrenciasAll = [...eqQuebrados, ...ocorrenciasJSON, ...acidentesJSON];

    if (ocorrenciasAll.length) {
      const ocorrenciasHtml = ocorrenciasAll.map((o) => `
        <tr>
          <td>${o.tipo}</td>
          <td>${o.descricao}</td>
          <td>${o.envolvidos}</td>
          <td>${o.acoes}</td>
          <td><span class="status-badge status-resolvido">${o.status}</span></td>
          <td>${o.horario}</td>
        </tr>
      `).join('');
      templateHtml = templateHtml.replace(/\{\{rdo\.ocorrencias\}\}/g, ocorrenciasHtml);
    } else {
      templateHtml = templateHtml.replace(/<table>[\s\S]*?\{\{rdo\.ocorrencias\}\}[\s\S]*?<\/table>/i, emptyMsg);
    }

    // --- Seção 8: Anexos ---
    const documentosGeral = safeArray(rdo.documentos);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    const fotos = documentosGeral.filter((d: Record<string, string>) =>
      d.tipo && (d.tipo.includes('image') || imageExtensions.includes(d.tipo.toLowerCase()))
    );
    const docs = documentosGeral.filter((d: Record<string, unknown>) => !fotos.includes(d));

    templateHtml = templateHtml.replace(/\{\{anexos\.total\}\}/g, documentosGeral.length.toString());

    let fotosHtmlChunks = [];
    if (fotos.length) {
      for (const f of fotos) {
         let imgTag = `<div style="width: 100%; height: 70px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 9pt;">📷 ${f.nome || 'Imagem'}</div>`;

         if (f.url) {
            try {
              const { data: fileBlob, error: downloadError } = await supabase.storage.from('documentos').download(f.url);
              if (fileBlob && !downloadError) {
                 const arr = await fileBlob.arrayBuffer();
                 const uint8Array = new Uint8Array(arr);
                 let binary = '';
                 const chunkSize = 8192;
                 for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
                 }
                 const b64 = btoa(binary);
                 const mime = fileBlob.type || 'image/jpeg';
                 imgTag = `<img src="data:${mime};base64,${b64}" class="gallery-image" style="max-height: 100%; max-width: 100%; object-fit: contain; margin: 0 auto; display: block;" />`;
              } else {
                 console.error('Erro ao baixar imagem do storage:', downloadError);
              }
            } catch (e) {
              console.error('Erro ao processar imagem para base64:', e);
            }
         }

         fotosHtmlChunks.push(`
          <div class="gallery-item">
              <div style="height: 70px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid #ccc; border-radius: 3px;">
                  ${imgTag}
              </div>
              <div class="gallery-caption">${f.nome || 'Foto'}</div>
          </div>
         `);
      }
    }
    const fotosHtml = fotosHtmlChunks.length ? fotosHtmlChunks.join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{anexos\.imagens\}\}/g, fotosHtml);

    const docsHtml = docs.length ? docs.map((d: Record<string, string>) => `
      <div class="attachment-item">
          <div class="attachment-icon">📄</div>
          <div class="attachment-info">
              <div class="attachment-name">${d.nome || 'Documento'}</div>
              <div class="attachment-meta">${d.tipo || 'Arquivo'}</div>
          </div>
      </div>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{anexos\.documentos\}\}/g, docsHtml);

    // --- Identificação ---
    templateHtml = templateHtml.replace(
      /\{\{usuario\.nome\}\} - \{\{usuario\.cargo\}\} - \{\{rdo\.data_elaboracao\}\}/g,
      `${responsavelNome} - ${responsavelCargo} - ${formatData(rdo.created_at)}`
    );

    if (rdo.status === 'Aprovado') {
      templateHtml = templateHtml.replace(/\{\{status_aprovacao\}\}/g,
        `<div class="identification-field" style="background-color: #e6ffe6; border-color: #99cc99;"><strong>Aprovado por:</strong> ${aprovadorNome} - ${aprovadorCargo} - ${formatData(rdo.data_aprovacao)}</div>`);
    } else if (rdo.status === 'Rejeitado') {
      templateHtml = templateHtml.replace(/\{\{status_aprovacao\}\}/g,
        `<div class="identification-field" style="background-color: #ffe6e6; border-color: #ff9999;"><strong>Status:</strong> Rejeitado${rdo.motivo_rejeicao ? ' - ' + rdo.motivo_rejeicao : ''}</div>`);
    } else {
      templateHtml = templateHtml.replace(/\{\{status_aprovacao\}\}/g,
        `<div class="identification-field" style="background-color: #fff8e6; border-color: #ffcc66;"><strong>Status:</strong> ${rdo.status || 'Em elaboração'}</div>`);
    }

    const dataGeracao = new Date().toLocaleString('pt-BR');
    templateHtml = templateHtml.replace(/\{\{rdo\.data_geracao\}\}/g, dataGeracao);

    return await convertHtmlToPdf(templateHtml, `RDO-${numStr}.PDF`, dataGeracao);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : '';
    console.error('[generate-rdo-pdf] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage, stack: errorStack }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function convertHtmlToPdf(templateHtml: string, filename: string, generatedAt: string): Promise<Response> {
  console.info('[generate-rdo-pdf] Converting HTML to PDF...');

  const formData = new FormData();
  const htmlFile = new File([templateHtml], "index.html", { type: "text/html" });
  const footerHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;"><div style="width:100%;font-size:7pt;color:#777;text-align:right;padding-right:15mm;">P&Aacute;GINA <span class="pageNumber"></span> DE <span class="totalPages"></span> | GERADO EM ${generatedAt}</div></body></html>`;
  const footerFile = new File([footerHtml], "footer.html", { type: "text/html" });
  formData.append('files', htmlFile);
  formData.append('files', footerFile);
  formData.append('marginTop', '0.59in');
  formData.append('marginBottom', '0.59in');
  formData.append('marginLeft', '0.59in');
  formData.append('marginRight', '0.59in');

  const gotenbergUrl = getGotenbergUrl();
  try {
    const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${response.status} - ${errText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    console.info(`[generate-rdo-pdf] PDF generated through Gotenberg. Size: ${pdfBuffer.byteLength} bytes`);
    return pdfResponse(pdfBuffer, filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate-rdo-pdf] Gotenberg unavailable, using embedded PDF fallback:', message);
    const fallbackPdf = await generateTextFallbackPdf(templateHtml, filename, generatedAt, message);
    return pdfResponse(fallbackPdf, filename);
  }
}

function getGotenbergUrl(): string {
  const configured = Deno.env.get('GOTENBERG_URL') || Deno.env.get('GOTENBERG_ENDPOINT');
  return (configured || 'https://demo.gotenberg.dev').replace(/\/+$/, '');
}

function pdfResponse(pdfBuffer: ArrayBuffer | Uint8Array, filename: string): Response {
  return new Response(pdfBuffer, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    },
  });
}

async function generateTextFallbackPdf(
  html: string,
  filename: string,
  generatedAt: string,
  converterError: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const lineHeight = 13;
  const fontSize = 9;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawTextLine = (line: string, options?: { bold?: boolean; color?: ReturnType<typeof rgb> }) => {
    if (y < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font: options?.bold ? boldFont : regularFont,
      color: options?.color || rgb(0.12, 0.12, 0.12),
      lineHeight,
    });
    y -= lineHeight;
  };

  drawTextLine(filename.replace(/\.pdf$/i, ''), { bold: true });
  drawTextLine(`Gerado em: ${generatedAt}`);
  drawTextLine('Modo degradado: conversor HTML indisponivel; conteudo textual preservado.', {
    color: rgb(0.55, 0.22, 0.03),
  });
  drawTextLine(`Falha do conversor: ${sanitizePdfText(converterError).slice(0, 120)}`);
  y -= 8;

  const contentLines = htmlToPlainText(html)
    .flatMap((line) => wrapPdfLine(line, 94))
    .slice(0, 1800);

  for (const line of contentLines) {
    drawTextLine(line);
  }

  const totalPages = pdfDoc.getPageCount();
  pdfDoc.getPages().forEach((pdfPage, index) => {
    pdfPage.drawText(`Pagina ${index + 1} de ${totalPages}`, {
      x: pageWidth - margin - 85,
      y: 22,
      size: 8,
      font: regularFont,
      color: rgb(0.45, 0.45, 0.45),
    });
  });

  return await pdfDoc.save();
}

function htmlToPlainText(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(h1|h2|h3|h4|p|div|section|article|table|thead|tbody|tr|li)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\r?\n/)
    .map((line) => decodeHtmlEntities(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map(sanitizePdfText);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/gi, 'a')
    .replace(/&agrave;/gi, 'a')
    .replace(/&atilde;/gi, 'a')
    .replace(/&acirc;/gi, 'a')
    .replace(/&eacute;/gi, 'e')
    .replace(/&ecirc;/gi, 'e')
    .replace(/&iacute;/gi, 'i')
    .replace(/&oacute;/gi, 'o')
    .replace(/&otilde;/gi, 'o')
    .replace(/&ocirc;/gi, 'o')
    .replace(/&uacute;/gi, 'u')
    .replace(/&ccedil;/gi, 'c')
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : '';
    });
}

function sanitizePdfText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
}

function wrapPdfLine(line: string, maxLength: number): string[] {
  if (line.length <= maxLength) return [line];
  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length > maxLength) {
      wrapped.push(current);
      current = word;
    } else {
      current += ` ${word}`;
    }
  }

  if (current) wrapped.push(current);
  return wrapped;
}

/**
 * Retorna a classe CSS correspondente ao status da atividade.
 */
function getStatusClass(status: string | undefined): string {
  if (!status) return 'status-pendente';
  const s = status.toLowerCase();
  if (s.includes('conclu')) return 'status-concluida';
  if (s.includes('andamento')) return 'status-andamento';
  if (s.includes('não') || s.includes('nao')) return 'status-nao-iniciada';
  if (s.includes('paralisada')) return 'status-paralisada';
  return 'status-pendente';
}
