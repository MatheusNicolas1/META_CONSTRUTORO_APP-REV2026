import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AdminOverviewMetrics from "@/components/admin/AdminOverviewMetrics";
import AdminAcquisitionMetrics from "@/components/admin/AdminAcquisitionMetrics";
import AdminOperationalMetrics from "@/components/admin/AdminOperationalMetrics";
import AdminEngagementMetrics from "@/components/admin/AdminEngagementMetrics";
import AdminRetentionMetrics from "@/components/admin/AdminRetentionMetrics";
import AdminRevenueMetrics from "@/components/admin/AdminRevenueMetrics";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminManagers from "@/components/admin/AdminManagers";
import AdminHeatmap from "@/components/admin/AdminHeatmap";
import AdminHealthMetrics from "@/components/admin/AdminHealthMetrics";
import AdminOrganizationsMetrics from "@/components/admin/AdminOrganizationsMetrics";
import AdminRoutesMetrics from "@/components/admin/AdminRoutesMetrics";
import AdminReferralsMetrics from "@/components/admin/AdminReferralsMetrics";
import AdminAuditLogs from "@/components/admin/AdminAuditLogs";
import AdminEnterprisePlans from "@/components/admin/AdminEnterprisePlans";
import { AdminFiltersBar, AdminFiltersProvider } from "@/components/admin/AdminFilters";

const AdminDashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const userRole = roles?.[0];
  const canAccessAdmin = userRole === "Presidente" || userRole === "Administrador";
  const canManageAdmins = canAccessAdmin;

  useEffect(() => {
    if (!loading && (!user || !canAccessAdmin)) {
      navigate("/app/dashboard");
    }
  }, [user, loading, navigate, canAccessAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <>
      <SEO
        title="Painel Administrativo | Meta Construtor"
        description="Painel administrativo de marketing, usuarios, rotas e uso do app"
        canonical={window.location.href}
      />

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <p className="text-muted-foreground">
            Metricas de marketing, usuarios, rotas e uso do app.
          </p>
        </div>

        <AdminFiltersProvider>
          <div className="mb-6">
            <AdminFiltersBar />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
              <TabsList className="inline-flex h-auto w-max justify-start gap-2 bg-muted/60 p-2">
                <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Visao geral</TabsTrigger>
                <TabsTrigger value="acquisition" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Aquisicao</TabsTrigger>
                <TabsTrigger value="activation" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Ativacao</TabsTrigger>
                <TabsTrigger value="engagement" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Engajamento</TabsTrigger>
                <TabsTrigger value="retention" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Retencao</TabsTrigger>
                <TabsTrigger value="revenue" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Receita</TabsTrigger>
                <TabsTrigger value="users" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Usuarios</TabsTrigger>
                <TabsTrigger value="organizations" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Organizacoes</TabsTrigger>
                <TabsTrigger value="routes" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Rotas</TabsTrigger>
                <TabsTrigger value="campaigns" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Campanhas</TabsTrigger>
                <TabsTrigger value="referrals" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Indicações</TabsTrigger>
                <TabsTrigger value="health" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Saude</TabsTrigger>
                <TabsTrigger value="audit" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Auditoria</TabsTrigger>
                <TabsTrigger value="enterprise" className="whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm sm:px-4">Enterprise</TabsTrigger>
              </TabsList>
            </div>

          <TabsContent value="overview" className="space-y-6">
            <AdminOverviewMetrics />
          </TabsContent>

          <TabsContent value="acquisition" className="space-y-6">
            <AdminAcquisitionMetrics />
          </TabsContent>

          <TabsContent value="activation" className="space-y-6">
            <AdminOperationalMetrics />
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <AdminEngagementMetrics />
            <AdminHeatmap />
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            <AdminRetentionMetrics />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <AdminRevenueMetrics />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <AdminOrganizationsMetrics />
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <AdminRoutesMetrics />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <AdminCoupons />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <AdminReferralsMetrics />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <AdminHealthMetrics />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AdminAuditLogs />
            {canManageAdmins && <AdminManagers />}
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-6">
            {userRole === "Presidente" ? (
              <AdminEnterprisePlans />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Apenas o Presidente pode gerenciar planos Enterprise.</p>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </AdminFiltersProvider>
      </div>
    </>
  );
};

export default AdminDashboard;
