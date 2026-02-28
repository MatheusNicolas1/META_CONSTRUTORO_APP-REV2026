import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User as AuthUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { User, UserRole } from "@/types/user";
import { toast } from "sonner";

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  attributes: Record<string, any>;
  mfaEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  refreshSession: () => Promise<void>;
  loading: boolean;
  // Novo método para atualizar roles externamente (usado pelo OrgContext)
  updateRoles: (newRoles: UserRole[]) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do usuário
  const loadUserData = useCallback(async (authUser: AuthUser) => {
    try {
      // Buscar perfil E role global em paralelo
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUser.id)
          .maybeSingle(),
      ]);

      // Profile may not exist yet for new users — that's OK
      if (profileResult.error) {
        console.warn("Erro ao buscar perfil (pode ser novo usuário):", profileResult.error.message);
      }
      const profile = profileResult.data;

      const globalRole = roleResult.data?.role as UserRole | undefined;

      // Se tiver role global, usa ele. Se não, começa com Colaborador esperando o OrgContext
      const initialRole: UserRole = globalRole || "Colaborador";

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.email || "Usuário",
        email: authUser.email || "",
        role: initialRole,
        avatar_url: profile?.avatar_url || "",
        createdAt: authUser.created_at,
        updatedAt: profile?.updated_at || authUser.created_at,
      });

      // Se for Presidente, define logo
      setRoles([initialRole]);

    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      // Fallback: create basic user from auth data so app doesn't get stuck
      setUser({
        id: authUser.id,
        name: authUser.email || "Usuário",
        email: authUser.email || "",
        role: "Colaborador",
        avatar_url: "",
        createdAt: authUser.created_at,
        updatedAt: authUser.created_at,
      });
      setRoles(["Colaborador"]);
    }
  }, []);

  // Método para OrgContext atualizar roles
  const updateRoles = useCallback((newRoles: UserRole[]) => {
    setRoles(prevRoles => {
      // PROTEÇÃO: Se o usuário já é Presidente (Global), não rebaixa
      if (prevRoles.includes('Presidente')) {
        return ['Presidente'];
      }
      return newRoles;
    });

    // Atualizar também o role principal do user
    setUser((prev) => {
      if (!prev) return null;

      // Mesma proteção para o objeto user
      if (prev.role === 'Presidente') {
        return prev;
      }

      return {
        ...prev,
        role: newRoles[0] || "Colaborador",
      };
    });
  }, []);

  // Configurar listener de autenticação
  useEffect(() => {
    let initialLoadDone = false;

    // Listener para mudanças de autenticação (signin, signout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        // Para eventos subsequentes (após o load inicial), carregar dados
        if (initialLoadDone) {
          loadUserData(newSession.user)
            .catch((error) => {
              console.error("Erro ao carregar dados do usuário no onAuthStateChange:", error);
            })
            .finally(() => setLoading(false));
        }
        // Para o evento INITIAL_SESSION, o getSession abaixo já cuida
      } else {
        setUser(null);
        setRoles([]);
        setLoading(false);
      }
    });

    // Verificar sessão existente — AWAIT loadUserData antes de setar loading=false
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        await loadUserData(existingSession.user).catch((error) => {
          console.error("Erro ao carregar dados do usuário na sessão existente:", error);
        });
      }
      setLoading(false);
      initialLoadDone = true;
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signIn = useCallback(async (emailOrPhone: string, password: string) => {
    try {
      let email = emailOrPhone;

      // Se não parece ser email, buscar email pelo telefone
      if (!emailOrPhone.includes('@')) {
        const cleanPhone = emailOrPhone.replace(/\D/g, '');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (profileError || !profile) {
          toast.error("Telefone não encontrado. Verifique e tente novamente.");
          throw new Error("Telefone não cadastrado");
        }

        email = profile.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("E-mail/telefone ou senha inválidos. Verifique suas credenciais e tente novamente.");
        } else {
          toast.error("Erro ao fazer login. Tente novamente.");
        }
        throw error;
      }

      if (data.session) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      // Log sanitizado: sem PII
      throw error;
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setRoles([]);
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
      toast.error("Erro ao fazer logout. Tente novamente.");
    }
  }, [navigate]);

  // Hierarquia de permissões
  const roleHierarchy: Record<UserRole, number> = {
    'Presidente': 4,
    'Administrador': 3,
    'Gerente': 2,
    'Colaborador': 1
  };

  const hasRole = useCallback((requiredRole: UserRole) => {
    // Se o usuário tem o role exato ou superior
    const userMaxLevel = Math.max(...roles.map(r => roleHierarchy[r] || 0));
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userMaxLevel >= requiredLevel;
  }, [roles]);

  const hasAnyRole = useCallback((allowedRoles: UserRole[]) => {
    // Se o usuário tem algum dos roles permitidos ou um superior a qualquer um deles
    // Simplificação: Se user é Presidente, tem acesso a tudo.
    if (roles.includes('Presidente')) return true;

    // Verificação hierárquica normal
    const userMaxLevel = Math.max(...roles.map(r => roleHierarchy[r] || 0));

    // Verifica se o nível do usuário satisfaz pelo menos um dos roles permitidos
    return allowedRoles.some(role => userMaxLevel >= (roleHierarchy[role] || 0));
  }, [roles]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        if (data.user) {
          await loadUserData(data.user);
        }
        toast.success("Sessão renovada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao renovar sessão:", error);
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/login");
    }
  }, [loadUserData, navigate]);

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: !!session,
    user,
    session,
    roles,
    attributes: {},
    mfaEnabled: false,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    refreshSession,
    loading,
    updateRoles,
  }), [session, user, roles, signIn, signOut, hasRole, hasAnyRole, refreshSession, loading, updateRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
};