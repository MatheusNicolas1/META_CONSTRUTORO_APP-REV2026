import { jsPDF } from 'jspdf';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface RDOPdfData {
    id: string;
    numero?: number;
    data: string;
    periodo: string;
    clima: string;
    status: string;
    obraNome: string;
    obraLocal?: string;
    responsavel?: string;
    observacoes?: string;
    equipes?: Array<{ nome: string; funcao?: string; quantidade?: number }>;
    atividades?: Array<{ nome: string; status: string; percentual?: number; quantidade?: number; unidade?: string }>;
    equipamentos?: Array<{ nome: string; status: string; horasUso?: number; quantidade?: number }>;
    documentos?: Array<{ nome: string; tipo?: string }>;
    imagensBase64?: Array<{ nome: string; base64: string; mimeType: string }>;
    empresaLogo?: string; // Base64 opcional da logo do usuário/empresa
}

export interface RDOPdfResult {
    blob: Blob;
    filename: string;
}

// ── Helpers de cor ────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C_BLACK: RGB = [0, 0, 0];
const C_GRAY_BG: RGB = [238, 238, 238]; // Cinza dos cabeçalhos de tabela
const C_WHITE: RGB = [255, 255, 255];
const C_L_GRAY: RGB = [245, 245, 245];
const C_SUCCESS: RGB = [34, 197, 94]; // Verde "Aprovado"

function fill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function text(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch { return dateStr; }
}

function getDiaSemana(dateStr: string): string {
    try {
        const [y, mm, dd] = dateStr.split('-');
        const date = new Date(Number(y), Number(mm) - 1, Number(dd));
        const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return dias[date.getDay()];
    } catch { return '—'; }
}

export async function generateRDOPdf(rdo: RDOPdfData): Promise<RDOPdfResult> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = 210;
    const m = 10;
    const cw = pw - m * 2;
    let y = m;

    const drawCell = (x: number, cY: number, w: number, h: number, txt: string, align: 'left' | 'center' | 'right' = 'left', isBold = false, fillC?: RGB, textC?: RGB, italic = false) => {
        if (fillC) {
            fill(doc, fillC);
            doc.rect(x, cY, w, h, 'F');
        }
        stroke(doc, C_BLACK);
        doc.setLineWidth(0.2);
        doc.rect(x, cY, w, h, 'S');

        doc.setFont('helvetica', italic ? 'italic' : (isBold ? 'bold' : 'normal'));
        doc.setFontSize(8);
        if (textC) text(doc, textC);
        else text(doc, C_BLACK);

        const textY = cY + h / 2 + 1.2;
        let textX = x + 2;
        if (align === 'center') textX = x + w / 2;
        if (align === 'right') textX = x + w - 2;

        const maxW = w - 4;
        let finalTxt = txt;
        if (doc.getTextWidth(finalTxt) > maxW) {
            finalTxt = doc.splitTextToSize(txt, maxW)[0] + '...';
        }

        doc.text(finalTxt, textX, textY, { align: align === 'left' ? undefined : align });
    };

    const drawMultiLineCell = (x: number, cY: number, w: number, h: number, lines: string[], aligns: ('left' | 'center')[], bolds: boolean[]) => {
        stroke(doc, C_BLACK);
        doc.setLineWidth(0.2);
        doc.rect(x, cY, w, h, 'S');

        const lineH = h / lines.length;
        lines.forEach((txt, i) => {
            const isBold = bolds[i] || false;
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setFontSize(8);
            text(doc, C_BLACK);

            const align = aligns[i] || 'center';
            const textY = cY + (i * lineH) + lineH / 2 + 1.2;
            let textX = align === 'center' ? x + w / 2 : x + 2;
            doc.text(txt, textX, textY, { align: align === 'left' ? undefined : align });
        });
    }

    const checkPage = (heightNeeded: number) => {
        if (y + heightNeeded > 280) {
            doc.addPage();
            y = m;
            return true;
        }
        return false;
    };

    // --- TOPO (STATUS) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(doc, C_BLACK);
    const rdoNum = rdo.numero?.toString() || rdo.id.substring(0, 8);
    const dateFormatted = formatDate(rdo.data);
    doc.text(`Relatório ${dateFormatted} n° ${rdoNum}`, m, y + 4);

    if (rdo.status === 'Aprovado') {
        const badgeW = 20;
        fill(doc, C_SUCCESS);
        doc.rect(pw - m - badgeW, y, badgeW, 5, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); text(doc, C_WHITE);
        doc.text('Aprovado', pw - m - badgeW + badgeW / 2, y + 3.5, { align: 'center' });
    }
    y += 8;

    // --- CABEÇALHO MAIN ---
    const totalHeaderH = 48;
    const rightColW = 75;
    const leftColW = cw - rightColW;

    // Borda externa
    stroke(doc, C_BLACK);
    doc.setLineWidth(0.2);
    doc.rect(m, y, cw, totalHeaderH, 'S');

    // Tabela direita do cabeçalho
    const rx = pw - m - rightColW;
    const rightRowH = totalHeaderH / 7;
    const rightSideInfos = [
        ['RDO n°:', rdoNum],
        ['Contrato:', '—'],
        ['Prazo Contratual:', '—'],
        ['Prazo Decorrido:', '—'],
        ['Prazo a Vencer:', '—'],
        ['Data do Relatório:', dateFormatted],
        ['Dia da Semana:', getDiaSemana(rdo.data)]
    ];

    rightSideInfos.forEach((row, i) => {
        const currY = y + i * rightRowH;
        // Desenha label (35mm) e valor (resto)
        drawCell(rx, currY, 35, rightRowH, row[0], 'left', true);
        drawCell(rx + 35, currY, rightColW - 35, rightRowH, row[1], 'left');
    });

    // --- CAIXA ESQUERDA ---
    const logoAreaH = totalHeaderH - (5 + 6 + 6 + 6); // 48 - 23 = 25mm de altura para a logo

    if (rdo.empresaLogo) {
        try {
            const logoType = rdo.empresaLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            const base64Data = rdo.empresaLogo.split(',')[1] || rdo.empresaLogo;
            // Preservando +- proporção colocando a logo centralizada num square de w=35 h=22 
            // no centro da parte da logo (leftColW / 2 = 57.5) -> (57.5 - 17.5 = 40)
            doc.addImage(base64Data, logoType, m + (leftColW / 2) - 17.5, y + 1.5, 35, logoAreaH - 3);
        } catch (e) { console.error('Error adding logo', e); }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        text(doc, C_BLACK);
        doc.text('META', m + leftColW / 2, y + 10, { align: 'center' });
        text(doc, [255, 165, 0]); // Laranja "Construction"
        doc.text('CONSTRUTOR', m + leftColW / 2, y + 18, { align: 'center' });
    }

    let leftY = y + logoAreaH;

    // Título Centralizado "Relatório Diário de Obra (RDO)"
    drawCell(m, leftY, leftColW, 5, 'Relatório Diário de Obra (RDO)', 'center', true, C_L_GRAY);
    leftY += 5;

    // Infos Obra (esquerda bottom)
    const lblW = 20;
    const txtW = leftColW - lblW;
    drawCell(m, leftY, lblW, 6, 'Obra:', 'left', true, C_GRAY_BG);
    drawCell(m + lblW, leftY, txtW, 6, rdo.obraNome, 'left');
    leftY += 6;

    drawCell(m, leftY, lblW, 6, 'Local:', 'left', true, C_GRAY_BG);
    drawCell(m + lblW, leftY, txtW, 6, rdo.obraLocal || '—', 'left');
    leftY += 6;

    drawCell(m, leftY, lblW, 6, 'Cliente:', 'left', true, C_GRAY_BG);
    drawCell(m + lblW, leftY, txtW, 6, rdo.responsavel || '—', 'left');

    y += totalHeaderH + 3;

    // --- HORÁRIO e CLIMA ---
    const hcH = 5;
    const cw1 = 65; // Horário de Trabalho
    const cw2 = 25; // Horas Trabalhadas
    const cw3 = 30; // Condição climática
    const cw4 = 35; // Tempo
    const cw5 = 35; // Condição

    drawCell(m, y, cw1, hcH, 'Horário de trabalho', 'left', true, C_GRAY_BG);
    drawCell(m + cw1, y, cw2, hcH, 'Horas trabalhadas', 'left', true, C_GRAY_BG);
    drawCell(m + cw1 + cw2, y, cw3, hcH, 'Condição climática', 'left', true, C_GRAY_BG);
    drawCell(m + cw1 + cw2 + cw3, y, cw4, hcH, 'Tempo', 'left', true, C_GRAY_BG);
    drawCell(m + cw1 + cw2 + cw3 + cw4, y, cw5, hcH, 'Condição', 'left', true, C_GRAY_BG);
    y += hcH;

    const horasTrabalhadas = rdo.periodo === 'Integral' ? '09:00' : (rdo.periodo === 'Manhã' ? '04:00' : '05:00');

    // Entradas Manhã
    drawCell(m, y, cw1 / 2, hcH, 'Entrada / Saída', 'left');
    drawCell(m + cw1 / 2, y, cw1 / 2, hcH, '07:00 - 17:00', 'left');

    // Cell grande para Horas Trabalhadas (2 linhas vertical)
    drawCell(m + cw1, y, cw2, hcH * 2, horasTrabalhadas, 'center', true);

    drawCell(m + cw1 + cw2, y, cw3, hcH, 'Manhã', 'left');
    drawCell(m + cw1 + cw2 + cw3, y, cw4, hcH, rdo.clima, 'left');

    const condC = rdo.clima.toLowerCase().includes('chuva') ? 'Impraticável' : 'Praticável';
    const cColor = condC === 'Impraticável' ? [220, 38, 38] as RGB : C_BLACK;
    drawCell(m + cw1 + cw2 + cw3 + cw4, y, cw5, hcH, condC, 'left', false, undefined, cColor, condC === 'Impraticável');
    y += hcH;

    // Entradas Tarde
    drawCell(m, y, cw1 / 2, hcH, 'Intervalo', 'left');
    drawCell(m + cw1 / 2, y, cw1 / 2, hcH, '12:00 - 13:00', 'left');
    drawCell(m + cw1 + cw2, y, cw3, hcH, 'Tarde', 'left');
    drawCell(m + cw1 + cw2 + cw3, y, cw4, hcH, rdo.clima, 'left');
    drawCell(m + cw1 + cw2 + cw3 + cw4, y, cw5, hcH, condC, 'left', false, undefined, cColor, condC === 'Impraticável');
    y += hcH;

    y += 3;

    // --- MÃO DE OBRA ---
    const numManpower = rdo.equipes?.length || 0;
    checkPage(hcH + 12);
    drawCell(m, y, cw, hcH, `Mão de Obra (${numManpower})`, 'left', true, C_GRAY_BG);
    y += hcH;

    if (numManpower > 0) {
        // Layout de tabela dividida em 2 painéis
        const colCount = 2;
        const painelW = cw / colCount;
        const subColNomeW = painelW * 0.8;
        const subColQtdW = painelW * 0.2;

        // Desenhar Header
        for (let i = 0; i < colCount; i++) {
            drawCell(m + i * painelW, y, subColNomeW, 5, 'Equipe / Função', 'center', true, C_L_GRAY);
            drawCell(m + i * painelW + subColNomeW, y, subColQtdW, 5, 'Qtd', 'center', true, C_L_GRAY);
        }
        y += 5;

        for (let i = 0; i < numManpower; i += colCount) {
            checkPage(6);
            for (let j = 0; j < colCount; j++) {
                const idx = i + j;
                const pX = m + j * painelW;
                if (idx < numManpower) {
                    const eq = rdo.equipes![idx];
                    const eqNome = eq.funcao ? `${eq.nome} (${eq.funcao})` : eq.nome;
                    const qnd = eq.quantidade || 1;
                    drawCell(pX, y, subColNomeW, 5, eqNome, 'left');
                    drawCell(pX + subColNomeW, y, subColQtdW, 5, qnd.toString(), 'center');
                } else {
                    drawCell(pX, y, subColNomeW, 5, '', 'left');
                    drawCell(pX + subColNomeW, y, subColQtdW, 5, '', 'center');
                }
            }
            y += 5;
        }
    } else {
        drawCell(m, y, cw, 6, 'Nenhuma mão de obra registrada.', 'center');
        y += 6;
    }
    y += 3;

    // --- EQUIPAMENTOS ---
    const numEqps = rdo.equipamentos?.length || 0;
    checkPage(hcH + 12);
    drawCell(m, y, cw, hcH, `Equipamentos (${numEqps})`, 'left', true, C_GRAY_BG);
    y += hcH;

    if (numEqps > 0) {
        // Layout de tabela dividida em 2 painéis
        const colCount = 2;
        const painelW = cw / colCount;
        const subColNomeW = painelW * 0.7;
        const subColStsW = painelW * 0.3;

        for (let i = 0; i < colCount; i++) {
            drawCell(m + i * painelW, y, subColNomeW, 5, 'Equipamento', 'center', true, C_L_GRAY);
            drawCell(m + i * painelW + subColNomeW, y, subColStsW, 5, 'Horas/Status', 'center', true, C_L_GRAY);
        }
        y += 5;

        for (let i = 0; i < numEqps; i += colCount) {
            checkPage(6);
            for (let j = 0; j < colCount; j++) {
                const idx = i + j;
                const pX = m + j * painelW;
                if (idx < numEqps) {
                    const eq = rdo.equipamentos![idx];
                    const val = eq.horasUso ? `${eq.horasUso} hrs` : eq.status;
                    drawCell(pX, y, subColNomeW, 5, eq.nome, 'left');
                    drawCell(pX + subColNomeW, y, subColStsW, 5, val, 'center');
                } else {
                    drawCell(pX, y, subColNomeW, 5, '', 'left');
                    drawCell(pX + subColNomeW, y, subColStsW, 5, '', 'center');
                }
            }
            y += 5;
        }
    } else {
        drawCell(m, y, cw, 6, 'Nenhum equipamento registrado.', 'center');
        y += 6;
    }
    y += 3;

    // --- ATIVIDADES ---
    const numAtivs = rdo.atividades?.length || 0;
    checkPage(hcH + 6);
    drawCell(m, y, cw, hcH, `Atividades / Tarefas (${numAtivs})`, 'left', true, C_GRAY_BG);
    y += hcH;

    if (numAtivs > 0) {
        drawCell(m, y, cw * 0.8, 5, 'Descrição da Atividade', 'center', true, C_L_GRAY);
        drawCell(m + cw * 0.8, y, cw * 0.2, 5, 'Status', 'center', true, C_L_GRAY);
        y += 5;

        rdo.atividades!.forEach(at => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
            const textLines = doc.splitTextToSize(at.nome, (cw * 0.8) - 4);
            const rH = Math.max(textLines.length * 4.5 + 2, 6);

            checkPage(rH);

            stroke(doc, C_BLACK); doc.setLineWidth(0.2);
            doc.rect(m, y, cw * 0.8, rH, 'S');
            text(doc, C_BLACK);
            doc.text(textLines, m + 2, y + 4.5);

            const atStatusText = at.status + (at.percentual ? ` (${at.percentual}%)` : '');
            stroke(doc, C_BLACK); doc.setLineWidth(0.2);
            doc.rect(m + cw * 0.8, y, cw * 0.2, rH, 'S');

            // splitTextToSize em status as vezes longo
            const atLines = doc.splitTextToSize(atStatusText, (cw * 0.2) - 2);
            doc.text(atLines, m + cw * 0.8 + 2, y + 4.5);

            y += rH;
        });
    } else {
        drawCell(m, y, cw, 6, 'Nenhuma atividade registrada.', 'center');
        y += 6;
    }
    y += 3;

    // --- OCORRÊNCIAS / OBSERVAÇÕES ---
    checkPage(hcH + 10);
    drawCell(m, y, cw, hcH, `Ocorrências / Observações`, 'left', true, C_GRAY_BG);
    y += hcH;

    if (rdo.observacoes && rdo.observacoes.trim() !== '') {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        const textLines = doc.splitTextToSize(rdo.observacoes, cw - 4);
        const rectH = Math.max(textLines.length * 4.5 + 4, 10);
        checkPage(rectH);
        stroke(doc, C_BLACK); doc.setLineWidth(0.2); doc.rect(m, y, cw, rectH, 'S');
        text(doc, C_BLACK);
        doc.text(textLines, m + 2, y + 4.5);
        y += rectH;
    } else {
        drawCell(m, y, cw, 10, 'Nenhuma observação registrada.', 'left');
        y += 10;
    }
    y += 3;

    // --- FOTOS ---
    const numFotos = rdo.imagensBase64?.length || 0;
    if (numFotos > 0) {
        checkPage(hcH + 30);
        drawCell(m, y, cw, hcH, `Galeria de Fotos (${numFotos})`, 'left', true, C_GRAY_BG);
        y += hcH;

        const imgW = (cw - 2) / 2; // Duas por linha, 2mm de espaco no meio // corrigido para não passar da borda direita da div
        const imgH = imgW * 0.7; // Ratio 16:9 ~ish

        let col = 0;
        let startY = y;

        rdo.imagensBase64!.forEach((img, idx) => {
            if (col === 0 && idx > 0) y += imgH + 6;

            if (checkPage(imgH + 6)) {
                startY = y;
            }

            const xImg = col === 0 ? m : m + imgW + 2;

            stroke(doc, C_BLACK); doc.rect(xImg, y, imgW, imgH + 6, 'S');
            try {
                // Remove prefixo caso venha na string base64
                const base64Data = img.base64.indexOf(',') > -1 ? img.base64.split(',')[1] : img.base64;
                doc.addImage(base64Data, img.mimeType.split('/')[1].toUpperCase(), xImg + 1, y + 1, imgW - 2, imgH - 1);
            } catch (e) {
                console.error('Error attaching image', e);
            }

            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); text(doc, C_BLACK);
            const legenda = doc.splitTextToSize(img.nome, imgW - 4)[0] || 'Imagem';
            doc.text(legenda, xImg + imgW / 2, y + imgH + 4, { align: 'center' });

            col = (col + 1) % 2;
        });
        y += imgH + 6;
    }

    // --- RODAPÉ (Páginas) ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); text(doc, C_BLACK);
        doc.text(`${i} / ${totalPages}`, pw - m, 290, { align: 'right' });
    }

    const blob = doc.output('blob');
    const dataStr = rdo.data.split('-').reverse().join('');
    const num = rdo.numero ?? rdo.id.substring(0, 8);
    const filename = `RDO_${num}_${dataStr}.pdf`;

    return { blob, filename };
}
