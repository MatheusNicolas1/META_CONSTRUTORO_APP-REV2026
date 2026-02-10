import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { useRateLimit, RATE_LIMIT_CONFIGS } from './RateLimiter';
import { track } from '@/integrations/analytics';

interface SecureUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadError {
  type: 'size' | 'type' | 'virus' | 'rate_limit' | 'generic';
  message: string;
}

// Tipos de arquivo permitidos por categoria
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  archives: ['application/zip', 'application/x-rar-compressed'],
};

const DEFAULT_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.spreadsheets,
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SecureUpload: React.FC<SecureUploadProps> = ({
  onFileSelect,
  acceptedTypes = DEFAULT_ALLOWED_TYPES,
  maxSizeBytes = MAX_FILE_SIZE,
  maxFiles = 1,
  className = '',
  disabled = false,
}) => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>([]);

  const rateLimiter = useRateLimit(RATE_LIMIT_CONFIGS.upload);

  const validateFile = useCallback((file: File): UploadError | null => {
    // Verificar tipo de arquivo
    if (!acceptedTypes.includes(file.type)) {
      return {
        type: 'type',
        message: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${acceptedTypes.join(', ')}`
      };
    }

    // Verificar tamanho
    if (file.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
      return {
        type: 'size',
        message: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
      };
    }

    // Verificar extensão vs MIME type (proteção contra bypass)
    const extension = file.name.split('.').pop()?.toLowerCase();
    const expectedMimeTypes = getExpectedMimeTypes(extension);
    if (expectedMimeTypes.length > 0 && !expectedMimeTypes.includes(file.type)) {
      return {
        type: 'type',
        message: 'Extensão do arquivo não confere com o tipo detectado'
      };
    }

    return null;
  }, [acceptedTypes, maxSizeBytes]);

  const scanForVirus = useCallback(async (file: File): Promise<boolean> => {
    // Mock de scanner antivírus - em produção integrar com serviço real
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular detecção de arquivos suspeitos por nome
        const suspiciousNames = ['virus', 'malware', 'trojan', 'worm'];
        const isSuspicious = suspiciousNames.some(name =>
          file.name.toLowerCase().includes(name)
        );
        resolve(!isSuspicious);
      }, 1000);
    });
  }, []);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled || !rateLimiter.checkRateLimit()) {
      return;
    }

    setErrors([]);
    const fileArray = Array.from(files);

    // Verificar número máximo de arquivos
    if (fileArray.length > maxFiles) {
      setErrors([{
        type: 'generic',
        message: `Máximo de ${maxFiles} arquivo(s) permitido(s)`
      }]);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        // Validar arquivo
        const validationError = validateFile(file);
        if (validationError) {
          setErrors(prev => [...prev, validationError]);
          continue;
        }

        // Atualizar progresso
        setUploadProgress((i / fileArray.length) * 50);

        // Scanner antivírus
        const isClean = await scanForVirus(file);
        if (!isClean) {
          setErrors(prev => [...prev, {
            type: 'virus',
            message: `Arquivo ${file.name} contém conteúdo suspeito`
          }]);
          continue;
        }

        // Atualizar progresso
        setUploadProgress(((i + 1) / fileArray.length) * 100);

        // Arquivo aprovado
        rateLimiter.recordAttempt();

        // M9: Analytics
        track('product.attachment_uploaded', {
          file_type: file.type,
          file_size: file.size,
          file_extension: file.name.split('.').pop()
        });

        onFileSelect(file);
      }

      if (errors.length === 0) {
        toast({
          title: "Upload concluído",
          description: `${fileArray.length} arquivo(s) processado(s) com sucesso`,
        });
      }
    } catch (error) {
      setErrors(prev => [...prev, {
        type: 'generic',
        message: 'Erro inesperado durante o upload'
      }]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [disabled, rateLimiter, maxFiles, validateFile, scanForVirus, onFileSelect, errors.length, toast]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Input
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={disabled || isUploading || rateLimiter.isBlocked}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />

        {(isUploading || rateLimiter.isBlocked) && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
            {isUploading && <Upload className="h-4 w-4 animate-spin" />}
            {rateLimiter.isBlocked && (
              <span className="text-sm text-destructive">
                Bloqueado por {rateLimiter.remainingTime}s
              </span>
            )}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Processando arquivo...</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <span className="text-sm text-destructive flex-1">{error.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearErrors}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Tipos aceitos: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}</p>
        <p>Tamanho máximo: {Math.round(maxSizeBytes / (1024 * 1024))}MB</p>
        {maxFiles > 1 && <p>Máximo: {maxFiles} arquivos</p>}
      </div>
    </div>
  );
};

// Utilitário para mapear extensões para MIME types esperados
const getExpectedMimeTypes = (extension?: string): string[] => {
  if (!extension) return [];

  const mimeMap: Record<string, string[]> = {
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'xls': ['application/vnd.ms-excel'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'zip': ['application/zip'],
    'rar': ['application/x-rar-compressed'],
  };

  return mimeMap[extension] || [];
};

export default SecureUpload;