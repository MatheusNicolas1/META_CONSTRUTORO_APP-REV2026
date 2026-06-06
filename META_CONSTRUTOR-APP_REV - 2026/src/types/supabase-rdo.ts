export interface DocumentoSupabase {
    id: number;
    nome: string;
    tipo: string;
    url: string;
    categoria: string;
    tamanho?: number;
    uploaded_by: string;
    rdo_id: string;
    created_at?: string;
}

export interface ObraSupabase {
    nome: string;
}

export interface RDOSupabase {
    id: string;
    data: string;
    obra_id: string; // Foreign key
    periodo: string;
    clima: string;
    status: string;
    equipe_ociosa: boolean;
    tempo_ocioso?: number;
    observacoes?: string;
    criado_por_id: string;
    approved_by?: string | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    aprovado_por_id?: string | null;
    data_aprovacao?: string | null;
    motivo_rejeicao?: string | null;
    created_at: string;
    updated_at?: string;
    org_id: string;

    // Joined fields
    obras?: ObraSupabase; // Could be null if join fails or optional? Usually object or null.
    documentos?: DocumentoSupabase[];
}
