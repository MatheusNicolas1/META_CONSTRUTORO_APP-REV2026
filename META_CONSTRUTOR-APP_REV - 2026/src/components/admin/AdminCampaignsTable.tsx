import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Calendar, Users } from "lucide-react";
import { matchesAdminTextFilter, useAdminFilters } from "./AdminFilters";

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

const AdminCampaignsTable = () => {
  const { filters, sinceDate } = useAdminFilters();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-campaigns-only", sinceDate],
    queryFn: async () => {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("admin_campaign_performance_view")
        .select("utm_source, utm_medium, utm_campaign, ref, total_events, page_views, anonymous_visitors, identified_users, auth_events, billing_events, first_seen_at, last_seen_at");

      if (campaignsError) throw campaignsError;

      return campaignsData || [];
    },
  });

  const campaigns = useMemo(() => {
    return (data || [])
      .filter((campaign: any) => {
        const campaignName = campaign.utm_campaign || campaign.ref || "";
        return (
          matchesAdminTextFilter(campaignName, filters.campaign) &&
          matchesAdminTextFilter(campaign.utm_source, filters.source)
        );
      })
      .sort((a: any, b: any) => Number(b.total_events || 0) - Number(a.total_events || 0));
  }, [data, filters.campaign, filters.source]);

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
          Nao foi possivel carregar campanhas.
        </CardContent>
      </Card>
    );
  }

  const totalEvents = campaigns.reduce((sum: number, c: any) => sum + Number(c.total_events || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(campaigns.length)}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(totalEvents)} eventos totais</p>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default AdminCampaignsTable;
