import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, UserX, CheckCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRequireOrg } from "@/hooks/requireOrg";
import { matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";

const AdminEngagementMetrics = () => {
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { filters, sinceDate } = useAdminFilters();
  const { data: menuData, isLoading: loadingMenu } = useQuery({
    queryKey: ['admin-menu-engagement', filters.period],
    queryFn: async () => {
      let query = supabase
        .from('user_activity')
        .select('event_name')
        .like('event_name', 'view_%');

      if (sinceDate) {
        query = query.gte('created_at', sinceDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Contar visualizações por menu
      const menuCounts = data.reduce((acc: any, activity) => {
        const menuName = activity.event_name.replace('view_', '');
        acc[menuName] = (acc[menuName] || 0) + 1;
        return acc;
      }, {});

      // Converter para array e ordenar
      const menuArray = Object.entries(menuCounts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          views: count as number
        }))
        .sort((a, b) => b.views - a.views);

      return menuArray;
    }
  });

  const { data: creditConsumption, isLoading: loadingCredit } = useQuery({
    queryKey: ['admin-credit-consumption', filters.period],
    queryFn: async () => {
      // Buscar usuários e seus créditos (respeitando o período global)
      let creditsQuery = supabase
        .from('user_credits')
        .select('credits_balance, created_at, user_id, plan_type');

      if (sinceDate) {
        creditsQuery = creditsQuery.gte('created_at', sinceDate);
      }

      const { data: creditsData, error } = await creditsQuery;

      if (error) throw error;

      // Aplicar filtro de plano (lado do cliente)
      const credits = (creditsData || []).filter((c) =>
        matchesAdminTextFilter(c.plan_type, filters.plan)
      );

      // Buscar RDOs para calcular tempo médio de consumo (filtrado por org)
      let rdosQuery = supabase
        .from('rdos')
        .select('criado_por_id, created_at')
        .eq('org_id', orgId)
        .limit(100);

      if (sinceDate) {
        rdosQuery = rdosQuery.gte('created_at', sinceDate);
      }

      const { data: rdos } = await rdosQuery;

      // Calcular média de dias para usar primeiro crédito
      const avgDays = rdos && credits ?
        rdos.reduce((sum, rdo) => {
          const userCredit = credits.find(c => c.user_id === rdo.criado_por_id);
          if (userCredit) {
            const daysDiff = Math.floor(
              (new Date(rdo.created_at).getTime() - new Date(userCredit.created_at).getTime())
              / (1000 * 60 * 60 * 24)
            );
            return sum + Math.max(0, daysDiff);
          }
          return sum;
        }, 0) / rdos.length : 0;

      const activeUsers = credits?.filter(c => c.credits_balance < 7).length || 0;

      return {
        avgDaysToFirstUse: Math.round(avgDays * 10) / 10,
        activeUsers
      };
    },
    enabled: !orgLoading && !!orgId,
  });

  const { data: onboardingData, isLoading: loadingOnboarding } = useQuery({
    queryKey: ['admin-onboarding', filters.period],
    queryFn: async () => {
      let profilesQuery = supabase
        .from('profiles')
        .select('has_seen_onboarding, plan_type');

      if (sinceDate) {
        profilesQuery = profilesQuery.gte('created_at', sinceDate);
      }

      const { data, error } = await profilesQuery;

      if (error) throw error;

      // Aplicar filtro de plano (lado do cliente)
      const profiles = (data || []).filter((p) =>
        matchesAdminTextFilter(p.plan_type, filters.plan)
      );

      const completed = profiles?.filter(p => p.has_seen_onboarding).length || 0;
      const total = profiles?.length || 0;
      const rate = total ? (completed / total) * 100 : 0;

      return {
        completed,
        total,
        rate: Math.round(rate * 10) / 10
      };
    }
  });

  if (loadingMenu || loadingCredit || loadingOnboarding) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">💡 Engajamento e Retenção</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo até 1º RDO
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditConsumption?.avgDaysToFirstUse || 0} dias
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de ativação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Onboarding
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onboardingData?.rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {onboardingData?.completed} de {onboardingData?.total} usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Engajados
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditConsumption?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consumiram créditos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Menus Mais Acessados */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Menus Mais Acessados (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={menuData?.slice(0, 8) || []}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="views"
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEngagementMetrics;
