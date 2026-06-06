import React, { useState } from "react";
import { useDDS } from "@/hooks/useDDS";
import {
  Shield,
  PlusCircle,
  History,
  BarChart3,
  Loader2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  TrendingUp,
  Lightbulb,
  BookOpen,
} from "lucide-react";

type Tab = "perfil" | "novo" | "historico" | "indicadores";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "perfil", label: "Perfil", icon: Shield },
  { key: "novo", label: "Novo DDS", icon: PlusCircle },
  { key: "historico", label: "Histórico", icon: History },
  { key: "indicadores", label: "Indicadores", icon: BarChart3 },
];

export default function DDS() {
  const [activeTab, setActiveTab] = useState<Tab>("novo");
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const filtros = {
    obraId: filtroObra || undefined,
    status: filtroStatus || undefined,
    dataInicio: filtroDataInicio || undefined,
    dataFim: filtroDataFim || undefined,
  };

  const {
    isLoading,
    perfil,
    registros,
    sugestoes,
    indicadores,
    salvarPerfil,
    criarDDS,
    useParticipantes,
  } = useDDS(activeTab === "historico" ? filtros : undefined);

  // Form states
  const [perfilForm, setPerfilForm] = useState({
    segmento: perfil?.segmento || "",
    principais_riscos: perfil?.principais_riscos?.join(", ") || "",
    nrs_aplicaveis: perfil?.nrs_aplicaveis?.join(", ") || "",
    meta_dds_mensal: perfil?.meta_dds_mensal || 4,
  });

  const [novoDDS, setNovoDDS] = useState({
    obra_id: "",
    tema: "",
    conteudo: "",
    data: new Date().toISOString().split("T")[0],
    horario: "",
    duracao_minutos: 15,
    observacoes: "",
    participantes: [{ nome: "", cargo: "" }],
  });

  // Sync perfil form when data loads
  React.useEffect(() => {
    if (perfil) {
      setPerfilForm({
        segmento: perfil.segmento || "",
        principais_riscos: (perfil.principais_riscos || []).join(", "),
        nrs_aplicaveis: (perfil.nrs_aplicaveis || []).join(", "),
        meta_dds_mensal: perfil.meta_dds_mensal || 4,
      });
    }
  }, [perfil]);

  // Auto-suggest tema from sugestoes
  const sugerirTema = () => {
    if (sugestoes.length > 0) {
      const random = sugestoes[Math.floor(Math.random() * sugestoes.length)];
      setNovoDDS((p) => ({
        ...p,
        tema: random.tema,
      }));
    }
  };

  const addParticipante = () =>
    setNovoDDS((p) => ({
      ...p,
      participantes: [...p.participantes, { nome: "", cargo: "" }],
    }));

  const removeParticipante = (i: number) =>
    setNovoDDS((p) => ({
      ...p,
      participantes: p.participantes.filter((_, idx) => idx !== i),
    }));

  const updateParticipante = (i: number, field: string, value: string) =>
    setNovoDDS((p) => ({
      ...p,
      participantes: p.participantes.map((part, idx) =>
        idx === i ? { ...part, [field]: value } : part
      ),
    }));

  const handleSalvarPerfil = () => {
    salvarPerfil.mutate({
      segmento: perfilForm.segmento,
      principais_riscos: perfilForm.principais_riscos
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      nrs_aplicaveis: perfilForm.nrs_aplicaveis
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      meta_dds_mensal: perfilForm.meta_dds_mensal,
    });
  };

  const handleCriarDDS = () => {
    criarDDS.mutate({
      obra_id: novoDDS.obra_id || undefined,
      tema: novoDDS.tema,
      conteudo: novoDDS.conteudo,
      data: novoDDS.data,
      horario: novoDDS.horario || undefined,
      duracao_minutos: novoDDS.duracao_minutos || undefined,
      observacoes: novoDDS.observacoes || undefined,
      participantes: novoDDS.participantes.filter((p) => p.nome.trim()),
    });
    // Reset form
    setNovoDDS({
      obra_id: "",
      tema: "",
      conteudo: "",
      data: new Date().toISOString().split("T")[0],
      horario: "",
      duracao_minutos: 15,
      observacoes: "",
      participantes: [{ nome: "", cargo: "" }],
    });
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      realizado: "bg-green-100 text-green-800",
      pendente: "bg-yellow-100 text-yellow-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return map[s] || "bg-gray-100 text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Diálogo Diário de Segurança</h1>
        <p className="mt-1 text-gray-600">
          Gerencie diálogos de segurança, perfil de riscos e indicadores mensais.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ===== ABAS ===== */}

      {/* 1. Perfil de Segurança */}
      {activeTab === "perfil" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Perfil de Segurança da Empresa
            </h2>
            <p className="text-sm text-gray-500">
              Defina o segmento, principais riscos e NRs aplicáveis à sua operação.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Segmento</label>
                <input
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Ex: Construção Civil, Industrial..."
                  value={perfilForm.segmento}
                  onChange={(e) =>
                    setPerfilForm((p) => ({ ...p, segmento: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Meta de DDS por Mês
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  value={perfilForm.meta_dds_mensal}
                  onChange={(e) =>
                    setPerfilForm((p) => ({
                      ...p,
                      meta_dds_mensal: parseInt(e.target.value) || 4,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Principais Riscos (separados por vírgula)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Queda de altura, Choque elétrico, Soterramento..."
                  value={perfilForm.principais_riscos}
                  onChange={(e) =>
                    setPerfilForm((p) => ({
                      ...p,
                      principais_riscos: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  NRs Aplicáveis (separadas por vírgula)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="NR-18, NR-35, NR-6, NR-12..."
                  value={perfilForm.nrs_aplicaveis}
                  onChange={(e) =>
                    setPerfilForm((p) => ({
                      ...p,
                      nrs_aplicaveis: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              onClick={handleSalvarPerfil}
              disabled={salvarPerfil.isPending || !perfilForm.segmento}
              className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {salvarPerfil.isPending ? "Salvando..." : "Salvar Perfil"}
            </button>

            {perfil && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(perfil.principais_riscos || []).map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                  >
                    {r}
                  </span>
                ))}
                {(perfil.nrs_aplicaveis || []).map((nr, i) => (
                  <span
                    key={`nr-${i}`}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {nr}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Novo DDS */}
      {activeTab === "novo" && (
        <section className="space-y-6">
          {/* Sugestão automática */}
          {sugestoes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Lightbulb className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Sugestões de temas disponíveis
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sugestoes.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setNovoDDS((p) => ({ ...p, tema: s.tema }))}
                    className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-amber-900 shadow-sm hover:bg-amber-100"
                  >
                    {s.tema}
                  </button>
                ))}
              </div>
              <button
                onClick={sugerirTema}
                className="mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900"
              >
                Sugerir tema aleatório
              </button>
            </div>
          )}

          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-600" />
              Registrar Novo DDS
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">ID da Obra</label>
                <input
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Opcional"
                  value={novoDDS.obra_id}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, obra_id: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Data *</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  value={novoDDS.data}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, data: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Horário</label>
                <input
                  type="time"
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  value={novoDDS.horario}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, horario: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Duração (min)
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  value={novoDDS.duracao_minutos}
                  onChange={(e) =>
                    setNovoDDS((p) => ({
                      ...p,
                      duracao_minutos: parseInt(e.target.value) || 15,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Tema *</label>
                <input
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Ex: Uso correto de EPIs, Trabalho em altura..."
                  value={novoDDS.tema}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, tema: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium">
                  Conteúdo abordado *
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Descreva os pontos discutidos durante o diálogo..."
                  value={novoDDS.conteudo}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, conteudo: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-1 block text-sm font-medium">
                  Observações
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-border p-2 text-sm"
                  placeholder="Observações adicionais..."
                  value={novoDDS.observacoes}
                  onChange={(e) =>
                    setNovoDDS((p) => ({ ...p, observacoes: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Participantes */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participantes
                </h3>
                <button
                  onClick={addParticipante}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  + Adicionar
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {novoDDS.participantes.map((part, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-xl border border-border p-2 text-sm"
                      placeholder="Nome do participante"
                      value={part.nome}
                      onChange={(e) =>
                        updateParticipante(i, "nome", e.target.value)
                      }
                    />
                    <input
                      className="flex-1 rounded-xl border border-border p-2 text-sm"
                      placeholder="Cargo (opcional)"
                      value={part.cargo}
                      onChange={(e) =>
                        updateParticipante(i, "cargo", e.target.value)
                      }
                    />
                    {novoDDS.participantes.length > 1 && (
                      <button
                        onClick={() => removeParticipante(i)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCriarDDS}
              disabled={
                criarDDS.isPending || !novoDDS.tema || !novoDDS.conteudo
              }
              className="rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {criarDDS.isPending ? "Registrando..." : "Registrar DDS"}
            </button>
          </div>
        </section>
      )}

      {/* 3. Histórico */}
      {activeTab === "historico" && (
        <section className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Obra
              </label>
              <input
                className="w-40 rounded-xl border border-border p-2 text-sm"
                placeholder="ID"
                value={filtroObra}
                onChange={(e) => setFiltroObra(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Status
              </label>
              <select
                className="w-36 rounded-xl border border-border p-2 text-sm"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="realizado">Realizado</option>
                <option value="pendente">Pendente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                De
              </label>
              <input
                type="date"
                className="rounded-xl border border-border p-2 text-sm"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Até
              </label>
              <input
                type="date"
                className="rounded-xl border border-border p-2 text-sm"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setFiltroObra("");
                setFiltroStatus("");
                setFiltroDataInicio("");
                setFiltroDataFim("");
              }}
              className="rounded-xl border px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
            >
              Limpar filtros
            </button>
          </div>

          {/* Lista */}
          {registros.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-gray-400">
              <BookOpen className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Nenhum registro de DDS encontrado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {registros.map((r) => (
                <details
                  key={r.id}
                  className="group rounded-xl border border-border bg-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {r.tema}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat("pt-BR").format(
                            new Date(r.data + "T00:00:00")
                          )}
                          {r.horario ? ` • ${r.horario}` : ""}
                          {r.duracao_minutos
                            ? ` • ${r.duracao_minutos}min`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </summary>
                  <div className="border-t border-border px-4 py-3 space-y-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Conteúdo</p>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {r.conteudo}
                      </p>
                    </div>
                    {r.observacoes && (
                      <div>
                        <p className="font-medium text-gray-600">Observações</p>
                        <p className="text-gray-700">{r.observacoes}</p>
                      </div>
                    )}
                    {r.obra_id && (
                      <p className="text-xs text-gray-400">
                        Obra: {r.obra_id}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Indicadores */}
      {activeTab === "indicadores" && (
        <section className="space-y-6">
          {/* Cards de indicadores */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-gray-500">Meta mensal</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {indicadores.meta}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-gray-500">Realizados</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {indicadores.realizados}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-gray-500">Pendentes</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {indicadores.pendentes}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-gray-500">Cancelados</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {indicadores.cancelados}
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Progresso da Meta Mensal
              </h3>
              <span className="text-sm font-bold text-blue-600">
                {indicadores.percentual}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{
                  width: `${Math.min(indicadores.percentual, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {indicadores.realizados} de {indicadores.meta} DDS realizados
              {indicadores.realizados >= indicadores.meta
                ? " — Meta atingida!"
                : ` — Faltam ${indicadores.meta - indicadores.realizados}`}
            </p>
          </div>

          {/* Recomendações */}
          {perfil && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Resumo do Perfil
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Segmento</p>
                  <p className="font-medium">{perfil.segmento}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs text-gray-500">Principais Riscos</p>
                  <p className="font-medium">
                    {(perfil.principais_riscos || []).join(", ") || "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-gray-500">NRs Aplicáveis</p>
                  <p className="font-medium">
                    {(perfil.nrs_aplicaveis || []).join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
