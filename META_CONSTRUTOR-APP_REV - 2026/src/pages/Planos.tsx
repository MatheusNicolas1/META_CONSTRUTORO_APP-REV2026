import SEO from "@/components/SEO";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrg } from "@/contexts/OrgContext";

const Planos = () => {
  const { activeRole, isLoading } = useOrg();
  const cannotManageBilling = activeRole
    ? !["Presidente", "Administrador"].includes(activeRole)
    : false;

  return (
    <>
      <SEO
        title="Planos e Assinatura | Meta Construtor"
        description="Escolha, assine ou altere seu plano do Meta Construtor."
        canonical={window.location.href}
      />

      <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Planos e Assinatura
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Escolha um plano, altere o ciclo de cobranca ou gerencie sua assinatura.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <LoadingSpinner size="lg" text="Carregando planos..." />
          </div>
        ) : cannotManageBilling ? (
          <Card>
            <CardHeader>
              <CardTitle>Acesso negado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Apenas Presidente ou Administrador podem contratar, trocar ou cancelar planos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <SubscriptionTab />
        )}
      </div>
    </>
  );
};

export default Planos;
