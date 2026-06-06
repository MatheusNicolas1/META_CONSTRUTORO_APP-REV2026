import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const RedefinirSenha = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 10) {
      toast.error("A senha deve ter pelo menos 10 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Senha alterada com sucesso.");
    } catch {
      toast.error("Nao foi possivel redefinir a senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <SEO title="Redefinir senha | Meta Construtor" description="Defina uma nova senha com seguranca." canonical={window.location.href} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-construction-blue/30 via-construction-blue/20 to-background" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-construction-blue/20 bg-card/90 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-construction-blue/10 text-construction-blue">
            {done ? <CheckCircle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Redefinir senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Defina uma nova senha com pelo menos 10 caracteres.
          </p>
        </div>

        {done ? (
          <div className="space-y-5 text-center">
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-foreground">
              Senha alterada com sucesso. Voce ja pode acessar com a nova senha.
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Ir para login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Nova senha</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nova senha"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 text-muted-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmar senha</label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmar nova senha"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 text-muted-foreground"
                  aria-label={showConfirmPassword ? "Ocultar confirmacao" : "Mostrar confirmacao"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Link>
            </Button>
          </form>
        )}
      </section>
    </main>
  );
};

export default RedefinirSenha;
