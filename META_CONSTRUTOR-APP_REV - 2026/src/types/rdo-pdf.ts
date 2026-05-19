/**
 * Tipos para geração de PDF do RDO (Relatório Diário de Obra).
 * Usados tanto pelo componente de template React quanto pela Edge Function.
 */

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
