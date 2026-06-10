import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Users,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Package,
  Wrench,
  HardHat,
  ClipboardList,
  DollarSign,
  FileText as FileTextIcon,
  Share2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { ResumoNicho } from '@/types/rdo';

// ============================================================
// Mapa de ícones por slug de nicho
// ============================================================

const nichoIconMap: Record<string, React.ReactNode> = {
  'execucao-obra': <HardHat className="h-4 w-4" />,
  'seguranca-trabalho': <ShieldAlert className="h-4 w-4" />,
  'ordens-servicos': <ClipboardList className="h-4 w-4" />,
  'equipes-mao-obra': <Users className="h-4 w-4" />,
  'equipamentos-maquinas': <Wrench className="h-4 w-4" />,
  'materiais-estoque': <Package className="h-4 w-4" />,
  'financeiro-contratos': <DollarSign className="h-4 w-4" />,
  'documentos-cliente': <FileTextIcon className="h-4 w-4" />,
};

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
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const prioridadeConfig: Record<string, string> = {
  Baixo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  Médio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  Alto: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// ============================================================
// Props
// ============================================================

interface RDOAgendaNichoTabProps {
  resumo: ResumoNicho;
}

// ============================================================
// Componente
// ============================================================

export const RDOAgendaNichoTab = ({ resumo }: RDOAgendaNichoTabProps) => {
  const navigate = useNavigate();
  const statusInfo = statusConfig[resumo.status_geral] || statusConfig.NORMAL;
  const nichoIcon = nichoIconMap[resumo.slug] || <Info className="h-4 w-4" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Ícone do nicho */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${resumo.status_geral === 'CRÍTICO' ? '#fef2f2' : resumo.status_geral === 'ALERTA' ? '#fff7ed' : '#f0fdf4'}`,
              }}
            >
              {nichoIcon}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {resumo.nicho}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {resumo.resumo_texto}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`gap-1 border text-xs font-medium ${statusInfo.color}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <FileText className="mb-1 h-5 w-5 text-construction-blue" />
            <span className="text-lg font-bold text-foreground">{resumo.total_rdos}</span>
            <span className="text-xs text-muted-foreground">RDOs</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <Activity className="mb-1 h-5 w-5 text-construction-purple" />
            <span className="text-lg font-bold text-foreground">{resumo.total_atividades}</span>
            <span className="text-xs text-muted-foreground">Atividades</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <Users className="mb-1 h-5 w-5 text-construction-green" />
            <span className="text-lg font-bold text-foreground">{resumo.total_equipes}</span>
            <span className="text-xs text-muted-foreground">Equipes</span>
          </div>
        </div>

        {/* Ocorrências */}
        {resumo.ocorrencias.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Ocorrências ({resumo.ocorrencias.length})
            </h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-1.5">
                {resumo.ocorrencias.map((oc, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-red-800 dark:text-red-200">
                        {oc.tipo}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                        {oc.descricao}
                      </p>
                      {(oc.gravidade || oc.impacto) && (
                        <Badge
                          variant="outline"
                          className="mt-1 border-red-300 text-[10px] text-red-700 dark:border-red-700 dark:text-red-300"
                        >
                          {oc.gravidade || oc.impacto}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Materiais em falta */}
        {resumo.materiais_em_falta.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-4 w-4 text-orange-500" />
              Materiais em Falta ({resumo.materiais_em_falta.length})
            </h4>
            <div className="space-y-1.5">
              {resumo.materiais_em_falta.map((mat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-800 dark:bg-orange-950"
                >
                  <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                    {mat.nome}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${prioridadeConfig[mat.prioridade] || prioridadeConfig['Médio']}`}
                  >
                    {mat.prioridade}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Colaboradores envolvidos */}
        {resumo.colaboradores_envolvidos.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-construction-green" />
              Colaboradores ({resumo.colaboradores_envolvidos.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {resumo.colaboradores_envolvidos.map((nome, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                  {nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {resumo.data}
          </span>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/app/rdo/agenda/${resumo.data}?nicho=${resumo.slug}`
                      );
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar link</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-construction-blue"
              onClick={() =>
                navigate(`/app/rdo?data=${resumo.data}&nicho=${resumo.slug}`)
              }
            >
              Ver RDOs
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
