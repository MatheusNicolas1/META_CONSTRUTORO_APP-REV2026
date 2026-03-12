import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Building2, MapPin, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useExpandable } from "@/hooks/use-expandable";
import { useRef, useEffect } from "react";
import { useRecentObras } from "@/hooks/useRecentObras";
import { Skeleton } from "@/components/ui/skeleton";

interface Obra {
  id: string;
  nome: string;
  progresso: number;
  prazo: string;
  status: string;
  responsavel: string;
  localizacao: string;
  equipe: string[];
  materiaisPrincipais: string[];
  orcamento: number;
  proximaEtapa: string;
  dataInicio: string;
  atividades: number;
}

interface ObraCardProps {
  obra: Obra;
}

// mockObras removed

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

function ObraCard({ obra }: ObraCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Em andamento":
        return <Badge variant="default" className="bg-construction-orange text-white text-[10px] sm:text-xs h-5">Em andamento</Badge>;
      case "Finalizando":
        return <Badge variant="default" className="bg-construction-green text-white text-[10px] sm:text-xs h-5">Finalizando</Badge>;
      case "Iniciando":
        return <Badge variant="secondary" className="bg-construction-blue text-white text-[10px] sm:text-xs h-5">Iniciando</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] sm:text-xs h-5">Pendente</Badge>;
    }
  };

  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-md border-border/50" onClick={toggleExpand}>
      <CardContent className="p-3 sm:p-4">
        {/* Header compacto com informações principais */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h4 className="font-semibold text-xs sm:text-sm text-card-foreground truncate">
                {obra.nome}
              </h4>
              {getStatusBadge(obra.status)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-3 flex-shrink-0">
            <Link to={`/app/obras/${obra.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                <Building2 className="h-3 w-3" />
              </Button>
            </Link>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Localização e responsável na mesma linha */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5 sm:mb-2 gap-2">
          <div className="flex items-center text-muted-foreground min-w-0 flex-1">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{obra.localizacao}</span>
          </div>
          <div className="flex items-center text-muted-foreground min-w-0 flex-1">
            <User className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">{obra.responsavel}</span>
          </div>
        </div>

        {/* Datas abaixo da localização */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs mb-2 sm:mb-3 gap-2">
          <div className="flex items-center text-muted-foreground min-w-0">
            <Calendar className="h-3 w-3 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Início: {formatDate(obra.dataInicio)}</span>
          </div>
          <span className="text-muted-foreground truncate">Término: {formatDate(obra.prazo)}</span>
        </div>

        {/* Progresso com quantidade de atividades */}
        <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-muted-foreground">• {obra.atividades} atividades</span>
            </div>
            <span className="font-semibold text-construction-green">{obra.progresso}%</span>
          </div>
          <ProgressBar value={obra.progresso} className="h-1.5 sm:h-2" />
        </div>

        {/* Conteúdo expandível otimizado */}
        <motion.div
          style={{ height: animatedHeight }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div ref={contentRef}>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pt-3 border-t border-border/30 space-y-3"
                >
                  {/* Informações financeiras e detalhadas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-card-foreground">Orçamento</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {formatCurrency(obra.orcamento)}
                      </Badge>
                    </div>
                  </div>

                  {/* Próxima etapa */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-card-foreground">Próxima Etapa</span>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded">
                      {obra.proximaEtapa}
                    </p>
                  </div>

                  {/* Equipe */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-card-foreground">Equipe</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {obra.equipe.length} membros
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {obra.equipe.map((membro, index) => (
                        <Badge key={index} variant="secondary" className="text-xs h-5 px-2">
                          {membro}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Materiais principais */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-card-foreground">Materiais Principais</span>
                    <div className="flex flex-wrap gap-1">
                      {obra.materiaisPrincipais.map((material, index) => (
                        <Badge key={index} variant="outline" className="text-xs h-5 px-2">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Botão de ação principal */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border/30">
          <Link to={`/app/obras/${obra.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="w-full h-7 sm:h-8 text-[10px] sm:text-xs font-medium">
              Visualizar Obra Completa
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentObras() {
  const { data: obras, isLoading } = useRecentObras();

  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-card-foreground flex items-center text-base sm:text-lg">
          <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Obras Recentes
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Suas obras mais atualizadas - Clique para expandir</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
        <div className="space-y-2 sm:space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="h-5 w-48 mb-3" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-40 mb-3" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : obras && obras.length > 0 ? (
            obras.map((obra) => (
              <ObraCard key={obra.id} obra={{
                id: obra.id,
                nome: obra.nome,
                progresso: obra.progresso || 0,
                prazo: obra.previsao_termino || new Date().toISOString(),
                status: obra.status,
                responsavel: obra.responsavel || "—",
                localizacao: obra.localizacao || "—",
                equipe: [], // TBD: Fetch relation
                materiaisPrincipais: [], // TBD: Fetch relation
                orcamento: 0, // TBD: Fetch relation
                proximaEtapa: obra.descricao || "Em andamento",
                dataInicio: obra.data_inicio || new Date().toISOString(),
                atividades: 0 // TBD: Count relation
              }} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma obra cadastrada ainda.
              <br />
              <Link to="/app/obras" className="text-construction-orange hover:underline mt-2 inline-block">
                Criar sua primeira obra
              </Link>
            </div>
          )}
        </div>

        {obras && obras.length > 0 && (
          <Link to="/app/obras">
            <Button variant="outline" className="w-full mt-3 sm:mt-4 h-9 text-sm">
              Ver Todas as Obras
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}