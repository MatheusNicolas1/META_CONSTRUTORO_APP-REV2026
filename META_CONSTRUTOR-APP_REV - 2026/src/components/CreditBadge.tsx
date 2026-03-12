import { useCredits } from '@/hooks/useCredits';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

/**
 * Badge que exibe o saldo de créditos de RDO para usuários do plano Gratuito.
 * Para planos pagos, não exibe nada (RDOs ilimitados).
 *
 * Estados visuais:
 * - Verde: 3+ créditos
 * - Amarelo: 1-2 créditos (alerta)
 * - Vermelho: 0 créditos (bloqueado)
 */
export function CreditBadge() {
    const { balance, isFreePlan, isLowCredits, hasCredits, isLoading, maxMonthlyRdos } = useCredits();

    // Não exibir para planos pagos
    if (!isFreePlan || isLoading) return null;

    const getVariant = () => {
        if (!hasCredits) return 'destructive';
        if (isLowCredits) return 'outline';
        return 'secondary';
    };

    const getColorClass = () => {
        if (!hasCredits) return 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30';
        if (isLowCredits) return 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30';
        return 'text-muted-foreground';
    };

    return (
        <Link to="/app/perfil?tab=assinatura" title="Gerenciar plano">
            <Badge
                variant={getVariant()}
                className={cn(
                    'cursor-pointer hover:opacity-80 transition-opacity gap-1.5 text-xs font-medium px-2.5 py-1',
                    getColorClass()
                )}
            >
                {!hasCredits ? (
                    <>
                        <AlertTriangle className="h-3 w-3" />
                        0/{maxMonthlyRdos} RDOs
                    </>
                ) : isLowCredits ? (
                    <>
                        <AlertTriangle className="h-3 w-3" />
                        {balance}/{maxMonthlyRdos} RDOs
                    </>
                ) : (
                    <>
                        <FileText className="h-3 w-3" />
                        {balance}/{maxMonthlyRdos} RDOs
                    </>
                )}
                <Sparkles className="h-3 w-3 ml-0.5 opacity-50" />
            </Badge>
        </Link>
    );
}
