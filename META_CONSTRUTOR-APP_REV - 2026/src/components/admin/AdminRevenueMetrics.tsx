import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Percent, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AdminMetricCard from "./AdminMetricCard";
import { matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const AdminRevenueMetrics = () => {
  const { filters } = useAdminFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-metrics"],
    queryFn: async () => {
      const [subscriptionsRes, couponsRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, status, billing_cycle, plan_id, plans(monthly_price_cents, yearly_price_cents, name)")
          .limit(1000),
        supabase.from("coupons").select("code, is_active, times_used, discount_type, discount_value").limit(1000),
      ]);

      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (couponsRes.error) throw couponsRes.error;

      return {
        subscriptions: subscriptionsRes.data || [],
        coupons: couponsRes.data || [],
      };
    },
  });

  const metrics = useMemo(() => {
    const subscriptions = (data?.subscriptions || []).filter((item: any) => {
      const plan = Array.isArray(item.plans) ? item.plans[0] : item.plans;
      return matchesAdminTextFilter(plan?.name || item.plan_id, filters.plan);
    });
    const active = subscriptions.filter((item) => item.status === "active" || item.status === "trialing");
    const mrrCents = active.reduce((sum, item: any) => {
      const plan = Array.isArray(item.plans) ? item.plans[0] : item.plans;
      const monthly = Number(plan?.monthly_price_cents || 0);
      const yearly = Number(plan?.yearly_price_cents || 0);
      return sum + (item.billing_cycle === "yearly" && yearly ? yearly / 12 : monthly);
    }, 0);
    const coupons = data?.coupons || [];
    const couponUses = coupons.reduce((sum, coupon) => sum + Number(coupon.times_used || 0), 0);

    return {
      activeSubscriptions: active.length,
      mrr: mrrCents / 100,
      activeCoupons: coupons.filter((coupon) => coupon.is_active).length,
      couponUses,
      coupons: coupons.sort((a, b) => Number(b.times_used || 0) - Number(a.times_used || 0)),
    };
  }, [data, filters.plan]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Receita</h2>
        <p className="text-sm text-muted-foreground">Assinaturas e cupons conectados ao funil comercial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Assinaturas ativas" value={metrics.activeSubscriptions} icon={CreditCard} source="subscriptions" />
        <AdminMetricCard title="MRR estimado" value={formatCurrency(metrics.mrr)} icon={TrendingUp} tone="green" source="subscriptions + plans" />
        <AdminMetricCard title="Cupons ativos" value={metrics.activeCoupons} icon={Percent} tone="purple" source="coupons" />
        <AdminMetricCard title="Usos de cupom" value={metrics.couponUses} icon={Percent} tone="amber" source="coupons" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cupons por uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.coupons.slice(0, 8).map((coupon) => (
            <div key={coupon.code} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{coupon.code}</p>
                <p className="text-xs text-muted-foreground">{coupon.discount_type || "desconto"} {coupon.discount_value || ""}</p>
              </div>
              <span className="text-muted-foreground">{coupon.times_used} usos</span>
            </div>
          ))}
          {metrics.coupons.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cupom encontrado.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenueMetrics;
