import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarClock, CreditCard, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminEventTimeline from "./AdminEventTimeline";

type OrgMemberRow = {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string | null;
  joined_at: string | null;
  profile?: {
    name: string | null;
    email: string | null;
  } | null;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string | null;
  updated_at: string | null;
  activeMembers: number;
  totalMembers: number;
  totalEvents: number;
  routeViews: number;
  interactions: number;
  lastEventAt: string | null;
  subscriptionStatus: string;
  planName: string | null;
  members: OrgMemberRow[];
  recentEvents: any[];
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

export default function AdminOrganizationsMetrics() {
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);

  const { data: orgs = [], isLoading, error } = useQuery({
    queryKey: ["admin-organizations-metrics"],
    queryFn: async (): Promise<OrgRow[]> => {
      const [orgsRes, membersRes, usageRes, subscriptionsRes, eventsRes] = await Promise.all([
        supabase
          .from("orgs")
          .select("id, name, slug, owner_user_id, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("org_members")
          .select("id, org_id, user_id, role, status, created_at, joined_at")
          .order("created_at", { ascending: false })
          .limit(2000),
        supabase
          .from("admin_org_usage_summary_view")
          .select("org_id, active_members, total_members, total_events, route_views, interactions, last_event_at"),
        supabase
          .from("subscriptions")
          .select("org_id, status, billing_cycle, plan_id, current_period_end")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("analytics_events")
          .select("org_id, event, route, source, created_at")
          .not("org_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (orgsRes.error) throw orgsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (usageRes.error) throw usageRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const members = (membersRes.data || []) as OrgMemberRow[];
      const userIds = Array.from(new Set(members.map((member) => member.user_id).filter(Boolean)));
      const planIds = Array.from(new Set((subscriptionsRes.data || []).map((subscription: any) => subscription.plan_id).filter(Boolean)));

      const [profilesRes, plansRes] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("id, name, email").in("id", userIds)
          : Promise.resolve({ data: [], error: null }),
        planIds.length
          ? supabase.from("plans").select("id, name, slug").in("id", planIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (plansRes.error) throw plansRes.error;

      const profilesById = new Map((profilesRes.data || []).map((profile: any) => [profile.id, profile]));
      const plansById = new Map((plansRes.data || []).map((plan: any) => [plan.id, plan]));
      const usageByOrg = new Map((usageRes.data || []).map((usage: any) => [usage.org_id, usage]));
      const subscriptionsByOrg = new Map<string, any>();
      (subscriptionsRes.data || []).forEach((subscription: any) => {
        if (!subscriptionsByOrg.has(subscription.org_id)) {
          subscriptionsByOrg.set(subscription.org_id, subscription);
        }
      });

      const membersByOrg = new Map<string, OrgMemberRow[]>();
      members.forEach((member) => {
        const current = membersByOrg.get(member.org_id) || [];
        current.push({
          ...member,
          profile: profilesById.get(member.user_id) || null,
        });
        membersByOrg.set(member.org_id, current);
      });

      const eventsByOrg = new Map<string, any[]>();
      (eventsRes.data || []).forEach((event: any) => {
        if (!event.org_id) return;
        const current = eventsByOrg.get(event.org_id) || [];
        if (current.length < 20) current.push(event);
        eventsByOrg.set(event.org_id, current);
      });

      return (orgsRes.data || []).map((org: any) => {
        const usage = usageByOrg.get(org.id) || {};
        const subscription = subscriptionsByOrg.get(org.id);
        const plan = subscription?.plan_id ? plansById.get(subscription.plan_id) : null;

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          owner_user_id: org.owner_user_id,
          created_at: org.created_at,
          updated_at: org.updated_at,
          activeMembers: Number(usage.active_members || 0),
          totalMembers: Number(usage.total_members || (membersByOrg.get(org.id) || []).length),
          totalEvents: Number(usage.total_events || 0),
          routeViews: Number(usage.route_views || 0),
          interactions: Number(usage.interactions || 0),
          lastEventAt: usage.last_event_at || null,
          subscriptionStatus: subscription?.status || "no_subscription",
          planName: plan?.name || plan?.slug || null,
          members: membersByOrg.get(org.id) || [],
          recentEvents: eventsByOrg.get(org.id) || [],
        };
      });
    },
  });

  const totals = useMemo(() => {
    return orgs.reduce(
      (acc, org) => ({
        orgs: acc.orgs + 1,
        activeMembers: acc.activeMembers + org.activeMembers,
        totalEvents: acc.totalEvents + org.totalEvents,
        activeSubscriptions: acc.activeSubscriptions + (["active", "trialing"].includes(org.subscriptionStatus) ? 1 : 0),
      }),
      { orgs: 0, activeMembers: 0, totalEvents: 0, activeSubscriptions: 0 },
    );
  }, [orgs]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizacoes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totals.orgs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totals.activeMembers)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totals.activeSubscriptions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totals.totalEvents)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizacoes e uso do app</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <LoadingSpinner />}
          {error && <p className="text-sm text-destructive">Nao foi possivel carregar as organizacoes.</p>}
          {!isLoading && !error && orgs.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma organizacao encontrada.</p>
          )}
          {!isLoading && !error && orgs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizacao</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Ultimo uso</TableHead>
                  <TableHead className="text-right">Detalhe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name || org.slug}</p>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{org.planName || "Sem plano"}</TableCell>
                    <TableCell>
                      <Badge variant={["active", "trialing"].includes(org.subscriptionStatus) ? "default" : "outline"}>
                        {org.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(org.activeMembers)} / {formatNumber(org.totalMembers)}</TableCell>
                    <TableCell>{formatNumber(org.totalEvents)}</TableCell>
                    <TableCell>{formatDate(org.lastEventAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrg(org)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrg)} onOpenChange={(open) => !open && setSelectedOrg(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedOrg && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedOrg.name || selectedOrg.slug}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Membros ativos</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedOrg.activeMembers)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Eventos</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedOrg.totalEvents)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Visualizacoes</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedOrg.routeViews)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Interacoes</p>
                    <p className="text-2xl font-bold">{formatNumber(selectedOrg.interactions)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Dados da organizacao</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">ID:</span> {selectedOrg.id}</p>
                    <p><span className="text-muted-foreground">Slug:</span> {selectedOrg.slug}</p>
                    <p><span className="text-muted-foreground">Owner:</span> {selectedOrg.owner_user_id}</p>
                    <p><span className="text-muted-foreground">Criada em:</span> {formatDate(selectedOrg.created_at)}</p>
                    <p><span className="text-muted-foreground">Atualizada em:</span> {formatDate(selectedOrg.updated_at)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Assinatura</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Plano:</span> {selectedOrg.planName || "Sem plano"}</p>
                    <p><span className="text-muted-foreground">Status:</span> {selectedOrg.subscriptionStatus}</p>
                    <p><span className="text-muted-foreground">Ultimo evento:</span> {formatDate(selectedOrg.lastEventAt)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Membros e roles</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrg.members.length === 0 && <p className="text-sm text-muted-foreground">Sem membros vinculados.</p>}
                  {selectedOrg.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{member.profile?.name || member.profile?.email || member.user_id}</p>
                        <p className="text-muted-foreground">{member.user_id}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Eventos recentes</CardTitle></CardHeader>
                <CardContent>
                  <AdminEventTimeline events={selectedOrg.recentEvents} formatDate={formatDate} />
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
