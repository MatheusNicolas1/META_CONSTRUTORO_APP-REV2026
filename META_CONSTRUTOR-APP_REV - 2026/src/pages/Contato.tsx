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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria o envio real do formulário
    console.log('Dados do formulário:', formData);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <>
      <SEO
        title="Contato - Meta Construtor | Fale Conosco"
        description="Entre em contato com a equipe do Meta Construtor. Suporte técnico, demonstrações, dúvidas sobre preços e parcerias. Estamos aqui para ajudar!"
        canonical="https://metaconstrutor.com.br/contato"
      />

      <div className="min-h-screen bg-background">
        <LandingNavigation />

        <main className="pt-16 md:pt-20 w-full">
          {/* Hero Section */}
          <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-muted/20 w-full">
            <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Fale Conosco
              </h1>
              <p className="text-xl text-muted-foreground">
                Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo
                ou preencha o formulário e responderemos o mais rápido possível.
              </p>
            </div>
          </section>

          {/* Contact Info */}
          <section className="py-10 md:py-12 lg:py-16 w-full">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 hover:scale-105 text-center"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {info.title}
                    </h3>
                    <p className="text-primary font-medium mb-1">
                      {info.details}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Envie sua Mensagem
                </h2>
                <p className="text-muted-foreground">
                  Preencha o formulário abaixo e nossa equipe entrará em contato em breve
                </p>
              </div>

              <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                          Empresa
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Nome da sua empresa"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                        Assunto *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical"
                        placeholder="Descreva sua dúvida ou necessidade em detalhes..."
                      />
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
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
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Mensagem Enviada com Sucesso!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Recebemos sua mensagem e nossa equipe entrará em contato em breve.
                      Obrigado pelo interesse no Meta Construtor!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => navigate('/login')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Começar Teste Gratuito
                      </button>
                      <button
                        onClick={() => navigate('/')}
                        className="border border-border hover:bg-muted text-foreground px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Voltar ao Início
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
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Outras Formas de Entrar em Contato
                </h2>
                <p className="text-muted-foreground">
                  Escolha a forma mais conveniente para você
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Chat Online
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Converse conosco em tempo real durante o horário comercial
                  </p>
                  <p className="text-blue-600 font-medium">
                    Use o chat no canto inferior direito →
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    WhatsApp
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Fale conosco diretamente pelo WhatsApp
                  </p>
                  <button
                    onClick={() => window.open('https://wa.me/5575992205734', '_blank')}
                    className="text-green-600 hover:underline font-medium"
                  >
                    Abrir WhatsApp →
                  </button>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Email Direto
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Envie um email diretamente para nossa equipe de suporte
                  </p>
                  <button
                    onClick={() => window.location.href = 'mailto:suporte@metaconstrutor.com'}
                    className="text-purple-600 hover:underline font-medium"
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