import React, { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileText,
  Folder,
  PlusCircle,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { OptimizedLink } from "@/components/OptimizedLink";
import { Onboarding } from "@/components/Onboarding";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useRecentObras } from "@/hooks/useRecentObras";
import { useRecentRDOs } from "@/hooks/useRecentRDOs";
import MetricCard, { type MetricTone } from "@/components/MetricCard";

type StatConfig = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: MetricTone;
};

type QuickActionConfig = {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  tone: string;
};

type RecentItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  to: string;
  icon: LucideIcon;
  tone: string;
};

const ActivityCalendarModern = React.lazy(() =>
  import("@/components/ActivityCalendarModern").then((module) => ({ default: module.ActivityCalendarModern }))
);

const QuickAction = memo(({ action }: { action: QuickActionConfig }) => (
  <OptimizedLink to={action.to} className="group min-w-[112px] flex-1">
    <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-transparent px-3 py-3 text-center transition-all duration-200 hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-md">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${action.tone} transition-transform group-hover:-translate-y-0.5`}>
        <action.icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-foreground">{action.title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{action.description}</p>
      </div>
    </div>
  </OptimizedLink>
));

QuickAction.displayName = "QuickAction";

const RecentVisualCard = memo(({ item }: { item: RecentItem }) => (
  <OptimizedLink to={item.to} className="group block">
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className={`flex aspect-[4/3] items-center justify-center ${item.tone}`}>
        <item.icon className="h-12 w-12" />
      </div>
      <div className="space-y-1 px-4 py-3">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{item.meta}</p>
      </div>
    </article>
  </OptimizedLink>
));

RecentVisualCard.displayName = "RecentVisualCard";

const DashboardEmptyRecent = () => (
  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
    <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
    <h3 className="mt-3 text-base font-semibold text-foreground">Nenhuma atividade recente</h3>
    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
      Crie uma obra ou registre um RDO para preencher esta area com dados reais.
    </p>
    <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
      <OptimizedLink to="/app/obras">
        <Button className="w-full sm:w-auto">
          <Building2 className="mr-2 h-4 w-4" />
          Nova Obra
        </Button>
      </OptimizedLink>
      <OptimizedLink to="/app/rdo/novo">
        <Button variant="outline" className="w-full sm:w-auto">
          <FileText className="mr-2 h-4 w-4" />
          Novo RDO
        </Button>
      </OptimizedLink>
    </div>
  </div>
);

const formatDate = (value?: string | null) => {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";

  return date.toLocaleDateString("pt-BR");
};

const OptimizedDashboard = memo(() => {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: obras, isLoading: isLoadingObras } = useRecentObras();
  const { data: rdos, isLoading: isLoadingRdos } = useRecentRDOs();

  const statsConfig: StatConfig[] = [
    {
      title: "Obras ativas",
      value: stats?.obrasAtivas?.toString() || "0",
      description: stats?.obrasAtivasDescricao || "Nenhuma obra cadastrada",
      icon: Building2,
      tone: "primary",
    },
    {
      title: "Equipes trabalhando",
      value: stats?.equipesTrabalhando?.toString() || "0",
      description: stats?.equipesDescricao || "Cadastre equipes nas obras",
      icon: Users,
      tone: "emerald",
    },
    {
      title: "Equipamentos ativos",
      value: stats?.equipamentosAtivos?.toString() || "0",
      description: stats?.equipamentosDescricao || "Nenhum equipamento cadastrado",
      icon: Wrench,
      tone: "sky",
    },
    {
      title: "Atividades pendentes",
      value: stats?.atividadesPendentes?.toString() || "0",
      description: stats?.atividadesDescricao || "Nenhuma atividade pendente",
      icon: ClipboardList,
      tone: "amber",
    },
  ];

  const quickActions: QuickActionConfig[] = [
    { title: "Novo RDO", description: "Diario de obra", to: "/app/rdo/novo", icon: PlusCircle, tone: "bg-primary text-primary-foreground" },
    { title: "Nova Obra", description: "Abrir cadastro", to: "/app/obras", icon: Building2, tone: "bg-sky-600 text-white" },
    { title: "Checklist", description: "Inspecoes", to: "/app/checklist", icon: CheckSquare, tone: "bg-emerald-500 text-white" },
    { title: "Equipes", description: "Mao de obra", to: "/app/equipes", icon: Users, tone: "bg-sky-500 text-white" },
    { title: "Documentos", description: "Arquivos", to: "/app/documentos", icon: Folder, tone: "bg-violet-500 text-white" },
    { title: "Relatorios", description: "Analises", to: "/app/relatorios", icon: BarChart3, tone: "bg-blue-600 text-white" },
    { title: "Despesas", description: "Financeiro", to: "/app/despesas", icon: DollarSign, tone: "bg-lime-600 text-white" },
    { title: "Integracoes", description: "Conexoes", to: "/app/integracoes", icon: Zap, tone: "bg-fuchsia-500 text-white" },
  ];

  const recentItems = useMemo<RecentItem[]>(() => {
    const obraItems = (obras || []).map((obra: any) => ({
      id: `obra-${obra.id}`,
      title: obra.nome || "Obra sem nome",
      subtitle: obra.localizacao || obra.status || "Obra",
      meta: `Atualizada em ${formatDate(obra.updated_at || obra.created_at || obra.data_inicio)}`,
      to: `/app/obras/${obra.id}`,
      icon: Briefcase,
      tone: "bg-primary/10 text-primary",
    }));

    const rdoItems = (rdos || []).map((rdo: any) => ({
      id: `rdo-${rdo.id}`,
      title: `RDO ${formatDate(rdo.data || rdo.created_at)}`,
      subtitle: rdo.obras?.nome || "Obra nao especificada",
      meta: rdo.status || "Pendente",
      to: `/app/rdo/${rdo.id}/visualizar`,
      icon: FileText,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    }));

    return [...obraItems, ...rdoItems].slice(0, 6);
  }, [obras, rdos]);

  const isLoadingRecent = isLoadingObras || isLoadingRdos;

  return (
    <>
      <Onboarding />
      <div className="space-y-8" data-tour="dashboard">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-sky-500/15 via-background to-primary/10 px-4 py-8 shadow-sm sm:px-8 lg:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              Bora organizar sua obra?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Encontre obras, RDOs, documentos e relatorios sem sair do painel principal.
            </p>
            <div className="mx-auto mt-6 flex max-w-3xl justify-center">
              <GlobalSearch
                className="w-full max-w-[640px]"
                buttonClassName="h-14 rounded-2xl border-border/80 bg-background/95 px-5 text-base shadow-sm"
                placeholder="Busque obras, RDOs, documentos e relatorios..."
                forceExpanded
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Acoes rapidas</h2>
              <p className="text-sm text-muted-foreground">Comece as tarefas mais usadas em um clique.</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-8 lg:overflow-visible lg:pb-0">
            {quickActions.map((action) => (
              <QuickAction key={action.title} action={action} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="min-h-[96px] rounded-2xl border border-border/70 bg-card px-4 py-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="mt-3 h-4 w-28" />
                <Skeleton className="mt-2 h-6 w-12" />
              </div>
            ))
          ) : (
            statsConfig.map((stat) => <MetricCard key={stat.title} {...stat} />)
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recentes</h2>
              <p className="text-sm text-muted-foreground">Obras e RDOs atualizados a partir dos dados reais do sistema.</p>
            </div>
            <div className="flex gap-2">
              <OptimizedLink to="/app/obras">
                <Button variant="outline" size="sm">Ver obras</Button>
              </OptimizedLink>
              <OptimizedLink to="/app/rdo">
                <Button variant="outline" size="sm">Ver RDOs</Button>
              </OptimizedLink>
            </div>
          </div>

          {isLoadingRecent ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-border/70 bg-card">
                  <Skeleton className="aspect-[4/3] rounded-t-2xl" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {recentItems.map((item) => (
                <RecentVisualCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <DashboardEmptyRecent />
          )}
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <React.Suspense fallback={<div className="h-72 rounded-2xl border border-border/70 bg-card/50" />}>
              <ActivityCalendarModern />
            </React.Suspense>
          </div>

          <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Proximos passos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use os atalhos para manter a rotina de obra atualizada.
            </p>
            <div className="mt-5 space-y-3">
              <OptimizedLink to="/app/rdo/novo" className="block">
                <Button className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Registrar RDO de hoje
                </Button>
              </OptimizedLink>
              <OptimizedLink to="/app/checklist" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Revisar checklists
                </Button>
              </OptimizedLink>
              <OptimizedLink to="/app/relatorios" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Abrir relatorios
                </Button>
              </OptimizedLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
});

OptimizedDashboard.displayName = "OptimizedDashboard";

export default OptimizedDashboard;
