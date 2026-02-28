import { useState, useEffect } from "react";
import { PlayCircle, User, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Onboarding } from "@/components/Onboarding";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PersonalDataCard } from "@/components/profile/PersonalDataCard";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";
import SEO from "@/components/SEO";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Perfil = () => {
  const { toast } = useToast();
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();

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
          .single();

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
          <TabsList className="w-full md:max-w-lg grid grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
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
        </Tabs>
      </div>
    </>
  );
};

export default Perfil;
