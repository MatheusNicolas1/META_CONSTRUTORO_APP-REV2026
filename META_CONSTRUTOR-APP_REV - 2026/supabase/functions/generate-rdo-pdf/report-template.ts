export type ReportMetaItem = {
  label: string;
  value: unknown;
};

export type ReportTableColumn = {
  key: string;
  label: string;
};

export type ReportAttachment = {
  name: string;
  type?: string;
  base64?: string;
};

export type ReportSection = {
  title: string;
  description?: string;
  meta?: ReportMetaItem[];
  columns?: ReportTableColumn[];
  rows?: Record<string, unknown>[];
  notes?: string[];
  attachments?: ReportAttachment[];
};

export type GenericReportPayload = {
  reportType: string;
  title: string;
  subtitle?: string;
  generatedAt?: string;
  meta?: ReportMetaItem[];
  sections?: ReportSection[];
};

const EMPTY_MESSAGE_HTML = 'NENHUM REGISTRO NESTA SE&Ccedil;&Atilde;O';

const escapeHtml = (value: unknown): string => {
  const text = value === null || value === undefined || value === '' ? '-' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const normalizeType = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

export const makeReportFilename = (reportType: string, generatedAt = new Date().toISOString()): string => {
  const parsedDate = new Date(generatedAt);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `RELATORIO_${normalizeType(reportType || 'GERAL')}_${yyyy}-${mm}-${dd}.PDF`;
};

const renderMetaGrid = (items?: ReportMetaItem[]): string => {
  if (!items?.length) return `<div class="empty-message">${EMPTY_MESSAGE_HTML}</div>`;

  return `
    <div class="info-grid">
      ${items.map((item) => `
        <div class="info-item">
          <span class="info-label">${escapeHtml(item.label)}</span>
          <div class="info-value">${escapeHtml(item.value)}</div>
        </div>
      `).join('')}
    </div>
  `;
};

const renderTable = (columns?: ReportTableColumn[], rows?: Record<string, unknown>[]): string => {
  if (!columns?.length || !rows?.length) {
    return `<div class="empty-message">${EMPTY_MESSAGE_HTML}</div>`;
  }

  return `
    <table>
      <thead>
        <tr>
          ${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const renderNotes = (notes?: string[]): string => {
  if (!notes?.length) return '';
  return `
    <div class="observations-box">
      ${notes.map((note) => escapeHtml(note)).join('<br>')}
    </div>
  `;
};

const renderAttachments = (attachments?: ReportAttachment[]): string => {
  if (!attachments?.length) return `<div class="empty-message">${EMPTY_MESSAGE_HTML}</div>`;

  const images = attachments.filter((attachment) => {
    const type = attachment.type?.toLowerCase() || '';
    return type.startsWith('image/') && attachment.base64;
  });
  const docs = attachments.filter((attachment) => !images.includes(attachment));

  return `
    ${images.length ? `
      <h4>Imagens</h4>
      <div class="gallery">
        ${images.map((image) => `
          <div class="gallery-item">
            <img class="gallery-image" src="${escapeHtml(image.base64)}" />
            <div class="gallery-caption">${escapeHtml(image.name)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${docs.length ? `
      <h4>Outros Documentos</h4>
      ${docs.map((doc) => `
        <div class="attachment-item">
          <div class="attachment-icon">DOC</div>
          <div class="attachment-info">
            <div class="attachment-name">${escapeHtml(doc.name)}</div>
            <div class="attachment-meta">${escapeHtml(doc.type || 'Arquivo')}</div>
          </div>
        </div>
      `).join('')}
    ` : ''}
  `;
};

const renderSection = (section: ReportSection, index: number): string => {
  const body = [
    section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : '',
    section.meta?.length ? renderMetaGrid(section.meta) : '',
    section.columns?.length ? renderTable(section.columns, section.rows) : '',
    section.notes?.length ? renderNotes(section.notes) : '',
    section.attachments ? renderAttachments(section.attachments) : ''
  ].filter(Boolean).join('');

  return `
    <div class="section">
      <div class="section-title">${index + 1}. ${escapeHtml(section.title)}</div>
      ${body || `<div class="empty-message">${EMPTY_MESSAGE_HTML}</div>`}
    </div>
  `;
};

export const buildGenericReportHtml = (payload: GenericReportPayload): string => {
  const generatedAt = payload.generatedAt || new Date().toLocaleString('pt-BR');
  const sections = [...(payload.sections || [])];
  while (sections.length < 8) {
    sections.push({ title: ['Resumo', 'Filtros', 'Indicadores', 'Detalhamento', 'Consolidado', 'Ocorrencias', 'Observacoes', 'Anexos'][sections.length] });
  }
  const limitedSections = sections.slice(0, 8);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(payload.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: A4;
      margin: 15mm;
      @bottom-right {
        content: "P\\00C1GINA " counter(page) " DE " counter(pages) " | GERADO EM ${escapeHtml(generatedAt)}";
        font-size: 7pt;
        color: #777;
      }
    }
    body {
      font-family: Roboto, Helvetica, Arial, sans-serif;
      color: #333;
      line-height: 1.3;
      font-size: 8.5pt;
      background: #fff;
    }
    .container { background: #fff; padding: 0; }
    .header {
      border-bottom: 2px solid #0066cc;
      padding: 10px 0 8px 0;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
    }
    .logo { font-size: 16px; font-weight: 700; color: #0066cc; margin-bottom: 3px; }
    .header-title { font-size: 15pt; font-weight: 700; color: #0066cc; margin-bottom: 5px; text-transform: uppercase; }
    .header-subtitle { color: #666; font-size: 8.5pt; }
    .header-right { text-align: right; font-size: 7.5pt; color: #666; min-width: 170px; }
    .header-info { margin-bottom: 3px; }
    .header-info-label { font-weight: 600; color: #333; }
    .section { margin-bottom: 15px; page-break-inside: avoid; }
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #fff;
      background: #0066cc;
      padding: 6px 10px;
      margin-bottom: 10px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .section-description { margin-bottom: 8px; color: #555; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
    .info-item { border: 1px solid #ddd; padding: 7px; background: #f9f9f9; border-radius: 3px; }
    .info-label { display: block; font-weight: 600; color: #0066cc; font-size: 7.5pt; text-transform: uppercase; margin-bottom: 3px; }
    .info-value { color: #333; font-size: 9pt; word-break: break-word; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th { background: #e8e8e8; color: #333; padding: 6px; text-align: left; font-weight: 600; border: 1px solid #ccc; text-transform: uppercase; font-size: 7pt; }
    td { padding: 6px; border: 1px solid #ddd; color: #333; vertical-align: top; }
    tbody tr:nth-child(even) { background: #f9f9f9; }
    .empty-message {
      background: #f0f0f0;
      border-left: 3px solid #0066cc;
      padding: 8px;
      margin-bottom: 10px;
      color: #666;
      font-style: italic;
      border-radius: 3px;
      font-size: 8pt;
      text-transform: uppercase;
    }
    .observations-box { background: #f9f9f9; border: 1px solid #ddd; padding: 8px; border-radius: 3px; min-height: 30px; white-space: pre-wrap; word-wrap: break-word; font-size: 9pt; }
    .gallery { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; }
    .gallery-item { text-align: center; }
    .gallery-image { max-width: 100%; max-height: 70px; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 5px; object-fit: contain; }
    .gallery-caption { font-size: 6.5pt; color: #666; word-break: break-word; }
    .attachment-item { display: flex; align-items: center; gap: 6px; padding: 6px; border: 1px solid #ddd; margin-bottom: 6px; border-radius: 3px; background: #f9f9f9; }
    .attachment-icon { font-size: 7pt; min-width: 22px; text-align: center; color: #0066cc; font-weight: 700; }
    .attachment-name { font-weight: 600; color: #333; font-size: 8.5pt; }
    .attachment-meta { font-size: 6.5pt; color: #999; margin-top: 2px; }
    .footer { border-top: 2px solid #0066cc; padding-top: 12px; margin-top: 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
    .signature-block { text-align: center; }
    .signature-line { border-bottom: 1px solid #333; margin-bottom: 8px; height: 30px; }
    .signature-label { font-size: 8pt; font-weight: 600; color: #333; text-transform: uppercase; }
    .page-info { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">MetaConstrutor</div>
        <div class="header-title">${escapeHtml(payload.title)}</div>
        <div class="header-subtitle">${escapeHtml(payload.subtitle || 'Relatorio gerado pela central de relatorios')}</div>
      </div>
      <div class="header-right">
        <div class="header-info"><span class="header-info-label">Tipo:</span> ${escapeHtml(payload.reportType)}</div>
        <div class="header-info"><span class="header-info-label">Gerado em:</span> ${escapeHtml(generatedAt)}</div>
      </div>
    </div>

    ${payload.meta?.length ? renderMetaGrid(payload.meta) : ''}
    ${limitedSections.map(renderSection).join('')}

    <div class="footer">
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Responsavel pela Obra</div>
      </div>
      <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-label">Gestor do Contrato</div>
      </div>
    </div>
    <div class="page-info">P&Aacute;GINA <span class="page-number"></span> DE <span class="total-pages"></span> | GERADO EM ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>`;
};
