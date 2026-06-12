import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRequireOrg } from '@/hooks/requireOrg';
import { useRDOAgenda, type AgendaComResumo } from '@/hooks/useRDOAgenda';
import { useRDONichos } from '@/hooks/useRDONichos';
import { RDOAgendaCard } from '@/components/rdo/RDOAgendaCard';
import { RDOAgendaNichoTab } from '@/components/rdo/RDOAgendaNichoTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sun,
  Cloud,
  CloudRain,
  Loader2,
  Search,
  Edit3,
  Save,
  X,
  ListChecks,
} from 'lucide-react';
import { format, parseISO, subDays, addDays, isToday, isYesterday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ResumoGeral, ResumoNicho } from '@/types/rdo';

// ============================================================
// Helpers
// ============================================================

const statusConfig: Record<string, { label: string; color: string }> = {
  NORMAL: { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800' },
  ATENÇÃO: { label: 'Atenção', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800' },
  ALERTA: { label: 'Alerta', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  CRÍTICO: { label: 'Crítico', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
};

const formatDateFull = (dataStr: string): string => {
  const date = parseISO(dataStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isTomorrow(date)) return 'Amanhã';
  return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

// ============================================================
// Página
// ============================================================

const RDOAgendaPage = () => {
  const navigate = useNavigate();
  const { orgId } = useRequireOrg();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data selecionada
  const dataParam = searchParams.get('data');
  const nichoParam = searchParams.get('nicho');
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(dataParam || hoje);
  const [dateRange, setDateRange] = useState<{ inicio?: string; fim?: string }>({
    fim: hoje,
    inicio: format(subDays(parseISO(hoje), 14), 'yyyy-MM-dd'),
  });

  // Edição de resumo
  const [editandoResumo, setEditandoResumo] = useState(false);
  const [resumoEdit, setResumoEdit] = useState('');
  const [climaEdit, setClimaEdit] = useState('');
  const [obsGestorEdit, setObsGestorEdit] = useState('');

  // Modal de criar agenda
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [novaData, setNovaData] = useState(hoje);

  // Hooks
  const { agendas, isLoading, isFetching, resumoGeralQuery, updateAgendaResumo, isUpdatingAgenda } = useRDOAgenda({
    orgId,
    dataInicio: dateRange.inicio,
    dataFim: dateRange.fim,
  });

  const { nichos } = useRDONichos();

  // Resumo da data selecionada
  const { data: resumo, isLoading: loadingResumo } = resumoGeralQuery(selectedDate);

  // Agenda da data selecionada
  const agendaSelecionada = useMemo(
    () => agendas.find((a) => a.data === selectedDate),
    [agendas, selectedDate]
  );

  // Navegação entre dias
  const navegarDia = useCallback(
    (direcao: 'prev' | 'next') => {
      const current = parseISO(selectedDate);
      const nova = direcao === 'prev' ? subDays(current, 1) : addDays(current, 1);
      const novaStr = format(nova, 'yyyy-MM-dd');
      setSelectedDate(novaStr);
      setSearchParams({ data: novaStr });
      setEditandoResumo(false);
    },
    [selectedDate, setSearchParams]
  );

  // Salvar resumo
  const handleSalvarResumo = async () => {
    try {
      await updateAgendaResumo({
        data: selectedDate,
        resumo_geral: resumoEdit,
        clima_geral: climaEdit,
        observacoes_gestor: obsGestorEdit,
      });
      setEditandoResumo(false);
    } catch {
      // Toast já é tratado no hook
    }
  };

  // Iniciar edição
  const iniciarEdicao = () => {
    setResumoEdit(resumo?.resumo_geral || '');
    setClimaEdit(agendaSelecionada?.clima_geral || '');
    setObsGestorEdit(agendaSelecionada?.observacoes_gestor || '');
    setEditandoResumo(true);
  };

  // Criar agenda manual para uma data
  const handleCriarAgenda = async () => {
    try {
      await updateAgendaResumo({
        data: novaData,
        titulo: `Diário de Bordo - ${format(parseISO(novaData), 'dd/MM/yyyy')}`,
      });
      setSelectedDate(novaData);
      setSearchParams({ data: novaData });
      setShowCriarDialog(false);
      toast.success('Agenda criada para ' + format(parseISO(novaData), 'dd/MM/yyyy'));
    } catch {
      // Toast já tratado
    }
  };

  // Ir para data específica
  const irParaHoje = () => {
    setSelectedDate(hoje);
    setSearchParams({ data: hoje });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => navigate('/app/rdo')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            RDOs
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-construction-orange" />
              Agenda de RDOs
            </h1>
            <p className="text-sm text-muted-foreground">
              Diário de bordo — visão consolidada dos RDOs por dia e nicho
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={() => setShowCriarDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Agenda
          </Button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Sidebar: Timeline de agendas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Timeline
            </h2>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : agendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <CalendarDays className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma agenda encontrada.
              </p>
              <p className="text-xs text-muted-foreground/70">
                As agendas são criadas automaticamente ao registrar RDOs.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/app/rdo/novo')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Criar RDO
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-220px)]">
              <div className="space-y-3 pr-2">
                {agendas.map((agenda) => (
                  <RDOAgendaCard
                    key={agenda.id}
                    agenda={agenda}
                    onClick={(data) => {
                      setSelectedDate(data);
                      setSearchParams({ data });
                      setEditandoResumo(false);
                    }}
                    isSelected={agenda.data === selectedDate}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Conteúdo principal: Detalhe da data */}
        <div className="space-y-4">
          {/* Navegação entre dias */}
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navegarDia('prev')}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="text-center">
              <p className="text-sm font-semibold capitalize text-foreground">
                {formatDateFull(selectedDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                {resumo ? `${resumo.total_rdos} RDO${resumo.total_rdos !== 1 ? 's' : ''} · ${resumo.total_nichos} nicho${resumo.total_nichos !== 1 ? 's' : ''}` : 'Carregando...'}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navegarDia('next')}
              className="gap-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {loadingResumo ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : !resumo || resumo.total_rdos === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-1 text-lg font-medium text-foreground">
                  Nenhum RDO nesta data
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {formatDateFull(selectedDate)} não possui RDOs registrados.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/app/rdo/novo?data=${selectedDate}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar RDO para esta data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status geral */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {resumo.status_geral === 'NORMAL' && (
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      )}
                      {resumo.status_geral === 'ATENÇÃO' && (
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      )}
                      {resumo.status_geral === 'ALERTA' && (
                        <ShieldAlert className="h-8 w-8 text-orange-500" />
                      )}
                      {resumo.status_geral === 'CRÍTICO' && (
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-sm font-semibold ${statusConfig[resumo.status_geral]?.color || statusConfig.NORMAL.color}`}
                          >
                            {resumo.status_geral}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {resumo.resumo_geral}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      {!editandoResumo ? (
                        <Button variant="outline" size="sm" className="gap-1" onClick={iniciarEdicao}>
                          <Edit3 className="h-3.5 w-3.5" />
                          Editar Resumo
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1 bg-construction-green hover:bg-construction-green/90"
                            onClick={handleSalvarResumo}
                            disabled={isUpdatingAgenda}
                          >
                            {isUpdatingAgenda ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Salvar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditandoResumo(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form de edição */}
                  {editandoResumo && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Clima do dia (ex: Ensolarado, 28°C)"
                          value={climaEdit}
                          onChange={(e) => setClimaEdit(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Resumo geral do dia
                        </label>
                        <Textarea
                          placeholder="Descreva o resumo do dia..."
                          value={resumoEdit}
                          onChange={(e) => setResumoEdit(e.target.value)}
                          className="min-h-[80px] resize-y"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Observações do gestor
                        </label>
                        <Textarea
                          placeholder="Observações do gestor da obra..."
                          value={obsGestorEdit}
                          onChange={(e) => setObsGestorEdit(e.target.value)}
                          className="min-h-[60px] resize-y"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Nichos com RDO */}
              {resumo.nichos.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Nichos do Dia
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {resumo.nichos.map((nichoItem, idx) => (
                      <RDOAgendaNichoTab
                        key={idx}
                        resumo={
                          {
                            ...nichoItem,
                            data: selectedDate,
                            total_atividades: 0,
                            total_equipes: 0,
                            ocorrencias: [],
                            materiais_em_falta: [],
                            resumo_texto: nichoItem.resumo_curto || `${nichoItem.total_rdos} RDO(s)`,
                            colaboradores_envolvidos: [],
                          } as ResumoNicho
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialog: Criar nova agenda */}
      <Dialog open={showCriarDialog} onOpenChange={setShowCriarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-construction-orange" />
              Nova Agenda
            </DialogTitle>
            <DialogDescription>
              Crie uma agenda para uma data específica. Normalmente as agendas
              são criadas automaticamente ao registrar RDOs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Data
              </label>
              <Input
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCriarDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-construction-blue hover:bg-construction-blue/90"
              onClick={handleCriarAgenda}
            >
              Criar Agenda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RDOAgendaPage;
