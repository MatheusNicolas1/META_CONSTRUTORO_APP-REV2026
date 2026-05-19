import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AdminMetrics from "@/components/admin/AdminMetrics";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminManagers from "@/components/admin/AdminManagers";
import AdminHeatmap from "@/components/admin/AdminHeatmap";

const AdminDashboard = () => {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está autenticado e tem role de Administrador (ou superior)
    if (!loading && (!user || !hasRole('Administrador'))) {
      navigate('/app/dashboard');
    }
  }, [user, loading, navigate, hasRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasRole('Administrador')) {
    return null;
  }

  return (
    <>
      <SEO
        title="Painel Administrativo | Meta Construtor"
        description="Painel de controle administrativo do Meta Construtor"
        canonical={window.location.href}
      />

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <p className="text-muted-foreground">
            Gestão completa da plataforma Meta Construtor
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
            {user?.email === 'matheusnicolas.org@gmail.com' && (
              <TabsTrigger value="managers">Administradores</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            <AdminMetrics />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="coupons" className="space-y-6">
            <AdminCoupons />
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <AdminHeatmap />
          </TabsContent>

          {user?.email === 'matheusnicolas.org@gmail.com' && (
            <TabsContent value="managers" className="space-y-6">
              <AdminManagers />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;
