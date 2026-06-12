import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Layers,
  AlertCircle,
} from 'lucide-react';
import type { ResumoGeral } from '@/types/rdo';

// ============================================================
// Helpers
// ============================================================

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NORMAL: {
    label: 'Normal',
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  ATENÇÃO: {
    label: 'Atenção',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  ALERTA: {
    label: 'Alerta',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  CRÍTICO: {
    label: 'Crítico',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: <AlertCircle className="h-4 w-4" />,
  },
};

// ============================================================
// Props
// ============================================================

interface RDOResumoGeralCardProps {
  resumo: ResumoGeral | null;
  isLoading: boolean;
}

// ============================================================
// Componente
// ============================================================

export const RDOResumoGeralCard = ({ resumo, isLoading }: RDOResumoGeralCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resumo) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-medium text-foreground">
            Nenhum resumo disponível
          </h3>
          <p className="text-sm text-muted-foreground">
            Não há dados de RDO para esta data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = statusConfig[resumo.status_geral] || statusConfig.NORMAL;
  const totalOcorrenciasCriticas = resumo.nichos.reduce(
    (acc, n) => acc + (n.ocorrencias_criticas || 0),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-construction-orange" />
            Resumo Geral do Dia
          </CardTitle>
          <Badge
            variant="outline"
            className={`gap-1.5 border px-3 py-1 text-sm font-medium ${statusInfo.color}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <FileText className="mb-1 h-6 w-6 text-construction-blue" />
            <span className="text-2xl font-bold text-foreground">
              {resumo.total_rdos}
            </span>
            <span className="text-xs text-muted-foreground">
              RDO{resumo.total_rdos !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <Layers className="mb-1 h-6 w-6 text-construction-purple" />
            <span className="text-2xl font-bold text-foreground">
              {resumo.total_nichos}
            </span>
            <span className="text-xs text-muted-foreground">
              Nicho{resumo.total_nichos !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <AlertTriangle className="mb-1 h-6 w-6 text-orange-500" />
            <span className="text-2xl font-bold text-foreground">
              {totalOcorrenciasCriticas}
            </span>
            <span className="text-xs text-muted-foreground">Ocorrências</span>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
            <CheckCircle2 className="mb-1 h-6 w-6 text-emerald-500" />
            <span className="text-2xl font-bold text-foreground">
              {resumo.nichos.filter((n) => n.status === 'NORMAL').length}
            </span>
            <span className="text-xs text-muted-foreground">Normais</span>
          </div>
        </div>

        {/* Status por nicho */}
        {resumo.nichos.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Status por Nicho
            </h4>
            <div className="space-y-2">
              {resumo.nichos.map((nicho, idx) => {
                const nichoStatus =
                  statusConfig[nicho.status] || statusConfig.NORMAL;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {nicho.nicho}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({nicho.total_rdos} RDO{nicho.total_rdos !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {nicho.ocorrencias_criticas > 0 && (
                        <span className="text-xs font-medium text-red-500">
                          {nicho.ocorrencias_criticas} crítica
                          {nicho.ocorrencias_criticas !== 1 ? 's' : ''}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`gap-1 text-xs ${nichoStatus.color}`}
                      >
                        {nichoStatus.icon}
                        {nichoStatus.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo textual */}
        {resumo.resumo_geral && (
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resumo.resumo_geral}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RDOResumoGeralCard;
