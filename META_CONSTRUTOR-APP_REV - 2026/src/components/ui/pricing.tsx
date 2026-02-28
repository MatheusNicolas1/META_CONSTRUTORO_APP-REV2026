"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

interface PricingPlan {
  name: string;
  price: number | string;
  yearlyPrice: number | string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title,
  description,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Atualiza estados dos botões quando o carousel muda
  useEffect(() => {
    if (!api) return;

    const updateButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on("select", updateButtons);
    api.on("reInit", updateButtons);
    updateButtons(); // Atualiza imediatamente

    return () => {
      api.off("select", updateButtons);
      api.off("reInit", updateButtons);
    };
  }, [api]);

  // Centralizar no plano correto ao carregar
  useEffect(() => {
    if (api && plans.length > 0) {
      // Verifica se veio de botão "Começar" através da URL ou localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const targetPlan = urlParams.get('plan') || localStorage.getItem('targetPlan');

      let targetIndex;
      if (targetPlan === 'free') {
        targetIndex = plans.findIndex(plan => plan.name === "FREE");
        localStorage.removeItem('targetPlan'); // Limpa após uso

        // Remove o parâmetro da URL após uso para limpar
        if (urlParams.has('plan')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else {
        // Default: centralizar no Profissional
        targetIndex = plans.findIndex(plan => plan.name === "PROFISSIONAL");
      }

      if (targetIndex !== -1) {
        // Pequeno delay para garantir que o carousel esteja totalmente inicializado
        setTimeout(() => {
          api.scrollTo(targetIndex, false);
        }, 100);
      }
    }
  }, [api, plans]);

  // Navegação com debounce
  const handlePrevious = () => {
    if (!api || isNavigating || !canScrollPrev) return;
    setIsNavigating(true);
    api.scrollPrev();
    setTimeout(() => setIsNavigating(false), 200);
  };

  const handleNext = () => {
    if (!api || isNavigating || !canScrollNext) return;
    setIsNavigating(true);
    api.scrollNext();
    setTimeout(() => setIsNavigating(false), 200);
  };

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api, isNavigating, canScrollPrev, canScrollNext]);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
      {/* Título e descrição - opcional, pode ser removido se já tiver na página */}
      {(title || description) && (
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          {title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg whitespace-pre-line max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center items-center mb-8 sm:mb-10 gap-3 sm:gap-4">
        <span className="text-xs sm:text-sm font-medium">Mensal</span>
        <Label>
          <Switch
            ref={switchRef as any}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
          />
        </Label>
        <span className="text-xs sm:text-sm font-medium text-center">
          Anual <span className="text-primary font-semibold">(Economize 20%)</span>
        </span>
      </div>

      <div className="relative w-full pt-8 sm:pt-10 md:pt-12 pb-4">
        {/* Setas de navegação posicionadas acima dos cards */}
        <div className="flex items-center justify-center mb-6 gap-4 sm:gap-6">
          <button
            onClick={handlePrevious}
            disabled={!canScrollPrev || isNavigating}
            className="h-12 w-12 rounded-full border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-background shadow-lg hover:shadow-xl active:scale-95"
            aria-label="Plano anterior"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canScrollNext || isNavigating}
            className="h-12 w-12 rounded-full border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-background shadow-lg hover:shadow-xl active:scale-95"
            aria-label="Próximo plano"
            type="button"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: false,
            slidesToScroll: 1,
            skipSnaps: false,
            dragFree: false,
            containScroll: "trimSnaps",
            duration: 30,
            watchDrag: true,
            breakpoints: {
              '(max-width: 640px)': {
                align: 'center',
                containScroll: 'keepSnaps',
                slidesToScroll: 1
              }
            }
          }}
          className="w-full mx-auto"
          role="region"
          aria-label="Planos de preços"
        >
          <CarouselContent className="pb-4 pt-8">
            {plans.map((plan, index) => (
              <CarouselItem
                key={`${plan.name}-${index}`}
                className={cn(
                  "basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                )}
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 120,
                    damping: 25,
                    delay: Math.min(index * 0.08, 0.3),
                  }}
                  className={cn(
                    "rounded-2xl border bg-background text-center relative flex flex-col h-full transition-all duration-300 hover:shadow-lg",
                    plan.isPopular
                      ? "border-primary border-2 shadow-2xl ring-4 ring-primary/15 scale-[1.05] z-10 p-4 sm:p-5 md:p-6 min-h-[620px] overflow-visible"
                      : "border-border hover:border-primary/40 p-4 sm:p-5 md:p-6 min-h-[580px] overflow-hidden"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-primary/90 py-1.5 px-4 rounded-full flex items-center shadow-xl border-2 border-background z-40 whitespace-nowrap">
                      <Star className="text-primary-foreground h-3.5 w-3.5 fill-current mr-1.5 flex-shrink-0" />
                      <span className="text-primary-foreground font-bold text-xs tracking-wide">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col pt-4">
                    <p className="text-xl font-bold text-foreground mb-3 leading-tight">
                      {plan.name}
                    </p>

                    <div className="mt-2 flex flex-col items-center justify-center gap-1 mb-2 min-h-[5rem]">
                      {plan.price === "Sob consulta" ? (
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          {plan.price}
                        </span>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-base text-muted-foreground self-start mt-2">R$</span>
                            <span className="text-5xl font-bold tracking-tight text-foreground">
                              <NumberFlow
                                value={
                                  (() => {
                                    const val = isMonthly ? plan.price : plan.yearlyPrice;
                                    if (typeof val === 'number') return val;
                                    // Se for string, remove pontos de milhar e troca vírgula por ponto
                                    return Number(String(val).replace(/\./g, '').replace(',', '.'));
                                  })()
                                }
                                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'decimal' }}
                                locales="pt-BR"
                                willChange
                              />
                            </span>
                          </div>
                          {plan.period && (
                            <span className="text-base font-medium text-muted-foreground">
                              /{plan.period}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {plan.price !== "0" && plan.price !== "Sob consulta" && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {isMonthly ? "Faturado mensalmente" : "Faturado anualmente"}
                      </p>
                    )}

                    <p className="mt-2 text-base text-muted-foreground leading-relaxed text-center mb-5">
                      {plan.description}
                    </p>

                    <ul className="space-y-3 flex-1 text-left mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-foreground leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <button
                        onClick={() => {
                          if (plan.href === '/login') {
                            navigate('/login');
                          } else {
                            navigate(`${plan.href}&billing=${isMonthly ? 'monthly' : 'yearly'}`);
                          }
                        }}
                        className={cn(
                          buttonVariants({
                            variant: plan.isPopular ? "default" : "outline",
                            size: "lg"
                          }),
                          "w-full font-semibold transition-all duration-200",
                          plan.isPopular && "shadow-lg hover:shadow-xl"
                        )}
                      >
                        {plan.buttonText}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-muted-foreground">
          5 créditos gratuitos por mês • Cancele a qualquer momento • Suporte incluído
        </p>
      </div>
    </div>
  );
}