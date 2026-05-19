import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from "@/components/SEO";
import LandingNavigation from '@/components/landing/LandingNavigation';
import FooterSection from '@/components/landing/FooterSection';

const ExpandableChatDemo = lazy(() => import('@/components/chat/ExpandableChatDemo').then(m => ({ default: m.ExpandableChatDemo })));
import {
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle
} from 'lucide-react';

const Contato = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: 'suporte@metaconstrutor.com',
      description: 'Resposta em até 4 horas úteis'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp',
      details: '(75) 9 9220-5734',
      description: 'Segunda a Sexta, 8h às 18h'
    },
    {
      icon: MapPin,
      title: 'Endereço',
      details: 'Salvador, BA - Brasil',
      description: 'Atendimento online em todo o país'
    },
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      details: 'Segunda a Sexta, 8h às 18h',
      description: 'Finais de semana via email'
    }
  ];

  const subjects = [
    'Dúvidas sobre o produto',
    'Problemas técnicos',
    'Solicitação de demonstração',
    'Informações sobre preços',
    'Parcerias e integrações',
    'Feedback e sugestões',
    'Outros'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      setIsSubmitted(true);
      setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Erro ao enviar contato:', err);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  return (
    <>
      <SEO
        title="Contato - Meta Construtor | Fale Conosco"
        description="Entre em contato com a equipe do Meta Construtor. Suporte técnico, demonstrações, dúvidas sobre preços e parcerias. Estamos aqui para ajudar!"
        canonical="https://metaconstrutor.com.br/contato"
      />

      <div className="min-h-screen overflow-x-hidden bg-background">
        <LandingNavigation />

        <main className="pt-16 md:pt-20 w-full">
          {/* Hero Section */}
          <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-muted/20 w-full">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-foreground mb-6 break-words">
                Fale Conosco
              </h1>
              <p className="mx-auto max-w-[21rem] text-base sm:max-w-3xl sm:text-lg text-muted-foreground leading-relaxed">
                Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo
                ou preencha o formulário e responderemos o mais rápido possível.
              </p>
            </div>
          </section>

          {/* Contact Info */}
          <section className="py-10 md:py-12 lg:py-16 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto grid max-w-[20rem] md:max-w-none md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 md:hover:scale-105 text-center"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-2">
                      {info.title}
                    </h3>
                    <p className="text-sm sm:text-base text-primary font-medium leading-relaxed mb-1 break-all sm:break-words">
                      {info.details}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {info.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="py-12 md:py-16 lg:py-20 bg-muted/30 w-full">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
                  Envie sua Mensagem
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Preencha o formulário abaixo e nossa equipe retornará pelos dados informados
                </p>
              </div>

              <div className="mx-auto max-w-[20rem] rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6 md:max-w-none md:p-8">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium leading-none text-foreground mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-none text-foreground mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium leading-none text-foreground mb-2">
                          Empresa
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Nome da sua empresa"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium leading-none text-foreground mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium leading-none text-foreground mb-2">
                        Assunto *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Selecione um assunto</option>
                        {subjects.map((subject, index) => (
                          <option key={index} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium leading-none text-foreground mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full min-w-0 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical"
                        placeholder="Descreva sua dúvida ou necessidade em detalhes..."
                      />
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-base font-semibold leading-none transition-colors flex items-center justify-center gap-2 sm:w-auto sm:px-8"
                      >
                        <Send className="h-4 w-4" />
                        Enviar Mensagem
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-foreground mb-4 break-words">
                      Mensagem Enviada com Sucesso!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Recebemos sua mensagem e registramos sua solicitação no atendimento.
                      Obrigado pelo interesse no Meta Construtor!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-base font-semibold leading-none transition-colors sm:w-auto"
                      >
                        Começar Teste Gratuito
                      </button>
                      <button
                        onClick={() => navigate('/home')}
                        className="w-full border border-border hover:bg-muted text-foreground px-6 py-2 rounded-lg text-base font-semibold leading-none transition-colors sm:w-auto"
                      >
                        Voltar ao Início
                      </button>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="w-full border border-border hover:bg-muted text-foreground px-6 py-2 rounded-lg text-base font-semibold leading-none transition-colors sm:w-auto"
                      >
                        Enviar outra mensagem
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="py-12 md:py-16 lg:py-20 mb-8 md:mb-12 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
                  Outras Formas de Entrar em Contato
                </h2>
                <p className="text-muted-foreground">
                  Escolha a forma mais conveniente para você
                </p>
              </div>

              <div className="mx-auto grid max-w-[20rem] md:max-w-none md:grid-cols-3 gap-8">
                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-2 break-words">
                    Chat Online
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    Converse conosco em tempo real durante o horário comercial
                  </p>
                  <p className="text-sm sm:text-base text-blue-600 font-medium leading-relaxed">
                    Use o chat no canto inferior direito →
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-2 break-words">
                    WhatsApp
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    Fale conosco diretamente pelo WhatsApp
                  </p>
                  <button
                    onClick={() => window.open('https://wa.me/5575992205734', '_blank')}
                    className="text-sm sm:text-base text-green-600 hover:underline font-medium leading-relaxed"
                  >
                    Abrir WhatsApp →
                  </button>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-2 break-words">
                    Email Direto
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    Envie um email diretamente para nossa equipe de suporte
                  </p>
                  <button
                    onClick={() => window.location.href = 'mailto:suporte@metaconstrutor.com'}
                    className="text-sm sm:text-base text-purple-600 hover:underline font-medium leading-relaxed"
                  >
                    Enviar Email →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <FooterSection />
        <Suspense fallback={null}>
          <ExpandableChatDemo />
        </Suspense>
      </div>
    </>
  );
};

export default Contato;
