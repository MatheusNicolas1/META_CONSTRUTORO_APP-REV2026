import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavigationSafety } from '@/utils/navigationSafety';
import { supabase } from "@/integrations/supabase/client";

const MFA = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      toast.error("Informe um codigo de 6 digitos.");
      return;
    }

    setLoading(true);
    try {
      // MFA real via Supabase (TOTP). A verificacao so acontece se o usuario
      // tiver um fator TOTP "verified" cadastrado; caso contrario o fluxo
      // permanece honesto e indisponivel, sem sucesso falso.
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((factor) => factor.status === "verified");

      if (factorsError || !totpFactor) {
        toast.info("MFA de login ainda nao esta disponivel neste ambiente.");
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast.success("Verificacao em duas etapas concluida.");
      NavigationSafety.safeNavigate(navigate, '/app/dashboard');
    } catch {
      toast.error("Codigo invalido ou expirado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <SEO title="Verificacao em duas etapas | Meta Construtor" description="Confirme seu acesso com MFA/2FA." canonical={window.location.href} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-construction-blue/30 via-construction-blue/20 to-background" />

      <Card className="relative z-10 w-full max-w-md border-construction-blue/20 bg-card/90 shadow-2xl backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-construction-blue/10 text-construction-blue">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Verificacao em duas etapas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Informe o codigo de 6 digitos gerado pelo seu aplicativo autenticador.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="code">Codigo de 6 digitos</label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => NavigationSafety.safeNavigate(navigate, '/login')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default MFA;
