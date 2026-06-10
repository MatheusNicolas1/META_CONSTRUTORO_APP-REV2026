// Status do RDO para fluxo de aprovacao. Mantem legados em portugues durante a migracao.
export type RDOStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'Em elaboração'
  | 'Aguardando aprovação'
  | 'Aprovado'
  | 'Rejeitado';

export interface RDO {
  id: string; // UUID
  data: string;
  obraId: string;
  obraNome: string;
  periodo: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Meio período' | 'Turno noturno' | 'Turno estendido' | 'Personalizado' | 'Múltiplos';
  clima: string;
  equipeOciosa: boolean;
  tempoOcioso?: number; // em horas

  // Campos de controle e aprovação
  status: RDOStatus;
  numero?: number;
  criadoPorId: string;
  criadoPorNome: string;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  dataAprovacao?: string;
  motivoRejeicao?: string;
  atividadesRealizadas: AtividadeRDO[];
  atividadesExtras: AtividadeExtraRDO[];
  equipesPresentes: EquipeRDO[];
  equipamentosUtilizados: EquipamentoRDO[];
  equipamentosQuebrados: EquipamentoQuebradoRDO[];
  acidentes: AcidenteRDO[];
  materiaisFalta: MaterialFaltaRDO[];
  estoqueMateriais: EstoqueMaterialRDO[];
  observacoes: string;
  imagens: ImagemRDO[];
  documentos: DocumentoRDO[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface AtividadeRDO {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidadeMedida: string;
  percentualConcluido: number; // 0 a 100
  status: 'Iniciada' | 'Em Andamento' | 'Concluída';
  observacoes?: string;
}

export interface AtividadeExtraRDO {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  unidadeMedida: string;
  percentualConcluido: number;
  justificativa: string;
}

export interface EquipeRDO {
  id: string;
  nome: string;
  funcao: string;
  horasTrabalho: number;
  presente: boolean;
  horasOciosas?: number;
}

export interface EquipamentoRDO {
  id: string;
  nome: string;
  categoria: string;
  horasUso: number;
  status: 'Operacional' | 'Manutenção' | 'Parado';
  observacoes?: string;
}

export interface EquipamentoQuebradoRDO {
  id: string;
  nome: string;
  categoria: string;
  descricaoProblema: string;
  causouOciosidade: boolean;
  horasParada?: number;
  impactoProducao: string;
  issueType: 'equipment' | 'occurrence';
  tipoOcorrencia?: string;
  envolvidos?: string[];
  acoesTomadas?: string;
}

export interface AcidenteRDO {
  id: string;
  descricao: string;
  gravidade: 'Leve' | 'Moderado' | 'Grave';
  colaboradoresEnvolvidos: string[];
  horaOcorrencia: string;
  providenciasTomadas: string;
  precisouPararObra: boolean;
}

export interface MaterialFaltaRDO {
  id: string;
  nome: string;
  categoria: string;
  quantidadeNecessaria: number;
  unidadeMedida: string;
  impactoProducao: 'Baixo' | 'Médio' | 'Alto';
  prazoEntregaPrevisto?: string;
}

export interface EstoqueMaterialRDO {
  id: string;
  nome: string;
  categoria: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  unidadeMedida: string;
  alertaEstoqueMinimo: boolean;
}

export interface ImagemRDO {
  id: number;
  nome: string;
  url: string;
  descricao?: string;
  timestamp: string;
}

export interface DocumentoRDO {
  id: number;
  nome: string;
  tipo: string;
  url: string;
  descricao?: string;
  timestamp: string;
}

export interface CreateRDOData {
  data: string;
  obraId: string;
  periodo: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | 'Meio período' | 'Turno noturno' | 'Turno estendido' | 'Personalizado' | 'Múltiplos';
  clima: string;
  equipeOciosa: boolean;
  tempoOcioso?: number;
  nichoId?: string;
  atividadesRealizadas: Omit<AtividadeRDO, 'id'>[];
  atividadesExtras: Omit<AtividadeExtraRDO, 'id'>[];
  equipesPresentes: EquipeRDO[];
  equipamentosUtilizados: EquipamentoRDO[];
  equipamentosQuebrados: Omit<EquipamentoQuebradoRDO, 'id'>[];
  acidentes: Omit<AcidenteRDO, 'id'>[];
  materiaisFalta: Omit<MaterialFaltaRDO, 'id'>[];
  estoqueMateriais: Omit<EstoqueMaterialRDO, 'id'>[];
  observacoes: string;
  // Anexos (unified)
  files?: File[];
}

// Interfaces para aprovação e rejeição
export interface ApproveRDOData {
  rdoId: number;
  aprovadoPorId: string;
  observacoes?: string;
}

export interface RejectRDOData {
  rdoId: number;
  rejeitadoPorId: string;
  motivoRejeicao: string;
}

// Interface para exportação
export interface ExportRDOOptions {
  format: 'pdf';
  includeImages: boolean;
  includeDocuments: boolean;
  emailTo?: string[];
}

// ============================================================
// Tipos para Nichos e Agendas (PRD_NICHOS_RDO.md)
// ============================================================

export interface RDONicho {
  id: string;
  org_id: string;
  nome: string;
  slug: string;
  descricao?: string;
  cor: string;
  icone: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface RDOAgenda {
  id: string;
  org_id: string;
  data: string;
  titulo?: string;
  resumo_geral?: string;
  clima_geral?: string;
  observacoes_gestor?: string;
  criado_por_id: string;
  created_at: string;
  updated_at: string;
}

export interface ResumoNicho {
  data: string;
  nicho: string;
  slug: string;
  total_rdos: number;
  total_atividades: number;
  total_equipes: number;
  ocorrencias: {
    tipo: string;
    descricao: string;
    gravidade?: string;
    impacto?: string;
  }[];
  materiais_em_falta: {
    nome: string;
    prioridade: string;
  }[];
  resumo_texto: string;
  colaboradores_envolvidos: string[];
  status_geral: 'NORMAL' | 'ATENÇÃO' | 'ALERTA' | 'CRÍTICO';
}

export interface ResumoGeral {
  data: string;
  total_rdos: number;
  total_nichos: number;
  nichos: {
    nicho: string;
    slug: string;
    total_rdos: number;
    ocorrencias_criticas: number;
    status: string;
    resumo_curto: string;
  }[];
  status_geral: 'NORMAL' | 'ATENÇÃO' | 'ALERTA' | 'CRÍTICO';
  resumo_geral: string;
}

export interface RDOAgendaFilter {
  orgId: string;
  dataInicio?: string;
  dataFim?: string;
}
