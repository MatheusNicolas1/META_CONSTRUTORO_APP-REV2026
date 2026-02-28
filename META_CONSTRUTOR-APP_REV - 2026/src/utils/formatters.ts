export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatProgress = (current: number, total: number): string => {
  if (total === 0) return '0%';
  return Math.round((current / total) * 100) + '%';
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

export const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    // Legacy / UI Labels
    'Ativo': 'text-construction-green',
    'Em andamento': 'text-construction-orange',
    'Concluída': 'text-construction-green',
    'Concluído': 'text-construction-green',
    'Finalizando': 'text-construction-green',
    'Iniciando': 'text-construction-blue',
    'Pendente': 'text-construction-blue',
    'Pausada': 'text-yellow-500',
    'Inativo': 'text-red-500',
    'Manutenção': 'text-construction-orange',
    'Disponível': 'text-construction-blue',
    'Operacional': 'text-construction-green',
    'Parado': 'text-red-500',

    // DB Enums (Strict)
    'ACTIVE': 'text-construction-orange',
    'DRAFT': 'text-construction-blue',
    'ON_HOLD': 'text-yellow-500',
    'COMPLETED': 'text-construction-green',
    'CANCELED': 'text-red-500'
  };

  return statusColors[status] || 'text-muted-foreground';
};

export const getStatusBadgeColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    // Legacy / UI Labels
    'Ativo': 'bg-construction-green text-white',
    'Em andamento': 'bg-construction-orange text-white',
    'Concluída': 'bg-construction-green text-white',
    'Concluído': 'bg-construction-green text-white',
    'Finalizando': 'bg-construction-green text-white',
    'Iniciando': 'bg-construction-blue text-white',
    'Pendente': 'bg-construction-blue text-white',
    'Pausada': 'bg-yellow-500 text-white',
    'Inativo': 'bg-red-500 text-white',
    'Manutenção': 'bg-construction-orange text-white',
    'Disponível': 'bg-construction-blue text-white',
    'Operacional': 'bg-construction-green text-white',
    'Parado': 'bg-red-500 text-white',

    // DB Enums (Strict)
    'ACTIVE': 'bg-construction-orange text-white',
    'DRAFT': 'bg-construction-blue text-white',
    'ON_HOLD': 'bg-yellow-500 text-white',
    'COMPLETED': 'bg-construction-green text-white',
    'CANCELED': 'bg-red-500 text-white',
    'SUBMITTED': 'bg-construction-orange text-white',
    'APPROVED': 'bg-construction-green text-white',
    'REJECTED': 'bg-red-500 text-white'
  };

  return statusColors[status] || 'bg-muted text-muted-foreground';
};

export const formatStatusLabel = (status: string): string => {
  const statusLabels: { [key: string]: string } = {
    'ACTIVE': 'Iniciando',
    'DRAFT': 'Rascunho/Iniciando',
    'ON_HOLD': 'Pausada',
    'COMPLETED': 'Concluída',
    'CANCELED': 'Cancelada',
    'SUBMITTED': 'Aguardando aprovação',
    'APPROVED': 'Aprovado',
    'REJECTED': 'Rejeitado'
  };
  return statusLabels[status] || status;
};