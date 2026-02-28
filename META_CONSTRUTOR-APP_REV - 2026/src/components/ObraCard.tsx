import { Card, CardContent } from "@/components/ui/card";
import { formatStatusLabel } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { MapPin, User, DollarSign, Calendar, Eye, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useExpandable } from "@/hooks/use-expandable";
import { useRef, useEffect } from "react";

interface Obra {
  id: number;
  nome: string;
  localizacao: string;
  responsavel: string;
  orcamento: number;
  progresso: number;
  dataInicio: string;
  previsaoTermino: string;
  status: string;
  atividades: number;
}

interface ObraCardProps {
  obra: Obra;
}

export function ObraCard({ obra }: ObraCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "bg-construction-orange/20 text-construction-orange border border-construction-orange/30";
      case "Finalizando":
        return "bg-construction-green/20 text-construction-green border border-construction-green/30";
      case "Iniciando":
        return "bg-construction-blue/20 text-construction-blue border border-construction-blue/30";
      default:
        return "bg-secondary text-secondary-foreground";
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

  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-md border-border/50" onClick={toggleExpand}>
      <CardContent className="p-4">
        {/* Header compacto com informações principais */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-card-foreground truncate">
                {obra.nome}
              </h4>
              <Badge variant="secondary" className={getStatusColor(obra.status)}>
                {/* Use helper to show humanized label */}
                {formatStatusLabel(obra.status)}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{obra.localizacao}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <Link to={`/obras/${obra.id}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Building2 className="h-3 w-3" />
              </Button>
            </Link>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Progresso principal */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold text-construction-green">{obra.progresso}%</span>
          </div>
          <ProgressBar value={obra.progresso} className="h-2" />
        </div>

        {/* Informações essenciais em linha */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
          <div className="flex items-center text-muted-foreground">
            <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{obra.responsavel}</span>
          </div>
          <div className="flex items-center justify-end text-muted-foreground">
            <span>{obra.atividades} atividades</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{formatDate(obra.dataInicio)}</span>
          </div>
          <div className="flex items-center justify-end text-muted-foreground">
            <span className="truncate">{formatDate(obra.previsaoTermino)}</span>
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
                  {/* Informações financeiras e detalhadas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-card-foreground">Orçamento</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {formatCurrency(obra.orcamento)}
                      </Badge>
                    </div>
                  </div>

                  {/* Período completo */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-card-foreground">Cronograma</span>
                    <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Início: {formatDate(obra.dataInicio)}</span>
                        <span>Término: {formatDate(obra.previsaoTermino)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-card-foreground">Responsável</span>
                    <div className="flex items-center text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span>{obra.responsavel}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Botão de ação principal */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <Link to={`/obras/${obra.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium">
              <Eye className="h-3 w-3 mr-2" />
              Ver Detalhes da Obra
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}