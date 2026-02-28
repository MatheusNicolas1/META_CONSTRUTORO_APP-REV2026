import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Calendar,
  User,
  Download,
  Eye,
  Edit,
  Trash2,
  Building2,
  FileType,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExpandable } from "@/hooks/use-expandable";
import { Documento } from "@/hooks/useDocuments";

interface DocumentoExpandableCardProps {
  documento: Documento;
  onEdit: (documento: Documento) => void;
  onDelete: (id: string) => void;
  onDownload: (documento: Documento) => void;
  onView: (documento: Documento) => void;
}

export function DocumentoExpandableCard({
  documento,
  onEdit,
  onDelete,
  onDownload,
  onView
}: DocumentoExpandableCardProps) {
  const { isExpanded, toggleExpand, animatedHeight } = useExpandable();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, animatedHeight]);

  const getStatusColor = (status: string) => {
    // Status not currently in DB schema, default to valid
    return "bg-construction-green text-white";
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Projeto":
        return "bg-construction-blue text-white";
      case "Licença":
        return "bg-construction-green text-white";
      case "Relatório":
        return "bg-construction-orange text-white";
      case "Memorial":
        return "bg-purple-500 text-white";
      case "Cronograma":
        return "bg-yellow-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (url: string) => {
    try {
      return url.split('/').pop()?.split('?')[0] || "Arquivo";
    } catch {
      return "Arquivo";
    }
  };

  return (
    <Card
      className="responsive-card w-full cursor-pointer bg-card border-border"
      onClick={toggleExpand}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-construction-orange flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-card-foreground truncate">
                  {documento.nome}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getTipoColor(documento.categoria)} variant="secondary">
                {documento.categoria}
              </Badge>
              {/* Status not yet in DB, maybe add later */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-xs">{documento.obra?.nome || "Geral"}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-xs">ID: {documento.uploaded_by.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-xs">{formatDate(documento.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(documento);
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Download"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onView(documento);
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Visualizar"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(documento);
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(documento.id);
              }}
              className="h-8 w-8 p-0 flex-shrink-0"
              title="Excluir"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

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
                className="px-6 pb-6"
              >
                <CardContent className="p-0 space-y-4">
                  {/* Document Details */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Tipo</p>
                      <p className="text-sm text-construction-blue">{documento.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Tamanho</p>
                      <p className="text-sm text-construction-green">{formatFileSize(documento.tamanho)}</p>
                    </div>
                  </div>

                  {/* File Information */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-card-foreground">Informações do Arquivo:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileType className="mr-2 h-4 w-4" />
                        <a href={documento.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[200px]">
                          {getFileName(documento.url)}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        Enviado por: {documento.uploaded_by}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Upload em: {formatDate(documento.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-card-foreground">Obra Vinculada:</h4>
                    <p className="text-sm text-construction-orange bg-muted/20 p-3 rounded-lg">
                      {documento.obra?.nome || "Geral"}
                    </p>
                  </div>

                  {/* Description */}
                  {documento.descricao && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-card-foreground">Descrição:</h4>
                      <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                        {documento.descricao}
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
