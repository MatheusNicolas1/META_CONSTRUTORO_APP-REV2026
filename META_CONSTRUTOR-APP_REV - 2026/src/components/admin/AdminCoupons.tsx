import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, DollarSign, Percent, Plus, Trash2, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  matchesAdminTextFilter,
  useAdminFilters,
} from "./AdminFilters";
import AdminFunnel from "./AdminFunnel";

type CouponForm = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  valid_until: string;
  usage_limit: number | null;
  is_active: boolean;
};

const emptyCoupon: CouponForm = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  valid_until: "",
  usage_limit: null,
  is_active: true,
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

const getCouponDiscountLabel = (coupon: any) => {
  if (coupon.discount_type === "percent") {
    return `${coupon.discount_value || coupon.discount_percentage || 0}%`;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(coupon.discount_value || 0));
};

const AdminCoupons = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCoupon, setNewCoupon] = useState<CouponForm>(emptyCoupon);
  const queryClient = useQueryClient();
  const { filters, sinceDate } = useAdminFilters();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-campaigns-coupons", sinceDate],
    queryFn: async () => {
      const funnelQuery = supabase
        .from("admin_funnel_daily_view")
        .select("event_date, route_views, interactions, signups, checkout_events, coupon_events, subscription_events, active_users")
        .order("event_date", { ascending: false });

      if (sinceDate) {
        funnelQuery.gte("event_date", sinceDate.slice(0, 10));
      }

      const [couponsRes, campaignsRes, funnelRes] = await Promise.all([
        supabase
          .from("coupons")
          .select("id, code, discount_type, discount_value, discount_percentage, valid_until, usage_limit, times_used, is_active, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("admin_campaign_performance_view")
          .select("utm_source, utm_medium, utm_campaign, ref, total_events, page_views, anonymous_visitors, identified_users, auth_events, billing_events, first_seen_at, last_seen_at"),
        funnelQuery,
      ]);

      if (couponsRes.error) throw couponsRes.error;
      if (campaignsRes.error) throw campaignsRes.error;
      if (funnelRes.error) throw funnelRes.error;

      return {
        coupons: couponsRes.data || [],
        campaigns: campaignsRes.data || [],
        funnel: funnelRes.data || [],
      };
    },
  });

  const coupons = useMemo(() => data?.coupons || [], [data?.coupons]);
  const filteredCoupons = useMemo(
    () => coupons.filter((coupon: any) => matchesAdminTextFilter(coupon.code, filters.campaign)),
    [coupons, filters.campaign],
  );

  const campaigns = useMemo(() => {
    return (data?.campaigns || [])
      .filter((campaign: any) => {
        const campaignName = campaign.utm_campaign || campaign.ref || "";
        return (
          matchesAdminTextFilter(campaignName, filters.campaign) &&
          matchesAdminTextFilter(campaign.utm_source, filters.source)
        );
      })
      .sort((a: any, b: any) => Number(b.total_events || 0) - Number(a.total_events || 0));
  }, [data?.campaigns, filters.campaign, filters.source]);

  const metrics = useMemo(() => {
    const funnel = data?.funnel || [];
    const totals = funnel.reduce(
      (acc: any, row: any) => ({
        routeViews: acc.routeViews + Number(row.route_views || 0),
        signups: acc.signups + Number(row.signups || 0),
        checkoutEvents: acc.checkoutEvents + Number(row.checkout_events || 0),
        couponEvents: acc.couponEvents + Number(row.coupon_events || 0),
        subscriptionEvents: acc.subscriptionEvents + Number(row.subscription_events || 0),
      }),
      { routeViews: 0, signups: 0, checkoutEvents: 0, couponEvents: 0, subscriptionEvents: 0 },
    );

    const couponUses = coupons.reduce((sum: number, coupon: any) => sum + Number(coupon.times_used || 0), 0);
    const activeCoupons = coupons.filter((coupon: any) => coupon.is_active).length;
    const campaignEvents = campaigns.reduce((sum: number, campaign: any) => sum + Number(campaign.total_events || 0), 0);

    return {
      ...totals,
      couponUses,
      activeCoupons,
      campaignEvents,
      checkoutConversion: totals.checkoutEvents ? totals.subscriptionEvents / totals.checkoutEvents : 0,
      couponShare: totals.checkoutEvents ? totals.couponEvents / totals.checkoutEvents : 0,
    };
  }, [campaigns, coupons, data?.funnel]);

  const commercialFunnelSteps = useMemo(() => [
    { label: "Rotas vistas", value: metrics.routeViews, source: "admin_funnel_daily_view.route_views" },
    { label: "Cadastros", value: metrics.signups, source: "admin_funnel_daily_view.signups" },
    { label: "Checkout", value: metrics.checkoutEvents, source: "admin_funnel_daily_view.checkout_events" },
    { label: "Eventos de cupom", value: metrics.couponEvents, source: "admin_funnel_daily_view.coupon_events" },
    { label: "Assinaturas", value: metrics.subscriptionEvents, source: "admin_funnel_daily_view.subscription_events" },
  ], [metrics.checkoutEvents, metrics.couponEvents, metrics.routeViews, metrics.signups, metrics.subscriptionEvents]);

  const auditCouponAction = async (action: string, details: Record<string, unknown>) => {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("admin_audit_logs").insert({
      admin_id: authData.user?.id || null,
      action,
      details: { ...details, source: "admin_campaigns_coupons" },
    });
  };

  const createCoupon = useMutation({
    mutationFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Usuario nao autenticado");

      const payload = {
        code: newCoupon.code.trim().toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: Number(newCoupon.discount_value || 0),
        valid_until: newCoupon.valid_until || null,
        usage_limit: newCoupon.usage_limit,
        is_active: newCoupon.is_active,
        created_by: authData.user.id,
      };

      const { data: created, error: createError } = await supabase
        .from("coupons")
        .insert(payload)
        .select("id, code")
        .single();

      if (createError) throw createError;

      await auditCouponAction("CREATE_COUPON", {
        coupon_id: created?.id,
        coupon_code: created?.code || payload.code,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns-coupons"] });
      setIsCreating(false);
      setNewCoupon(emptyCoupon);
      toast.success("Cupom criado com sucesso");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro desconhecido";
      toast.error(`Erro ao criar cupom: ${message}`);
    },
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, code, is_active }: { id: string; code: string; is_active: boolean }) => {
      const { error: updateError } = await supabase
        .from("coupons")
        .update({ is_active })
        .eq("id", id);

      if (updateError) throw updateError;

      await auditCouponAction(is_active ? "ACTIVATE_COUPON" : "DEACTIVATE_COUPON", {
        coupon_id: id,
        coupon_code: code,
        is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns-coupons"] });
      toast.success("Status do cupom atualizado");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro desconhecido";
      toast.error(`Erro ao atualizar cupom: ${message}`);
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: async ({ id, code }: { id: string; code: string }) => {
      const { error: deleteError } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await auditCouponAction("DELETE_COUPON", {
        coupon_id: id,
        coupon_code: code,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns-coupons"] });
      toast.success("Cupom removido com sucesso");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro desconhecido";
      toast.error(`Erro ao remover cupom: ${message}`);
    },
  });

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
          Nao foi possivel carregar campanhas e cupons.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cupons ativos</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(metrics.activeCoupons)}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(metrics.couponUses)} usos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de cupom</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(metrics.couponEvents)}</p>
            <p className="text-xs text-muted-foreground">{formatPercent(metrics.couponShare)} dos checkouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversao checkout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(metrics.checkoutConversion)}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(metrics.subscriptionEvents)} assinaturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos por campanha</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(metrics.campaignEvents)}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(campaigns.length)} campanhas/ref sources</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil comercial</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminFunnel steps={commercialFunnelSteps} formatValue={formatNumber} />
        </CardContent>
      </Card>

      {!isCreating ? (
        <Card>
          <CardContent className="pt-6">
            <Button type="button" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar cupom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Criar cupom</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo do cupom</Label>
                <Input
                  id="code"
                  placeholder="DESCONTO10"
                  value={newCoupon.code}
                  onChange={(event) => setNewCoupon({ ...newCoupon, code: event.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_type">Tipo de desconto</Label>
                <Select
                  value={newCoupon.discount_type}
                  onValueChange={(value: "percent" | "fixed") => setNewCoupon({ ...newCoupon, discount_type: value })}
                >
                  <SelectTrigger id="discount_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentagem</SelectItem>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor do desconto</Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  value={newCoupon.discount_value}
                  onChange={(event) => setNewCoupon({ ...newCoupon, discount_value: Number(event.target.value || 0) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valido ate</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={newCoupon.valid_until}
                  onChange={(event) => setNewCoupon({ ...newCoupon, valid_until: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Limite de uso</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={newCoupon.usage_limit || ""}
                  onChange={(event) => setNewCoupon({ ...newCoupon, usage_limit: event.target.value ? Number(event.target.value) : null })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newCoupon.is_active}
                  onCheckedChange={(checked) => setNewCoupon({ ...newCoupon, is_active: checked })}
                />
                <Label htmlFor="is_active">Cupom ativo</Label>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => createCoupon.mutate()} disabled={!newCoupon.code.trim() || createCoupon.isPending}>
                  {createCoupon.isPending ? <LoadingSpinner size="sm" /> : "Criar cupom"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campanhas no funil</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada para os filtros atuais.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Page views</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Ultimo evento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 12).map((campaign: any) => (
                  <TableRow key={`${campaign.utm_source}-${campaign.utm_medium}-${campaign.utm_campaign}-${campaign.ref}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.utm_campaign || campaign.ref || "Sem campanha"}</p>
                        <p className="text-xs text-muted-foreground">{campaign.ref || "sem ref"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{campaign.utm_source || "Direto"} / {campaign.utm_medium || "sem medium"}</TableCell>
                    <TableCell>{formatNumber(Number(campaign.total_events || 0))}</TableCell>
                    <TableCell>{formatNumber(Number(campaign.page_views || 0))}</TableCell>
                    <TableCell>
                      {formatNumber(Number(campaign.identified_users || 0))} id. / {formatNumber(Number(campaign.anonymous_visitors || 0))} anon.
                    </TableCell>
                    <TableCell>{formatNumber(Number(campaign.billing_events || 0))}</TableCell>
                    <TableCell>{formatDate(campaign.last_seen_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCoupons.map((coupon: any) => (
          <Card key={coupon.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={(checked) => toggleCoupon.mutate({ id: coupon.id, code: coupon.code, is_active: checked })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                      {coupon.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {coupon.valid_until && new Date(coupon.valid_until) < new Date() && (
                      <Badge variant="destructive">Expirado</Badge>
                    )}
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir cupom</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acao remove o cupom e registra auditoria administrativa.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCoupon.mutate({ id: coupon.id, code: coupon.code })}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2">
                  {coupon.discount_type === "percent" ? (
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{getCouponDiscountLabel(coupon)}</p>
                    <p className="text-xs text-muted-foreground">desconto</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{formatDate(coupon.valid_until)}</p>
                    <p className="text-xs text-muted-foreground">validade</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{formatNumber(Number(coupon.times_used || 0))} {coupon.usage_limit ? `/ ${formatNumber(Number(coupon.usage_limit))}` : ""}</p>
                    <p className="text-xs text-muted-foreground">usos</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Criado em {formatDate(coupon.created_at)}</p>
                  <p className="text-xs text-muted-foreground">Atualizado em {formatDate(coupon.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCoupons.length === 0 && !isCreating && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum cupom encontrado para os filtros atuais.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCoupons;
