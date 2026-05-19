import { User, Settings, LogOut, ChevronDown, HelpCircle, MessageSquarePlus } from "lucide-react";
import { useState, startTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/components/auth/AuthContext";

export function UserProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fallback data if user is loading or not present (shouldn't happen in protected routes)
  const userData = {
    name: user?.name || (user as any)?.user_metadata?.name || user?.email || "Usuário",
    email: user?.email || "",
    role: user?.role || (user as any)?.user_metadata?.role || "Usuário",
    avatar: user?.avatar_url || (user as any)?.user_metadata?.avatar_url || "",
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut(); // Desloga do Supabase, zera session e faz toast
      // O signOut default lá do AuthContext já executa a navegação para o /login
    } catch (error) {
      // O Erro já é repassado no Auth Context, mas caso não venha toast de lá
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    startTransition(() => {
      navigate("/app/perfil");
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 h-auto p-2 hover:bg-accent/50"
          aria-label="Menu do perfil do usuário"
          data-tour="perfil"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(userData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {userData.name}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {userData.role}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 max-w-[90vw] bg-popover border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.role}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => startTransition(() => navigate("/app/configuracoes"))} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => startTransition(() => navigate("/app/faq"))} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>FAQ / Dúvidas</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => startTransition(() => navigate("/app/feedback"))} className="cursor-pointer">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          <span>Enviar feedback</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
