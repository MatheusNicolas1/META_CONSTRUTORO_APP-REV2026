import { z } from "zod";

export const rdoSchema = z.object({
  // Cabeçalho
  data: z.string().min(1, "Data é obrigatória"),
  obraId: z.string().min(1, "Obra é obrigatória"),
  periodo: z.enum(['Manhã', 'Tarde', 'Noite', 'Integral', 'Meio período', 'Turno noturno', 'Turno estendido', 'Personalizado', 'Múltiplos']),
  clima: z.string().min(1, "Clima é obrigatório"),
  equipeOciosa: z.boolean(),
  tempoOcioso: z.number().optional(),

  // Atividades
  atividadesRealizadas: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome da atividade é obrigatório"),
    categoria: z.string(),
    quantidade: z.number().min(0),
    unidadeMedida: z.string(),
    percentualConcluido: z.number().min(0).max(100),
    status: z.enum(['Iniciada', 'Em Andamento', 'Concluída']),
    observacoes: z.string().optional(),
  })),

  atividadesExtras: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome da atividade é obrigatório"),
    descricao: z.string(),
    categoria: z.string(),
    quantidade: z.number().min(0),
    unidadeMedida: z.string(),
    percentualConcluido: z.number().min(0).max(100),
    justificativa: z.string().min(1, "Justificativa é obrigatória"),
  })),

  // Equipes
  equipesPresentes: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do colaborador é obrigatório"),
    funcao: z.string(),
    horasTrabalho: z.number().min(0).max(24),
    presente: z.boolean(),
    horasOciosas: z.number().optional(),
  })),

  // Equipamentos
  equipamentosUtilizados: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do equipamento é obrigatório"),
    categoria: z.string(),
    horasUso: z.number().min(0).max(24),
    status: z.enum(['Operacional', 'Manutenção', 'Parado']),
    observacoes: z.string().optional(),
  })),

  equipamentosQuebrados: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do equipamento é obrigatório"),
    categoria: z.string(),
    descricaoProblema: z.string().min(1, "Descrição do problema é obrigatória"),
    causouOciosidade: z.boolean(),
    horasParada: z.number().optional(),
    impactoProducao: z.string(),
    // Novos campos para problemas e ocorrências
    issueType: z.enum(['equipment', 'occurrence']),
    // Campos específicos para ocorrências
    tipoOcorrencia: z.string().optional(),
    envolvidos: z.array(z.string()).optional(),
    acoesTomadas: z.string().optional(),
  })),

  // Segurança
  acidentes: z.array(z.object({
    id: z.string().optional(),
    descricao: z.string().min(1, "Descrição do acidente é obrigatória"),
    gravidade: z.enum(['Leve', 'Moderado', 'Grave']),
    colaboradoresEnvolvidos: z.array(z.string()),
    horaOcorrencia: z.string(),
    providenciasTomadas: z.string().min(1, "Providências são obrigatórias"),
    precisouPararObra: z.boolean(),
  })),

  // Materiais
  materiaisFalta: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do material é obrigatório"),
    categoria: z.string(),
    quantidadeNecessaria: z.number().min(0),
    unidadeMedida: z.string(),
    impactoProducao: z.enum(['Baixo', 'Médio', 'Alto']),
    prazoEntregaPrevisto: z.string().optional(),
  })),

  estoqueMateriais: z.array(z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "Nome do material é obrigatório"),
    categoria: z.string(),
    quantidadeAtual: z.number().min(0),
    quantidadeMinima: z.number().min(0),
    unidadeMedida: z.string(),
    alertaEstoqueMinimo: z.boolean(),
  })),

  // Observações
  // Observações
  observacoes: z.string().optional(),

  // Anexos
  files: z.array(z.custom<File>()).optional(),
});

export type RDOFormData = z.infer<typeof rdoSchema>;