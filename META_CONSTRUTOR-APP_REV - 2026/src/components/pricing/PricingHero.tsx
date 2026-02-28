import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export function PricingHero() {
    return (
        <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-20">
            {/* Background elements - more subtle */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 blur-[100px] rounded-full opacity-40" />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4 max-w-4xl mx-auto"
                >
                    <Badge variant="outline" className="px-3 py-1 text-xs border-primary/20 bg-primary/5 text-primary/80 rounded-full font-medium">
                        Preços
                    </Badge>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                        Planos simples para <br />
                        <span className="text-primary">
                            grandes obras
                        </span>
                    </h1>

                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto font-light">
                        Transparência e flexibilidade para sua gestão.
                        Comece grátis e escale sem complicações.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                            <CheckCircle2 className="h-4 w-4 text-primary/60" />
                            <span>Sem fidelidade</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                            <CheckCircle2 className="h-4 w-4 text-primary/60" />
                            <span>Suporte premium</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                            <CheckCircle2 className="h-4 w-4 text-primary/60" />
                            <span>Upgrade instantâneo</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
