import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Building2,
  FileText,
  Edit,
  Trash2,
  Users,
  Wrench,
  ClipboardList,
  ChevronDown,
  CloudSun,
  Download,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpandable } from "@/hooks/use-expandable";
import { RDO } from "@/types/rdo";
import { SocialShare } from "@/components/SocialShare";
import { useRDONichos } from "@/hooks/useRDONichos";
import { RDONichoSelect } from "@/components/rdo/RDONichoSelect";

interface RDOExpandableCardProps {
  rdo: RDO;
  onEdit: (rdo: RDO) => void;
  onDelete: (id: number | string) => void;
  onDownload: (rdo: RDO) => void;
  editMode?: boolean;
  onNichoChange?: (nichoId: string) => void;
}

export function RDOExpandableCard({ rdo, onEdit, onDelete, onDownload, editMode = false, onNichoChange }: RDOExpandableCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);
  const { nichosQuery } = useRDONichos();
  const nichos = nichosQuery.data || [];
  const nicho = nichos.find((n) => n.id === (rdo as any).nicho_id);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline" className="text-[10px] px-1.5 py-0">N/A</Badge>;

    const s = status.toLowerCase();
    if (s.includes('aprovado') || s === 'approved')
      return <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Aprovado</Badge>;
    if (s.includes('rejeitado') || s === 'rejected')
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Rejeitado</Badge>;
    if (s.includes('aguardando') || s === 'submitted' || s.includes('analise'))
      return <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Em Análise</Badge>;
    if (s.includes('elabor') || s === 'draft')
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600">Rascunho</Badge>;
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Pendente</Badge>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluída":
        return "bg-emerald-600 text-white";
      case "Em Andamento":
        return "bg-amber-500 text-white";
      case "Iniciada":
        return "bg-blue-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const rdoLabel = rdo.numero
    ? String(rdo.numero).padStart(3, '0')
    : (typeof rdo.id === 'string' ? rdo.id.slice(0, 8) : rdo.id);

  return (
    <Card
      className="w-full cursor-pointer transition-all duration-200 hover:shadow-md bg-card border-border overflow-hidden"
      onClick={toggleExpand}
    >
      {/* ── HEADER COMPACTO ── */}
      <div className="p-3 sm:p-4">
        {/* Linha 1: Título + Status + Ações */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Ícone + Título */}
          <FileText className="h-4 w-4 text-construction-orange flex-shrink-0" />
          <span className="text-sm font-semibold text-card-foreground truncate max-w-[180px]">
            RDO #{rdoLabel}
          </span>

          {/* Status Badge */}
          {getStatusBadge(rdo.status)}

          {/* Nicho Badge */}
          {nicho && !editMode && (
            <Badge
              className="text-[10px] px-1.5 py-0 border flex items-center gap-1 max-w-full"
              style={{
                backgroundColor: `${nicho.cor}20`,
                borderColor: nicho.cor,
                color: nicho.cor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: nicho.cor }}
              />
              <span className="truncate max-w-[120px]">{nicho.nome}</span>
            </Badge>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Ações (inline, compacto) */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(rdo);
                    }}
                    className="h-7 w-7"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixar arquivo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <SocialShare
              title={`RDO #${rdo.id} - ${rdo.obraNome}`}
              text={`📋 RDO #${rdo.id}\n🏗️ ${rdo.obraNome}\n📅 ${formatDate(rdo.data)}\n☀️ ${rdo.clima}`}
              rdoId={rdo.id.toString()}
              obraId={rdo.obraId.toString()}
              compact={true}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(rdo)}
              className="h-7 w-7"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(rdo.id)}
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Seta de Expandir */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Linha 2: Meta-info compacta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            {formatDate(rdo.data)}
            {rdo.periodo && <span className="text-muted-foreground/70">· {rdo.periodo}</span>}
          </span>
          <span className="inline-flex items-center gap-1 truncate max-w-[180px] sm:max-w-none">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{rdo.obraNome}</span>
          </span>
          {rdo.clima && (
            <span className="inline-flex items-center gap-1">
              <CloudSun className="h-3 w-3 flex-shrink-0" />
              {rdo.clima}
            </span>
          )}
        </div>
      </div>

      {/* ── CONTEÚDO EXPANSÍVEL ── */}
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
              >
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 space-y-3">
                  {/* Stats Compactos */}
                  <div className="grid grid-cols-4 gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-blue-500 leading-none">{rdo.atividadesRealizadas.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Atividades</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-3.5 w-3.5 text-emerald-500 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-emerald-500 leading-none">{rdo.equipesPresentes.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Equipes</p>
                    </div>
                    <div className="text-center">
                      <Wrench className="h-3.5 w-3.5 text-amber-500 mx-auto mb-0.5" />
                      <p className="text-base font-bold text-amber-500 leading-none">{rdo.equipamentosUtilizados.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Equip.</p>
                    </div>
                    <div className="text-center">
                      <CloudSun className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-0.5" />
                      <p className="text-xs font-medium text-muted-foreground leading-tight mt-0.5">{rdo.clima || '—'}</p>
                    </div>
                  </div>

                  {/* Atividades */}
                  {rdo.atividadesRealizadas.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-card-foreground mb-1.5">Atividades Realizadas</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {rdo.atividadesRealizadas.map((a, i) => (
                          <Badge key={i} className={`${getStatusColor(a.status)} text-[10px] px-1.5 py-0`}>
                            {a.nome} · {a.quantidade}{a.unidadeMedida}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipes */}
                  {rdo.equipesPresentes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-card-foreground mb-1.5">Equipes Presentes</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {rdo.equipesPresentes.map((e, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                            {e.nome} · {e.horasTrabalho}h
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipamentos */}
                  {rdo.equipamentosUtilizados.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-card-foreground mb-1.5">Equipamentos</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {rdo.equipamentosUtilizados.map((eq, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {eq.nome} · {eq.horasUso}h
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nicho Select - modo edição */}
                  {editMode && onNichoChange && (
                    <div>
                      <h4 className="text-xs font-semibold text-card-foreground mb-1.5">Nicho</h4>
                      <div onClick={(e) => e.stopPropagation()}>
                        <RDONichoSelect
                          value={nicho?.id || ''}
                          onChange={onNichoChange}
                        />
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {rdo.observacoes && (
                    <div>
                      <h4 className="text-xs font-semibold text-card-foreground mb-1">Observações</h4>
                      <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md leading-relaxed break-words">
                        {rdo.observacoes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Card>
  );
}