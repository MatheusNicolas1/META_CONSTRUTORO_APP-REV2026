import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  ChevronRight,
  CreditCard,
  Download,
  MoreHorizontal,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminMetricCard from "./AdminMetricCard";
import AdminEventTimeline from "./AdminEventTimeline";
import {
  matchesAdminArrayFilter,
  matchesAdminTextFilter,
  useAdminFilters,
} from "./AdminFilters";
import {
  ADMIN_USERS_EXPORT_LIMIT,
  buildAdminUsersCsv,
  buildAdminUsersExportAuditDetails,
} from "./adminUsersExport";

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  created_at: string | null;
  plan_type: string | null;
  roles: string[];
  credits: number;
  activity_segment: string;
  risk_level: string;
  total_events: number;
  route_views: number;
  interactions: number;
  first_event_at: string | null;
  last_event_at: string | null;
  orgs: Array<{ id: string; name: string | null; slug: string | null; role: string; status: string }>;
  subscription_status: string;
  billing_cycle: string | null;
  plan_name: string | null;
  acquisition_source: string | null;
  acquisition_campaign: string | null;
  acquisition_ref: string | null;
};

type PendingAccessAction = {
  user: AdminUserRow;
  action: "suspend" | "unsuspend";
};

const PAGE_SIZE = 12;
const activityLabels: Record<string, string> = {
  active_7d: "Ativo 7d",
  active_30d: "Ativo 30d",
  inactive: "Inativo",
  no_activity: "Sem atividade",
};

const riskLabels: Record<string, string> = {
  high: "Alto risco",
  medium: "Risco medio",
  low: "Baixo risco",
  none: "Sem risco",
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const safeText = (value: unknown) => String(value || "").trim();

const getRiskTone = (risk: string) => {
  if (risk === "high") return "destructive";
  if (risk === "medium") return "secondary";
  return "outline";
};

const getInitials = (name: string | null, email: string | null) => {
  const source = name || email || "US";
  return source.slice(0, 2).toUpperCase();
};

const formatAttribution = (user: AdminUserRow) => {
  const source = user.acquisition_source || "sem origem";
  const campaign = user.acquisition_campaign ? ` / ${user.acquisition_campaign}` : "";
  return `${source}${campaign}`;
};

const AdminUsers = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { filters, sinceDate } = useAdminFilters();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [planFilter, setPlanFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [pendingAccessAction, setPendingAccessAction] = useState<PendingAccessAction | null>(null);
  const [accessReason, setAccessReason] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users-segmented", filters.period],
    queryFn: async () => {
      const [usersRes, segmentsRes, riskRes, creditsRes, membersRes, subscriptionsRes, attributionRes] = await Promise.all([
        supabase
          .from("admin_users_view")
          .select("id, name, email, phone, company, avatar_url, created_at, plan_type, roles")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("admin_user_segments_view")
          .select("user_id, activity_segment, first_event_at, last_event_at, total_events, route_views, interactions, plan_type, roles")
          .limit(1000),
        supabase
          .from("admin_churn_risk_view")
          .select("user_id, risk_level")
          .limit(1000),
        supabase
          .from("user_credits")
          .select("user_id, credits_balance, plan_type, total_shared, last_shared_at")
          .limit(1000),
        supabase
          .from("org_members")
          .select("user_id, org_id, role, status, orgs(id, name, slug)")
          .limit(3000),
        supabase
          .from("subscriptions")
          .select("org_id, status, billing_cycle, plans(name)")
          .limit(1000),
        supabase
          .from("analytics_events")
          .select("user_id, source, utm_source, utm_campaign, ref, created_at")
          .not("user_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (segmentsRes.error) throw segmentsRes.error;
      if (riskRes.error) throw riskRes.error;
      if (creditsRes.error) throw creditsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (attributionRes.error) throw attributionRes.error;

      const segmentsByUser = new Map((segmentsRes.data || []).map((item: any) => [item.user_id, item]));
      const riskByUser = new Map((riskRes.data || []).map((item: any) => [item.user_id, item.risk_level || "none"]));
      const creditsByUser = new Map((creditsRes.data || []).map((item: any) => [item.user_id, item]));
      const membersByUser = new Map<string, AdminUserRow["orgs"]>();
      const subscriptionsByOrg = new Map<string, any>();
      const attributionByUser = new Map<string, any>();

      (attributionRes.data || []).forEach((event: any) => {
        if (!event.user_id || attributionByUser.has(event.user_id)) return;
        attributionByUser.set(event.user_id, event);
      });

      (subscriptionsRes.data || []).forEach((subscription: any) => {
        if (!subscription.org_id) return;
        const current = subscriptionsByOrg.get(subscription.org_id);
        if (!current || subscription.status === "active" || subscription.status === "trialing") {
          subscriptionsByOrg.set(subscription.org_id, subscription);
        }
      });

      (membersRes.data || []).forEach((member: any) => {
        if (!member.user_id) return;
        const org = Array.isArray(member.orgs) ? member.orgs[0] : member.orgs;
        const current = membersByUser.get(member.user_id) || [];
        current.push({
          id: member.org_id,
          name: org?.name || null,
          slug: org?.slug || null,
          role: member.role,
          status: member.status,
        });
        membersByUser.set(member.user_id, current);
      });

      const users = (usersRes.data || [])
        .filter((user: any) => Boolean(user.id))
        .map((user: any): AdminUserRow => {
          const segment = segmentsByUser.get(user.id) || {};
          const credit = creditsByUser.get(user.id) || {};
          const attribution = attributionByUser.get(user.id) || {};
          const orgs = membersByUser.get(user.id) || [];
          const primarySubscription = orgs
            .map((org) => subscriptionsByOrg.get(org.id))
            .find((subscription) => subscription?.status === "active" || subscription?.status === "trialing") ||
            orgs.map((org) => subscriptionsByOrg.get(org.id)).find(Boolean);
          const plan = Array.isArray(primarySubscription?.plans)
            ? primarySubscription.plans[0]
            : primarySubscription?.plans;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            company: user.company,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            plan_type: user.plan_type || segment.plan_type || credit.plan_type || null,
            roles: user.roles || segment.roles || [],
            credits: Number(credit.credits_balance || 0),
            activity_segment: segment.activity_segment || "no_activity",
            risk_level: riskByUser.get(user.id) || "none",
            total_events: Number(segment.total_events || 0),
            route_views: Number(segment.route_views || 0),
            interactions: Number(segment.interactions || 0),
            first_event_at: segment.first_event_at || null,
            last_event_at: segment.last_event_at || null,
            orgs,
            subscription_status: primarySubscription?.status || "no_subscription",
            billing_cycle: primarySubscription?.billing_cycle || null,
            plan_name: plan?.name || null,
            acquisition_source: attribution.utm_source || attribution.source || null,
            acquisition_campaign: attribution.utm_campaign || null,
            acquisition_ref: attribution.ref || null,
          };
        });

      return users;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["admin-user-detail", selectedUser?.id],
    enabled: Boolean(selectedUser?.id),
    queryFn: async () => {
      const userId = selectedUser?.id;
      if (!userId) {
        return {
          events: [],
          audits: [],
          loginEvents: [],
          profileMarketing: null,
          referralsMade: [],
          referralsReceived: [],
          marketingEvents: [],
        };
      }

      const [eventsRes, auditsRes, loginEventsRes, profileRes, referralsMadeRes, referralsReceivedRes, marketingEventsRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("event, route, source, success, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("admin_audit_logs")
          .select("action, admin_id, details, created_at")
          .eq("target_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("analytics_events")
          .select("event, source, session_id, created_at")
          .eq("user_id", userId)
          .in("event", ["auth.user_identified", "auth.login"])
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("referral_code, referral_bonus_days")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("referrals")
          .select("id, new_user_id, bonus_granted, bonus_type, created_at")
          .eq("referrer_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("referrals")
          .select("id, referrer_id, bonus_granted, bonus_type, created_at")
          .eq("new_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("analytics_events")
          .select("event, route, source, created_at, utm_campaign, ref")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (auditsRes.error) throw auditsRes.error;
      if (loginEventsRes.error) throw loginEventsRes.error;
      if (profileRes.error) throw profileRes.error;
      if (referralsMadeRes.error) throw referralsMadeRes.error;
      if (referralsReceivedRes.error) throw referralsReceivedRes.error;
      if (marketingEventsRes.error) throw marketingEventsRes.error;

      const marketingEvents = (marketingEventsRes.data || [])
        .filter((event: any) => {
          const haystack = [
            event.event,
            event.route,
            event.source,
            event.utm_campaign,
            event.ref,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return ["coupon", "cupom", "referral", "indicacao", "indicacoes"].some((term) => haystack.includes(term));
        })
        .slice(0, 25);

      return {
        events: eventsRes.data || [],
        audits: auditsRes.data || [],
        loginEvents: loginEventsRes.data || [],
        profileMarketing: profileRes.data || null,
        referralsMade: referralsMadeRes.data || [],
        referralsReceived: referralsReceivedRes.data || [],
        marketingEvents,
      };
    },
  });

  const updateUserPlan = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      const { error } = await supabase.from("profiles").update({ plan_type: plan }).eq("id", userId);
      if (error) throw error;

      await supabase.from("admin_audit_logs").insert({
        admin_id: currentUser?.id,
        action: "UPDATE_PLAN",
        target_user_id: userId,
        details: { new_plan: plan, source: "admin_users_segmented" },
      });
    },
    onSuccess: () => {
      toast({ title: "Plano atualizado" });
      queryClient.invalidateQueries({ queryKey: ["admin-users-segmented"] });
      refetch();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o plano";
      toast({ title: "Erro ao atualizar plano", description: message, variant: "destructive" });
    },
  });

  const updateUserCredits = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const { error } = await supabase
        .from("user_credits")
        .upsert({ user_id: userId, credits_balance: credits, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;

      await supabase.from("admin_audit_logs").insert({
        admin_id: currentUser?.id,
        action: "UPDATE_CREDITS",
        target_user_id: userId,
        details: { new_credits: credits, source: "admin_users_segmented" },
      });
    },
    onSuccess: () => {
      toast({ title: "Creditos atualizados" });
      queryClient.invalidateQueries({ queryKey: ["admin-users-segmented"] });
      refetch();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Nao foi possivel atualizar os creditos";
      toast({ title: "Erro ao atualizar creditos", description: message, variant: "destructive" });
    },
  });

  const changeUserAccess = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: "suspend" | "unsuspend"; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("suspend-user", {
        body: { user_id: userId, action, reason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error.message || "Erro ao alterar acesso do usuario");
      return { ...data, action };
    },
    onSuccess: (data) => {
      toast({ title: data.action === "unsuspend" ? "Usuario reativado" : "Usuario suspenso" });
      queryClient.invalidateQueries({ queryKey: ["admin-users-segmented"] });
      refetch();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Nao foi possivel alterar o acesso do usuario";
      toast({ title: "Erro ao alterar acesso", description: message, variant: "destructive" });
    },
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const createdAfter = sinceDate ? new Date(sinceDate).getTime() : null;

    return (data || []).filter((user) => {
      const haystack = [user.name, user.email, user.company, user.id, user.plan_name, ...user.orgs.flatMap((org) => [org.name, org.slug, org.id])]
        .map((value) => safeText(value).toLowerCase())
        .join(" ");

      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      const matchesCreatedAt = !createdAfter || (user.created_at && new Date(user.created_at).getTime() >= createdAfter);
      const matchesPlan =
        (planFilter === "all" || user.plan_type === planFilter || user.plan_name === planFilter) &&
        matchesAdminTextFilter(`${user.plan_type || ""} ${user.plan_name || ""}`, filters.plan);
      const matchesRole =
        (roleFilter === "all" || user.roles.includes(roleFilter)) &&
        matchesAdminArrayFilter(user.roles, filters.role);
      const matchesOrg = !filters.org || user.orgs.some((org) => [org.id, org.name, org.slug].some((value) => matchesAdminTextFilter(value, filters.org)));
      const matchesActivity = activityFilter === "all" || user.activity_segment === activityFilter;
      const matchesRisk = riskFilter === "all" || user.risk_level === riskFilter;
      const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter || user.orgs.some((org) => org.status === statusFilter);
      const matchesCampaign = matchesAdminTextFilter(user.acquisition_campaign, filters.campaign);
      const matchesSource = matchesAdminTextFilter(`${user.acquisition_source || ""} ${user.acquisition_ref || ""}`, filters.source);

      return matchesSearch && matchesCreatedAt && matchesPlan && matchesRole && matchesOrg && matchesActivity && matchesRisk && matchesStatus && matchesCampaign && matchesSource;
    });
  }, [activityFilter, data, filters.campaign, filters.org, filters.plan, filters.role, filters.source, planFilter, riskFilter, roleFilter, search, sinceDate, statusFilter]);

  const segmentSummary = useMemo(() => {
    return filteredUsers.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.activity_segment === "active_7d") acc.active7d += 1;
        if (user.risk_level === "high" || user.risk_level === "medium") acc.atRisk += 1;
        if (user.subscription_status === "active" || user.subscription_status === "trialing") acc.paying += 1;
        return acc;
      },
      { total: 0, active7d: 0, atRisk: 0, paying: 0 }
    );
  }, [filteredUsers]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingAccessUser = pendingAccessAction?.user || null;
  const isReactivation = pendingAccessAction?.action === "unsuspend";

  const resetLocalFilters = () => {
    setSearch("");
    setPlanFilter("all");
    setRoleFilter("all");
    setActivityFilter("all");
    setRiskFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    const rows = filteredUsers.slice(0, ADMIN_USERS_EXPORT_LIMIT);
    if (rows.length === 0) {
      toast({ title: "Nada para exportar", description: "Nenhum usuario no recorte atual." });
      return;
    }

    const csv = buildAdminUsersCsv(rows);
    const auditDetails = buildAdminUsersExportAuditDetails({
      exportedCount: rows.length,
      totalFiltered: filteredUsers.length,
      filters: { planFilter, roleFilter, activityFilter, riskFilter, statusFilter, global: filters },
    });

    await supabase.from("admin_audit_logs").insert({
      admin_id: currentUser?.id,
      action: "EXPORT_USERS_SEGMENT",
      target_user_id: null,
      details: auditDetails,
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios_segmento_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Usuarios e segmentos</h2>
        <p className="text-sm text-muted-foreground">
          Leitura operacional de usuarios, atividade, risco, orgs, plano e acoes administrativas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard title="Usuarios no recorte" value={segmentSummary.total} icon={Users} source="admin_users_view + admin_user_segments_view" />
        <AdminMetricCard title="Ativos 7 dias" value={segmentSummary.active7d} icon={ChevronRight} tone="green" source="admin_user_segments_view" />
        <AdminMetricCard title="Em risco" value={segmentSummary.atRisk} icon={ShieldAlert} tone="amber" source="admin_churn_risk_view" />
        <AdminMetricCard title="Pagantes/trial" value={segmentSummary.paying} icon={CreditCard} tone="purple" source="subscriptions" />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa, org ou id..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button type="button" variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar segmento
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Select value={planFilter} onValueChange={(value) => { setPlanFilter(value); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Colaborador">Colaborador</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activityFilter} onValueChange={(value) => { setActivityFilter(value); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Atividade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda atividade</SelectItem>
                <SelectItem value="active_7d">Ativo 7d</SelectItem>
                <SelectItem value="active_30d">Ativo 30d</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="no_activity">Sem atividade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={(value) => { setRiskFilter(value); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo risco</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Medio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
                <SelectItem value="none">Sem risco</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="no_subscription">Sem assinatura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={resetLocalFilters}>
            Limpar filtros locais
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Orgs</TableHead>
                <TableHead className="text-right">Eventos</TableHead>
                <TableHead>Ultimo uso</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name || "Sem nome"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email || user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{activityLabels[user.activity_segment] || user.activity_segment}</Badge>
                      <Badge variant={getRiskTone(user.risk_level) as any}>{riskLabels[user.risk_level] || user.risk_level}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge>{user.plan_type || user.plan_name || "sem plano"}</Badge>
                      <p className="text-xs text-muted-foreground">{user.subscription_status}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[180px] space-y-1">
                      <p className="truncate text-sm">{formatAttribution(user)}</p>
                      {user.acquisition_ref && <p className="truncate text-xs text-muted-foreground">ref {user.acquisition_ref}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[220px] space-y-1">
                      {user.orgs.slice(0, 2).map((org) => (
                        <p key={`${user.id}-${org.id}`} className="truncate text-sm">
                          {org.name || org.slug || org.id}
                          <span className="text-xs text-muted-foreground"> - {org.role}</span>
                        </p>
                      ))}
                      {user.orgs.length === 0 && <span className="text-sm text-muted-foreground">Sem org</span>}
                      {user.orgs.length > 2 && <p className="text-xs text-muted-foreground">+{user.orgs.length - 2} orgs</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-medium">{user.total_events.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">{user.route_views} rotas / {user.interactions} cliques</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{formatDate(user.last_event_at)}</p>
                    <p className="text-xs text-muted-foreground">Cadastro {formatDate(user.created_at)}</p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Abrir acoes do usuario"
                          aria-label={`Abrir acoes de ${user.name || user.email || "usuario"}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>Ver detalhe</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          disabled={changeUserAccess.isPending}
                          onClick={() => {
                            setAccessReason("Suspenso pelo painel administrativo");
                            setPendingAccessAction({ user, action: "suspend" });
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={changeUserAccess.isPending}
                          onClick={() => {
                            setAccessReason("Reativado pelo painel administrativo");
                            setPendingAccessAction({ user, action: "unsuspend" });
                          }}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Reativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {paginatedUsers.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum usuario encontrado no recorte atual.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pagina {currentPage} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
            Anterior
          </Button>
          <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
            Proxima
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhe do usuario</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle className="text-base">Perfil</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">{selectedUser.name || "Sem nome"}</p>
                    <p className="text-muted-foreground">{selectedUser.email || "Sem email"}</p>
                    <p>{selectedUser.company || "Sem empresa"}</p>
                    <p>Cadastro: {formatDate(selectedUser.created_at)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Plano e roles</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Plano</Label>
                      <Select value={selectedUser.plan_type || "free"} onValueChange={(plan) => updateUserPlan.mutate({ userId: selectedUser.id, plan })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="master">Master</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.roles.map((role) => <Badge key={role} variant="outline">{role}</Badge>)}
                    </div>
                    <p>Status: {selectedUser.subscription_status}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Credito e risco</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Creditos</Label>
                      <div className="mt-1 flex gap-2">
                        <Input id={`credits-${selectedUser.id}`} type="number" defaultValue={selectedUser.credits} />
                        <Button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`credits-${selectedUser.id}`) as HTMLInputElement | null;
                            const credits = Number(input?.value || 0);
                            updateUserCredits.mutate({ userId: selectedUser.id, credits });
                          }}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                    <Badge variant={getRiskTone(selectedUser.risk_level) as any}>{riskLabels[selectedUser.risk_level] || selectedUser.risk_level}</Badge>
                    <p>{activityLabels[selectedUser.activity_segment] || selectedUser.activity_segment}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Organizacoes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser.orgs.map((org) => (
                      <div key={org.id} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{org.name || org.slug || org.id}</p>
                        <p className="text-muted-foreground">{org.role} - {org.status}</p>
                      </div>
                    ))}
                    {selectedUser.orgs.length === 0 && <p className="text-sm text-muted-foreground">Sem organizacao vinculada.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Timeline de eventos</CardTitle></CardHeader>
                  <CardContent>
                    <AdminEventTimeline
                      events={detailQuery.data?.events || []}
                      isLoading={detailQuery.isLoading}
                      formatDate={formatDate}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Ultimos logins</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {detailQuery.isLoading && <LoadingSpinner />}
                  {(detailQuery.data?.loginEvents || []).map((event: any) => (
                    <div key={`${event.event}-${event.created_at}-${event.session_id || "sem-sessao"}`} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{event.event === "auth.user_identified" ? "Sessao autenticada identificada" : event.event}</p>
                      <p className="text-muted-foreground">
                        {event.source || "sem origem"} - {formatDate(event.created_at)}
                      </p>
                      {event.session_id && (
                        <p className="text-xs text-muted-foreground">
                          Sessao: {String(event.session_id).slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  ))}
                  {!detailQuery.isLoading && (detailQuery.data?.loginEvents || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Sem evento de login dedicado para este usuario.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Indicacoes</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {detailQuery.isLoading && <LoadingSpinner />}
                    {!detailQuery.isLoading && (
                      <>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Codigo de indicacao</p>
                          <p className="font-medium">{detailQuery.data?.profileMarketing?.referral_code || "Sem codigo registrado"}</p>
                          <p className="text-muted-foreground">
                            Bonus acumulado: {detailQuery.data?.profileMarketing?.referral_bonus_days || 0} dias
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-md border p-3">
                            <p className="font-medium">{(detailQuery.data?.referralsMade || []).length}</p>
                            <p className="text-muted-foreground">indicacoes geradas</p>
                          </div>
                          <div className="rounded-md border p-3">
                            <p className="font-medium">{(detailQuery.data?.referralsReceived || []).length}</p>
                            <p className="text-muted-foreground">cadastros por indicacao</p>
                          </div>
                        </div>
                        {(detailQuery.data?.referralsMade || []).slice(0, 5).map((referral: any) => (
                          <div key={referral.id} className="rounded-md border p-3">
                            <p className="font-medium">Novo usuario: {referral.new_user_id}</p>
                            <p className="text-muted-foreground">
                              {referral.bonus_granted ? "Bonus concedido" : "Bonus pendente"} - {referral.bonus_type || "sem tipo"} - {formatDate(referral.created_at)}
                            </p>
                          </div>
                        ))}
                        {(detailQuery.data?.referralsReceived || []).slice(0, 5).map((referral: any) => (
                          <div key={referral.id} className="rounded-md border p-3">
                            <p className="font-medium">Indicador: {referral.referrer_id}</p>
                            <p className="text-muted-foreground">
                              {referral.bonus_granted ? "Bonus concedido" : "Bonus pendente"} - {referral.bonus_type || "sem tipo"} - {formatDate(referral.created_at)}
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Cupons e campanhas</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {detailQuery.isLoading && <LoadingSpinner />}
                    {(detailQuery.data?.marketingEvents || []).map((event: any) => (
                      <div key={`${event.event}-${event.created_at}`} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{event.event || "evento de marketing"}</p>
                        <p className="text-muted-foreground">
                          {event.route || event.source || event.utm_campaign || event.ref || "sem origem"} - {formatDate(event.created_at)}
                        </p>
                      </div>
                    ))}
                    {!detailQuery.isLoading && (detailQuery.data?.marketingEvents || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sem evento de cupom/campanha vinculado diretamente a este usuario.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Auditoria administrativa</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(detailQuery.data?.audits || []).map((audit: any) => (
                    <div key={`${audit.action}-${audit.created_at}`} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{audit.action}</p>
                      <p className="text-muted-foreground">admin {audit.admin_id || "sistema"} - {formatDate(audit.created_at)}</p>
                    </div>
                  ))}
                  {!detailQuery.isLoading && (detailQuery.data?.audits || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem auditoria recente.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingAccessAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAccessAction(null);
            setAccessReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isReactivation ? "Reativar acesso?" : "Suspender acesso?"}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao vai {isReactivation ? "reativar" : "suspender"} o acesso de {pendingAccessUser?.email || pendingAccessUser?.id || "este usuario"} usando a Edge Function real `suspend-user`. A alteracao so sera considerada concluida se o backend confirmar a operacao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="access-reason">Motivo registrado na auditoria</Label>
            <Textarea
              id="access-reason"
              value={accessReason}
              onChange={(event) => setAccessReason(event.target.value)}
              placeholder="Informe o motivo da alteracao de acesso"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeUserAccess.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAccessAction) return;
                changeUserAccess.mutate(
                  {
                    userId: pendingAccessAction.user.id,
                    action: pendingAccessAction.action,
                    reason: accessReason.trim() || undefined,
                  },
                  {
                    onSuccess: () => {
                      setPendingAccessAction(null);
                      setAccessReason("");
                    },
                  }
                );
              }}
              disabled={changeUserAccess.isPending || !accessReason.trim()}
              className={isReactivation ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {changeUserAccess.isPending
                ? isReactivation ? "Reativando..." : "Suspendendo..."
                : isReactivation ? "Reativar acesso" : "Suspender acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
