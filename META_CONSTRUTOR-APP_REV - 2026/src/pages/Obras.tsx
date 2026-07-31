import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Search, Plus, AlertCircle } from "lucide-react";
import { ObraExpandableCard } from "@/components/ui/expandable-card";
import { NovaObraForm } from "@/components/NovaObraForm";
import { PlanLimitCard } from "@/components/PlanLimitCard";
import { useObras } from "@/hooks/useObras";
import { usePermissions } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AnimatedPage } from "@/components/AnimatedPage";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { motion } from "framer-motion";

const Obras = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { obras, isLoading, error, refetch } = useObras();
  const { obra: obraPerms, isLoading: isPermsLoading, obrasCount } = usePermissions();

  const filteredObras = obras.filter(obra =>
    String(obra.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(obra.localizacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(obra.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "text-construction-orange";
      case "Finalizando":
        return "text-construction-green";
      case "Iniciando":
        return "text-construction-blue";
      default:
        return "text-muted-foreground";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading || isPermsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} lines={3} hasImage />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="responsive-spacing">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar obras</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span>Não foi possível carregar as obras. Verifique sua conexão e tente novamente.</span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="responsive-spacing">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">Obras</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus projetos</p>
          </div>
          <Button
            className="gradient-construction border-0 hover:opacity-90 w-full sm:w-auto sm:flex-shrink-0"
            onClick={() => setIsDialogOpen(true)}
            disabled={!obraPerms.canCreate}
            title={obraPerms.isAtLimit ? `Limite de ${obraPerms.maxObras} obras atingido` : !obraPerms.canCreate ? "Você não tem permissão para criar obras" : ""}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Obra</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {obraPerms.isAtLimit && (
          <PlanLimitCard
            title="Limite de obras atingido"
            description={`Seu plano atual permite até ${obraPerms.maxObras} obra(s). Faça upgrade para cadastrar novas obras e continuar expandindo seus projetos.`}
            used={obrasCount}
            limit={obraPerms.maxObras}
          />
        )}

        {/* Search Bar */}
        <div className="w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar obras, localização ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Works Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredObras.map((obra) => (
            <ObraExpandableCard
              key={obra.id}
              id={obra.id}
              nome={obra.nome || "Obra sem nome"}
              localizacao={obra.localizacao || "Localização não informada"}
              responsavel={obra.responsavel || "Responsável não informado"}
              cliente={obra.cliente || "Cliente não informado"}
              tipo={obra.tipo || "Não especificado"}
              progresso={obra.progresso || 0}
              dataInicio={obra.data_inicio}
              previsaoTermino={obra.previsao_termino}
              status={obra.status || "Iniciando"}
              atividades={obra.atividades?.[0]?.count || 0}
              equipes={[]} // Atualmente as equipes são relacionadas, não incluídas direto na obra
              tarefasRecentes={[]} // Tarefas seriam buscadas separadamente
            />
          ))}
        </div>

        {filteredObras.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Nenhuma obra encontrada"
            description={searchTerm ? "Nenhum resultado para esta busca" : "Comece cadastrando sua primeira obra"}
            action={!searchTerm ? { label: "Nova Obra", onClick: () => setIsDialogOpen(true) } : undefined}
          />
        )}

        <NovaObraForm
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Obras;
