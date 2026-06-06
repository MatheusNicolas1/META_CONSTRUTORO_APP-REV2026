import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Users, TrendingUp, Percent, Award, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminMetricCard from "./AdminMetricCard";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

type TopReferrer = {
  id: string;
  name: string | null;
  email: string | null;
  referral_code: string | null;
  referrals_count: number;
  avatar_url: string | null;
};

interface AdminReferralsMetricsProps {
  sinceDate?: string | null;
}

const AdminReferralsMetrics = ({ sinceDate }: AdminReferralsMetricsProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-referrals-metrics", sinceDate],
    queryFn: async () => {
      // 1. Profiles com referral_code preenchido (total de códigos gerados)
      const { count: totalReferralCodes, error: codesError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("referral_code", "is", null);

      if (codesError) throw codesError;

      // 2. Profiles que foram indicados (referred_by não nulo)
      let referredQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("referred_by", "is", null);

      if (sinceDate) {
        referredQuery = referredQuery.gte("created_at", sinceDate);
      }

      const { count: totalReferred, error: referredError } =
        await referredQuery;

      if (referredError) throw referredError;

      // 3. Contagem total na tabela referrals
      let referralsQuery = supabase
        .from("referrals")
        .select("*", { count: "exact", head: true });

      if (sinceDate) {
        referralsQuery = referralsQuery.gte("created_at", sinceDate);
      }

      const { count: totalReferralsDb, error: referralsDbError } =
        await referralsQuery;

      if (referralsDbError) throw referralsDbError;

      // 4. Top referrers (profiles que mais indicaram)
      const { data: topReferrersRaw, error: topError } = await supabase
        .from("referrals")
        .select(
          "referrer_id, profiles!inner(id, name, email, referral_code, avatar_url)"
        )
        .order("created_at", { ascending: false });

      if (topError) throw topError;

      // 5. Processar top referrers
      const referrerMap = new Map<string, TopReferrer>();
      for (const row of topReferrersRaw || []) {
        const profile = (row as any).profiles;
        if (!profile) continue;
        const existing = referrerMap.get(profile.id);
        if (existing) {
          existing.referrals_count += 1;
        } else {
          referrerMap.set(profile.id, {
            id: profile.id,
            name: profile.name || null,
            email: profile.email || null,
            referral_code: profile.referral_code || null,
            referrals_count: 1,
            avatar_url: profile.avatar_url || null,
          });
        }
      }

      const topReferrers = Array.from(referrerMap.values())
        .sort((a, b) => b.referrals_count - a.referrals_count)
        .slice(0, 10);

      return {
        totalReferralCodes: totalReferralCodes || 0,
        totalReferred: totalReferred || 0,
        totalReferralsDb: totalReferralsDb || 0,
        topReferrers,
      };
    },
  });

  const conversionRate = useMemo(() => {
    if (!data || data.totalReferralCodes === 0) return 0;
    return data.totalReferred / data.totalReferralCodes;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar métricas de indicações.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Códigos de indicação"
          value={formatNumber(data?.totalReferralCodes || 0)}
          description="Total de códigos de indicação gerados"
          icon={Gift}
          tone="purple"
          source="profiles.referral_code"
        />
        <AdminMetricCard
          title="Usuários indicados"
          value={formatNumber(data?.totalReferred || 0)}
          description="Total de usuários que se cadastraram via indicação"
          icon={UserPlus}
          tone="green"
          source="profiles.referred_by"
        />
        <AdminMetricCard
          title="Taxa de conversão"
          value={formatPercent(conversionRate)}
          description="Indicados / Total de códigos gerados"
          icon={Percent}
          tone="blue"
          source="profiles"
        />
        <AdminMetricCard
          title="Total na tabela referrals"
          value={formatNumber(data?.totalReferralsDb || 0)}
          description="Registros na tabela referrals"
          icon={TrendingUp}
          tone="amber"
          source="referrals"
        />
      </div>

      {/* Top referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.topReferrers || data.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma indicação registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Indicações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topReferrers.map((referrer, index) => (
                  <TableRow key={referrer.id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {referrer.avatar_url ? (
                          <img
                            src={referrer.avatar_url}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{referrer.name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {referrer.email || "—"}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {referrer.referral_code || "—"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatNumber(referrer.referrals_count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Indicações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Códigos gerados</span>
            <span className="font-medium">
              {formatNumber(data?.totalReferralCodes || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usuários indicados (referred_by)</span>
            <span className="font-medium">
              {formatNumber(data?.totalReferred || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registros na tabela referrals</span>
            <span className="font-medium">
              {formatNumber(data?.totalReferralsDb || 0)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-medium">Taxa de conversão</span>
            <span className="font-bold text-green-600">
              {formatPercent(conversionRate)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferralsMetrics;
