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
  // Extended properties for details view
  equipes?: { nome: string; membros: number; funcao: string }[];
  equipamentos?: { nome: string; status: string; categoria: string }[];
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