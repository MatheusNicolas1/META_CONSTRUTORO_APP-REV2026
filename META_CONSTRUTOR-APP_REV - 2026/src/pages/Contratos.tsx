import React, { useState } from "react";
import { useContratosMedicoes, ObraContrato, MedicaoContrato } from "@/hooks/useContratosMedicoes";
import { Loader2, FileText, Plus, CheckCircle, XCircle, Send, ChevronDown, ChevronRight, DollarSign, Calendar, Building } from "lucide-react";

// ============================================
// Helpers
// ============================================
const STATUS_LABELS: Record<string, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

const MEDICAO_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  pendente_campo: "Pendente (Campo)",
  aprovado_campo: "Aprovado (Campo)",
  pendente_financeiro: "Pendente (Financeiro)",
  aprovado_financeiro: "Aprovado (Financeiro)",
  rejeitado: "Rejeitado",
};

const MEDICAO_STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-700",
  pendente_campo: "bg-yellow-100 text-yellow-800",
  aprovado_campo: "bg-green-100 text-green-800",
  pendente_financeiro: "bg-blue-100 text-blue-800",
  aprovado_financeiro: "bg-emerald-100 text-emerald-800",
  rejeitado: "bg-red-100 text-red-800",
};

const TIPO_ADITIVO_LABELS: Record<string, string> = {
  valor: "Valor",
  prazo: "Prazo",
  escopo: "Escopo",
  reajuste: "Reajuste",
  outro: "Outro",
};

const formatarMoeda = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatarData = (d: string | null | undefined) => {
  if (!d) return "-";
  const [ano, mes, dia] = d.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

// ============================================
// Componente Principal
// ============================================
export default function Contratos() {
  const [view, setView] = useState<"lista" | "detalhe">("lista");
  const [contratoSelecionado, setContratoSelecionado] = useState<ObraContrato | null>(null);

  const [filtroObra, setFiltroObra] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const {
    isLoading,
    contratos,
    valorTotalContratos,
    createContrato,
    createMedicao,
    createAditivo,
    createBoletim,
    aprovarMedicaoCampo,
    aprovarMedicaoFinanceiro,
    rejeitarMedicao,
    submeterMedicaoCampo,
    submeterMedicaoFinanceiro,
    useContratoItens,
    useMedicoes,
    useMedicaoItens,
    useBoletins,
    useAditivos,
  } = useContratosMedicoes(filtroObra || undefined, filtroFornecedor || undefined, filtroStatus || undefined);

  // ---- Formulário novo contrato ----
  const [showNovoContrato, setShowNovoContrato] = useState(false);
  const [novoContrato, setNovoContrato] = useState({
    obra_id: "",
    fornecedor_id: "",
    fornecedor_nome: "",
    numero: "",
    descricao: "",
    valor_total: 0,
    data_inicio: "",
    data_fim: "",
  });

  // ============================================
  // View: Lista de Contratos
  // ============================================
  if (view === "lista") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
          <p className="mt-1 text-gray-600">Contratos de obra, medições, aditivos e boletins.</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="h-4 w-4" /> Total Contratos
            </div>
            <p className="mt-1 text-xl font-bold">{contratos.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign className="h-4 w-4" /> Valor Total
            </div>
            <p className="mt-1 text-xl font-bold">{formatarMoeda(valorTotalContratos)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Building className="h-4 w-4" /> Ativos
            </div>
            <p className="mt-1 text-xl font-bold">{contratos.filter((c) => c.status === "ativo").length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-xl border border-border bg-card p-2 text-sm w-48"
            placeholder="ID da obra"
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
          />
          <input
            className="rounded-xl border border-border bg-card p-2 text-sm w-48"
            placeholder="Fornecedor (nome)"
            value={filtroFornecedor}
            onChange={(e) => setFiltroFornecedor(e.target.value)}
          />
          <select
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => setShowNovoContrato(true)}
          >
            <Plus className="inline h-4 w-4 mr-1" /> Novo Contrato
          </button>
        </div>

        {/* Modal novo contrato */}
        {showNovoContrato && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="font-semibold">Novo Contrato</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input className="rounded-xl border border-border bg-background p-2 text-sm" placeholder="ID da Obra" value={novoContrato.obra_id} onChange={(e) => setNovoContrato((p) => ({ ...p, obra_id: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" placeholder="Número do Contrato" value={novoContrato.numero} onChange={(e) => setNovoContrato((p) => ({ ...p, numero: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" placeholder="Descrição" value={novoContrato.descricao} onChange={(e) => setNovoContrato((p) => ({ ...p, descricao: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" type="number" placeholder="Valor Total" value={novoContrato.valor_total || ""} onChange={(e) => setNovoContrato((p) => ({ ...p, valor_total: Number(e.target.value) }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" type="date" value={novoContrato.data_inicio} onChange={(e) => setNovoContrato((p) => ({ ...p, data_inicio: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" type="date" placeholder="Data Fim" value={novoContrato.data_fim} onChange={(e) => setNovoContrato((p) => ({ ...p, data_fim: e.target.value }))} />
              <input className="rounded-xl border border-border bg-background p-2 text-sm" placeholder="Fornecedor (nome)" value={novoContrato.fornecedor_nome} onChange={(e) => setNovoContrato((p) => ({ ...p, fornecedor_nome: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={!novoContrato.obra_id || !novoContrato.numero || !novoContrato.descricao || novoContrato.valor_total <= 0}
                onClick={() => {
                  createContrato.mutate(novoContrato as any, {
                    onSuccess: () => {
                      setShowNovoContrato(false);
                      setNovoContrato({ obra_id: "", fornecedor_id: "", fornecedor_nome: "", numero: "", descricao: "", valor_total: 0, data_inicio: "", data_fim: "" });
                    },
                  });
                }}
              >
                Criar
              </button>
              <button className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setShowNovoContrato(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Contratos */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Nº</th>
                  <th className="p-2 text-left">Descrição</th>
                  <th className="p-2 text-left">Fornecedor</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2 text-left">Início</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">Nenhum contrato encontrado</td>
                  </tr>
                ) : (
                  contratos.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-2 font-medium">{c.numero}</td>
                      <td className="p-2 max-w-xs truncate">{c.descricao}</td>
                      <td className="p-2">{c.fornecedor_nome || "-"}</td>
                      <td className="p-2 text-right">{formatarMoeda(Number(c.valor_total) + Number(c.valor_aditivo))}</td>
                      <td className="p-2">{formatarData(c.data_inicio)}</td>
                      <td className="p-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.status === "ativo" ? "bg-green-100 text-green-800" :
                          c.status === "suspenso" ? "bg-yellow-100 text-yellow-800" :
                          c.status === "encerrado" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          className="rounded-lg bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/70"
                          onClick={() => { setContratoSelecionado(c); setView("detalhe"); }}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // View: Detalhe do Contrato
  // ============================================

  if (!contratoSelecionado) {
    setView("lista");
    return null;
  }

  return (
    <ContratoDetalhe
      contrato={contratoSelecionado}
      onBack={() => { setContratoSelecionado(null); setView("lista"); }}
      useContratoItens={useContratoItens}
      useMedicoes={useMedicoes}
      useMedicaoItens={useMedicaoItens}
      useBoletins={useBoletins}
      useAditivos={useAditivos}
      createMedicao={createMedicao}
      createAditivo={createAditivo}
      createBoletim={createBoletim}
      aprovarMedicaoCampo={aprovarMedicaoCampo}
      aprovarMedicaoFinanceiro={aprovarMedicaoFinanceiro}
      rejeitarMedicao={rejeitarMedicao}
      submeterMedicaoCampo={submeterMedicaoCampo}
      submeterMedicaoFinanceiro={submeterMedicaoFinanceiro}
    />
  );
}

// ============================================
// Sub-componente: Detalhe do Contrato
// ============================================

function ContratoDetalhe({
  contrato,
  onBack,
  useContratoItens,
  useMedicoes,
  useMedicaoItens,
  useBoletins,
  useAditivos,
  createMedicao,
  createAditivo,
  createBoletim,
  aprovarMedicaoCampo,
  aprovarMedicaoFinanceiro,
  rejeitarMedicao,
  submeterMedicaoCampo,
  submeterMedicaoFinanceiro,
}: {
  contrato: ObraContrato;
  onBack: () => void;
  useContratoItens: (id?: string) => any;
  useMedicoes: (id?: string) => any;
  useMedicaoItens: (id?: string) => any;
  useBoletins: (id?: string) => any;
  useAditivos: (id?: string) => any;
  createMedicao: any;
  createAditivo: any;
  createBoletim: any;
  aprovarMedicaoCampo: any;
  aprovarMedicaoFinanceiro: any;
  rejeitarMedicao: any;
  submeterMedicaoCampo: any;
  submeterMedicaoFinanceiro: any;
}) {
  const [aba, setAba] = useState<"itens" | "medicoes" | "aditivos">("itens");

  const { data: itens = [], isLoading: loadingItens } = useContratoItens(contrato.id);
  const { data: medicoes = [], isLoading: loadingMedicoes } = useMedicoes(contrato.id);
  const { data: aditivos = [], isLoading: loadingAditivos } = useAditivos(contrato.id);

  // Estado para nova medição
  const [showNovaMedicao, setShowNovaMedicao] = useState(false);
  const [novaMedicao, setNovaMedicao] = useState({
    contrato_id: contrato.id,
    numero: (medicoes.length || 0) + 1,
    data_medicao: new Date().toISOString().split("T")[0],
    valor_medido: 0,
    percentual_executado: 0,
    observacoes: "",
  });

  // Estado para novo aditivo
  const [showNovoAditivo, setShowNovoAditivo] = useState(false);
  const [novoAditivo, setNovoAditivo] = useState({
    contrato_id: contrato.id,
    numero: (aditivos.length || 0) + 1,
    tipo: "valor" as "valor" | "prazo" | "escopo" | "reajuste" | "outro",
    descricao: "",
    valor: 0,
    data_inicio_nova: "",
    data_fim_nova: "",
  });

  // Estado para aprovação com motivo de rejeição
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [medicaoRejeitando, setMedicaoRejeitando] = useState<string | null>(null);

  // Medição expandida (para ver itens / boletins)
  const [medicaoExpandida, setMedicaoExpandida] = useState<string | null>(null);

  const valorTotal = Number(contrato.valor_total) + Number(contrato.valor_aditivo);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <button onClick={onBack} className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted">
          ← Voltar
        </button>
        <div>
          <h1 className="text-xl font-bold">Contrato {contrato.numero}</h1>
          <p className="text-sm text-gray-600">{contrato.descricao}</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
          contrato.status === "ativo" ? "bg-green-100 text-green-800" :
          contrato.status === "suspenso" ? "bg-yellow-100 text-yellow-800" :
          contrato.status === "encerrado" ? "bg-blue-100 text-blue-800" :
          "bg-red-100 text-red-800"
        }`}>
          {STATUS_LABELS[contrato.status] || contrato.status}
        </span>
      </div>

      {/* Cards de resumo do contrato */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-gray-500"><DollarSign className="inline h-3 w-3" /> Valor</div>
          <p className="text-lg font-bold">{formatarMoeda(valorTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-gray-500"><Calendar className="inline h-3 w-3" /> Início</div>
          <p className="text-lg font-bold">{formatarData(contrato.data_inicio)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-gray-500"><Calendar className="inline h-3 w-3" /> Fim</div>
          <p className="text-lg font-bold">{formatarData(contrato.data_fim)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs text-gray-500"><Building className="inline h-3 w-3" /> Fornecedor</div>
          <p className="text-lg font-bold truncate">{contrato.fornecedor_nome || "-"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["itens", "medicoes", "aditivos"] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === t ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setAba(t)}
          >
            {t === "itens" ? "Itens" : t === "medicoes" ? "Medições" : "Aditivos"}
          </button>
        ))}
      </div>

      {/* ======== Aba: Itens ======== */}
      {aba === "itens" && (
        <div>
          {loadingItens ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-left">Un.</th>
                    <th className="p-2 text-right">Qtd.</th>
                    <th className="p-2 text-right">Valor Unit.</th>
                    <th className="p-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum item cadastrado</td></tr>
                  ) : (
                    itens.map((item: any) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-2">{item.descricao}</td>
                        <td className="p-2">{item.unidade}</td>
                        <td className="p-2 text-right">{Number(item.quantidade).toLocaleString("pt-BR")}</td>
                        <td className="p-2 text-right">{formatarMoeda(Number(item.valor_unitario))}</td>
                        <td className="p-2 text-right font-medium">{formatarMoeda(Number(item.valor_total))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======== Aba: Medições ======== */}
      {aba === "medicoes" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => setShowNovaMedicao(true)}
            >
              <Plus className="inline h-4 w-4 mr-1" /> Nova Medição
            </button>
          </div>

          {/* Form nova medição */}
          {showNovaMedicao && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-sm">Nova Medição</h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">Número</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="number" value={novaMedicao.numero} onChange={(e) => setNovaMedicao((p) => ({ ...p, numero: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Data</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="date" value={novaMedicao.data_medicao} onChange={(e) => setNovaMedicao((p) => ({ ...p, data_medicao: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Valor Medido</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="number" value={novaMedicao.valor_medido || ""} onChange={(e) => setNovaMedicao((p) => ({ ...p, valor_medido: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">% Executado</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="number" min="0" max="100" step="0.01" value={novaMedicao.percentual_executado || ""} onChange={(e) => setNovaMedicao((p) => ({ ...p, percentual_executado: Number(e.target.value) }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Observações</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" value={novaMedicao.observacoes} onChange={(e) => setNovaMedicao((p) => ({ ...p, observacoes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  disabled={novaMedicao.valor_medido <= 0}
                  onClick={() => {
                    createMedicao.mutate(novaMedicao, {
                      onSuccess: () => {
                        setShowNovaMedicao(false);
                        setNovaMedicao({ contrato_id: contrato.id, numero: (medicoes.length || 0) + 2, data_medicao: new Date().toISOString().split("T")[0], valor_medido: 0, percentual_executado: 0, observacoes: "" });
                      },
                    });
                  }}
                >
                  Criar Medição
                </button>
                <button className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setShowNovaMedicao(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista de medições */}
          {loadingMedicoes ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <div className="space-y-2">
              {medicoes.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Nenhuma medição registrada</p>
              ) : (
                medicoes.map((m: MedicaoContrato) => (
                  <MedicaoCard
                    key={m.id}
                    medicao={m}
                    expanded={medicaoExpandida === m.id}
                    onToggleExpand={() => setMedicaoExpandida(medicaoExpandida === m.id ? null : m.id)}
                    useMedicaoItens={useMedicaoItens}
                    useBoletins={useBoletins}
                    createBoletim={createBoletim}
                    aprovarMedicaoCampo={aprovarMedicaoCampo}
                    aprovarMedicaoFinanceiro={aprovarMedicaoFinanceiro}
                    rejeitarMedicao={rejeitarMedicao}
                    submeterMedicaoCampo={submeterMedicaoCampo}
                    submeterMedicaoFinanceiro={submeterMedicaoFinanceiro}
                    motivoRejeicao={motivoRejeicao}
                    setMotivoRejeicao={setMotivoRejeicao}
                    medicaoRejeitando={medicaoRejeitando}
                    setMedicaoRejeitando={setMedicaoRejeitando}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ======== Aba: Aditivos ======== */}
      {aba === "aditivos" && (
        <div className="space-y-4">
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => setShowNovoAditivo(true)}
          >
            <Plus className="inline h-4 w-4 mr-1" /> Novo Aditivo
          </button>

          {showNovoAditivo && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-sm">Novo Aditivo</h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500">Número</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="number" value={novoAditivo.numero} onChange={(e) => setNovoAditivo((p) => ({ ...p, numero: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Tipo</label>
                  <select className="w-full rounded-xl border border-border bg-background p-2 text-sm" value={novoAditivo.tipo} onChange={(e) => setNovoAditivo((p) => ({ ...p, tipo: e.target.value as any }))}>
                    <option value="valor">Valor</option>
                    <option value="prazo">Prazo</option>
                    <option value="escopo">Escopo</option>
                    <option value="reajuste">Reajuste</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500">Descrição</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" value={novoAditivo.descricao} onChange={(e) => setNovoAditivo((p) => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Valor (negativo = desconto)</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="number" value={novoAditivo.valor || ""} onChange={(e) => setNovoAditivo((p) => ({ ...p, valor: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Nova Data Início</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="date" value={novoAditivo.data_inicio_nova} onChange={(e) => setNovoAditivo((p) => ({ ...p, data_inicio_nova: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Nova Data Fim</label>
                  <input className="w-full rounded-xl border border-border bg-background p-2 text-sm" type="date" value={novoAditivo.data_fim_nova} onChange={(e) => setNovoAditivo((p) => ({ ...p, data_fim_nova: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  disabled={!novoAditivo.descricao}
                  onClick={() => {
                    createAditivo.mutate(novoAditivo, {
                      onSuccess: () => {
                        setShowNovoAditivo(false);
                        setNovoAditivo({ contrato_id: contrato.id, numero: (aditivos.length || 0) + 2, tipo: "valor", descricao: "", valor: 0, data_inicio_nova: "", data_fim_nova: "" });
                      },
                    });
                  }}
                >
                  Criar Aditivo
                </button>
                <button className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setShowNovoAditivo(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {loadingAditivos ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Nº</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Novo Início</th>
                    <th className="p-2 text-left">Novo Fim</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aditivos.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nenhum aditivo</td></tr>
                  ) : (
                    aditivos.map((a: any) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="p-2">{a.numero}</td>
                        <td className="p-2">{TIPO_ADITIVO_LABELS[a.tipo] || a.tipo}</td>
                        <td className="p-2 max-w-xs truncate">{a.descricao}</td>
                        <td className={`p-2 text-right font-medium ${Number(a.valor) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatarMoeda(Number(a.valor))}
                        </td>
                        <td className="p-2">{formatarData(a.data_inicio_nova)}</td>
                        <td className="p-2">{formatarData(a.data_fim_nova)}</td>
                        <td className="p-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === "aprovado" ? "bg-green-100 text-green-800" :
                            a.status === "rejeitado" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {a.status === "aprovado" ? "Aprovado" : a.status === "rejeitado" ? "Rejeitado" : "Pendente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-componente: Card de Medição
// ============================================

function MedicaoCard({
  medicao,
  expanded,
  onToggleExpand,
  useMedicaoItens,
  useBoletins,
  createBoletim,
  aprovarMedicaoCampo,
  aprovarMedicaoFinanceiro,
  rejeitarMedicao,
  submeterMedicaoCampo,
  submeterMedicaoFinanceiro,
  motivoRejeicao,
  setMotivoRejeicao,
  medicaoRejeitando,
  setMedicaoRejeitando,
}: {
  medicao: MedicaoContrato;
  expanded: boolean;
  onToggleExpand: () => void;
  useMedicaoItens: (id?: string) => any;
  useBoletins: (id?: string) => any;
  createBoletim: any;
  aprovarMedicaoCampo: any;
  aprovarMedicaoFinanceiro: any;
  rejeitarMedicao: any;
  submeterMedicaoCampo: any;
  submeterMedicaoFinanceiro: any;
  motivoRejeicao: string;
  setMotivoRejeicao: (v: string) => void;
  medicaoRejeitando: string | null;
  setMedicaoRejeitando: (v: string | null) => void;
}) {
  const { data: itensMedicao = [] } = useMedicaoItens(medicao.id);
  const { data: boletins = [] } = useBoletins(medicao.id);

  const [showNovoBoletim, setShowNovoBoletim] = useState(false);
  const [novoBoletim, setNovoBoletim] = useState({ medicao_id: medicao.id, titulo: "", descricao: "", data: new Date().toISOString().split("T")[0], anexo_path: "" });

  const botoesAcao = () => {
    switch (medicao.status) {
      case "rascunho":
        return (
          <button
            className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200"
            onClick={() => submeterMedicaoCampo.mutate(medicao.id)}
            disabled={submeterMedicaoCampo.isPending}
          >
            <Send className="inline h-3 w-3 mr-1" /> Submeter ao Campo
          </button>
        );
      case "pendente_campo":
        return (
          <div className="flex gap-1">
            <button
              className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
              onClick={() => aprovarMedicaoCampo.mutate(medicao.id)}
              disabled={aprovarMedicaoCampo.isPending}
            >
              <CheckCircle className="inline h-3 w-3 mr-1" /> Aprovar Campo
            </button>
            <button
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
              onClick={() => setMedicaoRejeitando(medicao.id)}
            >
              <XCircle className="inline h-3 w-3 mr-1" /> Rejeitar
            </button>
          </div>
        );
      case "aprovado_campo":
        return (
          <button
            className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
            onClick={() => submeterMedicaoFinanceiro.mutate(medicao.id)}
            disabled={submeterMedicaoFinanceiro.isPending}
          >
            <Send className="inline h-3 w-3 mr-1" /> Submeter ao Financeiro
          </button>
        );
      case "pendente_financeiro":
        return (
          <div className="flex gap-1">
            <button
              className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
              onClick={() => aprovarMedicaoFinanceiro.mutate(medicao.id)}
              disabled={aprovarMedicaoFinanceiro.isPending}
            >
              <CheckCircle className="inline h-3 w-3 mr-1" /> Aprovar Financeiro
            </button>
            <button
              className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
              onClick={() => setMedicaoRejeitando(medicao.id)}
            >
              <XCircle className="inline h-3 w-3 mr-1" /> Rejeitar
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header do card */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
        onClick={onToggleExpand}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-medium text-sm">Medição #{medicao.numero}</span>
        <span className="text-sm text-gray-500">{formatarData(medicao.data_medicao)}</span>
        <span className="text-sm font-semibold">{formatarMoeda(Number(medicao.valor_medido))}</span>
        <span className="text-sm text-gray-500">{Number(medicao.percentual_executado).toFixed(1)}%</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MEDICAO_STATUS_COLORS[medicao.status] || "bg-gray-100"}`}>
          {MEDICAO_STATUS_LABELS[medicao.status] || medicao.status}
        </span>
        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
          {botoesAcao()}
        </div>
      </div>

      {/* Diálogo de rejeição */}
      {medicaoRejeitando === medicao.id && (
        <div className="mx-3 mb-3 rounded-lg border border-red-200 bg-red-50 p-3" onClick={(e) => e.stopPropagation()}>
          <label className="text-xs font-medium text-red-800">Motivo da rejeição:</label>
          <input
            className="w-full mt-1 rounded-lg border border-red-200 bg-white p-2 text-sm"
            value={motivoRejeicao}
            onChange={(e) => setMotivoRejeicao(e.target.value)}
            placeholder="Descreva o motivo..."
          />
          <div className="flex gap-2 mt-2">
            <button
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              disabled={!motivoRejeicao.trim()}
              onClick={() => {
                rejeitarMedicao.mutate({ medicaoId: medicao.id, motivo: motivoRejeicao }, {
                  onSuccess: () => { setMedicaoRejeitando(null); setMotivoRejeicao(""); },
                });
              }}
            >
              Confirmar Rejeição
            </button>
            <button className="rounded-lg border border-border px-3 py-1 text-xs" onClick={() => { setMedicaoRejeitando(null); setMotivoRejeicao(""); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo expandido */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          {medicao.observacoes && (
            <p className="text-sm text-gray-600 bg-muted/30 rounded-lg p-2">{medicao.observacoes}</p>
          )}

          {/* Itens da medição */}
          <div>
            <h5 className="text-xs font-semibold text-gray-500 mb-1">Itens Medidos</h5>
            {itensMedicao.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum item registrado</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-1.5 text-left">Descrição</th>
                      <th className="p-1.5 text-right">Qtd. Medida</th>
                      <th className="p-1.5 text-right">Valor</th>
                      <th className="p-1.5 text-right">% Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensMedicao.map((item: any) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-1.5">{item.descricao}</td>
                        <td className="p-1.5 text-right">{Number(item.quantidade_medida).toLocaleString("pt-BR")}</td>
                        <td className="p-1.5 text-right">{formatarMoeda(Number(item.valor_medido))}</td>
                        <td className="p-1.5 text-right">{Number(item.percentual_item).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Boletins */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h5 className="text-xs font-semibold text-gray-500">Boletins</h5>
              <button
                className="rounded-lg bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
                onClick={() => setShowNovoBoletim(!showNovoBoletim)}
              >
                <Plus className="inline h-3 w-3" /> Adicionar
              </button>
            </div>

            {showNovoBoletim && (
              <div className="mb-2 rounded-lg border border-border bg-muted/30 p-2 space-y-1">
                <input className="w-full rounded-lg border border-border bg-background p-1.5 text-xs" placeholder="Título" value={novoBoletim.titulo} onChange={(e) => setNovoBoletim((p) => ({ ...p, titulo: e.target.value }))} />
                <input className="w-full rounded-lg border border-border bg-background p-1.5 text-xs" placeholder="Descrição (opcional)" value={novoBoletim.descricao} onChange={(e) => setNovoBoletim((p) => ({ ...p, descricao: e.target.value }))} />
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    disabled={!novoBoletim.titulo}
                    onClick={() => {
                      createBoletim.mutate(novoBoletim, {
                        onSuccess: () => { setShowNovoBoletim(false); setNovoBoletim({ medicao_id: medicao.id, titulo: "", descricao: "", data: new Date().toISOString().split("T")[0], anexo_path: "" }); },
                      });
                    }}
                  >
                    Salvar
                  </button>
                  <button className="rounded-lg border border-border px-3 py-1 text-xs" onClick={() => setShowNovoBoletim(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {boletins.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum boletim</p>
            ) : (
              <div className="space-y-1">
                {boletins.map((b: any) => (
                  <div key={b.id} className="rounded-lg border border-border bg-muted/20 p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{b.titulo}</span>
                      <span className="text-gray-400">{formatarData(b.data)}</span>
                    </div>
                    {b.descricao && <p className="mt-0.5 text-gray-600">{b.descricao}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
