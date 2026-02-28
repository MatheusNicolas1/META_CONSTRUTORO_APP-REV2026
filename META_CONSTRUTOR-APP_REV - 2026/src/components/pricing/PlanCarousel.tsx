
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    description: string;
    features: string[];
    recommended?: boolean;
}

interface PlanCarouselProps {
    plans: Plan[];
    billingCycle: "monthly" | "yearly";
    selectedPlanId: string | null;
    currentPlanId?: string;
    onSelectPlan: (planId: string) => void;
}

export function PlanCarousel({
    plans,
    billingCycle,
    selectedPlanId,
    currentPlanId,
    onSelectPlan,
}: PlanCarouselProps) {
    return (
        <Carousel
            opts={{
                align: "start",
                loop: false,
            }}
            className="w-full max-w-6xl mx-auto px-4 sm:px-12"
        >
            <CarouselContent className="-ml-4">
                {plans.map((plan) => {
                    const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
                    const isSelected = selectedPlanId === plan.id;
                    const isCurrent = currentPlanId === plan.id;

                    return (
                        <CarouselItem key={plan.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                            <Card
                                className={cn(
                                    "flex flex-col h-full relative border-2 transition-all duration-300",
                                    isSelected
                                        ? "border-primary shadow-xl scale-105 z-10"
                                        : "border-border hover:border-primary/50",
                                    plan.recommended && !isSelected && "border-primary/50"
                                )}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                        <Badge variant="default" className="bg-primary hover:bg-primary gap-1 px-4 py-1">
                                            <Star className="h-3 w-3 fill-current" />
                                            Mais Popular
                                        </Badge>
                                    </div>
                                )}

                                {isSelected && (
                                    <div className="absolute -top-3 right-4">
                                        <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>
                                    </div>
                                )}

                                <CardHeader className={cn("text-center pb-2", plan.recommended && "pt-8")}>
                                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <span className="text-sm text-muted-foreground">R$</span>
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            {(price / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            /{billingCycle === "monthly" ? "mês" : "ano"}
                                        </span>
                                    </div>
                                    {billingCycle === "yearly" && (
                                        <span className="text-xs text-green-500 font-medium mt-1 block">
                                            Economize 20% com o plano anual
                                        </span>
                                    )}
                                    <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">
                                        {plan.description}
                                    </p>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <ul className="space-y-3 pt-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        onClick={() => onSelectPlan(plan.id)}
                                        disabled={isCurrent}
                                        className={cn("w-full gap-2", isSelected && "bg-primary text-primary-foreground font-bold")}
                                        variant={isSelected ? "default" : isCurrent ? "outline" : "default"}
                                    >
                                        {isCurrent
                                            ? "Plano Atual"
                                            : isSelected
                                                ? "Plano Selecionado"
                                                : "Selecionar Plano"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-0" />
            <CarouselNext className="hidden md:flex right-0" />
        </Carousel>
    );
}
