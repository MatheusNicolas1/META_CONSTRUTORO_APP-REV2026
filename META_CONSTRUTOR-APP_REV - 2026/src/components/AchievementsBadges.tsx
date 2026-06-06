import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  achievement_type: string;
  created_at: string;
}

export const AchievementsBadges = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Erro ao carregar conquistas:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "gestor_ouro":
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case "especialista":
        return <Award className="h-8 w-8 text-blue-500" />;
      case "primeira_obra":
        return <Star className="h-8 w-8 text-primary" />;
      default:
        return <Trophy className="h-8 w-8 text-gray-500" />;
    }
  };

  const shareOnLinkedIn = (achievement: Achievement) => {
    const message = `Selo registrado no MetaConstrutor: "${achievement.title}".`;
    const popup = window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
    if (!popup) {
      toast.error("O navegador bloqueou a janela do LinkedIn.");
    }
  };

  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhuma conquista registrada ainda. Quando houver selos confirmados, eles aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Minhas Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="flex justify-center">{getIcon(achievement.achievement_type)}</div>
                <h3 className="font-semibold">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => shareOnLinkedIn(achievement)}
                >
                  Compartilhar no LinkedIn
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
