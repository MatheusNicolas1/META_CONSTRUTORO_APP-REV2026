import { useState } from 'react';
import { RDOWorkerRow, RDOEquipmentRow, RDOActivityRow } from '@/types/capture';
import { CloudRain, Sun, Cloud, HardHat, FileText, CheckCircle2, AlertCircle, Sparkles, Table2, Layers } from 'lucide-react';

export default function RDOExcelSimulator() {
  const [activeTab, setActiveTab] = useState<'efetivo' | 'equipamentos' | 'atividades'>('efetivo');
  const [weather, setWeather] = useState<'Sol' | 'Chuva' | 'Nublado'>('Sol');
  const [period, setPeriod] = useState<'Manhã' | 'Tarde' | 'Integral'>('Integral');
  const [isSaaSComparisonActive, setIsSaaSComparisonActive] = useState(false);

  const [workers, setWorkers] = useState<RDOWorkerRow[]>([
    { id: '1', role: 'Encarregado Geral', quantity: 1, hours: 8, totalHours: 8 },
    { id: '2', role: 'Pedreiro', quantity: 4, hours: 8, totalHours: 32 },
    { id: '3', role: 'Servente', quantity: 6, hours: 8, totalHours: 48 },
    { id: '4', role: 'Eletricista', quantity: 1, hours: 4, totalHours: 4 },
    { id: '5', role: 'Pintor', quantity: 2, hours: 8, totalHours: 16 },
  ]);

  const [equipments, setEquipments] = useState<RDOEquipmentRow[]>([
    { id: '1', name: 'Betoneira 400L', quantity: 1, status: 'Operacional', hoursWorked: 6 },
    { id: '2', name: 'Andaime Fachadeiro', quantity: 12, status: 'Operacional', hoursWorked: 8 },
    { id: '3', name: 'Compactador de Solo', quantity: 1, status: 'Parado', hoursWorked: 0 },
    { id: '4', name: 'Serra Circular de Bancada', quantity: 1, status: 'Operacional', hoursWorked: 4 },
  ]);

  const [activities, setActivities] = useState<RDOActivityRow[]>([
    { id: '1', description: 'Concretagem da laje do 2º pavimento', team: 'Equipe de Estrutura', status: 'Em Andamento', progress: 65 },
    { id: '2', description: 'Instalação elétrica de conduítes e caixas', team: 'Equipe de Instalações', status: 'Em Andamento', progress: 40 },
    { id: '3', description: 'Regularização e contrapiso do 1º andar', team: 'Acabamentos', status: 'Concluído', progress: 100 },
    { id: '4', description: 'Impermeabilização de banheiros', team: 'Acabamentos', status: 'Não Iniciado', progress: 0 },
  ]);

  const [generalComment, setGeneralComment] = useState('Início dos trabalhos sem imprevistos. Recebimento de material às 10:00 (15m³ de brita).');

  const updateWorkerQty = (id: string, qty: number) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === id) {
        const safeQty = Math.max(0, qty);
        return { ...w, quantity: safeQty, totalHours: safeQty * w.hours };
      }
      return w;
    }));
  };

  const updateWorkerHours = (id: string, hrs: number) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === id) {
        const safeHrs = Math.max(0, Math.min(24, hrs));
        return { ...w, hours: safeHrs, totalHours: w.quantity * safeHrs };
      }
      return w;
    }));
  };

  const updateEquipmentHrs = (id: string, hrs: number) => {
    setEquipments(prev => prev.map(e => {
      if (e.id === id) {
        const safeHrs = Math.max(0, Math.min(24, hrs));
        return { ...e, hoursWorked: safeHrs, status: safeHrs > 0 ? 'Operacional' : 'Parado' };
      }
      return e;
    }));
  };

  const toggleActivityStatus = (id: string) => {
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        if (act.status === 'Concluído') return { ...act, status: 'Em Andamento', progress: 50 };
        if (act.status === 'Em Andamento') return { ...act, status: 'Não Iniciado', progress: 0 };
        return { ...act, status: 'Concluído', progress: 100 };
      }
      return act;
    }));
  };

  const totalEfetivo = workers.reduce((sum, w) => sum + w.quantity, 0);
  const totalHH = workers.reduce((sum, w) => sum + w.totalHours, 0);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 p-6 text-slate-800 border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-5 border-b border-slate-200 gap-3">
        <div>
          <span className="bg-brand-orange/10 text-brand-orange px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" /> Simulador de Planilha
          </span>
          <h3 className="text-xl font-bold font-display text-brand-blue flex items-center gap-2">
            <Table2 className="w-5 h-5 text-brand-orange" /> Planilha RDO Gratuita
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Preencha os campos abaixo de forma interativa para simular o uso real no Excel.
          </p>
        </div>
        <button
          onClick={() => setIsSaaSComparisonActive(!isSaaSComparisonActive)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer uppercase tracking-wider ${
            isSaaSComparisonActive
              ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20 border border-brand-orange scale-102'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {isSaaSComparisonActive ? 'Ver Planilha Excel' : 'Ver no Meta Construtor ⚡'}
        </button>
      </div>

      {!isSaaSComparisonActive ? (
        <div className="space-y-4">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
            <div className="space-y-2 p-1">
              <span className="text-slate-500 text-[10px] uppercase block tracking-wider font-bold">Clima na Obra:</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setWeather('Sol')}
                  className={`p-1 rounded flex items-center justify-center cursor-pointer transition-all ${weather === 'Sol' ? 'bg-amber-100 text-amber-850 border border-amber-300 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Sun className="w-4 h-4" />
                </button>
                <button onClick={() => setWeather('Nublado')}
                  className={`p-1 rounded flex items-center justify-center cursor-pointer transition-all ${weather === 'Nublado' ? 'bg-blue-100 text-blue-800 border border-blue-250' : 'text-slate-400 hover:text-slate-600'}`}>
                  <Cloud className="w-4 h-4" />
                </button>
                <button onClick={() => setWeather('Chuva')}
                  className={`p-1 rounded flex items-center justify-center cursor-pointer transition-all ${weather === 'Chuva' ? 'bg-indigo-100 text-indigo-800 border border-indigo-250' : 'text-slate-400 hover:text-slate-600'}`}>
                  <CloudRain className="w-4 h-4" />
                </button>
                <span className="text-slate-800 ml-1 text-xs font-sans font-semibold">{weather}</span>
              </div>
            </div>
            <div className="space-y-2 p-1">
              <span className="text-slate-500 text-[10px] uppercase block tracking-wider font-bold">Período:</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-white text-slate-800 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-orange w-full">
                <option value="Integral">Integral</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
              </select>
            </div>
            <div className="p-1 border-l border-slate-200 pl-3">
              <span className="text-slate-500 text-[10px] uppercase block tracking-wider font-bold">Efetivo Total:</span>
              <p className="text-lg font-bold text-brand-blue font-sans mt-0.5 flex items-center gap-1">
                <HardHat className="w-4 h-4 text-brand-orange inline" /> {totalEfetivo} <span className="text-[10px] font-normal text-slate-500">Pessoas</span>
              </p>
            </div>
            <div className="p-1 border-l border-slate-200 pl-3">
              <span className="text-slate-500 text-[10px] uppercase block tracking-wider font-bold">Horas Homem (H.H.):</span>
              <p className="text-lg font-bold text-slate-800 font-sans mt-0.5">{totalHH} <span className="text-[10px] font-normal text-slate-500">Horas</span></p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 shrink-0 text-xs gap-1">
            {(['efetivo', 'equipamentos', 'atividades'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 cursor-pointer outline-none transition-all font-semibold border-b-2 flex items-center gap-1.5 ${
                  activeTab === tab ? 'border-brand-orange text-brand-orange bg-slate-50 rounded-t-lg font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {tab === 'efetivo' && <HardHat className="w-3.5 h-3.5" />}
                {tab === 'equipamentos' && <FileText className="w-3.5 h-3.5" />}
                {tab === 'atividades' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {tab === 'efetivo' ? '1. Efetivo de Pessoal' : tab === 'equipamentos' ? '2. Equipamentos Utilizados' : '3. Atividades & Checklists'}
              </button>
            ))}
          </div>

          {/* TAB 1: EFETIVO */}
          {activeTab === 'efetivo' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 font-mono">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-sans tracking-wide">
                    <th className="px-3 py-2 font-bold">Função / Categoria</th>
                    <th className="px-3 py-2 w-32 text-center font-bold">Quant.</th>
                    <th className="px-3 py-2 w-28 text-center font-bold">Horas p/ dia</th>
                    <th className="px-3 py-2 w-28 text-right font-bold">H.H Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {workers.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 font-sans font-semibold text-slate-800">{w.role}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center items-center gap-1.5">
                          <button onClick={() => updateWorkerQty(w.id, w.quantity - 1)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded w-5 h-5 flex items-center justify-center font-bold text-[13px] text-slate-755 cursor-pointer">-</button>
                          <input type="number" value={w.quantity || ''} onChange={(e) => updateWorkerQty(w.id, parseInt(e.target.value) || 0)}
                            className="w-10 bg-white border border-slate-250 rounded px-1 py-0.5 text-xs text-center font-bold text-brand-orange outline-none focus:border-brand-orange" />
                          <button onClick={() => updateWorkerQty(w.id, w.quantity + 1)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded w-5 h-5 flex items-center justify-center font-bold text-[13px] text-slate-755 cursor-pointer">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input type="number" value={w.hours || ''} onChange={(e) => updateWorkerHours(w.id, parseInt(e.target.value) || 0)}
                          className="w-12 bg-white border border-slate-250 rounded px-1.5 py-0.5 text-xs text-center outline-none focus:border-brand-orange font-sans font-semibold text-slate-700" />
                      </td>
                      <td className="px-3 py-3 text-right font-sans font-semibold text-slate-800">{w.totalHours} hrs</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-sans border-t-2 border-slate-250 font-bold text-slate-800">
                    <td className="px-3 py-3 text-slate-700">Total Geral de Efetivo</td>
                    <td className="px-3 py-3 text-center text-brand-orange font-mono text-sm">{totalEfetivo} colab.</td>
                    <td className="px-3 py-3 text-center text-slate-400">—</td>
                    <td className="px-3 py-3 text-right text-slate-900 font-mono text-sm">{totalHH} hrs</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 bg-brand-orange/5 border border-brand-orange/10 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-650 font-sans leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Problema no Excel Manual:</strong>
                  Soma de Horas Homem (H.H.) requer fórmulas repetitivas. Se um funcionário for desligado ou cadastrado incorretamente, a planilha quebra.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPAMENTOS */}
          {activeTab === 'equipamentos' && (
            <div className="space-y-3">
              <table className="w-full text-left text-xs text-slate-800 font-mono">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-sans tracking-wide">
                    <th className="px-3 py-2 font-bold">Equipamento</th>
                    <th className="px-3 py-2 text-center w-24 font-bold">Quant.</th>
                    <th className="px-3 py-2 text-center w-28 font-bold">Status</th>
                    <th className="px-3 py-2 text-right w-28 font-bold">Horas Trab.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {equipments.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 font-sans font-semibold text-slate-800">{eq.name}</td>
                      <td className="px-3 py-3 text-center text-slate-755 font-sans">{eq.quantity}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase tracking-wider border ${
                          eq.status === 'Operacional' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>{eq.status}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input type="number" value={eq.hoursWorked || 0} onChange={(ev) => updateEquipmentHrs(eq.id, parseInt(ev.target.value) || 0)}
                          className="w-12 bg-white border border-slate-250 rounded px-1.5 py-0.5 text-xs text-center outline-none focus:border-brand-orange font-bold text-slate-800" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 bg-brand-orange/5 border border-brand-orange/10 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-650 font-sans leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Deficiência Crônica no Excel:</strong>
                  Lançar horas de betoneira e caminhões no Excel é lento. Gerentes esquecem de apurar o horímetro, gerando locações desnecessárias.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ATIVIDADES */}
          {activeTab === 'atividades' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">Atividades Executadas:</span>
                <div className="space-y-2">
                  {activities.map(act => (
                    <div key={act.id} onClick={() => toggleActivityStatus(act.id)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1 rounded-full transition-colors ${
                          act.status === 'Concluído' ? 'bg-green-105 text-green-700' :
                          act.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-350 border border-slate-300'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-sans font-semibold text-slate-800 ${act.status === 'Concluído' ? 'line-through text-slate-400' : ''}`}>
                            {act.description}
                          </p>
                          <span className="text-[10px] text-slate-400 font-sans">{act.team}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-sans px-2.5 py-0.5 rounded-full font-bold border ${
                        act.status === 'Concluído' ? 'bg-green-50 text-green-700 border-green-200' :
                        act.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-450 border-slate-200'
                      }`}>{act.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Observações Gerais / Ocorrências:</label>
                <textarea value={generalComment} onChange={(e) => setGeneralComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-850 font-sans outline-none focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 h-16 resize-none"
                  placeholder="Registre visitas técnicas, ocorrências, imprevistos..." />
              </div>
              <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-650 font-sans leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Problema Crítico de Fotos no Excel:</strong>
                  Anexar fotos exige baixá-las do celular, redimensionar... se a planilha for pesada, ela trava.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SAAS VIEW */
        <div className="space-y-4 animate-fade-in text-slate-700">
          <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-sans">
              <span className="font-bold text-slate-900 block">Como funciona no Meta Construtor?</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Elimine o preenchimento manual de planilhas de obra, substituindo por relatórios digitais profissionais em apenas 1 minuto!
              </p>
            </div>
          </div>
          <div className="bg-brand-blue rounded-2xl p-5 font-sans space-y-4 shadow-lg text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-extrabold tracking-wide uppercase text-slate-200">Relatório de Obra Oficial</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-bold">RDO Aprovado</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl space-y-1 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Clima Inteligente</span>
                <p className="text-white font-semibold flex items-center gap-1.5"><Sun className="w-4 h-4 text-amber-300" /> Sol Intenso (28°C)</p>
                <span className="text-[9px] text-slate-400 block">Sincronizado via GPS</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl space-y-1 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Efetivo de Obra</span>
                <p className="text-white font-semibold flex items-center gap-1.5"><HardHat className="w-4 h-4 text-brand-orange" /> {totalEfetivo} Colaboradores</p>
                <span className="text-[9px] text-slate-400 block">Coleta automática via app</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl space-y-1 border border-white/10 col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Esforço Poupado</span>
                <p className="font-bold text-emerald-400 flex items-center gap-1">⚡ 28 Minutos economizados</p>
                <span className="text-[9px] text-slate-400 block">Lançado em 1 clique</span>
              </div>
            </div>
            <div className="space-y-2 pt-1 font-sans">
              <span className="text-[10px] text-slate-350 uppercase tracking-wider block font-bold">Progresso Físico em Tempo Real:</span>
              <div className="space-y-2">
                {activities.slice(0, 3).map(act => (
                  <div key={act.id} className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-white">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white font-semibold text-xs">{act.description}</span>
                      <span className="text-emerald-300 font-bold font-mono">{act.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${act.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#15C370]/10 border border-[#15C370]/25 rounded-xl p-3 flex justify-between items-center text-xs">
              <div className="space-y-0.5 text-[#15C370]">
                <p className="font-extrabold text-[11px] text-white">Notificação para Diretoria e Clientes</p>
                <p className="text-[10px] text-slate-200">O relatório em PDF é enviado automaticamente!</p>
              </div>
              <button onClick={() => alert('Simulando exportação via WhatsApp do Relatório PDF da Obra!')}
                className="bg-[#15C370] hover:bg-[#12a961] text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-[10px] shadow-sm uppercase">
                Enviar PDF
              </button>
            </div>
          </div>
          <div className="text-center font-sans space-y-1">
            <p className="text-xs text-slate-500">Mais de <strong className="text-slate-800">450 construtoras</strong> já migraram do Excel para o Meta Construtor.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-5 pt-4 border-t border-slate-200 select-none">
        <span>RDO_Modelo_Excel_2026.xlsx</span>
        <span className="text-emerald-600 flex items-center gap-1 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Planilha Ativa
        </span>
      </div>
    </div>
  );
}
