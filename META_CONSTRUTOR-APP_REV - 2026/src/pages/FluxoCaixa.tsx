import React, { useState } from "react";
import { useFluxoCaixa, PrevisaoRecord } from "@/hooks/useFluxoCaixa";
import { Loader2, TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react";

export default function FluxoCaixa() {
  const [obraId, setObraId] = useState("");
  const {
    isLoading,
    previsoes,
    realizado,
    curva,
    saldoPrevisto,
    saldoRealizado,
    createPrevisao,
    createRealizado,
  } = useFluxoCaixa(obraId || undefined);

  const [novaPrevisao, setNovaPrevisao] = useState({
    obra_id: "",
    tipo: "saida" as "entrada" | "saida",
    categoria: "",
    descricao: "",
    data_prevista: "",
    valor_previsto: 0,
    origem: "manual",
  });

  const [novoRealizado, setNovoRealizado] = useState({
    obra_id: "",
    tipo: "saida" as "entrada" | "saida",
    categoria: "",
    data_realizada: "",
    valor_realizado: 0,
  });

  const formatarMoeda = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-10">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Fluxo de Caixa e Curva ABC</h1>
        <p className="mt-1 text-gray-600">Previsões, realizado e análise de desvios por obra.</p>
      </div>

      {/* Filtro por obra */}
      <div>
        <input
          className="rounded-xl border border-border bg-card p-2 text-sm w-full max-w-sm"
          placeholder="ID da obra (opcional)"
          value={obraId}
          onChange={(e) => setObraId(e.target.value)}
        />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingUp className="h-4 w-4" /> Previsto</div>
          <p className="mt-1 text-xl font-bold">{formatarMoeda(saldoPrevisto)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500"><Wallet className="h-4 w-4" /> Realizado</div>
          <p className="mt-1 text-xl font-bold">{formatarMoeda(saldoRealizado)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500"><TrendingDown className="h-4 w-4" /> Desvio</div>
          <p className={`mt-1 text-xl font-bold ${saldoRealizado > saldoPrevisto ? 'text-green-600' : 'text-red-600'}`}>
            {formatarMoeda(saldoRealizado - saldoPrevisto)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500"><AlertTriangle className="h-4 w-4" /> Alertas</div>
          <p className="mt-1 text-xl font-bold">{curva.filter((c: any) => c.status !== 'ok').length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : (
        <>
          {/* Tabela de Previsões */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Previsões</h2>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <input className="rounded-xl border border-border bg-card p-2 text-sm" placeholder="Descrição" value={novaPrevisao.descricao} onChange={e => setNovaPrevisao(p => ({ ...p, descricao: e.target.value }))} />
              <input className="rounded-xl border border-border bg-card p-2 text-sm" placeholder="Categoria" value={novaPrevisao.categoria} onChange={e => setNovaPrevisao(p => ({ ...p, categoria: e.target.value }))} />
              <input className="rounded-xl border border-border bg-card p-2 text-sm" type="number" placeholder="Valor" value={novaPrevisao.valor_previsto || ''} onChange={e => setNovaPrevisao(p => ({ ...p, valor_previsto: Number(e.target.value) }))} />
              <input className="rounded-xl border border-border bg-card p-2 text-sm" type="date" value={novaPrevisao.data_prevista} onChange={e => setNovaPrevisao(p => ({ ...p, data_prevista: e.target.value }))} />
              <select className="rounded-xl border border-border bg-card p-2 text-sm" value={novaPrevisao.tipo} onChange={e => setNovaPrevisao(p => ({ ...p, tipo: e.target.value as any }))}>
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
              <input className="rounded-xl border border-border bg-card p-2 text-sm" placeholder="ID da obra" value={novaPrevisao.obra_id} onChange={e => setNovaPrevisao(p => ({ ...p, obra_id: e.target.value }))} />
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={!novaPrevisao.obra_id || !novaPrevisao.descricao || novaPrevisao.valor_previsto <= 0}
                onClick={() => {
                  createPrevisao.mutate({ ...novaPrevisao } as any);
                  setNovaPrevisao({ obra_id: "", tipo: "saida", categoria: "", descricao: "", data_prevista: "", valor_previsto: 0, origem: "manual" });
                }}
              >
                Criar previsão
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previsoes.slice(0, 20).map((p: any) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-2">{p.descricao}</td>
                      <td className="p-2">{p.tipo}</td>
                      <td className="p-2 text-right">{formatarMoeda(Number(p.valor_previsto))}</td>
                      <td className="p-2">{p.data_prevista}</td>
                      <td className="p-2">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabela de Realizado */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Realizado</h2>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <input className="rounded-xl border border-border bg-card p-2 text-sm" placeholder="Categoria" value={novoRealizado.categoria} onChange={e => setNovoRealizado(p => ({ ...p, categoria: e.target.value }))} />
              <input className="rounded-xl border border-border bg-card p-2 text-sm" type="number" placeholder="Valor" value={novoRealizado.valor_realizado || ''} onChange={e => setNovoRealizado(p => ({ ...p, valor_realizado: Number(e.target.value) }))} />
              <input className="rounded-xl border border-border bg-card p-2 text-sm" type="date" value={novoRealizado.data_realizada} onChange={e => setNovoRealizado(p => ({ ...p, data_realizada: e.target.value }))} />
              <select className="rounded-xl border border-border bg-card p-2 text-sm" value={novoRealizado.tipo} onChange={e => setNovoRealizado(p => ({ ...p, tipo: e.target.value as any }))}>
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
              <input className="rounded-xl border border-border bg-card p-2 text-sm" placeholder="ID da obra" value={novoRealizado.obra_id} onChange={e => setNovoRealizado(p => ({ ...p, obra_id: e.target.value }))} />
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={!novoRealizado.obra_id || !novoRealizado.categoria || novoRealizado.valor_realizado <= 0}
                onClick={() => {
                  createRealizado.mutate({ ...novoRealizado } as any);
                  setNovoRealizado({ obra_id: "", tipo: "saida", categoria: "", data_realizada: "", valor_realizado: 0 });
                }}
              >
                Lançar
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Categoria</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {realizado.slice(0, 20).map((r: any) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-2">{r.categoria}</td>
                      <td className="p-2">{r.tipo}</td>
                      <td className="p-2 text-right">{formatarMoeda(Number(r.valor_realizado))}</td>
                      <td className="p-2">{r.data_realizada}</td>
                      <td className="p-2">{r.origem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Curva ABC */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Curva ABC</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Competência</th>
                    <th className="p-2 text-right">Planejado</th>
                    <th className="p-2 text-right">Realizado</th>
                    <th className="p-2 text-right">Desvio %</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {curva.map((c: any) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-2">{c.competencia}</td>
                      <td className="p-2 text-right">{formatarMoeda(Number(c.base_planejada))}</td>
                      <td className="p-2 text-right">{formatarMoeda(Number(c.base_realizada))}</td>
                      <td className={`p-2 text-right font-medium ${Number(c.desvio_percentual) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(c.desvio_percentual).toFixed(1)}%
                      </td>
                      <td className="p-2">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
