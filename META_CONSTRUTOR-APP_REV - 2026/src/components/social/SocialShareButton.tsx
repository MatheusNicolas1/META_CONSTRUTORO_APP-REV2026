import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Instagram, Linkedin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// FALSO-054: onShareSuccess removido — circuito legado de creditos sociais (social_shares / add_credit_for_share)
// nunca foi conectado ao frontend. O compartilhamento e apenas client-side (popup Instagram/LinkedIn).
interface SocialShareButtonProps {
  title: string;
  description: string;
  imageUrl?: string;
  obraId?: string;
  rdoId?: string;
  compact?: boolean;
}

export const SocialShareButton = ({
  title,
  description,
  imageUrl,
  obraId,
  rdoId,
  compact = false
}: SocialShareButtonProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'linkedin' | null>(null);
  const [caption, setCaption] = useState(`${title}\n\n${description}\n\n#MetaConstrutor #EngenhariaCivil #ConstruÃ§Ã£o`);
  const [isSharing, setIsSharing] = useState(false);

  const handlePlatformSelect = (platform: 'instagram' | 'linkedin') => {
    setSelectedPlatform(platform);
    setShowPreview(true);
  };

  const generateShareContent = () => {
    const baseUrl = window.location.origin;
    const shareUrl = obraId
      ? `${baseUrl}/obras/${obraId}`
      : rdoId
        ? `${baseUrl}/rdo/${rdoId}`
        : baseUrl;

    return {
      caption,
      url: shareUrl,
      imageUrl: imageUrl || '/placeholder.svg'
    };
  };

  const shareToInstagram = async () => {
    // Instagram nÃ£o tem API pÃºblica para compartilhamento direto
    // Vamos copiar o conteÃºdo e abrir o Instagram Web
    const content = generateShareContent();

    try {
      await navigator.clipboard.writeText(`${content.caption}\n\n${content.url}`);

      const popup = window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      if (!popup) {
        toast.error("O navegador bloqueou a janela do Instagram.");
        return;
      }

      toast.info(
        "ConteÃºdo copiado. Cole no Instagram para publicar.",
        { duration: 5000 }
      );

      setShowPreview(false);
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error("Erro ao preparar compartilhamento");
    }
  };

  const shareToLinkedIn = async () => {
    const content = generateShareContent();

    try {
      // LinkedIn Share URL
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`;

      // Abrir LinkedIn em nova janela
      const popup = window.open(linkedInUrl, '_blank', 'width=600,height=600');

      if (popup) {
        toast.info("Janela do LinkedIn aberta. Conclua a publicaÃ§Ã£o na plataforma.");
        setShowPreview(false);
      } else {
        toast.error("O navegador bloqueou a janela do LinkedIn.");
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error("Erro ao compartilhar no LinkedIn");
    }
  };



  const handleShare = async () => {
    if (!selectedPlatform) return;

    setIsSharing(true);

    try {
      if (selectedPlatform === 'instagram') {
        await shareToInstagram();
      } else if (selectedPlatform === 'linkedin') {
        await shareToLinkedIn();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={compact ? "ghost" : "outline"} size={compact ? "icon" : "sm"}>
            <Share2 className="h-4 w-4" />
            {!compact && <span className="ml-2">Compartilhar</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePlatformSelect('instagram')}>
            <Instagram className="h-4 w-4 mr-2" />
            Instagram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePlatformSelect('linkedin')}>
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlatform === 'instagram' ? (
                <>
                  <Instagram className="h-5 w-5" />
                  Preparar para Instagram
                </>
              ) : (
                <>
                  <Linkedin className="h-5 w-5" />
                  Preparar para LinkedIn
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">


            {imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Legenda
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Escreva uma legenda..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length} caracteres
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
              {selectedPlatform === 'instagram' ? (
                <p>
                  O conteúdo será copiado. A publicação precisa ser concluída no Instagram.
                </p>
              ) : (
                <p>
                  Uma nova janela será aberta. A publicação precisa ser concluída no LinkedIn.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleShare}
                disabled={isSharing}
                className="gap-2"
              >
                {isSharing ? "Compartilhando..." : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Preparar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

