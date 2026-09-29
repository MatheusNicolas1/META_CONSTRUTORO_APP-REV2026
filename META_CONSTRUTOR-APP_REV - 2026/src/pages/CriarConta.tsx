import { SignUpPage } from "@/components/ui/sign-up";

import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { useSignUp } from "@/hooks/useSignUp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getGoogleOAuthRedirectUrl } from "@/utils/authRedirect";
import { track } from "@/integrations/analytics";

const CriarConta = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useSignUp();

  const handleSignUp = async (data: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => {
    track('auth.signup_started', { method: 'email_password' });
    const success = await signUp(data);

    if (success) {
      track('auth.signup_completed', { method: 'email_password' });
      // Pequena pausa para o check de confirmação aparecer no botão antes do dashboard.
      window.setTimeout(() => navigate("/app/dashboard"), 700);
    }
    return success;
  };

  const handleGoogleSignIn = async () => {
    try {
      track('auth.signup_initiated', { method: 'google' });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getGoogleOAuthRedirectUrl(),
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
      <SEO {...seoPages.criarConta} />
      {/* Foto real de obra (acervo do projeto); sem depoimentos fictícios (PRD_falso). */}
      <SignUpPage
        heroImageSrc="/marketing/obras-reais/estrutura-metalica-aerea.webp"
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        onSignIn={handleSignIn}
      />
    </>
  );
};

export default CriarConta;
