import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
// Importação do html2pdf - como o pacote não tem exportações default amigáveis de TS em certas bundlers, 
// a melhor forma é via await dynamic import ou require.
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { RdoPdfTemplate } from '../components/rdo/RdoPdfTemplate';

// --- Tipos Mantidos para compatibilidade com useRDODownload ---
export interface RDOPdfData {
    id: string;
    numero: string | number;
    data: string;
    obraNome: string;
    obraLocal?: string;
    responsavel?: string;
    cliente?: string;
    dataInicioObra?: string;
    previsaoTerminoObra?: string;
    status: string;
    aprovadoPor?: string;

    // Seção 1 — Condições Climáticas
    clima?: string;
    climaManha?: string;
    climaTarde?: string;

    // Seção 2 — Período de Trabalho
    periodo?: string;
    periodos?: Array<{ tipo: string; horarioInicio?: string; horarioFim?: string }>;
    equipeOciosa?: boolean;
    tempoOcioso?: number;

    // Seção 3 — Equipes Presentes
    equipes?: Array<{
        nome: string;
        funcao?: string;
        quantidade?: number;
        horasTrabalho?: number;
        presente?: boolean;
        horasOciosas?: number;
    }>;

    // Seção 4 — Atividades Realizadas
    atividades?: Array<{
        descricao: string;
        status: string;
        percentual?: number;
        quantidade?: number;
        unidade?: string;
        observacoes?: string;
    }>;
    atividadesExtras?: Array<{
        descricao: string;
        justificativa?: string;
        quantidade?: number;
        unidade?: string;
        percentual?: number;
    }>;

    // Seção 5 — Equipamentos Utilizados
    equipamentos?: Array<{
        nome: string;
        status: string;
        horasUso?: number;
        quantidade?: number;
        observacoes?: string;
    }>;

    // Seção 6 — Problemas e Ocorrências
    ocorrencias?: Array<{
        descricao: string;
        tipo?: string;
        envolvidos?: string[];
        acoesTomadas?: string;
        causouOciosidade?: boolean;
        horasParada?: number;
    }>;
    acidentes?: Array<{
        descricao: string;
        gravidade?: string;
        colaboradoresEnvolvidos?: string[];
        horaOcorrencia?: string;
        providenciasTomadas?: string;
        precisouPararObra?: boolean;
    }>;

    // Seção 7 — Observações Gerais
    observacoesTexto?: string;
    comentarios?: Array<{ autor: string; texto: string; data: string }>;

    // Seção 8 — Anexos
    fotos?: Array<{ url: string; legenda: string; base64: string; mimeType: string }>;
    documentos?: Array<{ nome: string; tipo?: string; url?: string }>;
    empresaLogo?: string;
}

export interface RDOPdfResult {
    blob: Blob;
    filename: string;
}

// ... lines truncated for clarity ...
export async function generateRDOPdf(rdo: RDOPdfData): Promise<RDOPdfResult> {
    return new Promise((resolve, reject) => {
        try {
            // 1. Cria um contêiner invisível no DOM
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '-9999px';
            // A largura de um A4 a 96DPI é de ~794px. Forçamos a largura pro canvas capturar corretamente.
            container.style.width = '794px';
            container.style.backgroundColor = 'white';
            container.style.color = '#333';

            document.body.appendChild(container);

            // 2. Renderiza o Template via React de forma síncrona
            const root = createRoot(container);
            flushSync(() => {
                root.render(<RdoPdfTemplate rdo={rdo} />);
            });

            // 3. Aguarda a renderização de fontes, imagens e reflow do DOM
            setTimeout(async () => {
                try {
                    const dataStr = rdo.data ? rdo.data.split('T')[0].split('-').reverse().join('') : new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
                    const num = rdo.numero ?? rdo.id.substring(0, 8);
                    const filename = `RDO_${num}_${dataStr}.pdf`;

                    // Configurações avançadas do HTML2PDF
                    const opt = {
                        margin: 0, // Margem já injetada no CSS do container do React (.pdf-container)
                        filename: filename,
                        image: { type: 'jpeg' as const, quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            letterRendering: true,
                            windowWidth: 794,
                            scrollY: 0
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
                        // Força quebras dinâmicas (como p.break-page do template)
                        pagebreak: { mode: ['css', 'legacy'] }
                    };

                    // 4. Executa a conversão e obtém o arquivo (Blob)
                    const blob = await html2pdf().set(opt).from(container).output('blob');

                    // 5. Cleanup
                    root.unmount();
                    document.body.removeChild(container);

                    resolve({ blob, filename });
                } catch (error) {
                    root.unmount();
                    document.body.removeChild(container);
                    console.error("Erro interno do html2pdf:", error);
                    reject(error);
                }
            }, 1000); // 1.0s wait para garantir que fotos em base64 e refs de img fiquem prontas

        } catch (e) {
            reject(e);
        }
    });
}
