import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useAuth } from "@/components/auth/AuthContext";

const Logout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      await signOut();
    };
    handleLogout();
  }, [signOut]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center">
      <SEO title="Saindo... | Meta Construtor" description="Encerrando sua sessão com segurança." canonical={window.location.href} />
      <p>Saindo...</p>
    </main>
  );
};

export default Logout;
