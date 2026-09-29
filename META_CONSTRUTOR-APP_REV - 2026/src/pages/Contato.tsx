import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SEO from "@/components/SEO";
import { seoPages } from '@/config/seo';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, MapPin, Send, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedStatusIcon, SubmitButton, type SubmitState } from '@/components/ui/animated-status';
import { PublicLayout } from '@/components/public/PublicLayout';
import { AnimatedSection } from '@/components/public/AnimatedSection';
import { AnimatedGradient } from '@/components/public/AnimatedGradient';
import { StaggerContainer, StaggerItem } from '@/components/public/StaggerContainer';
import { NavigationSafety } from '@/utils/navigationSafety';

const contactChannels = [
  {
    icon: Mail,
    title: 'Email',
    value: 'suporte@metaconstrutor.com',
    desc: 'Resposta em até 4 horas úteis',
    action: 'mailto:suporte@metaconstrutor.com',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: '(75) 9 9220-5734',
    desc: 'Segunda a Sexta, 8h às 18h',
    action: 'https://wa.me/5575992205734',
  },
  {
    icon: Phone,
    title: 'Telefone',
    value: '(75) 9 9220-5734',
    desc: 'Horário comercial',
    action: 'tel:+5575992205734',
  },
  {
    icon: MapPin,
    title: 'Endereço',
    value: 'Salvador, BA — Brasil',
    desc: 'Atendimento online em todo o país',
    action: null,
  },
];

const faqItems = [
  { q: 'Quanto tempo para responder?', a: 'Respondemos em até 4 horas em dias úteis. No WhatsApp, a resposta costuma ser em minutos durante o horário comercial.' },
  { q: 'Posso agendar uma demonstração?', a: 'Claro! Envie uma mensagem pelo WhatsApp ou formulário pedindo uma demo. Entraremos em contato para agendar.' },
  // Nível de suporte de cada plano: fonte única na tabela de /preco (evita promessas divergentes).
  { q: 'Tem suporte técnico?', a: 'Sim. Todos os planos têm suporte. O canal e o prazo de atendimento de cada plano estão na página de planos.' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Contato() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submitState: SubmitState = sent ? 'success' : sending ? 'loading' : error ? 'error' : 'idle';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Erro ao enviar');
      }

      // Mostra a confirmação no botão antes de trocar para a tela de sucesso.
      setSent(true);
      window.setTimeout(() => {
        setSent(false);
        setSubmitted(true);
      }, 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro de rede. Tente novamente.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <SEO {...seoPages.contato} />

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-10 md:pb-12 bg-hero-gradient">
        <div className="container max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-orange-ghost text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <MessageCircle className="w-3.5 h-3.5" /> Fale com a gente
            </span>
            <h1 className="text-[clamp(1.75rem,5vw,3.75rem)] font-extrabold text-neutral-900 leading-[1.05] tracking-tight mb-4">
              Como podemos{' '}
              <AnimatedGradient as="span">ajudar?</AnimatedGradient>
            </h1>
            <p className="text-lg text-neutral-600 max-w-lg mx-auto leading-relaxed">
              Dúvidas, demonstração, suporte ou parceria — escolha o canal que preferir.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Channels + Form */}
      <AnimatedSection>
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Channels */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-extrabold text-neutral-900">
                <AnimatedGradient as="span">Canais de contato</AnimatedGradient>
              </h2>
              <StaggerContainer staggerDelay={0.08} className="space-y-6">
                {contactChannels.map((ch, i) => {
                  const Icon = ch.icon;
                  return (
                    <StaggerItem key={i} className="flex items-start gap-4 p-3 md:p-4 rounded-xl hover:bg-neutral-50 transition-colors" direction="left" distance={20}>
                      <div className="w-10 h-10 bg-brand-orange-ghost rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-brand-orange" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{ch.title}</h3>
                        {ch.action ? (
                          <a href={ch.action} className="text-brand-orange hover:underline font-medium text-sm">
                            {ch.value}
                          </a>
                        ) : (
                          <p className="text-neutral-700 text-sm">{ch.value}</p>
                        )}
                        <p className="text-neutral-500 text-xs mt-1">{ch.desc}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 flex flex-col bg-neutral-50 rounded-2xl p-5 md:p-8 border border-neutral-100"
            >
              {submitted ? (
                <div className="my-auto text-center py-12" role="status">
                  <AnimatedStatusIcon status="success" className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-extrabold text-neutral-900 mb-2">Mensagem enviada!</h2>
                  <p className="text-neutral-600 mb-6">Recebemos seu contato e responderemos em até 4 horas úteis.</p>
                  <Button variant="outline" className="rounded-full" onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' }); }}>
                    Enviar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-neutral-900 mb-6">Solicitar orçamento</h2>

                  {error && (
                    <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                      <AnimatedStatusIcon status="error" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nome *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Empresa</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                          placeholder="Nome da construtora"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Telefone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                          placeholder="(DDD) 9 9999-9999"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Assunto *</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                        placeholder="Ex: Demonstração, dúvida sobre planos..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mensagem *</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all resize-none"
                        placeholder="Conte como podemos ajudar..."
                      />
                    </div>
                    <SubmitButton
                      state={submitState}
                      labels={{
                        idle: <span className="flex items-center gap-2"><Send className="w-4 h-4" aria-hidden="true" /> Enviar mensagem</span>,
                        loading: 'Enviando…',
                        success: 'Mensagem enviada',
                        error: 'Não foi possível enviar. Tentar de novo',
                      }}
                    />
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection className="bg-neutral-50">
        <div className="container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-brand-orange font-semibold text-sm tracking-wide uppercase">Dúvidas rápidas</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mt-3">
              <AnimatedGradient as="span">Antes de enviar</AnimatedGradient>
            </h2>
          </div>
          <StaggerContainer staggerDelay={0.06} className="space-y-1">
            {faqItems.map((item, i) => (
              <StaggerItem key={i} className="border-b border-neutral-200 pb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.q}</h3>
                <p className="text-neutral-600 leading-relaxed">{item.a}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </AnimatedSection>
    </PublicLayout>
  );
}
