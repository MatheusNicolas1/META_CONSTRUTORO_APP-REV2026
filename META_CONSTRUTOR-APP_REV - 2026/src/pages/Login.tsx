import { SignInPage } from "@/components/ui/sign-in";
import { authTestimonials } from "@/data/auth-testimonials";

import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";




const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // V7: Removido rememberedEmail do localStorage (PII em plain text)

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const emailOrPhone = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (!emailOrPhone || !password) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha e-mail/celular e senha.",
          variant: "destructive",
        });
        return;
      }

      await signIn(emailOrPhone, password);

      // V7: Não armazenamos email em localStorage (segurança)

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Meta Construtor.",
      });

      // Redirecionamento é tratado no AuthContext

    } catch (error: unknown) {
      // Erro já é tratado no AuthContext com toast
      // Log sanitizado: sem PII
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/dashboard`,
        },
      });

      if (error) throw error;

    } catch (error: unknown) {
      toast({
        title: "Erro ao fazer login com Google",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    navigate("/recuperar-senha");
  };

  const handleCreateAccount = () => {
    navigate("/criar-conta");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Autenticando..." />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Login | Meta Construtor"
        description="Acesse sua conta no Meta Construtor e gerencie suas obras com facilidade."
        canonical="https://metaconstrutor.com.br/login"
      />
      <SignInPage
        title={<span className="font-light text-foreground tracking-tighter">Bem-vindo</span>}
        description="Acesse sua conta usando e-mail ou celular cadastrado"
        heroImageSrc="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop"
        testimonials={authTestimonials}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        isLoading={isLoading}
        initialEmail=""
      />
    </>
  );
};

export default Login;
