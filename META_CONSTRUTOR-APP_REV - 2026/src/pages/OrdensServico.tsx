import React, { useState } from "react";
import { useOrdensServico } from "@/hooks/useOrdensServico";
import { Loader2, ClipboardList, Play, Check, AlertTriangle } from "lucide-react";

export default function OrdensServico() {
  const [obraId, setObraId] = useState("");
  const { isLoading, ordens, createOS, updateStatus } = useOrdensServico(obraId || undefined);

  const [nova, setNova] = useState({ obra_id: "", titulo: "", descricao: "", data_limite: "", prioridade: "media", responsavel_nome: "" });

  const statusColor = (s: string) => {
    const map: Record<string, string> = { PENDENTE: 'bg-yellow-100 text-yellow-800', EM_ANDAMENTO: 'bg-blue-100 text-blue-800', CONCLUIDA: 'bg-green-100 text-green-800', BLOQUEADA: 'bg-red-100 text-red-800', CANCELADA: 'bg-gray-100 text-gray-600', APROVADA: 'bg-emerald-100 text-emerald-800' };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <p className="mt-1 text-gray-600">Crie e acompanhe ordens de serviço por obra.</p>
      </div>

      <input className="rounded-xl border border-border bg-card p-2 text-sm w-full max-w-sm" placeholder="ID da obra" value={obraId} onChange={e => setObraId(e.target.value)} />

      {/* Criar OS */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">Nova Ordem de Serviço</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input className="rounded-xl border p-2 text-sm" placeholder="ID da obra *" value={nova.obra_id} onChange={e => setNova(p => ({...p, obra_id: e.target.value}))} />
          <input className="rounded-xl border p-2 text-sm" placeholder="Título *" value={nova.titulo} onChange={e => setNova(p => ({...p, titulo: e.target.value}))} />
          <input className="rounded-xl border p-2 text-sm" placeholder="Descrição" value={nova.descricao} onChange={e => setNova(p => ({...p, descricao: e.target.value}))} />
          <input className="rounded-xl border p-2 text-sm" type="date" value={nova.data_limite} onChange={e => setNova(p => ({...p, data_limite: e.target.value}))} />
          <select className="rounded-xl border p-2 text-sm" value={nova.prioridade} onChange={e => setNova(p => ({...p, prioridade: e.target.value}))}>
            <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option>
          </select>
          <input className="rounded-xl border p-2 text-sm" placeholder="Responsável" value={nova.responsavel_nome} onChange={e => setNova(p => ({...p, responsavel_nome: e.target.value}))} />
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!nova.obra_id || !nova.titulo} onClick={() => { createOS.mutate(nova as any); setNova({ obra_id: "", titulo: "", descricao: "", data_limite: "", prioridade: "media", responsavel_nome: "" }); }}>Criar OS</button>
        </div>
      </section>

      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="space-y-2">
          {ordens.map((os: any) => (
            <div key={os.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-semibold">{os.titulo} <span className="text-xs text-gray-500">({os.numero})</span></p>
                <p className="text-xs text-gray-500">{os.descricao} • Limite: {os.data_limite}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(os.status)}`}>{os.status}</span>
                {os.status === 'PENDENTE' && <button className="rounded-lg p-1 text-blue-600 hover:bg-blue-50" title="Iniciar" onClick={() => updateStatus.mutate({ id: os.id, status: 'EM_ANDAMENTO' })}><Play className="h-4 w-4"/></button>}
                {os.status === 'EM_ANDAMENTO' && <button className="rounded-lg p-1 text-green-600 hover:bg-green-50" title="Concluir" onClick={() => updateStatus.mutate({ id: os.id, status: 'CONCLUIDA' })}><Check className="h-4 w-4"/></button>}
                {(os.status === 'PENDENTE' || os.status === 'EM_ANDAMENTO') && <button className="rounded-lg p-1 text-red-600 hover:bg-red-50" title="Bloquear" onClick={() => updateStatus.mutate({ id: os.id, status: 'BLOQUEADA', motivo_bloqueio: 'Bloqueio manual' })}><AlertTriangle className="h-4 w-4"/></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
