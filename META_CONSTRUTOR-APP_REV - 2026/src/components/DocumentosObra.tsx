import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { FileText, Trash2, Upload } from "lucide-react";

interface DocumentoObra {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  dataUpload: string;
  url?: string;
  file?: File;
}

interface DocumentosObraProps {
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
}

export const DocumentosObra = ({ onFilesChange, disabled = false }: DocumentosObraProps) => {
  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);

  const handleFilesUploaded = (uploadedFiles: any[]) => {
    if (disabled) return;

    const novosDocumentos = uploadedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nome: file.name,
      tipo: file.type || 'application/octet-stream',
      tamanho: formatFileSize(file.size),
      dataUpload: new Date().toLocaleDateString('pt-BR'),
      url: file.url,
      file: file.file instanceof File ? file.file : undefined
    }));

    setDocumentos(prev => [...prev, ...novosDocumentos]);
    onFilesChange?.(uploadedFiles.map((file) => file.file).filter((file): file is File => file instanceof File));
  };

  const removerDocumento = (id: string) => {
    setDocumentos(prev => {
      const nextDocuments = prev.filter(doc => doc.id !== id);
      onFilesChange?.(nextDocuments.map((doc) => doc.file).filter((file): file is File => file instanceof File));
      return nextDocuments;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('image')) return '🖼️';
    if (tipo.includes('word') || tipo.includes('document')) return '📝';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <div className="space-y-6 mt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-card-foreground">Documentos da Obra</h3>
        <div className="text-sm text-muted-foreground">
          {documentos.length} documento(s) adicionado(s)
        </div>
      </div>

      {/* Área de Upload */}
      <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <CardContent className="pt-6">
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <h4 className="text-base font-medium text-card-foreground">
                Adicionar Documentos
              </h4>
              <p className="text-sm text-muted-foreground">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (máx. 10MB por arquivo)
              </p>
            </div>
            <div className="mt-6">
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                multiple
                maxSize={10}
                uploadType="documents"
                className={disabled ? "pointer-events-none opacity-60" : undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {documentos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-base font-medium text-card-foreground">
            Documentos Adicionados
          </h4>
          <div className="space-y-3">
            {documentos.map((documento) => (
              <Card key={documento.id} className="border-border bg-card">
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="text-2xl flex-shrink-0">
                        {getFileIcon(documento.tipo)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {documento.nome}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                          <span>{documento.tamanho}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Adicionado em {documento.dataUpload}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removerDocumento(documento.id)}
                        disabled={disabled}
                        title="Remover documento"
                        aria-label={`Remover documento ${documento.nome}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {documentos.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h4 className="mt-4 text-base font-medium text-card-foreground">
            Nenhum documento adicionado
          </h4>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Adicione documentos relacionados à obra como projetos, licenças, contratos, etc.
          </p>
        </div>
      )}
    </div>
  );
};
