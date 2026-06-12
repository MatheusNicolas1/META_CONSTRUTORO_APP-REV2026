import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Eye,
  ListChecks,
} from 'lucide-react';
import { format, isToday, isYesterday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AgendaComResumo } from '@/hooks/useRDOAgenda';
import type { ResumoGeral } from '@/types/rdo';

// ============================================================
// Helpers
// ============================================================

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NORMAL: {
    label: 'Normal',
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  ATENÇÃO: {
    label: 'Atenção',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  ALERTA: {
    label: 'Alerta',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    icon: <ShieldAlert className="h-3 w-3" />,
  },
  CRÍTICO: {
    label: 'Crítico',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

const climaIcon = (clima?: string | null) => {
  if (!clima) return <Sun className="h-4 w-4 text-muted-foreground" />;
  const c = clima.toLowerCase();
  if (c.includes('sol') || c.includes('ensolarado') || c.includes('limpo'))
    return <Sun className="h-4 w-4 text-amber-500" />;
  if (c.includes('nublado') || c.includes('nuvem'))
    return <Cloud className="h-4 w-4 text-muted-foreground" />;
  if (c.includes('chuva') || c.includes('chuvoso'))
    return <CloudRain className="h-4 w-4 text-blue-500" />;
  if (c.includes('neve'))
    return <CloudSnow className="h-4 w-4 text-sky-300" />;
  if (c.includes('tempestade') || c.includes('raio'))
    return <CloudLightning className="h-4 w-4 text-purple-500" />;
  if (c.includes('vento'))
    return <Wind className="h-4 w-4 text-teal-500" />;
  return <Sun className="h-4 w-4 text-muted-foreground" />;
};

const formatDataLabel = (dataStr: string): string => {
  const date = parseISO(dataStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

const formatDataShort = (dataStr: string): string => {
  const date = parseISO(dataStr);
  return format(date, 'dd/MM', { locale: ptBR });
};

// ============================================================
// Props
// ============================================================

interface RDOAgendaCardProps {
  agenda: AgendaComResumo;
  resumo?: ResumoGeral;
  onClick?: (data: string) => void;
  isSelected?: boolean;
}

// ============================================================
// Componente
// ============================================================

export const RDOAgendaCard = ({ agenda, resumo, onClick, isSelected }: RDOAgendaCardProps) => {
  const navigate = useNavigate();
  const statusInfo = resumo
    ? statusConfig[resumo.status_geral] || statusConfig.NORMAL
    : statusConfig.NORMAL;

  const totalOcorrencias = resumo
    ? resumo.nichos.reduce((acc, n) => acc + n.ocorrencias_criticas, 0)
    : 0;

  const nichosComRDO = resumo?.nichos || [];

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected ? 'ring-2 ring-construction-blue ring-offset-2' : ''}
      `}
      onClick={() => onClick?.(agenda.data)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Indicador de data */}
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold capitalize">
                {formatDataLabel(agenda.data)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(agenda.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Status badge */}
          {resumo && (
            <Badge
              variant="outline"
              className={`gap-1 border text-xs font-medium ${statusInfo.color}`}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Clima e resumo */}
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          {climaIcon(agenda.clima_geral)}
          <span>{agenda.clima_geral || 'Clima não informado'}</span>
        </div>

        {resumo && (
          <>
            {/* Métricas */}
            <div className="mb-3 flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                      <FileText className="h-3.5 w-3.5 text-construction-blue" />
                      <span>{resumo.total_rdos} RDO{resumo.total_rdos !== 1 ? 's' : ''}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Total de RDOs do dia</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
                      <ListChecks className="h-3.5 w-3.5 text-construction-purple" />
                      <span>{resumo.total_nichos} nicho{resumo.total_nichos !== 1 ? 's' : ''}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Nichos com RDOs no dia</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {totalOcorrencias > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{totalOcorrencias} ocorrência{totalOcorrencias !== 1 ? 's' : ''}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Ocorrências críticas no dia</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Nichos com RDO */}
            {nichosComRDO.length > 0 && (
              <ScrollArea className="max-h-20">
                <div className="flex flex-wrap gap-1.5">
                  {nichosComRDO.map((nicho, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-1 text-xs font-normal"
                    >
                      {nicho.nicho}
                      <span className="ml-0.5 text-muted-foreground">
                        ({nicho.total_rdos})
                      </span>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Resumo textual */}
            {resumo.resumo_geral && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                {resumo.resumo_geral}
              </p>
            )}
          </>
        )}

        {/* Observações do gestor */}
        {agenda.observacoes_gestor && (
          <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Gestor: </span>
              {agenda.observacoes_gestor}
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer com ação */}
      <div className="border-t px-6 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {agenda.titulo || 'Diário de Bordo'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-construction-blue"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/rdo/agenda/${agenda.data}`);
            }}
          >
            <Eye className="h-3 w-3" />
            Detalhes
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
