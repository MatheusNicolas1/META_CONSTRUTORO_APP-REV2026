"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Check, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { track } from "@/integrations/analytics";

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
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Atualiza estados dos botoes quando o carousel muda.
  useEffect(() => {
    if (!api) return;

    const updateButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on("select", updateButtons);
    api.on("reInit", updateButtons);
    updateButtons();

    return () => {
      api.off("select", updateButtons);
      api.off("reInit", updateButtons);
    };
  }, [api]);

  // Centraliza no plano correto ao carregar.
  useEffect(() => {
    if (api && plans.length > 0) {
      // Verifica se veio de botao "Comecar" pela URL ou localStorage.
      const urlParams = new URLSearchParams(window.location.search);
      const targetPlan = urlParams.get('plan') || localStorage.getItem('targetPlan');

      let targetIndex;
      if (targetPlan === 'free') {
        targetIndex = plans.findIndex(plan => plan.name === "FREE");
        localStorage.removeItem('targetPlan');

        // Remove o parametro da URL apos uso.
        if (urlParams.has('plan')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else {
        // No mobile, start from the first card to avoid partially clipped slides.
        targetIndex = isDesktop ? plans.findIndex(plan => plan.name === "PROFISSIONAL") : 0;
      }

      if (targetIndex !== -1) {
        // Pequeno delay para garantir que o carousel esteja totalmente inicializado
        setTimeout(() => {
          api.scrollTo(targetIndex, false);
        }, 100);
      }
    }
  }, [api, plans, isDesktop]);

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
    track('marketing.billing_toggle', { is_yearly: checked, is_monthly: !checked });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
      {/* Título e descrição - opcional, pode ser removido se já tiver na página */}
      {(title || description) && (
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          {title && (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight break-words">
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

      <div className="flex flex-wrap justify-center items-center mb-8 sm:mb-10 gap-3 sm:gap-4">
        <span className="text-xs sm:text-sm font-medium leading-none">Mensal</span>
        <Label>
          <Switch
            checked={!isMonthly}
            onCheckedChange={handleToggle}
          />
        </Label>
        <span className="text-xs sm:text-sm font-medium leading-none text-center">
          Anual <span className="text-primary font-semibold">(Economize 20%)</span>
        </span>
      </div>

      <div className="relative w-full pt-4 sm:pt-6 md:pt-8 pb-4">
        {/* Setas de navegação posicionadas acima dos cards */}
        <div className="flex items-center justify-center mb-4 gap-4 sm:gap-6">
          <button
            onClick={handlePrevious}
            disabled={!canScrollPrev || isNavigating}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Plano anterior"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canScrollNext || isNavigating}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Próximo plano"
            type="button"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            slidesToScroll: 1,
            skipSnaps: false,
            dragFree: false,
            containScroll: "trimSnaps",
            duration: 30,
            watchDrag: true,
            breakpoints: {
              '(max-width: 640px)': {
                align: 'start',
                containScroll: 'trimSnaps',
                slidesToScroll: 1
              }
            }
          }}
          className="w-full min-w-0 mx-auto"
          role="region"
          aria-label="Planos de preços"
        >
          <CarouselContent className="pb-4 pt-6">
            {plans.map((plan, index) => (
              <CarouselItem
                key={`${plan.name}-${index}`}
                className={cn(
                  "basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                )}
              >
                <article
                  className={cn(
                    "relative flex h-full flex-col border bg-background p-4 text-center transition-colors duration-200 sm:p-5 md:p-6",
                    plan.isPopular
                      ? "z-10 min-h-[620px] border-primary"
                      : "min-h-[580px] border-border hover:border-primary/40"
                  )}
                >
                  {plan.isPopular && (
                    <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 px-3 py-2 text-primary">
                      <Star className="h-3.5 w-3.5 flex-shrink-0 fill-current" />
                      <span className="text-xs font-semibold uppercase leading-none">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col pt-4">
                    <p className="text-lg sm:text-xl font-semibold text-foreground mb-3 leading-snug break-words">
                      {plan.name}
                    </p>

                    <div className="mt-2 flex flex-col items-center justify-center gap-1 mb-2 min-h-[5rem]">
                      {plan.price === "Sob consulta" ? (
                        <span className="text-2xl sm:text-3xl font-semibold text-foreground break-words">
                          {plan.price}
                        </span>
                      ) : (
                        <>
                          <div className="flex min-w-0 items-baseline justify-center gap-1">
                            <span className="text-base text-muted-foreground self-start mt-2">R$</span>
                            <span className="text-4xl sm:text-5xl font-semibold leading-none text-foreground">
                              <NumberFlow
                                value={
                                  (() => {
                                    const val = isMonthly ? plan.price : plan.yearlyPrice;
                                    if (typeof val === 'number') return val;
          // Se for string, remove pontos de milhar e troca virgula por ponto.
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

                    <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed text-center mb-5 break-words">
                      {plan.description}
                    </p>

                    <ul className="space-y-3 flex-1 text-left mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex min-w-0 items-start gap-2.5 text-sm leading-relaxed">
                          <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="min-w-0 text-foreground leading-relaxed break-words">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <button
                        onClick={() => {
                          if (plan.href === '/login') {
                            navigate('/login');
                          } else if (plan.href.startsWith('/contato')) {
                            navigate('/contato');
                          } else {
                            const separator = plan.href.includes('?') ? '&' : '?';
                            navigate(`${plan.href}${separator}billing=${isMonthly ? 'monthly' : 'yearly'}`);
                          }
                        }}
                        className={cn(
                          buttonVariants({
                            variant: plan.isPopular ? "default" : "outline",
                            size: "lg"
                          }),
                          "w-full text-base font-semibold leading-none transition-colors duration-200"
                        )}
                      >
                        {plan.buttonText}
                      </button>
                    </div>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="text-center mt-10">
        <p className="text-sm leading-relaxed text-muted-foreground">
          5 créditos gratuitos por mês • Cancele a qualquer momento • Suporte incluído
        </p>
      </div>
    </div>
  );
}
