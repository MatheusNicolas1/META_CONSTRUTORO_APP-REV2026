import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building2, FileText, Clock, Thermometer, CloudRain, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useExpandable } from "@/hooks/use-expandable";
import { useRef, useEffect } from "react";
import { useRecentRDOs } from "@/hooks/useRecentRDOs";
import { Skeleton } from "@/components/ui/skeleton";

interface RDO {
  id: string;
  numeroRDO: string;
  obra: string;
  responsavel: string;
  data: Date;
  status: "pendente" | "aprovado" | "rejeitado" | "em_analise";
  atividades: number;
  clima: string;
  temperatura: string;
  equipamentos: string[];
  observacoes: string;
  horaInicio: string;
  horaFim: string;
}

interface RDOCardProps {
  rdo: RDO;
}

// mockRDOs removed

const getStatusBadge = (status: RDO["status"]) => {
  switch (status) {
    case "aprovado":
      return <Badge variant="default" className="bg-construction-green text-white">Aprovado</Badge>;
    case "rejeitado":
      return <Badge variant="destructive">Rejeitado</Badge>;
    case "em_analise":
      return <Badge variant="secondary" className="bg-construction-blue text-white">Em Análise</Badge>;
    default:
      return <Badge variant="outline">Pendente</Badge>;
  }
};

function RDOCard({ rdo }: RDOCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-md border-border/50" onClick={toggleExpand}>
      <CardContent className="p-4">
        {/* Header compacto com informações principais */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-card-foreground truncate">
                {rdo.numeroRDO}
              </h4>
              {getStatusBadge(rdo.status)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{rdo.obra}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <Link to={`/rdo/${rdo.id}/editar`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <FileText className="h-3 w-3" />
              </Button>
            </Link>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Informações essenciais em linha */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
          <div className="flex items-center text-muted-foreground">
            <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{rdo.responsavel}</span>
          </div>
          <div className="flex items-center justify-end text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span>{rdo.data.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <span>{rdo.atividades} atividades</span>
          </div>
          <div className="flex items-center justify-end text-muted-foreground">
            <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span>{rdo.horaInicio} - {rdo.horaFim}</span>
          </div>
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
                  {/* Condições de trabalho */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center text-muted-foreground">
                      <CloudRain className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{rdo.clima}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Thermometer className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{rdo.temperatura}</span>
                    </div>
                  </div>

                  {/* Equipamentos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-card-foreground">Equipamentos</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {rdo.equipamentos.length} itens
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rdo.equipamentos.map((equipamento, index) => (
                        <Badge key={index} variant="secondary" className="text-xs h-5 px-2">
                          {equipamento}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-card-foreground">Observações</span>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded">
                      {rdo.observacoes}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Botão de ação principal */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <Link to={`/rdo/${rdo.id}/visualizar`} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium">
              Visualizar RDO Completo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentRDOs() {
  const { data: rdos, isLoading } = useRecentRDOs();

  return (
    <Card className="bg-card border-border w-full">
      <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="text-card-foreground flex items-center text-base sm:text-lg">
          <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          RDOs Recentes
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Relatórios diários mais recentes - Clique para expandir</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
        <div className="space-y-2 sm:space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : rdos && rdos.length > 0 ? (
            rdos.map((rdo) => (
              <RDOCard key={rdo.id} rdo={{
                id: rdo.id,
                numeroRDO: `RDO-${new Date(rdo.data).toISOString().split('T')[0].replace(/-/g, '')}`,
                obra: rdo.obras?.nome || "Obra não especificada",
                responsavel: "—", // TBD
                data: new Date(rdo.data),
                status: (rdo.status === 'APPROVED' || rdo.status === 'Aprovado') ? 'aprovado' :
                  (rdo.status === 'REJECTED' || rdo.status === 'Rejeitado') ? 'rejeitado' :
                    (rdo.status === 'SUBMITTED' || rdo.status === 'Aguardando aprovação') ? 'em_analise' : 'pendente',
                atividades: 0, // TBD
                clima: rdo.clima,
                temperatura: "—",
                equipamentos: [], // TBD
                observacoes: rdo.observacoes || "",
                horaInicio: "07:00", // Default shift
                horaFim: "17:00"
              }} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum RDO cadastrado ainda.
              <br />
              <Link to="/rdo" className="text-construction-orange hover:underline mt-2 inline-block">
                Criar seu primeiro RDO
              </Link>
            </div>
          )}
        </div>

        {rdos && rdos.length > 0 && (
          <Link to="/rdo">
            <Button variant="outline" className="w-full mt-3 sm:mt-4 h-9 text-sm">
              Ver Todos os RDOs
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}