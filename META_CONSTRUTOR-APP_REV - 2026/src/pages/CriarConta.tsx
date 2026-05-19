import { SignUpPage } from "@/components/ui/sign-up";
import { authTestimonials } from "@/data/auth-testimonials";

import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useSignUp } from "@/hooks/useSignUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAuthCallbackUrl } from "@/utils/authRedirect";




const CriarConta = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useSignUp();

  const handleSignUp = async (data: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => {
    const success = await signUp(data);

    if (success) {
      // Redirecionar para dashboard após sucesso
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthCallbackUrl(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login com Google. Tente novamente.';
      toast.error(message);
    }
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <>
      <SEO
        title="Criar conta | Meta Construtor"
        description="Cadastre-se no Meta Construtor e gerencie suas obras com facilidade."
        canonical="https://metaconstrutor.com.br/criar-conta"
      />
      <SignUpPage
        heroImageSrc="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop"
        testimonials={authTestimonials}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        onSignIn={handleSignIn}
      />
    </>
  );
};

export default CriarConta;
