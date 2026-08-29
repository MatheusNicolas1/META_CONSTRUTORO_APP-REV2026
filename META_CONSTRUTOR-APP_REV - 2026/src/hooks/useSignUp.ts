import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/integrations/analytics';
import { toast } from 'sonner';
import { getAffiliateCodeFromCookie, processAffiliateReferral } from '@/utils/affiliateTracker';

interface SignUpData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface UseSignUpReturn {
  signUp: (data: SignUpData) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Rate limit frontend: max 3 tentativas em 60 segundos
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;
const PROFILE_LOOKUP_ATTEMPTS = 5;
const PROFILE_LOOKUP_RETRY_MS = 400;

// Mensagem genérica para qualquer erro de signup (enumeration protection)
const GENERIC_SIGNUP_ERROR = 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const useSignUp = (): UseSignUpReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef<number[]>([]);

  const checkFrontendRateLimit = (): boolean => {
    const now = Date.now();
    attempts.current = attempts.current.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (attempts.current.length >= RATE_LIMIT_MAX) {
      return false;
    }
    attempts.current.push(now);
    return true;
  };

  const checkBackendRateLimit = async (): Promise<boolean> => {
    try {
      const response = await supabase.functions.invoke('signup-guard', {
        method: 'POST',
        body: {},
      });

      if (response.error) {
        // Fail open: se edge function falhar, permitir
        return true;
      }

      const data = response.data;
      if (data && !data.allowed) {
        toast.error(data.message || 'Muitas tentativas. Aguarde um momento.');
        return false;
      }

      return true;
    } catch {
      // Fail open
      return true;
    }
  };

  const signUp = async (data: SignUpData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Rate limit frontend
      if (!checkFrontendRateLimit()) {
        throw new Error('Muitas tentativas de cadastro. Aguarde 1 minuto e tente novamente.');
      }

      // Validações básicas (sem revelar detalhes no erro)
      if (!data.name || data.name.length < 2) {
        throw new Error('Nome deve ter pelo menos 2 caracteres.');
      }

      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Email inválido.');
      }

      if (data.password !== data.confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }

      if (data.password.length < 10) {
        throw new Error('A senha deve ter pelo menos 10 caracteres.');
      }

      if (!data.phone || data.phone.length < 10) {
        throw new Error('Telefone inválido.');
      }

      // Rate limit backend (edge function)
      const backendAllowed = await checkBackendRateLimit();
      if (!backendAllowed) {
        return false;
      }

      const cleanPhone = data.phone.replace(/\D/g, '');

      // Analytics: início do cadastro (funnel signup_started -> signup_completed)
      track('auth.signup_started', { method: 'email_password', context: 'criar_conta' });

      // Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
          data: {
            name: data.name,
            phone: cleanPhone,
            plan_type: 'free',
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        // ENUMERATION PROTECTION: Nunca revelar se email já existe
        // Todas as mensagens são genéricas
        if (signUpError.message.includes('already registered') ||
          signUpError.message.includes('User already registered')) {
          // Mensagem genérica — não revela que email existe
          throw new Error(GENERIC_SIGNUP_ERROR);
        }

        if (signUpError.message.includes('Invalid email')) {
          throw new Error('Verifique os dados informados e tente novamente.');
        }

        if (signUpError.message.includes('Password')) {
          throw new Error('Senha inválida. Use no mínimo 10 caracteres com letras, números e símbolos.');
        }

        throw new Error(GENERIC_SIGNUP_ERROR);
      }

      if (!authData.user) {
        throw new Error(GENERIC_SIGNUP_ERROR);
      }

      let profile: { id: string } | null = null;
      let profileError: unknown = null;

      for (let attempt = 1; attempt <= PROFILE_LOOKUP_ATTEMPTS; attempt += 1) {
        const { data: profileData, error: lookupError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle();

        profile = profileData;
        profileError = lookupError;

        if (profile || profileError || attempt === PROFILE_LOOKUP_ATTEMPTS) {
          break;
        }

        await wait(PROFILE_LOOKUP_RETRY_MS);
      }

      if (profileError || !profile) {
        throw new Error(GENERIC_SIGNUP_ERROR);
      }

      // Analytics: cadastro concluído (conta criada + perfil confirmado)
      track('auth.signup_completed', { method: 'email_password', context: 'criar_conta' });

      // Login automatico apos cadastro.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        toast.success('Conta criada com sucesso! Faça login para continuar.');
        return false;
      }

      // Processar indicação de afiliado (se houver cookie affiliate_ref)
      const affiliateCode = getAffiliateCodeFromCookie();
      if (affiliateCode) {
        // Não-blocking — o cadastro já foi concluído
        processAffiliateReferral(affiliateCode, data.email).then((result) => {
          if (result.success) {
            console.info('[Affiliate] Referral registered successfully');
          } else {
            console.warn('[Affiliate] Referral not registered:', result.error);
          }
        });
      }

      toast.success('Conta criada com sucesso! Entrando na sua conta...');
      return true;

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : GENERIC_SIGNUP_ERROR;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { signUp, isLoading, error };
};
