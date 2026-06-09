import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  MessageCircle,
  Headphones,
  FileText,
  CheckCheck,
  Mic,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Tipos de mensagem ──────────────────────────

type Message = {
  id: number;
  from: 'user' | 'bot';
  type: 'text' | 'audio' | 'file';
  text?: string;
  time: string;
};

// ─── Dados da simulação ─────────────────────────

const whatsappMessages: Message[] = [
  { id: 1, from: 'user', type: 'text', text: 'Bom dia! Preciso do RDO da obra 104 de hoje.', time: '08:32' },
  { id: 2, from: 'bot', type: 'text', text: 'Olá! Um momento que vou buscar o RDO para você. 📋', time: '08:32' },
  { id: 3, from: 'bot', type: 'file', text: 'RDO-2026-06-07.pdf — Diário de Obra', time: '08:33' },
  { id: 4, from: 'bot', type: 'audio', text: 'Resumo do RDO — 1:23 min', time: '08:33' },
  { id: 5, from: 'user', type: 'text', text: 'Perfeito, obrigado! Envia também o checklist?', time: '08:35' },
  { id: 6, from: 'bot', type: 'file', text: 'CHECKLIST-2026-06-07.pdf — Qualidade', time: '08:35' },
];

// ─── Componentes das bolhas ─────────────────────

function UserBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-[#dcf8c6] text-neutral-800 text-sm sm:text-base rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="leading-relaxed">{text}</p>
        </div>
        <div className="flex justify-end items-center gap-1 mt-0.5 pr-1">
          <span className="text-[10px] text-neutral-400">{time}</span>
          <CheckCheck className="w-3 h-3 text-blue-500" />
        </div>
      </div>
    </div>
  );
}

function BotBubble({ type, text, time }: { type: 'text' | 'audio' | 'file'; text: string; time: string }) {
  return (
    <div className="flex mb-3">
      {/* Avatar do bot */}
      <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 shadow-sm">
        <MessageCircle className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className="bg-white text-neutral-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-neutral-100">
          {type === 'text' && (
            <p className="text-sm sm:text-base leading-relaxed">{text}</p>
          )}
          {type === 'audio' && (
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                {/* Waveform visual animada */}
                <div className="flex items-center gap-[3px] h-6">
                  {[2, 4, 3, 6, 5, 7, 4, 3, 5, 2].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-brand-orange rounded-full"
                      animate={{ height: [h * 2, h * 3, h * 2] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">{text}</p>
              </div>
            </div>
          )}
          {type === 'file' && (
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="w-9 h-9 rounded-lg bg-brand-orange/5 border border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{text}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-brand-emerald flex items-center justify-center">
                    <CheckCheck className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-[10px] text-neutral-400">Entregue ✓</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 pl-1">
          <span className="text-[10px] text-neutral-400">{time}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Indicador "Digitando..." ───────────────────

function TypingIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex mb-3">
      <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0 mr-2 shadow-sm">
        <MessageCircle className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-neutral-100">
        <div className="flex gap-1.5">
          <motion.div
            className="w-2 h-2 bg-neutral-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-neutral-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.div
            className="w-2 h-2 bg-neutral-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Seção principal ────────────────────────────

export function WhatsAppDemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);

  // Animação de revelação das mensagens
  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const showNext = () => {
      if (i >= whatsappMessages.length) {
        setAutoScroll(false);
        return;
      }
      const msg = whatsappMessages[i];

      // Mostra indicador "digitando" antes da msg do bot
      if (msg.from === 'bot') {
        setShowTyping(true);
      }

      const delay = msg.from === 'bot' ? 1200 : 600;

      timers.push(setTimeout(() => {
        setShowTyping(false);
        setVisibleMessages(prev => prev + 1);
        setAutoScroll(true);
        i++;
        setTimeout(() => setAutoScroll(false), 300);
        timers.push(setTimeout(showNext, msg.from === 'user' ? 1000 : 800));
      }, msg.from === 'bot' ? 1200 : 600));
    };

    showNext();
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [autoScroll, visibleMessages, showTyping]);

  return (
    <section ref={ref} className="py-10 md:py-20 bg-white overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header da seção */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <MessageCircle className="w-3.5 h-3.5" /> Assistente Inteligente
          </span>
          <h2 className="text-[clamp(1.75rem,5vw,3rem)] md:text-[clamp(2rem,4vw,3.75rem)] font-extrabold mt-3 mb-4 leading-tight text-neutral-900">
            Sua obra no{' '}
            <span className="text-brand-orange">WhatsApp</span>
          </h2>
          <p className="text-neutral-600 text-[clamp(0.9rem,2.5vw,1.125rem)] max-w-2xl mx-auto px-2">
            O Meta Construtor responde por voz e envia documentos direto no WhatsApp. Faça perguntas, peça relatórios e receba tudo em segundos.
          </p>
        </motion.div>

        {/* Grid: 2 colunas — celular WhatsApp + cards de funcionalidades */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-10 max-w-5xl mx-auto">
          {/* Coluna 1-3: Simulação do WhatsApp */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* Moldura de celular */}
            <div className="mx-auto max-w-[360px]">
              <div className="bg-white rounded-[28px] shadow-2xl border-4 border-neutral-800 overflow-hidden">
                {/* Top bar do WhatsApp */}
                <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">Meta Construtor</p>
                      <p className="text-[10px] text-white/70">online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-white/70" />
                    <Clock className="w-4 h-4 text-white/70" />
                  </div>
                </div>

                {/* Área de mensagens */}
                <div
                  ref={scrollRef}
                  className="bg-[#efeae2] h-[420px] overflow-y-auto px-3 py-3"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  }}
                >
                  {/* Header do chat */}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-1 bg-white/80 rounded-full px-4 py-1.5 shadow-sm">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span className="text-[10px] text-neutral-500 font-medium">Mensagens criptografadas</span>
                    </div>
                  </div>

                  {/* Mensagens */}
                  {whatsappMessages.slice(0, visibleMessages).map((msg) =>
                    msg.from === 'user' ? (
                      <UserBubble key={msg.id} text={msg.text!} time={msg.time} />
                    ) : (
                      <BotBubble key={msg.id} type={msg.type} text={msg.text!} time={msg.time} />
                    )
                  )}

                  {/* Indicador de digitação */}
                  <TypingIndicator active={showTyping && visibleMessages < whatsappMessages.length} />
                </div>

                {/* Input bar do WhatsApp */}
                <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-neutral-400 border border-neutral-200">
                    Digite uma mensagem...
                  </div>
                  <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-neutral-400 mt-3">
                Demonstração interativa — as mensagens aparecem automaticamente
              </p>
            </div>
          </motion.div>

          {/* Coluna 4-5: Cards descritivos */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2 flex flex-col gap-4 justify-center"
          >
            {/* Card: Resposta por áudio */}
            <div className="bg-gradient-to-br from-brand-orange/5 to-white border border-brand-orange/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Resposta por áudio</h3>
                  <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                    O bot responde com um resumo de áudio do RDO, checklist ou relatório. A mão de obra fica livre para ouvir enquanto trabalha.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-100 p-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[3, 5, 4, 7, 6, 4].map((h, i) => (
                    <div key={i} className="w-[3px] bg-brand-orange rounded-full" style={{ height: h * 3 }} />
                  ))}
                </div>
                <span className="text-xs text-neutral-500">Resumo do RDO • 1:23 min</span>
              </div>
            </div>

            {/* Card: Envio de PDF */}
            <div className="bg-gradient-to-br from-brand-emerald/5 to-white border border-brand-emerald/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-emerald" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Envio de documentos</h3>
                  <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                    Peça qualquer documento — RDO, checklist, relatório, contrato — e o bot entrega o PDF na hora. Pronto para assinar ou compartilhar.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-100 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-emerald/5 border border-brand-emerald/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-emerald" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-800 truncate">RDO-2026-06-07.pdf</p>
                  <p className="text-[10px] text-neutral-400">PDF • 245 KB</p>
                </div>
                <CheckCheck className="w-4 h-4 text-brand-emerald" />
              </div>
            </div>

            {/* Card: Todas as integrações */}
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">+ Integrações diretas</h3>
                  <p className="text-xs text-neutral-500">Relatórios, fotos, notificações</p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                O WhatsApp Bot faz parte do ecossistema Meta Construtor. Consulte saldos, prazos, equipes e muito mais sem sair do chat.
              </p>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-center mt-10"
        >
          <Button
            className="bg-brand-orange hover:bg-brand-orange-hover text-white rounded-full px-8 py-6 text-base shadow-lg shadow-brand-orange/25"
            asChild
          >
            <Link to="/criar-conta">
              Testar o assistente <MessageCircle className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Import missing from lucide-react
function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default WhatsAppDemoSection;
