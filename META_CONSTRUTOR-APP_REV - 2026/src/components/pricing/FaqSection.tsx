import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
    const faqs = [
        {
            question: "Como funciona o periodo de teste?",
            answer: "Voce pode testar o Plano Profissional gratuitamente por 14 dias. Nao pedimos cartao de credito para comecar. Se a rotina fizer sentido para a equipe, basta escolher um plano ao final do periodo."
        },
        {
            question: "Posso mudar de plano a qualquer momento?",
            answer: "Sim. A mudanca de plano pode ser feita conforme a necessidade da obra e da equipe. Quando houver duvida, o contato comercial orienta o melhor enquadramento."
        },
        {
            question: "O que acontece se eu cancelar?",
            answer: "Se cancelar, o acesso aos recursos pagos permanece ate o final do ciclo de faturamento vigente. Depois disso, a conta volta para o plano gratuito quando aplicavel."
        },
        {
            question: "Como funciona o suporte?",
            answer: "O suporte e tratado pelos canais oficiais de contato. Planos empresariais podem ter condicoes especificas definidas em proposta comercial."
        },
        {
            question: "Preciso instalar algo no meu computador?",
            answer: "Nao. O Meta Construtor e uma plataforma web acessada pelo navegador."
        }
    ];

    return (
        <section className="bg-muted/30 px-2 py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-4 break-words">Duvidas frequentes</h2>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                        Respostas objetivas para avaliar planos, faturamento e suporte.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="px-2 py-2">
                            <AccordionTrigger className="text-left text-base sm:text-lg font-semibold leading-snug break-words transition-colors duration-150">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
