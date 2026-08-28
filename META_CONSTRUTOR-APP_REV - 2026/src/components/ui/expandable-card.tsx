"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  GitBranch,
  MessageSquare,
  Star,
  Users,
  CheckCircle2,
  Building2,
  MapPin,
  User,
  Calendar,
  Home,
  Store,
  Factory,
  Settings,
  School,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExpandable } from "@/hooks/use-expandable";
import { SocialShare } from "@/components/SocialShare";

interface ObraCardProps {
  id: string;
  nome: string;
  localizacao: string;
  responsavel: string;
  cliente: string;
  tipo: string;
  progresso: number;
  dataInicio: string;
  previsaoTermino: string;
  status: string;
  atividades: number;
  equipes?: Array<{ name: string; image?: string }>;
  tarefasRecentes?: Array<{ title: string; completed: boolean }>;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function ObraExpandableCard({
  id,
  nome,
  localizacao,
  responsavel,
  cliente,
  tipo,
  progresso,
  dataInicio,
  previsaoTermino,
  status,
  atividades,
  equipes = [],
  tarefasRecentes = [],
  onDelete,
  isDeleting = false,
}: ObraCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "Residencial":
        return Home;
      case "Comercial":
        return Store;
      case "Industrial":
        return Factory;
      case "Infraestrutura":
        return Settings;
      case "Institucional":
        return School;
      default:
        return Building2;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
  };

  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg border-border/50" onClick={toggleExpand}>
      <CardContent className="p-4">
        {/* Header compacto */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className={getStatusColor(status)}>
                {status}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-5 w-5 rounded border border-border/30 flex items-center justify-center">
                      {React.createElement(getTipoIcon(tipo), { className: "h-3 w-3 text-muted-foreground" })}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tipo}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className="font-semibold text-base text-card-foreground mb-1 truncate">{nome}</h3>
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{localizacao}</span>
            </div>
          </div>

          <div className="ml-3 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Progresso e informações principais */}
        <div className="space-y-3 mb-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-construction-green">{progresso}%</span>
            </div>
            <ProgressBar value={progresso} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center text-muted-foreground">
              <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{responsavel}</span>
            </div>
            <div className="flex items-center justify-end text-muted-foreground">
              <span>{atividades} atividades</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{formatDate(dataInicio)}</span>
            </div>
            <div className="flex items-center justify-end text-muted-foreground">
              <span className="truncate">{formatDate(previsaoTermino)}</span>
            </div>
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
                  {/* Informações detalhadas */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs">
                      <Building2 className="h-3 w-3 mr-1.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="ml-1 font-medium text-card-foreground">{cliente}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      {React.createElement(getTipoIcon(tipo), { className: "h-3 w-3 mr-1.5 flex-shrink-0 text-muted-foreground" })}
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="ml-1 font-medium text-card-foreground">{tipo}</span>
                    </div>
                  </div>

                  {/* Equipe */}
                  {equipes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-card-foreground">Equipe</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {equipes.length} membros
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {equipes.map((membro, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 border border-border">
                                  <AvatarImage
                                    src={membro.image || `https://ui-avatars.com/api/?name=${membro.name}&background=random`}
                                    alt={membro.name}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {membro.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{membro.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarefas recentes */}
                  {tarefasRecentes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-card-foreground">Tarefas Recentes</span>
                      <div className="space-y-1">
                        {tarefasRecentes.map((tarefa, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                            <span className="text-muted-foreground truncate">{tarefa.title}</span>
                            {tarefa.completed && (
                              <CheckCircle2 className="h-3 w-3 text-construction-green flex-shrink-0 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Botões de ação */}
        <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/obras/${id}`);
              }}
            >
              <Building2 className="h-3 w-3 mr-1.5" />
              Ver Detalhes
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <SocialShare
                title={`Obra: ${nome}`}
                text={`Obra: ${nome}\nLocal: ${localizacao}\nResponsável: ${responsavel}\n\nResumo compartilhado pelo MetaConstrutor.`}
                obraId={id}
              />
            </div>
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              {isDeleting ? "Movendo..." : "Mover para Lixeira"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
