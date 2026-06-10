// Tipos para sistema de Checklist

export type ChecklistCategory = 
  | 'Segurança' 
  | 'Qualidade' 
  | 'Equipamentos' 
  | 'Documentação' 
  | 'Outros';

export type ChecklistItemPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type ChecklistItemStatus = 
  | 'Não iniciado' 
  | 'Em andamento' 
  | 'Concluído' 
  | 'Não conforme'
  | 'Não aplicável';

export type ChecklistStatus = 
  | 'Rascunho'
  | 'Em Andamento' 
  | 'Aguardando Aprovação'
  | 'Concluído' 
  | 'Pendente'
  | 'Cancelado';

export interface ChecklistAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  priority: ChecklistItemPriority;
  status: ChecklistItemStatus;
  requiresAttachment: boolean;
  isObligatory: boolean;
  attachments: ChecklistAttachment[];
  completedAt?: string;
  completedBy?: string;
  observations?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: ChecklistCategory;
  description: string;
  items: Omit<ChecklistItem, 'id' | 'status' | 'attachments' | 'completedAt' | 'completedBy' | 'observations'>[];
  createdAt: string;
  isActive: boolean;
}

export interface DigitalSignature {
  id: string;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatureData: string; // Base64 da assinatura
  ipAddress?: string;
  deviceInfo?: string;
}

export interface ChecklistResponsible {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Checklist {
  id: string;
  title: string;
  category: ChecklistCategory;
  description?: string;
  obra: {
    id: string;
    name: string;
  };
  responsible: ChecklistResponsible;
  items: ChecklistItem[];
  status: ChecklistStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  signature?: DigitalSignature;
  templateUsed?: {
    id: string;
    name: string;
  };
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export interface ChecklistFilters {
  search: string;
  obra: string;
  category: ChecklistCategory | 'all';
  status: ChecklistStatus | 'all';
  responsible: string;
  dateRange: {
    start?: string;
    end?: string;
  };
}

export interface ChecklistFormData {
  title: string;
  category: ChecklistCategory | '';
  description: string;
  obraId: string;
  responsibleId: string;
  dueDate: string;
  templateId?: string;
  items: ChecklistItem[];
}
