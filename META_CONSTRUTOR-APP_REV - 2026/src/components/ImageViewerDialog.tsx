import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw, Loader2, ExternalLink } from 'lucide-react';
import { getPublicUrl, getSignedUrl, downloadStorageFileToDevice } from '@/utils/storageUtils';
import { getOptimizedImageUrl } from '@/hooks/useOptimizedImage';

interface ImageViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title: string;
  bucket?: string;
}

export function ImageViewerDialog({ isOpen, onClose, src, title, bucket = 'documentos' }: ImageViewerDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Tenta carregar: URL pública primeiro, se falhar tenta signed URL
  useEffect(() => {
    if (!isOpen || !src) return;
    setImgError(false);
    setZoom(1);

    const loadUrl = async () => {
      // Tenta URL pública primeiro
      const pubUrl = getPublicUrl(src, bucket);
      if (pubUrl) {
        setImageUrl(pubUrl);
        return;
      }
      // Fallback: signed URL
      const signed = await getSignedUrl(src, bucket, 300); // 5 min
      if (signed) {
        setImageUrl(signed);
      } else {
        setImageUrl(null);
        setImgError(true);
      }
    };

    loadUrl();
  }, [isOpen, src, bucket]);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      await downloadStorageFileToDevice(bucket, src, title);
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
    } finally {
      setLoading(false);
    }
  }, [bucket, src, title]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleClose = () => {
    setZoom(1);
    setImgError(false);
    setImageUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      {/* Oculta o X padrão do DialogContent via CSS e usa o nosso na toolbar */}
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-sm border-border [&>button[aria-label='Close']]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate max-w-[60%]">{title}</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5} title="Reduzir zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3} title="Aumentar zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleResetZoom} title="Resetar zoom">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={loading || imgError}
              title="Baixar imagem original"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClose} className="ml-2 h-8 gap-1 text-xs">
              <span>Fechar</span>
              <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">ESC</kbd>
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex items-center justify-center p-4 overflow-auto max-h-[85vh]" style={{
          backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
          backgroundSize: '20px 20px'
        }}>
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={title}
              style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
              className="max-w-full max-h-full object-contain rounded-md shadow-lg"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <div className="w-16 h-16 border-2 border-orange-400/40 rounded-md flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l18 18" stroke="currentColor" />
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" />
                  <path d="M3 16l5-4 4 4 3-2 6 5" stroke="currentColor" fill="none" />
                </svg>
              </div>
              <p className="text-sm text-center max-w-sm">
                {imgError
                  ? 'Não foi possível carregar a imagem. Ela pode ter sido removida ou o bucket é privado.'
                  : 'URL da imagem não disponível.'}
              </p>
              {imgError && (
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(imageUrl || getPublicUrl(src, bucket) || '', '_blank', 'noopener')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Tentar abrir diretamente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImageViewerDialog;
