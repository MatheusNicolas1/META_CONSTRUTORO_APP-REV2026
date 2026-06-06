import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Share2, FileText, Instagram, Linkedin, HelpCircle } from "lucide-react";

export const CreditsInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Como funciona o sistema de créditos?
          </DialogTitle>
          <DialogDescription>
            Controle de uso para usuários do Plano Free
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Visão geral</h3>
            <p className="text-sm text-muted-foreground">
              O sistema de créditos controla o uso de recursos no Plano Free e registra benefícios somente quando houver uma ação confirmada.
            </p>
          </div>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Créditos iniciais</h4>
                <p className="text-sm text-muted-foreground">
                  Você começa com <strong className="text-foreground">7 créditos gratuitos</strong> ao criar sua conta no Plano Free.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Como usar seus créditos
            </h3>
            <Card className="p-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Criação de RDO:</strong> -1 crédito por novo relatório
                </p>
                <p className="text-xs text-muted-foreground">
                  Cada vez que você criar um novo RDO, será consumido 1 crédito.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Créditos extras
            </h3>
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">Instagram</h4>
                    <p className="text-xs text-muted-foreground">
                      Quando houver registro real confirmado, compartilhamentos no Instagram podem adicionar <strong className="text-foreground">+1 crédito</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Linkedin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">LinkedIn</h4>
                    <p className="text-xs text-muted-foreground">
                      Quando houver registro real confirmado, compartilhamentos no LinkedIn podem adicionar <strong className="text-foreground">+1 crédito</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Planos pagos</h4>
              <p className="text-xs text-muted-foreground">
                Os limites variam conforme o plano ativo da sua conta.
              </p>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Ver planos
              </Button>
            </div>
          </Card>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <h4 className="font-semibold text-sm">Observações</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Créditos extras dependem de registro real do compartilhamento.</li>
              <li>Use legendas e hashtags compatíveis com o conteúdo que você realmente publicou.</li>
              <li>Seu histórico aparece apenas quando houver dados persistidos no sistema.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
