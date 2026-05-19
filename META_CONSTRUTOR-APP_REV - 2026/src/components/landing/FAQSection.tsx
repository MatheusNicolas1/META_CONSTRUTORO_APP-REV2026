import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';

const FAQSection = () => {
  const navigate = useNavigate();
  const { navigateToFreePlan } = usePricingNavigation();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    {
      question: 'Como funciona o teste grátis do MetaConstrutor?',
      answer: 'O teste grátis é completamente funcional por 14 dias, sem limitações. Você pode testar todas as funcionalidades, incluir suas obras reais e avaliar como a plataforma se adapta ao seu fluxo de trabalho. Não pedimos cartão de crédito para começar.'
    },
    {
      question: 'Posso usar o MetaConstrutor offline?',
      answer: 'Sim! O MetaConstrutor funciona offline nas funcionalidades essenciais como preenchimento de RDO, checklists e visualização de dados. Quando a conexão for reestabelecida, todos os dados são sincronizados automaticamente.'
    },
    {
      question: 'O MetaConstrutor integra com outras ferramentas?',
      answer: 'Sim! Integramos com WhatsApp, Gmail, Google Drive, Excel, sistemas ERP populares e muitas outras ferramentas. Também oferecemos API completa para integrações customizadas no plano Empresa.'
    },
    {
      question: 'Como funciona o suporte técnico?',
      answer: 'Oferecemos suporte por email no plano Gratuito, suporte prioritário no Profissional e suporte 24/7 dedicado no plano Empresa. Nossa equipe é especializada em construção civil e entende suas necessidades específicas.'
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas. Seus dados permanecem acessíveis por 90 dias após o cancelamento, e você pode exportá-los quando necessário.'
    },
    {
      question: 'O MetaConstrutor é seguro para dados sensíveis?',
      answer: 'Absolutamente. Utilizamos criptografia de nível bancário, certificação SSL, servidores certificados ISO 27001 e seguimos as melhores práticas de segurança da indústria. Seus dados estão completamente protegidos.'
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-16 md:py-24 bg-background">{/* Changed from bg-muted/30 to bg-background for better alternation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            Tire suas dúvidas sobre o MetaConstrutor e nossa forma de trabalho
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-border bg-background">
              <CardContent className="p-0">
                  <button
                    className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(index)}
                    aria-expanded={openItems.includes(index)}
                  >
                  <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground pr-4">
                    {faq.question}
                  </h3>
                  {openItems.includes(index) ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                
                {openItems.includes(index) && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-8 sm:mt-12 text-center px-2 sm:px-0">
          <Card className="bg-card border-border">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold leading-snug text-foreground mb-2">
                Ainda tem dúvidas?
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed px-2 sm:px-0">
                Nossa equipe está pronta para ajudar você a encontrar a melhor solução 
                para sua empresa de construção.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto touch-manipulation text-base font-semibold leading-none"
                  onClick={() => {
                    if ((window as any).gtag) {
                      (window as any).gtag('event', 'contact_from_faq', {
                        page_location: window.location.href
                      });
                    }
                    navigate('/contato');
                  }}
                >
                  Falar com Especialista
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto touch-manipulation text-base font-semibold leading-none"
                   onClick={() => {
                     if ((window as any).gtag) {
                       (window as any).gtag('event', 'start_trial_from_faq', {
                         page_location: window.location.href
                       });
                     }
                     navigateToFreePlan();
                   }}
                >
                  Começar Teste Grátis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
