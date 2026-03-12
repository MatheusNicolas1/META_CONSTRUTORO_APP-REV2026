import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Wrench, ClipboardList, FileText } from "lucide-react";
import { OptimizedLink } from "@/components/OptimizedLink";
import { Onboarding } from "@/components/Onboarding";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

// Componente otimizado para stats
const StatCard = memo(({ stat }: { stat: any }) => (
  <Card className="bg-card border-border responsive-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-card-foreground">
        {stat.title}
      </CardTitle>
      <stat.icon className={`h-4 w-4 ${stat.color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
      <p className="text-xs text-muted-foreground">{stat.description}</p>
    </CardContent>
  </Card>
));

StatCard.displayName = "StatCard";

// Componentes lazy-loaded
const RecentRDOs = React.lazy(() =>
  import("@/components/RecentRDOs").then(module => ({ default: module.RecentRDOs }))
);
const RecentObras = React.lazy(() =>
  import("@/components/RecentObras").then(module => ({ default: module.RecentObras }))
);
const ActivityCalendarModern = React.lazy(() =>
  import("@/components/ActivityCalendarModern").then(module => ({ default: module.ActivityCalendarModern }))
);

const OptimizedDashboard = memo(() => {
  const { data: stats, isLoading } = useDashboardStats();

  const statsConfig = [
    {
      title: "Obras Ativas",
      value: stats?.obrasAtivas?.toString() || "0",
      description: stats?.obrasAtivasDescricao || "Nenhuma obra cadastrada",
      icon: Building2,
      color: "text-construction-orange",
    },
    {
      title: "Equipes Trabalhando",
      value: stats?.equipesTrabalhando?.toString() || "0",
      description: stats?.equipesDescricao || "Cadastre equipes nas obras",
      icon: Users,
      color: "text-construction-green",
    },
    {
      title: "Equipamentos Ativos",
      value: stats?.equipamentosAtivos?.toString() || "0",
      description: stats?.equipamentosDescricao || "Nenhum equipamento cadastrado",
      icon: Wrench,
      color: "text-construction-blue",
    },
    {
      title: "Atividades Pendentes",
      value: stats?.atividadesPendentes?.toString() || "0",
      description: stats?.atividadesDescricao || "Nenhuma atividade pendente",
      icon: ClipboardList,
      color: "text-yellow-500",
    },
  ];

  return (
    <>
      <Onboarding />
      <div className="space-y-6" data-tour="dashboard">
        <div className="mobile-stack">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral das suas obras e projetos</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <OptimizedLink to="/app/rdo" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-safe">
                <FileText className="mr-2 h-4 w-4" />
                Novo RDO
              </Button>
            </OptimizedLink>
            <OptimizedLink to="/app/obras" className="w-full sm:w-auto">
              <Button className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto touch-safe">
                <Building2 className="mr-2 h-4 w-4" />
                Nova Obra
              </Button>
            </OptimizedLink>
          </div>
        </div>

        {/* Stats Cards com renderização otimizada */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            statsConfig.map((stat) => (
              <StatCard key={stat.title} stat={stat} />
            ))
          )}
        </div>

        {/* Activity Heatmap */}
        <React.Suspense fallback={<div className="h-64 rounded-xl border bg-card/50" />}>
          <ActivityCalendarModern />
        </React.Suspense>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 pb-20 lg:pb-6">
          <React.Suspense fallback={
            <div className="h-96 bg-card rounded-lg border border-border animate-pulse" />
          }>
            <RecentRDOs />
          </React.Suspense>

          <React.Suspense fallback={
            <div className="h-96 bg-card rounded-lg border border-border animate-pulse" />
          }>
            <RecentObras />
          </React.Suspense>
        </div>
      </div>
    </>
  );
});

OptimizedDashboard.displayName = "OptimizedDashboard";

export default OptimizedDashboard;