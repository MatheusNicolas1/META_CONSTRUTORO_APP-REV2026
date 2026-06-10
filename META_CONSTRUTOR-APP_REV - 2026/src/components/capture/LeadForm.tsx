import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/capture';
import { Download, Loader2, CheckCircle2, AlertCircle, ChevronDown, HelpCircle } from 'lucide-react';

const STORAGE_KEY = 'rdo_capture_leads';

// Generate CSV template content
function generateCSVTemplate(name: string): string {
  const headers = [
    'DATA',
    'EFETIVO',
    'EQUIPAMENTOS',
    'ATIVIDADES',
    'CLIMA',
    'PERIODO',
    'OBSERVACOES',
    'ENGENHEIRO',
    'OBRA'
  ].join(';');

  const example = [
    new Date().toLocaleDateString('pt-BR'),
    'Pedreiro(4), Servente(6), Eletricista(1)',
    'Betoneira 400L(1), Andaime(12)',
    'Concretagem laje 2º pav. - 65%',
    'Sol - 28°C',
    'Integral (07h às 17h)',
    'Recebimento de 15m³ de brita às 10h.',
    name || 'Engenheiro Responsável',
    'Edifício Comercial - Obra 001'
  ].join(';');

  return `\uFEFF${headers}\n${example}`;
}

interface LeadFormProps {
  onLeadAdded: (lead: Lead) => void;
}

export default function LeadForm({ onLeadAdded }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  // Format WhatsApp as user types
  const handleWhatsAppChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 2) {
      setWhatsapp(`(${cleaned}`);
    } else if (cleaned.length <= 7) {
      setWhatsapp(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`);
    } else {
      setWhatsapp(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`);
    }
  }, []);

  const downloadCSV = useCallback(() => {
    const csvContent = generateCSVTemplate(name);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDO_Modelo_Obra_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [name]);

  const saveToSupabase = async (lead: Lead) => {
    try {
      const { error: supabaseError } = await supabase.from('leads').insert({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        whatsapp: lead.whatsapp,
        role: lead.role,
        company_size: lead.companySize,
      });
      if (supabaseError) throw supabaseError;
      return true;
    } catch (err) {
      console.warn('Supabase insert failed, using localStorage fallback:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !whatsapp.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!agreeTerms) {
      setError('Você precisa concordar com os termos para receber o modelo.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    setIsLoading(true);

    const newLead: Lead = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      role,
      companySize,
      timestamp: new Date().toISOString(),
      downloadCount: 1,
    };

    // Try Supabase first, fallback to localStorage
    const savedToDB = await saveToSupabase(newLead);

    // Always save to localStorage as backup
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Lead[];
    stored.push(newLead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    onLeadAdded(newLead);

    // Trigger CSV download
    downloadCSV();

    setIsSuccess(true);
    setIsLoading(false);

    // Countdown redirect
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center space-y-4 shadow-lg shadow-emerald-500/5">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold font-display text-slate-900">
            Modelo RDO Enviado! 🎉
          </h3>
          <p className="text-sm text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
            O download do seu modelo de planilha RDO em Excel já foi iniciado. 
            Verifique também seu e-mail <strong className="text-brand-orange">{email}</strong>.
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-400 font-sans space-y-1">
          <p className="font-semibold text-slate-600">🎁 Bônus liberados automaticamente:</p>
          <p>✅ Cupom <strong className="text-brand-orange">RDO-PREMIUM</strong> — Teste grátis do Meta Construtor</p>
          <p>✅ Planilha RDO em CSV/Excel editável</p>
          <p>✅ Acesso ao simulador interativo de produtividade</p>
        </div>
        <p className="text-xs text-slate-400 font-sans">
          Redirecionando em {countdown}s...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 font-sans block">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 text-slate-800 placeholder:text-slate-400 transition-all"
            required
          />
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 font-sans block">
            Melhor E-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com.br"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 text-slate-800 placeholder:text-slate-400 transition-all"
            required
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 font-sans block">
            WhatsApp / Celular <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={e => handleWhatsAppChange(e.target.value)}
            placeholder="(11) 99999-8888"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 text-slate-800 placeholder:text-slate-400 transition-all"
            required
          />
        </div>

        {/* Cargo */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 font-sans block">Cargo / Função</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 text-slate-700 cursor-pointer appearance-none transition-all"
          >
            <option value="">Selecione seu cargo</option>
            <option value="Proprietário / Sócio">Proprietário / Sócio</option>
            <option value="Engenheiro Residente">Engenheiro Residente</option>
            <option value="Arquiteto / Técnico">Arquiteto / Técnico</option>
            <option value="Mestre / Supervisor">Mestre / Supervisor</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>

      {/* Porte da empresa */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 font-sans block">Porte da Construtora</label>
        <select
          value={companySize}
          onChange={e => setCompanySize(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 text-slate-700 cursor-pointer appearance-none transition-all"
        >
          <option value="">Selecione o porte</option>
          <option value="Micro (1 obra)">Micro (1 obra simultânea)</option>
          <option value="Pequena (2-3 obras)">Pequena (2 a 3 obras)</option>
          <option value="Média (4-8 obras)">Média (4 a 8 obras)</option>
          <option value="Grande (9+ obras)">Grande (9 ou mais obras)</option>
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700 font-sans">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={e => setAgreeTerms(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/20 cursor-pointer accent-brand-orange"
        />
        <span className="text-xs text-slate-500 font-sans leading-relaxed group-hover:text-slate-700 transition-colors">
          Ao enviar, concordo em receber o modelo gratuito de RDO em Excel e comunicações do Meta Construtor. 
          Seus dados estão seguros conforme nossa{' '}
          <a href="/legal/privacidade" target="_blank" className="text-brand-orange underline underline-offset-2 hover:text-brand-orange/80">
            Política de Privacidade
          </a>.
        </span>
      </label>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-orange/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparando seu modelo...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            QUERO MEU MODELO RDO GRÁTIS
          </>
        )}
      </button>
    </form>
  );
}
