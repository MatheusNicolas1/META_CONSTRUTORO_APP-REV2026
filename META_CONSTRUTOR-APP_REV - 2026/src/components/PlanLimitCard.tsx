import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PlanLimitCardProps {
  title: string;
  description: string;
  used?: number;
  limit?: number;
  actionLabel?: string;
}

export const PlanLimitCard = ({
  title,
  description,
  used,
  limit,
  actionLabel = "Ver planos",
}: PlanLimitCardProps) => {
  const navigate = useNavigate();
  const showUsage = typeof used === "number" && typeof limit === "number";

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 shadow-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {showUsage && (
                <Badge variant="secondary" className="h-6 rounded-md px-2 text-xs font-medium">
                  {used} / {limit}
                </Badge>
              )}
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full shrink-0 border-primary/25 bg-background/70 text-primary hover:bg-primary/10 sm:w-auto"
          onClick={() => navigate("/preco")}
        >
          {actionLabel}
          <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
};
