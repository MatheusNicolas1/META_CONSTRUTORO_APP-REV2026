import { useState, useEffect } from "react";
import { BarChart3, PlayCircle, User, Shield, CreditCard, Percent } from "lucide-react";
import { AffiliateCard } from "@/components/profile/AffiliateCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Onboarding } from "@/components/Onboarding";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PersonalDataCard } from "@/components/profile/PersonalDataCard";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";
import SEO from "@/components/SEO";
import { isPlatformPresidentUser } from "@/utils/adminAccess";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Perfil = () => {
  const { toast } = useToast();
  const [showTour, setShowTour] = useState(false);
  const { user, roles } = useAuth();
  const userRole = roles?.[0];
  const canAccessMetrics = userRole === "Presidente" || userRole === "Administrador";

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    cpf_cnpj: "",
    avatar_url: "",
  });

  const [initialLoading, setInitialLoading] = useState(true);

  // Carregar dados reais do perfil para passar ao card
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUserData({
            name: data.name || user.name || "",
            email: user.email || "",
            phone: data.phone || "",
            company: data.company || "",
            cpf_cnpj: data.cpf_cnpj || "",
            avatar_url: data.avatar_url || "",
          });
        } else {
          setUserData((current) => ({
            ...current,
            name: user.name || "",
            email: user.email || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar suas informações.",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  if (initialLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <>
      <SEO title="Meu Perfil | Meta Construtor" description="Gerencie suas informações pessoais e assinatura." canonical={window.location.href} />
      {showTour && <Onboarding forceShow={true} onComplete={() => setShowTour(false)} />}

      <div className="space-y-6 container mx-auto p-4 md:p-6 max-w-7xl animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Gerencie suas informações, segurança e plano de assinatura.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTour(true)}
            className="gap-2 hidden md:flex"
          >
            <PlayCircle className="h-4 w-4" />
            Tour Guiado
          </Button>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="personal" className="w-full space-y-8">
          <TabsList className={`w-full grid h-auto p-1 bg-muted/50 rounded-xl ${canAccessMetrics ? "md:max-w-3xl grid-cols-2 sm:grid-cols-5" : "md:max-w-xl grid-cols-4"}`}>
            <TabsTrigger value="personal" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados Pessoais</span>
              <span className="sm:hidden">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Minha Assinatura</span>
              <span className="sm:hidden">Planos</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
              <span className="sm:hidden">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
              <Percent className="h-4 w-4" />
              <span className="hidden sm:inline">Afiliados</span>
              <span className="sm:hidden">Afiliados</span>
            </TabsTrigger>
            {canAccessMetrics && (
              <TabsTrigger value="metrics" className="gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all">
                <BarChart3 className="h-4 w-4" />
                <span>Métricas</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="personal" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 focus-visible:outline-none focus-visible:ring-0">
            <PersonalDataCard initialData={userData} />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-6xl mx-auto md:mx-0">
              <SubscriptionTab />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 focus-visible:outline-none focus-visible:ring-0">
            <SecurityCard />
          </TabsContent>

          <TabsContent value="affiliate" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 focus-visible:outline-none focus-visible:ring-0">
            <AffiliateCard />
          </TabsContent>

          {canAccessMetrics && (
            <TabsContent value="metrics" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-3xl rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">Métricas do app</h2>
                    <p className="text-muted-foreground">
                      Acesse o painel de marketing, usuarios, rotas e utilizacao.
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to="/app/admin/dashboard">
                      <BarChart3 className="h-4 w-4" />
                      Abrir painel
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default Perfil;
