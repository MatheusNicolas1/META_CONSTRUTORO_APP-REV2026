export interface Obra {
  id: string; // UUID
  nome: string;
  localizacao: string;
  responsavel: string;
  cliente: string;
  tipo: 'Residencial' | 'Comercial' | 'Industrial' | 'Infraestrutura' | 'Institucional';
  progresso: number;
  dataInicio: string;
  previsaoTermino: string;
  status: 'Iniciando' | 'Em andamento' | 'Finalizando' | 'Concluída' | 'Pausada' | 'ACTIVE' | 'DRAFT' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  atividades: number;
  descricao?: string;
  area?: string;
  categoria?: string;
  prioridade?: 'Baixa' | 'Média' | 'Alta';
  observacoes?: string;
  orcamento?: number;
  orcamento_previsto?: number;
  documentos?: {
    id: string;
    nome: string;
    tipo: string;
    categoria: string;
    tamanho: number | null;
    url: string;
    created_at: string;
    origem: 'Obra' | 'RDO';
    rdo_id?: string | null;
  }[];
  imagens?: {
    id: string;
    nome: string;
    tipo: string;
    url: string;
    previewUrl?: string | null;
    created_at: string;
    origem: 'Obra' | 'RDO';
    rdo_id?: string | null;
  }[];
  atividadesDetalhadas?: {
    id: string;
    nome: string;
    categoria: string;
    quantidade: number;
    unidadeMedida: string;
    percentualConcluido: number;
    status: string;
    data: string;
    rdoId: string;
    isExtra: boolean;
  }[];
  despesas?: {
    id: string;
    categoria: string;
    fornecedor: string;
    valor: number;
    status: string;
    data: string;
    notaFiscal: string;
  }[];
  // Extended properties for details view
  equipes?: { nome: string; membros: number; funcao: string; horasTrabalho?: number; ultimoRDO?: string }[];
  equipamentos?: { nome: string; status: string; categoria: string; horasUso?: number; ultimoRDO?: string }[];
  rdos?: { id: number; data: string; atividades: string; observacoes: string }[];
  financeiro?: {
    orcamentoTotal: number;
    valorExecutado: number;
    saldoRestante: number;
    itensOrcamento: {
      id: number;
      atividade: string;
      valorPrevisto: number;
      valorExecutado: number;
      diferenca: number;
      status: string;
      percentualExecutado: number;
    }[];
  };
}

export interface CreateObraData {
  nome: string;
  localizacao: string;
  responsavel: string;
  cliente: string;
  tipo: 'Residencial' | 'Comercial' | 'Industrial' | 'Infraestrutura' | 'Institucional';
  dataInicio: string;
  previsaoTermino: string;
  descricao?: string;
  area?: string;
  observacoes?: string;
}

export interface UpdateObraData extends Partial<CreateObraData> {
  id: string;
  progresso?: number;
  status?: Obra['status'];
}
