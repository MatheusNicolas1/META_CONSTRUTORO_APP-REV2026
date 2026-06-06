import React, { useState } from "react";
import { useClientesPortal, CreateClientePortalData } from "@/hooks/useClientesPortal";
import { Loader2, Copy, Ban, MessageSquare, CheckSquare, Link2, Plus } from "lucide-react";
import { toast } from "sonner";

const APP_URL = process.env.NODE_ENV === "production"
  ? window.location.origin
  : window.location.origin;

export default function ClientesPortal() {
  const {
    clientes,
    isClientesLoading,
    createCliente,
    revokeCliente,
    aprovacoes,
    createAprovacao,
    mensagens,
    sendMensagem,
  } = useClientesPortal();

  // Estado para criação de novo cliente portal
  const [novoCliente, setNovoCliente] = useState({
    obra_id: "",
    nome: "",
    email: "",
    telefone: "",
    fotos: true,
    cronograma: true,
    aprovacoes: true,
    mensagens: true,
  });

  const [novaAprovacao, setNovaAprovacao] = useState({
    cliente_portal_id: "",
    titulo: "",
    descricao: "",
    tipo: "acabamento",
    opcoes: [] as string[],
  });

  const [novaMensagem, setNovaMensagem] = useState({
    cliente_portal_id: "",
    obra_id: "",
    texto: "",
  });

  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${APP_URL}/portal/${token}`);
    setCopied(token);
    toast.success("Link copiado");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateCliente = () => {
    if (!novoCliente.obra_id || !novoCliente.nome) {
      toast.error("Obra e nome são obrigatórios");
      return;
    }
    createCliente.mutate({
      obra_id: novoCliente.obra_id,
      nome: novoCliente.nome,
      email: novoCliente.email || undefined,
      telefone: novoCliente.telefone || undefined,
      allowed_sections: {
        fotos: novoCliente.fotos,
        cronograma: novoCliente.cronograma,
        aprovacoes: novoCliente.aprovacoes,
        mensagens: novoCliente.mensagens,
      },
    } as CreateClientePortalData);
    setNovoCliente({ obra_id: "", nome: "", email: "", telefone: "", fotos: true, cronograma: true, aprovacoes: true, mensagens: true });
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Portal do Cliente</h1>
        <p className="mt-1 text-gray-600">Gerencie acessos para clientes acompanharem obras.</p>
      </div>

      {/* Seção 0: Criar novo link */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5" /> Criar novo link
        </h2>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Obra *</label>
            <input
              className="w-full rounded-xl border border-border bg-background p-2 text-sm"
              placeholder="ID da obra (uuid)"
              value={novoCliente.obra_id}
              onChange={(e) => setNovoCliente((p) => ({ ...p, obra_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Nome do cliente *</label>
            <input
              className="w-full rounded-xl border border-border bg-background p-2 text-sm"
              placeholder="Nome completo"
              value={novoCliente.nome}
              onChange={(e) => setNovoCliente((p) => ({ ...p, nome: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
            <input
              className="w-full rounded-xl border border-border bg-background p-2 text-sm"
              placeholder="cliente@email.com"
              value={novoCliente.email}
              onChange={(e) => setNovoCliente((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Telefone</label>
            <input
              className="w-full rounded-xl border border-border bg-background p-2 text-sm"
              placeholder="(11) 99999-9999"
              value={novoCliente.telefone}
              onChange={(e) => setNovoCliente((p) => ({ ...p, telefone: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">Seções visíveis</label>
            <div className="flex flex-wrap gap-3">
              {(["fotos", "cronograma", "aprovacoes", "mensagens"] as const).map((s) => (
                <label key={s} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={novoCliente[s]}
                    onChange={(e) => setNovoCliente((p) => ({ ...p, [s]: e.target.checked }))}
                    className="rounded"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              disabled={!novoCliente.obra_id || !novoCliente.nome || createCliente.isPending}
              onClick={handleCreateCliente}
            >
              {createCliente.isPending ? "Gerando..." : "Gerar link"}
            </button>
          </div>
        </div>
      </section>

      {/* Seção 1: Links ativos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Link2 className="h-5 w-5" /> Links de acesso ({clientes.length})
        </h2>
        {isClientesLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-gray-500">Nenhum link gerado ainda.</p>
        ) : (
          <div className="space-y-2">
            {clientes.map((cliente: any) => (
              <div
                key={cliente.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">{cliente.nome}</p>
                  <p className="text-xs text-gray-500">
                    {cliente.email || "Sem email"} • {cliente.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-50"
                    onClick={() => copyLink(cliente.token_hash)}
                    title="Copiar link"
                  >
                    {copied === cliente.token_hash ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  {cliente.status === "ativo" && (
                    <button
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
                      onClick={() => revokeCliente.mutate(cliente.id)}
                      title="Revogar acesso"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seção 2: Aprovações */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <CheckSquare className="h-5 w-5" /> Aprovações
        </h2>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={novaAprovacao.cliente_portal_id}
            onChange={(e) => setNovaAprovacao((prev) => ({ ...prev, cliente_portal_id: e.target.value }))}
          >
            <option value="">Selecionar cliente...</option>
            {clientes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <input
            placeholder="Título"
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={novaAprovacao.titulo}
            onChange={(e) => setNovaAprovacao((prev) => ({ ...prev, titulo: e.target.value }))}
          />
          <textarea
            placeholder="Descrição"
            className="rounded-xl border border-border bg-card p-2 text-sm"
            rows={2}
            value={novaAprovacao.descricao}
            onChange={(e) => setNovaAprovacao((prev) => ({ ...prev, descricao: e.target.value }))}
          />
          <select
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={novaAprovacao.tipo}
            onChange={(e) => setNovaAprovacao((prev) => ({ ...prev, tipo: e.target.value }))}
          >
            <option value="acabamento">Acabamento</option>
            <option value="layout">Layout</option>
            <option value="material">Material</option>
            <option value="outro">Outro</option>
          </select>
          <input
            placeholder="Opções (separadas por vírgula)"
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={novaAprovacao.opcoes.join(", ")}
            onChange={(e) =>
              setNovaAprovacao((prev) => ({
                ...prev,
                opcoes: e.target.value.split(",").map((s) => s.trim()),
              }))
            }
          />
        </div>
        <button
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          disabled={
            !novaAprovacao.cliente_portal_id ||
            !novaAprovacao.titulo ||
            !novaAprovacao.descricao
          }
          onClick={() => {
            const obra = clientes.find(
              (c: any) => c.id === novaAprovacao.cliente_portal_id
            )?.obra_id;
            if (!obra) return;
            createAprovacao.mutate({
              ...novaAprovacao,
              obra_id: obra,
            });
            setNovaAprovacao({
              cliente_portal_id: "",
              titulo: "",
              descricao: "",
              tipo: "acabamento",
              opcoes: [],
            });
          }}
        >
          Criar aprovação
        </button>

        <div className="mt-4 space-y-2">
          {aprovacoes.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
            >
              <div>
                <p className="font-semibold text-sm">{item.titulo}</p>
                <p className="text-xs text-gray-500">{item.descricao}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.status === "pendente"
                    ? "bg-yellow-100 text-yellow-800"
                    : item.status === "aprovado"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Seção 3: Mensagens */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="h-5 w-5" /> Mensagens
        </h2>
        <div className="mb-3 flex gap-3">
          <select
            className="rounded-xl border border-border bg-card p-2 text-sm"
            value={novaMensagem.cliente_portal_id}
            onChange={(e) => {
              const cliente = clientes.find((c: any) => c.id === e.target.value);
              setNovaMensagem((prev) => ({
                ...prev,
                cliente_portal_id: e.target.value,
                obra_id: cliente?.obra_id || "",
              }));
            }}
          >
            <option value="">Cliente...</option>
            {clientes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <input
            className="flex-1 rounded-xl border border-border bg-card p-2 text-sm"
            placeholder="Digite sua mensagem..."
            value={novaMensagem.texto}
            onChange={(e) => setNovaMensagem((prev) => ({ ...prev, texto: e.target.value }))}
          />
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            disabled={!novaMensagem.cliente_portal_id || !novaMensagem.texto || !novaMensagem.obra_id}
            onClick={() => {
              sendMensagem.mutate({
                cliente_portal_id: novaMensagem.cliente_portal_id,
                obra_id: novaMensagem.obra_id,
                mensagem: novaMensagem.texto,
              });
              setNovaMensagem({ cliente_portal_id: "", obra_id: "", texto: "" });
            }}
          >
            Enviar
          </button>
        </div>

        <div className="space-y-2">
          {mensagens.slice(0, 20).map((msg: any) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 text-sm ${
                msg.direction === "interno_para_cliente"
                  ? "ml-auto max-w-xs bg-blue-50 text-blue-800"
                  : "max-w-xs bg-gray-100 text-gray-700"
              }`}
            >
              <p className="text-xs opacity-70 mb-1">
                {msg.direction === "cliente_para_interno" ? "Cliente" : "Nós"}
              </p>
              <p>{msg.mensagem}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
