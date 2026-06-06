import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Gift, Users } from "lucide-react";
import { toast } from "sonner";

export const ReferralManager = () => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralsCount, setReferralsCount] = useState(0);
  const [bonusDays, setBonusDays] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar código de indicação e bônus do perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code, referral_bonus_days")
        .eq("id", user.id)
        .single();

      if (profile) {
        setReferralCode(profile.referral_code || "");
        setBonusDays(profile.referral_bonus_days || 0);
      }

      // Contar indicações
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user.id);

      setReferralsCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar dados de indicação:", error);
    }
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/criar-conta?ref=${referralCode}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Conheça o MetaConstrutor para organizar obras, RDOs e equipes. Use meu link de indicação: ${getReferralLink()}`;
    const popup = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    if (!popup) {
      toast.error("O navegador bloqueou a janela do WhatsApp.");
    }
  };

  if (!referralCode) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Programa de Indicações
        </CardTitle>
        <CardDescription>
          Compartilhe seu link de indicação. Bônus aparecem aqui somente quando a indicação for registrada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input value={getReferralLink()} readOnly />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{referralsCount}</p>
                  <p className="text-sm text-muted-foreground">Indicações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Gift className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{bonusDays}</p>
                  <p className="text-sm text-muted-foreground">Dias de bônus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={shareOnWhatsApp} className="w-full">
          Compartilhar no WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
};
