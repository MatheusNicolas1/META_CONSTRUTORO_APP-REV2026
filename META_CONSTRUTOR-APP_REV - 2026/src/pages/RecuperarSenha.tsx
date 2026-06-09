import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";
import { ArrowLeft, Mail } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
    } finally {
      // Keep the response generic to avoid account enumeration and real e-mail dependency.
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <SEO title="Recuperar senha | Meta Construtor" description="Receba um link seguro para recuperar sua senha." canonical={window.location.href} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-construction-blue/30 via-construction-blue/20 to-background" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-construction-blue/20 bg-card/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-construction-blue/10 text-construction-blue">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Recuperar senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe seu e-mail para receber instrucoes de redefinicao.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5 text-center">
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-foreground">
              Se existir uma conta para <strong>{email}</strong>, enviaremos instrucoes para recuperar o acesso.
            </div>
            <Button variant="outline" className="w-full" onClick={() => NavigationSafety.safeNavigate(navigate, '/login')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">E-mail</label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperacao"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => NavigationSafety.safeNavigate(navigate, '/login')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
            </Button>
          </form>
        )}
      </section>
    </main>
  );
};

export default RecuperarSenha;
