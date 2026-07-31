import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { seoPages } from '@/config/seo';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { AnimatedSection } from '@/components/public/AnimatedSection';
import { AnimatedGradient } from '@/components/public/AnimatedGradient';
import LeadForm from '@/components/capture/LeadForm';
import RDOExcelSimulator from '@/components/capture/RDOExcelSimulator';
import AdminLeads from '@/components/capture/AdminLeads';
import { testimonials } from '@/components/capture/testimonials';
import { Lead } from '@/types/capture';
import {
  ArrowRight, Download, CheckCircle2, TrendingUp, HardHat, Shield,
 HelpCircle, ChevronDown, Table2, Sparkles, Clock, FileText, Image as ImageIcon,
 Cloud, Sun, Users, Building2, BarChart3, ChevronRight, Star
} from 'lucide-react';

const STORAGE_KEY = 'rdo_capture_leads';

interface CalculatorProps {
  workers: number;
  hoursPerRDO: number;
  rdosPerMonth: number;
  hourlyRate: number;
}

function RDOCalculator({ workers, hoursPerRDO, rdosPerMonth, hourlyRate }: CalculatorProps) {
  const timeInExcel = (workers * hoursPerRDO * rdosPerMonth).toFixed(0);
  const costInExcel = (parseInt(timeInExcel) * hourlyRate).toFixed(2);
  const timeInSaaS = (workers * 0.25 * rdosPerMonth).toFixed(1);
  const costInSaaS = (parseFloat(timeInSaaS) * hourlyRate * 0.4).toFixed(2);
  const hoursSaved = (parseInt(timeInExcel) - parseFloat(timeInSaaS)).toFixed(0);
  const financialSavings = (parseFloat(costInExcel) - parseFloat(costInSaaS)).toFixed(2);

  return (
    <section id="calculadora-economia" className="bg-slate-50/80 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" itemScope itemType="https://schema.org/Product">
        <meta itemProp="name" content="Calculadora de Economia RDO Meta Construtor" />
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-10">
          <span className="text-brand-orange font-bold text-xs uppercase tracking-widest font-mono">Calculadora de Produtividade</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-brand-blue tracking-tight leading-snug">
            Quanto Sua Obra Economiza Por Mês?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
            Veja abaixo a simulação comparativa entre usar planilhas manuais (Excel) e nossa automação completa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Processo Anterior */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-red-200 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-red-500 bg-red-100 text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">Processo Manual com Planilhas</span>
              <h4 className="font-extrabold font-display text-base text-brand-blue pt-1">Tempo e Custos com Excel</h4>
              <p className="text-xs text-slate-450 leading-relaxed font-sans">
                Tempo perdido redimensionando fotos, pesquisando previsão do tempo e reunindo dados para formatação final.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3 font-sans">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Tempo total consumido ao mês</span>
                <strong className="text-xl text-brand-blue tracking-tight">{timeInExcel} horas / mês</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Custo administrativo mensal estimado</span>
                <strong className="text-xl text-red-600 tracking-tight">R$ {parseFloat(costInExcel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* Com o Meta Construtor */}
          <div className="bg-gradient-to-br from-brand-blue to-slate-900 text-white border border-brand-orange/25 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-emerald-400 bg-emerald-500/10 text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full uppercase">Automação Ativa</span>
              <h4 className="font-extrabold font-display text-base text-white pt-1">Tempo e Custos com Meta Construtor</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Fotos otimizadas instantaneamente pelo celular, climatologia via GPS e preenchimento ágil sem digitar.
              </p>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-3 font-sans">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Tempo total consumido ao mês</span>
                <strong className="text-xl text-white tracking-tight">{timeInSaaS} horas / mês</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Custo operacional mensal estimado</span>
                <strong className="text-xl text-emerald-450 tracking-tight">R$ {parseFloat(costInSaaS).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* Resultado Geral */}
          <div className="md:col-span-2 bg-brand-orange/5 border-2 border-dashed border-brand-orange/25 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-md">
              <div className="inline-flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                <TrendingUp className="w-3.5 h-3.5" /> Desempenho Liberado
              </div>
              <h3 className="text-brand-blue font-black font-display text-lg tracking-tight">
                Sua Economia Geral com Automação de Diário
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Migrar para o Meta Construtor devolve tempo precioso de engenharia ao canteiro de obras.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 md:gap-8 bg-white border border-brand-orange/15 rounded-xl p-5 shadow-sm shrink-0 w-full md:w-auto font-sans">
              <div>
                <span className="text-[9.5px] text-slate-400 uppercase block font-mono">Tempo Economizado</span>
                <strong className="text-xl md:text-2xl text-brand-orange tracking-tight">{hoursSaved} horas /mês</strong>
                <p className="text-[10px] text-slate-400 mt-0.5">~{Math.round(parseInt(hoursSaved) / 8)} dias recuperados</p>
              </div>
              <div className="border-l border-slate-100 pl-5 md:pl-6">
                <span className="text-[9.5px] text-slate-400 uppercase block font-mono">Capital Economizado</span>
                <strong className="text-xl md:text-2xl text-slate-800 tracking-tight">
                  R$ {parseFloat(financialSavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <p className="text-[10px] text-slate-400 mt-0.5">Liberados todo mês</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Captura() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for header effects
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load leads from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Lead[];
    setLeads(stored);
  }, []);

  const handleLeadAdded = useCallback((lead: Lead) => {
    setLeads(prev => [...prev, lead]);
  }, []);

  const handleClearLeads = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLeads([]);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroScrollToForm = () => {
    const el = document.getElementById('captura-form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const calculatorProps = {
    workers: 14,
    hoursPerRDO: 3,
    rdosPerMonth: 22,
    hourlyRate: 45,
  };

  const features = [
    {
      icon: Shield,
      title: 'Auditoria Jurídica Trabalhista',
      desc: 'Saber exatamente quais funcionários próprios e terceirizados trabalharam em cada data do projeto. Evite passivos trabalhistas.',
    },
    {
      icon: BarChart3,
      title: 'Controle Real de Horímetros',
      desc: 'Registre quais escavadeiras e compactadores funcionaram ou ficaram ociosos, gerando gráficos de produtividade.',
    },
    {
      icon: Cloud,
      title: 'Prevenção de Atraso Climático',
      desc: 'Prove ao investidor ou fiscal do banco que a obra atrasou devido ao índice de chuvas registradas com precisão geográfica.',
    },
  ];

  const faqs = [
    {
      q: 'O modelo de Diário de Obra em Excel é mesmo gratuito?',
      a: 'Sim, o modelo em formato CSV/Excel otimizado é 100% gratuito e será enviado imediatamente por e-mail e disponibilizado para download assim que você preencher o formulário.',
    },
    {
      q: 'Qual é o cupom que recebo após o download?',
      a: 'Você receberá automaticamente o cupom <strong className="text-brand-orange">RDO-PREMIUM</strong> que lhe concede licença completa de teste para experimentar todo o ecossistema do Meta Construtor, sem custos e sem cartão de crédito.',
    },
    {
      q: 'O que é o Diário de Obra (RDO) e por que ele é obrigatório?',
      a: 'O RDO é um documento oficial que registra diariamente todas as atividades, efetivo, clima e ocorrências em um canteiro de obras. Serve como memória técnica e segurança jurídica, sendo obrigatório pelas diretrizes do CREA.',
    },
    {
      q: 'Como funciona o aplicativo móvel do Meta Construtor?',
      a: 'Com o app móvel, seu mestre-de-obras aponta o avanço físico, pessoal e anexa fotos diretamente do celular (mesmo offline). Assim que restabelecer a conexão, o PDF é gerado em segundos e compartilhado automaticamente no WhatsApp.',
    },
  ];

  return (
    <PublicLayout>
      <SEO {...seoPages.captura} />

      {/* ========== HERO SECTION ========== */}
      <section className="relative bg-brand-blue overflow-hidden">
        <AnimatedGradient className="absolute inset-0 opacity-30" as="span"> </AnimatedGradient>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Text */}
            <div className="space-y-6">
              <AnimatedSection className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-brand-orange/15 text-brand-orange border border-brand-orange/25 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Modelo Grátis de RDO
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-[1.1]">
                  Chega de Perder{' '}
                  <span className="text-brand-orange">Horas</span> no Excel
                </h1>
                <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
                  Baixe agora o modelo profissional de planilha de Diário de Obra (RDO) em Excel 
                  e descubra como o Meta Construtor automatiza tudo em 1 minuto.
                </p>
              </AnimatedSection>

              {/* CTA Buttons */}
              <AnimatedSection className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={heroScrollToForm}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-sm py-3.5 px-7 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-orange/25 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  QUERO MEU MODELO GRÁTIS
                </button>
                <button
                  onClick={() => scrollToSection('simulador')}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm py-3.5 px-7 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Table2 className="w-4 h-4" />
                  Simular Planilha Agora
                </button>
              </AnimatedSection>

              {/* Social Proof */}
              <AnimatedSection className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong className="text-white">100%</strong> gratuito</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-sans">
                  <Shield className="w-4 h-4 text-brand-orange" />
                  <span><strong className="text-white">Sem cartão</strong> de crédito</span>
                </div>
              </AnimatedSection>
            </div>

            {/* Right: Form Card */}
            <AnimatedSection className="bg-white rounded-2xl shadow-2xl shadow-brand-blue/20 p-6 sm:p-8 border border-slate-100">
              <div className="space-y-1 mb-5">
                <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono inline-flex items-center gap-1">
                  <Download className="w-3 h-3" /> Grátis — Sem Cartão
                </span>
                <h3 className="text-lg font-bold font-display text-brand-blue">
                  Receba Seu Modelo RDO Agora
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Preencha e baixe instantaneamente a planilha editável.
                </p>
              </div>
              <LeadForm onLeadAdded={handleLeadAdded} />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ========== SIMULADOR RDO ========== */}
      <section id="simulador" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="text-center max-w-3xl mx-auto space-y-2 mb-8">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest font-mono">Simulador Interativo</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-brand-blue tracking-tight">
              Teste a Planilha RDO Antes de Baixar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans">
              Interaja com o modelo completo — efetivo, equipamentos e atividades — e veja como o Meta Construtor simplifica tudo.
            </p>
          </div>
          <RDOExcelSimulator />
          <div className="text-center pt-4">
            <button
              onClick={heroScrollToForm}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-sm py-3 px-6 rounded-xl inline-flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Planilha RDO Grátis
            </button>
          </div>
        </div>
      </section>

      {/* ========== CALCULADORA ========== */}
      <RDOCalculator {...calculatorProps} />

      {/* ========== FEATURE PILLS ========== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest font-mono">Pilares da Profissionalização</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-brand-blue tracking-tight leading-snug">
              Por Que Donos de Construtoras Blindam Suas Obras?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
              RDOs não servem só para prestar contas ao cliente. Eles fornecem inteligência de cronograma e amparo jurídico.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-slate-200/40 rounded-2xl p-6 space-y-4 shadow-sm hover:-translate-y-0.5 transition-transform duration-300">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h4 className="font-extrabold font-display text-base text-brand-blue">{f.title}</h4>
                <p className="text-xs text-slate-550 leading-relaxed font-sans">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section id="depoimentos" className="bg-brand-blue py-16 sm:py-20 lg:py-24 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest font-mono">Depoimentos Reais</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
              Quem Já Migrou das Planilhas Aprovou!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl mx-auto leading-relaxed">
              Profissionais de engenharia, arquitetos, mestres de obras e gestores que saíram do Excel manual.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 9).map((t, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:bg-slate-900/75 transition-all text-xs">
                <p className="italic text-slate-300 font-sans leading-relaxed">"{t.comment}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-brand-orange/30 text-white flex items-center justify-center font-bold font-display text-[10.5px]">
                    {t.initials || t.name.slice(0, 2)}
                  </div>
                  <div className="font-sans">
                    <span className="font-extrabold text-white block text-xs">{t.name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{t.handle} • Cliente Verificado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-slate-400 font-sans font-medium">
            Engenheiros e gestores de obra usam o Meta Construtor para manter a rotina de campo organizada e documentada.
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="perguntas" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-brand-orange font-bold text-xs uppercase tracking-widest font-mono">Dúvidas Frequentes</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-brand-blue tracking-tight">
            Ainda Tem Alguma Dúvida?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed">
            Esclarecemos as principais dúvidas sobre o recebimento da planilha RDO gratuita.
          </p>
        </div>
        <div className="space-y-3 font-sans">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full text-left p-4 flex justify-between items-center outline-none cursor-pointer hover:bg-slate-50/50"
              >
                <span className="font-bold text-xs sm:text-sm text-brand-blue flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-orange shrink-0" /> {faq.q}
                </span>
                <ChevronDown className={`w-4.5 h-4.5 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-brand-orange' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="p-4 pt-0 border-t border-slate-100 text-xs text-slate-550 leading-relaxed bg-slate-50/20"
                  dangerouslySetInnerHTML={{ __html: faq.a }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========== ADMIN LEADS (modal) ========== */}
      {showAdmin && (
        <AdminLeads
          leads={leads}
          onClearLeads={handleClearLeads}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* Admin toggle - small trigger in bottom corner */}
      <button
        onClick={() => setShowAdmin(true)}
        className="fixed bottom-4 right-4 z-40 bg-slate-800 hover:bg-slate-700 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg opacity-40 hover:opacity-100 transition-all cursor-pointer"
        title="Admin - Visualizar Leads Capturados"
      >
        {leads.length} leads
      </button>

      {/* ========== STRUCTURED DATA ========== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Modelo RDO em Excel - Meta Construtor',
            description: 'Planilha gratuita de Diário de Obra (RDO) em Excel para construtoras. Automatize seus relatórios diários.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock' },
          }),
        }}
      />
    </PublicLayout>
  );
}
