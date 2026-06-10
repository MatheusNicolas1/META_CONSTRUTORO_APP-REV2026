import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DigitalSignature } from "@/types/checklist";
import { PenTool, RotateCcw, Check, X, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DigitalSignatureProps {
  onSign: (signature: DigitalSignature) => void;
  signerName?: string;
  signerEmail?: string;
}

export function DigitalSignatureComponent({ 
  onSign, 
  signerName = "", 
  signerEmail = "" 
}: DigitalSignatureProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState({
    name: signerName,
    email: signerEmail
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isDialogOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const [isLoadingIP, setIsLoadingIP] = useState(false);

  // Captura o IP real do usuário via API pública
  const getRealIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return "IP não disponível";
    }
  };

  const saveSignature = async () => {
    if (!hasSignature) {
      toast({
        title: "Assinatura necessária",
        description: "Por favor, desenhe sua assinatura antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    if (!signatureData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive"
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsLoadingIP(true);

      const realIP = await getRealIP();

      // Convert canvas to base64
      const signatureBase64 = canvas.toDataURL('image/png');

      const signature: DigitalSignature = {
        id: `sig-${Date.now()}`,
        signerName: signatureData.name,
        signerEmail: signatureData.email,
        signedAt: new Date().toISOString(),
        signatureData: signatureBase64,
        ipAddress: realIP,
        deviceInfo: navigator.userAgent
      };

      setIsLoadingIP(false);

      onSign(signature);
      setIsDialogOpen(false);
      clearSignature();

      toast({
        title: "Assinatura salva",
        description: "O checklist foi assinado digitalmente com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao obter IP para assinatura:", error);
      setIsLoadingIP(false);
      toast({
        title: "Erro",
        description: "Não foi possível obter seu IP. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          Assinar Digitalmente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Assinatura Digital
          </DialogTitle>
          <DialogDescription>
            Assine digitalmente para finalizar o checklist. Sua assinatura será registrada com data e hora.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signer-name">Nome Completo *</Label>
              <Input
                id="signer-name"
                value={signatureData.name}
                onChange={(e) => setSignatureData({ ...signatureData, name: e.target.value })}
                placeholder="Digite seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signer-email">E-mail (Opcional)</Label>
              <Input
                id="signer-email"
                type="email"
                value={signatureData.email}
                onChange={(e) => setSignatureData({ ...signatureData, email: e.target.value })}
                placeholder="seu.email@exemplo.com"
              />
            </div>
          </div>

          <Separator />

          {/* Signature Canvas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Assinatura</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Button>
            </div>

            <Card className="border-2 border-dashed border-muted">
              <CardContent className="p-0">
                <canvas
                  ref={canvasRef}
                  className="w-full h-48 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground text-center">
              Desenhe sua assinatura na área acima usando o mouse ou toque
            </p>
          </div>

          <Separator />

          {/* Legal Notice */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Aviso Legal:</strong> Ao assinar digitalmente, você confirma que:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Verificou todos os itens do checklist</li>
              <li>As informações fornecidas são verdadeiras e precisas</li>
              <li>Assume responsabilidade pelas verificações realizadas</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={saveSignature}
              disabled={!hasSignature || !signatureData.name.trim() || isLoadingIP}
            >
              {isLoadingIP ? <><Globe className="h-4 w-4 mr-2 animate-spin" />Obtendo IP...</> : <><Check className="h-4 w-4 mr-2" />Confirmar Assinatura</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}