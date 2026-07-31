import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditsInfoDialog } from "@/components/CreditsInfoDialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface UserCredits {
  credits_balance: number;
  plan_type: string;
  total_shared: number;
}

export const CreditsDisplay = () => {
  const { user } = useAuth();
  const { isPresidente } = usePlanLimits();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    loadCredits(user.id, user.email || null);

    // Configurar listener para mudanças em tempo real com tratamento de erros
    let channel: any = null;

    try {
      channel = supabase
        .channel('credits-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_credits'
          },
          () => {
            if (user?.id) loadCredits(user.id, user.email || null);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime subscription error - continuing without realtime updates');
          }
        });
    } catch (error) {
      console.warn('Could not establish realtime connection:', error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing channel:', error);
        }
      }
    };
  }, [user?.id]);

  const loadCredits = async (userId: string, email: string | null) => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_balance, plan_type, total_shared')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não existe registro, criar um
        if (error.code === 'PGRST116') {
          const { data: newCredits } = await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              plan_type: 'free',
              credits_balance: 7
            })
            .select('credits_balance, plan_type, total_shared')
            .single();

          setCredits(newCredits);
        }
        return;
      }

      setCredits(data);
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !credits) return null;

  // Presidentes têm acesso ilimitado — não mostrar aviso de créditos
  if (isPresidente) return null;

  // Não mostrar para planos premium
  if (credits.plan_type !== 'free') return null;
  return (
    <Card data-tour="credits" className="p-4 mb-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Seus Créditos</p>
            <p className="text-xs text-muted-foreground">
              Plano Free
            </p>
          </div>
        </div>
        <Badge
          variant={credits.credits_balance <= 2 ? "destructive" : "secondary"}
          className="text-lg font-bold px-4 py-2"
        >
          {credits.credits_balance}
        </Badge>
      </div>

      {/* Barra de progresso visual */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Créditos restantes</span>
          <span>{credits.credits_balance} / 7</span>
        </div>
        <Progress
          value={(credits.credits_balance / 7) * 100}
          className="h-2"
        />
      </div>

      {credits.credits_balance < 3 && (
        <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs text-warning-foreground">
            ⚠️ <strong>Atenção!</strong> Seus créditos estão acabando!{' '}
            <a href="/preco" className="font-bold underline underline-offset-2 hover:text-warning-foreground/80">
              Faça upgrade
            </a>{' '}
            para obter RDOs ilimitados.
          </p>
        </div>
      )}

      {credits.credits_balance === 0 && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive font-medium">
            ⚠️ Créditos esgotados. Você atingiu o limite de RDOs gratuitos.{' '}
            <a href="/preco" className="font-bold underline underline-offset-2 hover:text-destructive/80">
              Faça upgrade
            </a>{' '}
            para continuar usando.
          </p>
        </div>
      )}
    </Card>
  );
};
