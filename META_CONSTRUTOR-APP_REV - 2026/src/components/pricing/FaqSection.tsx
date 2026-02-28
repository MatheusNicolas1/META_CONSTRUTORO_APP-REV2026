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
            question: "Como funciona o período de teste?",
            answer: "Você pode testar o Plano Profissional gratuitamente por 14 dias. Não pedimos cartão de crédito para começar. Se gostar, basta escolher um plano ao final do período."
        },
        {
            question: "Posso mudar de plano a qualquer momento?",
            answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento diretamente nas configurações da sua conta. A mudança é imediata."
        },
        {
            question: "O que acontece se eu cancelar?",
            answer: "Se cancelar, você continuará tendo acesso aos recursos pagos até o final do ciclo de faturamento atual. Após isso, sua conta voltará para o plano gratuito."
        },
        {
            question: "Como funciona o suporte?",
            answer: "Oferecemos suporte via chat e e-mail para todos os planos. Usuários do plano Business têm acesso a suporte prioritário e gerente de conta dedicado."
        },
        {
            question: "Preciso instalar algo no meu computador?",
            answer: "Não. O Meta Construtor é 100% em nuvem. Você pode acessar de qualquer lugar, em qualquer dispositivo, apenas com seu navegador."
        }
    ];

    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Dúvidas Frequentes</h2>
                    <p className="text-muted-foreground">
                        Tudo o que você precisa saber sobre nossos planos e faturamento.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-left text-lg">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
