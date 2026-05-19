import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Briefcase, MapPin, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PublicProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  position?: string;
  is_public: boolean;
}

const PerfilPublico = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadProfile();
    }
  }, [slug]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Perfil não encontrado</h2>
            <p className="text-muted-foreground text-center">
              Este perfil não existe ou não está público.
            </p>
        <Button onClick={() => navigate("/home")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
          onClick={() => navigate("/home")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback className="text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <Badge variant="secondary">Perfil Público</Badge>
              </div>
              
              {profile.position && profile.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{profile.position} na {profile.company}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {profile.bio && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Sobre</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>

            {profile.phone && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}

            {profile.company && (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{profile.company}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Perfil criado no MetaConstrutor - Gestão de Obras
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPublico;
