import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { getSafeAuthNextPath } from "@/utils/authRedirect";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Finalizando autenticacao...");

  useEffect(() => {
    let active = true;

    const finishOAuth = async () => {
      const next = getSafeAuthNextPath(searchParams.get("next"));
      const providerError = searchParams.get("error_description") || searchParams.get("error");

      if (providerError) {
        navigate(`/login?auth_error=${encodeURIComponent(providerError)}`, { replace: true });
        return;
      }

      try {
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;
          if (!session) {
            throw new Error("Sessao OAuth nao encontrada.");
          }
        }

        if (active) {
          navigate(next, { replace: true });
        }
      } catch (error) {
        const description = error instanceof Error ? error.message : "Falha ao autenticar com Google.";
        if (active) {
          setMessage("Nao foi possivel finalizar o login.");
          navigate(`/login?auth_error=${encodeURIComponent(description)}`, { replace: true });
        }
      }
    };

    finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={message} />
    </div>
  );
};

export default AuthCallback;
