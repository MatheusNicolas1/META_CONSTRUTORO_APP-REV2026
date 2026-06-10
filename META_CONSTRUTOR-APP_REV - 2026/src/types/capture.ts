export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  companySize: string;
  timestamp: string;
  downloadCount: number;
}

export interface RDOWorkerRow {
  id: string;
  role: string;
  quantity: number;
  hours: number;
  totalHours: number;
}

export interface RDOEquipmentRow {
  id: string;
  name: string;
  quantity: number;
  status: 'Operacional' | 'Parado' | 'Manutenção';
  hoursWorked: number;
}

export interface RDOActivityRow {
  id: string;
  description: string;
  team: string;
  status: 'Concluído' | 'Em Andamento' | 'Não Iniciado';
  progress: number;
}

export interface Testimonial {
  name: string;
  handle: string;
  comment: string;
  initials?: string;
}
