import { useState } from 'react';
import { Lead } from '@/types/capture';
import { Search, Filter, Download, Users, X, RefreshCw } from 'lucide-react';

interface AdminLeadsProps {
  leads: Lead[];
  onClearLeads: () => void;
  onClose: () => void;
}

export default function AdminLeads({ leads, onClearLeads, onClose }: AdminLeadsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.whatsapp.includes(searchQuery);
    const matchesFilter = roleFilter === '' || lead.role === roleFilter;
    return matchesSearch && matchesFilter;
  });

  const downloadLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Nome', 'Email', 'WhatsApp/Celular', 'Funcao/Cargo', 'Volume de Obras', 'Data da Captura'];
    const rows = [
      ['META CONSTRUTOR - BASE DE LEADS DE CAPTURA RDO EXCEL'],
      ['Gerado em:', new Date().toLocaleString('pt-BR')],
      [],
      headers,
      ...leads.map(l => [l.id, l.name, l.email, l.whatsapp, l.role, l.companySize, l.timestamp]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leads_Captura_RDO_MetaConstrutor_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col border border-slate-100 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-brand-blue text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange/20 rounded-xl border border-brand-orange/30">
              <Users className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Painel de Leads Capturados</h2>
              <p className="text-xs text-slate-400 font-sans">
                Monitore, gerencie e exporte os leads capturados pela página de RDO.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-sans text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
          >
            <X className="w-4 h-4" /> Fechar
          </button>
        </div>

        {/* Stats */}
        <div className="bg-slate-50 border-b border-slate-200/60 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider font-mono">Total de Leads</span>
            <p className="text-2xl font-black font-display text-brand-orange mt-0.5">{leads.length}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider font-mono">Conversão Média</span>
            <p className="text-2xl font-black font-display text-emerald-500 mt-0.5">34.2%</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, email, fone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-brand-orange text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs outline-none focus:border-brand-orange cursor-pointer text-slate-700"
            >
              <option value="">Filtro: Cargos (Ver todos)</option>
              <option value="Proprietário / Sócio">Sócio Construtor</option>
              <option value="Engenheiro Residente">Engenheiro Civil</option>
              <option value="Arquiteto / Técnico">Arquiteto / Técnico</option>
              <option value="Mestre / Supervisor">Mestre de Obras</option>
              <option value="Outro">Outro segmento</option>
            </select>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={downloadLeadsCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar (CSV)
            </button>
            <button
              onClick={onClearLeads}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
        </div>

        {/* Lead Table */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-sans text-sm">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Nenhum lead capturado ainda.</p>
              <p className="text-xs mt-1">Preencha o formulário acima para começar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-brand-orange/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 font-sans">{lead.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400 font-sans mt-0.5">
                      <span>{lead.email}</span>
                      <span>{lead.whatsapp}</span>
                      {lead.role && <span className="text-brand-orange">{lead.role}</span>}
                      {lead.companySize && <span>{lead.companySize}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(lead.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
