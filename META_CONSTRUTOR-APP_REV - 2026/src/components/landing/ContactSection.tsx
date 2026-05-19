import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.error) {
        throw new Error(result?.error?.message || 'Erro ao enviar contato');
      }

      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Recebemos sua solicitacao e registramos o contato no atendimento.",
      });

      setFormData({
        name: '',
        email: '',
        company: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contato@metaconstrutor.com',
      href: 'mailto:contato@metaconstrutor.com'
    },
    {
      icon: Phone,
      title: 'Telefone',
      value: '+55 (11) 9999-9999',
      href: 'tel:+5511999999999'
    },
    {
      icon: MapPin,
      title: 'Endereço',
      value: 'São Paulo, SP - Brasil',
      href: '#'
    }
  ];

  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Vamos conversar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entre em contato conosco para saber como o Meta Construtor pode transformar 
            a gestão das suas obras.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensagem *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
                  placeholder="Como podemos ajudar você?"
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="lg:pl-8">
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Informações de Contato
              </h3>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{info.title}</div>
                      {info.href !== '#' ? (
                        <a 
                          href={info.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <div className="text-muted-foreground">{info.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Horário de Atendimento</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Segunda a Sexta: 8h às 18h</div>
                  <div>Sábado: 8h às 12h</div>
                  <div>Domingo: Fechado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
