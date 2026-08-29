import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, UserPlus } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRequireOrg } from "@/hooks/requireOrg";
import { matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";

const AdminAcquisitionMetrics = () => {
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { filters, sinceDate } = useAdminFilters();
  const { data: newUsersData, isLoading: loadingNewUsers } = useQuery({
    queryKey: ['admin-new-users-30d', filters.period],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('created_at, plan_type')
        .order('created_at', { ascending: true });

      if (sinceDate) {
        query = query.gte('created_at', sinceDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aplicar filtro de plano (lado do cliente)
      const profiles = (data || []).filter((profile) =>
        matchesAdminTextFilter(profile.plan_type, filters.plan)
      );

      // Agrupar por dia
      const dailyData = profiles.reduce((acc: any[], profile) => {
        const date = new Date(profile.created_at).toLocaleDateString('pt-BR');
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.users += 1;
        } else {
          acc.push({ date, users: 1 });
        }
        return acc;
      }, []);

      return {
        total: profiles.length,
        dailyData: dailyData.slice(-7) // Últimos 7 dias
      };
    }
  });

  const { data: conversionData, isLoading: loadingConversion } = useQuery({
    queryKey: ['admin-rdo-conversion', filters.period, orgId],
    queryFn: async () => {
      // Total de usuários (respeitando o período global)
      let profilesQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (sinceDate) {
        profilesQuery = profilesQuery.gte('created_at', sinceDate);
      }

      const { count: totalUsers, error: userError } = await profilesQuery;

      if (userError) throw userError;

      // Usuários que criaram pelo menos 1 RDO na org ativa
      let rdosQuery = supabase
        .from('rdos')
        .select('criado_por_id')
        .eq('org_id', orgId)
        .limit(1000);

      if (sinceDate) {
        rdosQuery = rdosQuery.gte('created_at', sinceDate);
      }

      const { data: rdoUsers, error: rdoError } = await rdosQuery;

      if (rdoError) throw rdoError;

      const uniqueRdoUsers = new Set(rdoUsers?.map(r => r.criado_por_id)).size;
      const conversionRate = totalUsers ? (uniqueRdoUsers / totalUsers) * 100 : 0;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: uniqueRdoUsers,
        conversionRate: Math.round(conversionRate * 10) / 10
      };
    },
    enabled: !orgLoading && !!orgId,
  });

  if (loadingNewUsers || loadingConversion) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">📈 Aquisição e Crescimento</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Novos Usuários (30 dias)
            </CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newUsersData?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Crescimento do topo do funil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários que criaram RDOs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {conversionData?.totalUsers} totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle>Novos Cadastros (Últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={newUsersData?.dailyData || []}>
              <XAxis
                dataKey="date"
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
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAcquisitionMetrics;
