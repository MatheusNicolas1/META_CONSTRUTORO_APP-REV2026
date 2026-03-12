import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { rdoTemplateHtml } from "./template.ts";

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
    const { rdoId } = await req.json();

    if (!rdoId) {
      return new Response(JSON.stringify({ error: 'rdoId is required' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Auth header from the client requesting the PDF
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader || '',
        },
      },
    });

    // 1. Fetch data
    const { data: rdo, error } = await supabase
      .from('rdos')
      .select(`
        *,
        obras (nome, localizacao, data_inicio, previsao_termino, responsavel),
        rdo_atividades (*),
        rdo_equipes (*, equipes(*)),
        rdo_equipamentos (*, equipamentos(*)),
        documentos (*),
        rdo_notas (*)
      `)
      .eq('id', rdoId)
      .single();

    if (error || !rdo) {
      throw new Error(`RDO não encontrado: ${error?.message}`);
    }

    const detalhes = rdo.detalhes || {};
    const safeArray = (val: any) => Array.isArray(val) ? val : [];

    // Profiles fetching
    let responsavelNome = 'Usuário';
    let responsavelCargo = 'Responsável';
    if (rdo.criado_por_id || rdo.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, bio') // assuming role/cargo is there
        .eq('id', rdo.criado_por_id || rdo.user_id)
        .single();
      if (profile) {
        if (profile.name) responsavelNome = profile.name;
        if (profile.bio) responsavelCargo = profile.bio;
      }
    }

    let aprovadorNome = 'Aprovador';
    let aprovadorCargo = 'Gerente';
    if (rdo.aprovado_por) {
      const { data: aprovadorProfile } = await supabase
        .from('profiles')
        .select('name, bio')
        .eq('id', rdo.aprovado_por)
        .single();
      if (aprovadorProfile) {
        if (aprovadorProfile.name) aprovadorNome = aprovadorProfile.name;
        if (aprovadorProfile.bio) aprovadorCargo = aprovadorProfile.bio;
      }
    }

    // 2. Read template
    let templateHtml = rdoTemplateHtml;

    // 3. Simple variable replacements
    const formatData = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '';
    const numStr = rdo.numero || rdo.id.substring(0, 8);

    templateHtml = templateHtml.replace(/\{\{rdo\.numero\}\}/g, numStr);
    templateHtml = templateHtml.replace(/\{\{obra\.codigo\}\}/g, rdo.obras?.codigo || 'N/A');
    templateHtml = templateHtml.replace(/\{\{rdo\.data_emissao\}\}/g, formatData(rdo.created_at));
    templateHtml = templateHtml.replace(/\{\{rdo\.data\}\}/g, formatData(rdo.data) || formatData(rdo.created_at));
    templateHtml = templateHtml.replace(/\{\{obra\.nome\}\} - \{\{obra\.endereco\}\}/g, `${rdo.obras?.nome || 'Obra'} - ${rdo.obras?.localizacao || 'Endereço não informado'}`);

    const climaManha = detalhes.climaManha || rdo.clima || '☀️ Claro';
    const climaTarde = detalhes.climaTarde || rdo.clima || '☀️ Claro';
    templateHtml = templateHtml.replace(/\{\{rdo\.clima_manha\}\} \| \{\{rdo\.clima_tarde\}\}/g, `Manhã: ${climaManha} | Tarde: ${climaTarde}`);

    templateHtml = templateHtml.replace(/\{\{rdo\.equipe_ociosa\}\}/g, rdo.equipe_ociosa === 'Sim' || rdo.equipe_ociosa === true ? 'Sim' : 'Não');
    templateHtml = templateHtml.replace(/\{\{rdo\.observacoes\}\}/g, rdo.observacoes || 'Sem observações gerais.');

    // 4. Table Generations
    const emptyMsg = `<tr><td colspan="100%" class="empty-message" style="text-align: center;">Nenhum registro nesta seção.</td></tr>`;

    // Períodos
    const periodosData = safeArray(detalhes.periodos);
    const periodosHtml = periodosData.length ? periodosData.map((p: any) => `
      <tr>
        <td>${p.tipo || 'Hora Comum'}</td>
        <td>${p.horarioInicio || '-'}</td>
        <td>${p.horarioFim || '-'}</td>
        <td>-</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.periodos\}\}/g, periodosHtml);

    // Equipes
    const equipesDB = safeArray(rdo.rdo_equipes).map((e: any) => ({
      nome: e.equipes?.nome || 'Equipe', funcao: e.equipes?.funcao || '', horasTrabalho: e.horas_trabalho
    }));
    const equipesJSON = safeArray(detalhes.equipes);
    const equipesData = [...equipesDB, ...equipesJSON];

    const equipesHtml = equipesData.length ? equipesData.map((e: any) => `
      <tr>
        <td>${e.nome || '-'}</td>
        <td>-</td>
        <td>-</td>
        <td>${e.funcao || 'Operacional'}</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.equipes\}\}/g, equipesHtml);

    // Atividades Planejadas
    const atividadesData = safeArray(rdo.rdo_atividades);
    const atividadesHtml = atividadesData.length ? atividadesData.map((a: any) => `
      <tr>
        <td>${a.nome || a.descricao || '-'}</td>
        <td>-</td>
        <td><span class="status-badge status-${a.status?.toLowerCase().replace(' ', '-') || 'pendente'}">${a.status || 'Pendente'}</span></td>
        <td>${a.percentual_concluido || '0'}%</td>
        <td>${a.observacoes || '-'}</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.atividades_planejadas\}\}/g, atividadesHtml);

    // Atividades Extras
    const extrasData = safeArray(detalhes.atividadesExtras);
    const extrasHtml = extrasData.length ? extrasData.map((a: any) => `
      <tr>
        <td>${a.descricao || '-'}</td>
        <td>${a.justificativa || '-'}</td>
        <td>-</td>
        <td>-</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.atividades_extras\}\}/g, extrasHtml);

    // Equipamentos
    const eqDB = safeArray(rdo.rdo_equipamentos).map((e: any) => ({
      nome: e.equipamentos?.nome || 'Equipamento', status: e.status, horasUso: e.horas_uso, obs: e.observacoes
    }));
    const eqJSON = safeArray(detalhes.equipamentos);
    const eqData = [...eqDB, ...eqJSON];

    const equipamentosHtml = eqData.length ? eqData.map((e: any) => `
      <tr>
        <td>${e.nome || '-'}</td>
        <td>1</td>
        <td>${e.horasUso ? e.horasUso + 'h' : '-'}</td>
        <td>-</td>
        <td>${e.obs || '-'}</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.equipamentos\}\}/g, equipamentosHtml);

    // Ocorrencias
    const ocorrenciasData = safeArray(detalhes.equipamentosQuebrados); // and acidentes
    const ocorrenciasHtml = ocorrenciasData.length ? ocorrenciasData.map((o: any) => `
      <tr>
        <td>${o.tipoOcorrencia || 'Geral'}</td>
        <td>${o.descricaoProblema || o.descricao || '-'}</td>
        <td>${safeArray(o.envolvidos).join(', ') || '-'}</td>
        <td>${o.acoesTomadas || '-'}</td>
        <td><span class="status-badge status-resolvido">Registrado</span></td>
        <td>${o.horasParada ? o.horasParada + 'h' : '-'}</td>
      </tr>
    `).join('') : emptyMsg;
    templateHtml = templateHtml.replace(/\{\{rdo\.ocorrencias\}\}/g, ocorrenciasHtml);

    // Anexos
    const documentosGeral = safeArray(rdo.documentos);
    const fotos = documentosGeral.filter((d: any) => d.tipo && (d.tipo.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(d.tipo)));
    const docs = documentosGeral.filter((d: any) => !fotos.includes(d));

    templateHtml = templateHtml.replace(/\{\{anexos\.total\}\}/g, documentosGeral.length.toString());

    const fotosHtml = fotos.length ? fotos.map((f: any) => `
      <div class="gallery-item">
          <!-- O ideal seria ter uma tag img aqui, mas usaremos placeholders p/ n quebrar PDF s/ URL publica -->
          <div style="width: 100%; height: 70px; background-color: #e0e0e0; border: 1px solid #ccc; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 9pt;">Img: ${f.nome || 'Imagem'}</div>
          <div class="gallery-caption">${f.nome || 'Foto'}</div>
      </div>
    `).join('') : '<div class="empty-message">Nenhum registro nesta seção.</div>';
    templateHtml = templateHtml.replace(/\{\{anexos\.imagens\}\}/g, fotosHtml);

    const docsHtml = docs.length ? docs.map((d: any) => `
      <div class="attachment-item">
          <div class="attachment-info">
              <div class="attachment-name">Anexo: ${d.nome || 'Documento'}</div>
              <div class="attachment-meta">${d.tipo || 'Arquivo'}</div>
          </div>
      </div>
    `).join('') : '<div class="empty-message">Nenhum registro nesta seção.</div>';
    templateHtml = templateHtml.replace(/\{\{anexos\.documentos\}\}/g, docsHtml);

    // Identificação
    templateHtml = templateHtml.replace(/\{\{usuario\.nome\}\} - \{\{usuario\.cargo\}\} - \{\{rdo\.data_elaboracao\}\}/g,
      `${responsavelNome} - ${responsavelCargo} - ${formatData(rdo.created_at)}`);

    if (rdo.status === 'Aprovado') {
      templateHtml = templateHtml.replace(/\{\{status_aprovacao\}\}/g,
        `<div class="identification-field" style="background-color: #e6ffe6; border-color: #99cc99;"><strong>Aprovado por:</strong> ${aprovadorNome} - ${aprovadorCargo} - ${formatData(rdo.updated_at)}</div>`);
    } else {
      templateHtml = templateHtml.replace(/\{\{status_aprovacao\}\}/g,
        `<div class="identification-field" style="background-color: #fff8e6; border-color: #ffcc66;"><strong>Status:</strong> Aguardando aprovação</div>`);
    }

    templateHtml = templateHtml.replace(/\{\{rdo\.data_geracao\}\}/g, new Date().toLocaleString('pt-BR'));

    // 5. Convert to PDF using Gotenberg Demo API (no API key required)
    console.log('Using Gotenberg Demo API for PDF generation');

    let pdfBuffer: ArrayBuffer;

    const formData = new FormData();
    // Gotenberg expects a file named index.html
    const htmlFile = new File([templateHtml], "index.html", { type: "text/html" });
    formData.append('files', htmlFile);
    // Add margin parameters
    formData.append('marginTop', '0.59in'); // 15mm
    formData.append('marginBottom', '0.59in');
    formData.append('marginLeft', '0.59in');
    formData.append('marginRight', '0.59in');

    const response = await fetch('https://demo.gotenberg.dev/forms/chromium/convert/html', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Gotenberg error: ${await response.text()}`);
    }

    pdfBuffer = await response.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RDO-${numStr}.pdf"`
      },
    });

  } catch (err: any) {
    console.error('Error generating PDF:', err);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
