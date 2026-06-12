import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Phone, Mail, MapPin, Clock, MessageCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';

// ─── Variants ────────────────────────────────────────────────
const cinematic = {
  initial: { opacity: 0, y: 30, filter: 'blur(4px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Contact Info ────────────────────────────────────────────
const CONTACT_INFO = [
  { icon: Phone, label: 'Telefone', value: '(31) 99876-5432', link: 'tel:+5531998765432' },
  { icon: Mail, label: 'E-mail', value: 'contato@metaconstrutor.com.br', link: 'mailto:contato@metaconstrutor.com.br' },
  { icon: MapPin, label: 'Endereço', value: 'Belo Horizonte, MG' },
  { icon: Clock, label: 'Horário', value: 'Seg-Sex, 8h às 18h' },
];

// ─── Floating Input ──────────────────────────────────────────
function FloatingInput({ label, type = 'text', value, onChange }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;
  return (
    <div className="relative">
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full pt-6 pb-2 px-4 border-2 rounded-xl transition-all duration-200 text-base ${
          focused ? 'border-brand-orange shadow-lg shadow-orange-100' : 'border-neutral-200'
        }`}
      />
      <motion.label animate={{ y: isFloating ? -22 : 0, x: 12, scale: isFloating ? 0.75 : 1, color: focused ? '#F97316' : '#9ca3af' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-3 left-0 text-neutral-400 pointer-events-none origin-left"
      >{label}</motion.label>
    </div>
  );
}

function FloatingTextarea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;
  return (
    <div className="relative">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        rows={4}
        className={`w-full pt-6 pb-2 px-4 border-2 rounded-xl transition-all duration-200 text-base resize-none ${
          focused ? 'border-brand-orange shadow-lg shadow-orange-100' : 'border-neutral-200'
        }`}
      />
      <motion.label animate={{ y: isFloating ? -22 : 0, x: 12, scale: isFloating ? 0.75 : 1, color: focused ? '#F97316' : '#9ca3af' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-3 left-0 text-neutral-400 pointer-events-none origin-left"
      >{label}</motion.label>
    </div>
  );
}

function SuccessMessage() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="text-center py-12"
    >
      <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </motion.div>
      <h3 className="text-2xl font-bold text-brand-blue mb-2">Mensagem enviada!</h3>
      <p className="text-neutral-500">Responderemos em até 24 horas úteis.</p>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function Contato2() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-brand-blue overflow-x-hidden">
      <SEO {...seoPages.contato2} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-brand-blue via-[#162d4e] to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(249,115,22,0.12)_0%,_transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...cinematic}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange/20 text-brand-orange text-sm font-semibold mb-4 border border-brand-orange/30">
              Fale Conosco
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 font-heading">
              Vamos conversar sobre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-300">
                sua obra
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/70 max-w-2xl mx-auto">
              Tire dúvidas, peça um orçamento ou agende uma demonstração personalizada
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Form */}
            <motion.div className="lg:col-span-3"
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7 }}
            >
              <div className="bg-white rounded-2xl p-8 md:p-10 border border-neutral-200 shadow-lg">
                <AnimatePresence mode="wait">
                  {sent ? (<SuccessMessage />) : (
                    <motion.form key="form" onSubmit={handleSubmit}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="space-y-5"
                    >
                      <div className="grid sm:grid-cols-2 gap-5">
                        <FloatingInput label="Seu Nome" value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} />
                        <FloatingInput label="Seu E-mail" type="email" value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <FloatingInput label="Telefone / WhatsApp" type="tel" value={formData.phone} onChange={(v) => setFormData((p) => ({ ...p, phone: v }))} />
                        <FloatingInput label="Nome da Construtora" value={formData.company} onChange={(v) => setFormData((p) => ({ ...p, company: v }))} />
                      </div>
                      <FloatingTextarea label="Como podemos ajudar?" value={formData.message} onChange={(v) => setFormData((p) => ({ ...p, message: v }))} />
                      <Button type="submit" disabled={sending || sent}
                        className="w-full bg-brand-orange hover:bg-orange-600 text-white py-6 rounded-xl text-lg font-semibold shadow-lg shadow-brand-orange/25 hover:shadow-brand-orange/40 transition-all duration-300"
                      >
                        {sending ? (
                          <><Loader2 className="mr-2 w-5 h-5 animate-spin" />Enviando...</>
                        ) : (
                          <><Send className="mr-2 w-5 h-5" />Enviar Mensagem</>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Info Cards */}
            <motion.div className="lg:col-span-2 space-y-4" variants={staggerContainer}>
              {CONTACT_INFO.map((item) => (
                <motion.a key={item.label} href={item.link || '#'} variants={staggerItem}
                  className="block bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md hover:border-brand-orange/30 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-orange flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 font-medium uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm font-semibold text-brand-blue">{item.value}</div>
                    </div>
                  </div>
                </motion.a>
              ))}
              {/* WhatsApp */}
              <motion.div variants={staggerItem}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Fale pelo WhatsApp</h3>
                </div>
                <p className="text-sm text-emerald-100 mb-4">
                  Resposta rápida, geralmente em menos de 5 minutos em horário comercial.
                </p>
                <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-5 rounded-xl">
                  <MessageCircle className="mr-2 w-5 h-5" /> Chamar no WhatsApp
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scene — obra da obra como fundo visual */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img src="/marketing/obras-reais/estrutura-metalica-aerea.webp" alt="Obra Meta Construtor"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/80 via-brand-blue/60 to-transparent" />
        <div className="relative h-full flex items-center">
          <div className="max-w-xl mx-auto md:mx-16 px-4">
            <motion.div {...cinematic}>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-heading">
                Pronto para transformar sua obra?
              </h2>
              <p className="text-lg text-blue-100/80 mb-6">
                Mais de 1.500 obras já gerenciadas com o Meta Construtor. Comece grátis hoje.
              </p>
              <Button size="lg" className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-xl shadow-xl">
                Comece Grátis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
