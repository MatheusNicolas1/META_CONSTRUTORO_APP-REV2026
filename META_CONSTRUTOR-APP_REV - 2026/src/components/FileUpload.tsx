import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X, Image as ImageIcon, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File; // Added to access raw file for upload
}

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // em MB
  multiple?: boolean;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  uploadType?: 'images' | 'documents' | 'all';
  className?: string;
}

export function FileUpload({
  accept = "*",
  maxSize = 50,
  multiple = true,
  onFilesUploaded,
  uploadType = 'all',
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getAcceptString = () => {
    switch (uploadType) {
      case 'images':
        return 'image/*';
      case 'documents':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt';
      default:
        return accept;
    }
  };

  const handleFileChange = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Verificar tamanho
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de ${maxSize}MB`,
          variant: "destructive"
        });
        return;
      }

      // Verificar tipo
      if (uploadType === 'images' && !file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é uma imagem válida`,
          variant: "destructive"
        });
        return;
      }

      if (uploadType === 'documents' && file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um documento válido`,
          variant: "destructive"
        });
        return;
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file: file // Store raw file
      });
    });

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles);
    }

    if (onFilesUploaded && newFiles.length > 0) {
      onFilesUploaded(multiple ? [...files, ...newFiles] : newFiles);
    }
  }, [files, maxSize, multiple, onFilesUploaded, uploadType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    const newFiles = files.filter(file => file.id !== fileId);
    setFiles(newFiles);
    if (onFilesUploaded) {
      onFilesUploaded(newFiles);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getUploadTitle = () => {
    switch (uploadType) {
      case 'images':
        return 'Upload de Imagens';
      case 'documents':
        return 'Upload de Documentos';
      default:
        return 'Upload de Arquivos';
    }
  };

  const getUploadDescription = () => {
    switch (uploadType) {
      case 'images':
        return 'JPG, PNG, GIF até 50MB';
      case 'documents':
        return 'PDF, DOC, XLS até 50MB';
      default:
        return `Qualquer arquivo até ${maxSize}MB`;
    }
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
            ? 'border-construction-orange bg-construction-orange/10'
            : 'border-border hover:border-construction-orange/50'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-card-foreground mb-2">
          {getUploadTitle()}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arraste e solte arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {getUploadDescription()}
        </p>

        <Input
          type="file"
          accept={getAcceptString()}
          multiple={multiple}
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload">
          <Button variant="outline" className="cursor-pointer" asChild>
            <span>Selecionar Arquivos</span>
          </Button>
        </Label>
      </div>

      {files.length > 0 && (
        <Card className="mt-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Arquivos Selecionados</CardTitle>
            <CardDescription>
              {files.length} arquivo{files.length !== 1 ? 's' : ''} selecionado{files.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}