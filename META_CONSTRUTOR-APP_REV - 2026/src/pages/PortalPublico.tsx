import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NavigationSafety } from "@/utils/navigationSafety";

type AllowedSections = {
  fotos?: boolean;
  cronograma?: boolean;
  aprovacoes?: boolean;
  mensagens?: boolean;
};

type PortalPayload = {
  obra?: { id: string; nome: string; endereco?: string | null; status?: string | null };
  cliente?: { nome: string; allowed_sections: AllowedSections };
  progresso?: { etapas_concluidas: number; etapas_pendentes: number; percentual_concluido?: number };
  fotos?: Array<{ id: string; url: string; descricao?: string | null; data?: string | null }>;
  aprovacoes_pendentes?: Array<{ id: string; titulo: string; descricao: string; tipo: string; opcoes: unknown; created_at: string }>;
  mensagens_recentes?: Array<{ id: string; direction: string; author_type: string; mensagem: string; created_at: string }>;
};

const PortalPublicoInner = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<PortalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const sections = useMemo(
    () => payload?.cliente?.allowed_sections || {},
    [payload]
  );

  useEffect(() => {
    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    const base = import.meta.env.VITE_SUPABASE_URL || "";
    const endpoint = `${base}/functions/v1/portal-client-bootstrap`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(`${endpoint}?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Falha ao carregar portal (${res.status}).`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.error) throw new Error(data.error);
        setPayload({
          obra: data.obra,
          cliente: data.cliente,
          progresso: data.progresso,
          fotos: data.fotos,
          aprovacoes_pendentes: data.aprovacoes_pendentes,
          mensagens_recentes: data.mensagens_recentes,
        });
      })
      .catch((err) => {
        setError(err.message || "Falha ao carregar portal.");
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => clearTimeout(timeout);
  }, [token]);

  const approveItem = async (aprovacaoId: string, aprovado: boolean, comentario?: string) => {
    const base = import.meta.env.VITE_SUPABASE_URL || "";
    const endpoint = `${base}/functions/v1/portal-client-approve-item`;
    const url = new URL(endpoint);
    url.searchParams.set("token", token || "");

    try {
      setSubmitting(aprovacaoId);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ aprovacao_id: aprovacaoId, aprovado, comentario }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Falha ao responder (${res.status}).`);
      }
      setPayload((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          aprovacoes_pendentes:
            prev.aprovacoes_pendentes?.filter((item) => {
              const value = item as { id?: string };
              return value.id !== aprovacaoId;
            }) || [],
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao responder.";
      alert(message);
    } finally {
      setSubmitting(null);
    }
  };

  const sendMessage = async (mensagem: string) => {
    if (!mensagem.trim()) return;
    const base = import.meta.env.VITE_SUPABASE_URL || "";
    const endpoint = `${base}/functions/v1/portal-client-send-message`;
    const url = new URL(endpoint);
    url.searchParams.set("token", token || "");

    try {
      setSubmitting("msg");
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mensagem }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Falha ao enviar mensagem (${res.status}).`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar mensagem.";
      alert(message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-10 text-sm">
          Carregando portal do cliente...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-10 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-10 text-sm">
          Portal indisponível.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <header className="mb-8 flex flex-col gap-3">
          <h1 className="text-2xl font-bold">Portal do Cliente</h1>
          <p className="text-sm text-muted-foreground">
            {payload.obra?.nome && <>Obra: <span className="font-semibold">{payload.obra.nome}</span></>}
          </p>
          {payload.obra?.status && (
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {payload.obra.status}
            </span>
          )}
          <p className="text-xs text-muted-foreground">Bem-vindo(a), {payload.cliente?.nome || "cliente"}.</p>
        </header>

        <section className="space-y-6">
          {sections.cronograma && (
            <div className="rounded-2xl border border-border p-4">
              <h2 className="text-lg font-semibold">Progresso</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                  <p className="text-xl font-bold">{payload.progresso?.etapas_concluidas ?? 0}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold">{payload.progresso?.etapas_pendentes ?? 0}</p>
                </div>
              </div>
              {typeof payload.progresso?.percentual_concluido === "number" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Percentual: {(payload.progresso.percentual_concluido ?? 0).toFixed(2)}%
                </p>
              )}
            </div>
          )}

          {sections.fotos && (
            <div className="rounded-2xl border border-border p-4">
              <h2 className="text-lg font-semibold">Fotos</h2>
              <p className="text-xs text-muted-foreground">Registros visuais recentes da obra.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(payload.fotos || []).slice(0, 12).map((foto) => (
                  <div key={foto.id} className="rounded-xl border border-border bg-muted/30">
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                      <img
                        src={foto.url}
                        alt={foto.descricao || "Foto da obra"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-semibold">{foto.descricao || "Sem título"}</p>
                      <p className="text-[11px] text-muted-foreground">{foto.data ? new Date(foto.data).toLocaleString("pt-BR") : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
              {(payload.fotos || []).length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">Nenhuma foto cadastrada.</p>
              )}
            </div>
          )}

          {sections.aprovacoes && (
            <div className="rounded-2xl border border-border p-4">
              <h2 className="text-lg font-semibold">Aprovações</h2>
              <p className="text-xs text-muted-foreground">Itens aguardando sua avaliação.</p>
              <div className="mt-3 space-y-3">
                {(payload.aprovacoes_pendentes || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem aprovações pendentes.</p>
                ) : (
                  payload.aprovacoes_pendentes?.map((ap) => (
                    <div key={ap.id} className="rounded-xl border border-border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{ap.titulo}</p>
                          <p className="text-xs text-muted-foreground">{ap.descricao}</p>
                          <p className="text-[11px] text-muted-foreground">Tipo: {ap.tipo}</p>
                        </div>
                        <span className="rounded-full bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                          Pendente
                        </span>
                      </div>

                      {(ap.opcoes && Array.isArray(ap.opcoes) && ap.opcoes.length > 0) && (
                        <div className="mt-3 space-y-2">
                          {(ap.opcoes as Array<{ nome?: string; imagem?: string }>).map((opcao, idx) => (
                            <div key={idx} className="rounded-lg border border-border/70 bg-background p-2">
                              {opcao.imagem && (
                                <img src={opcao.imagem} alt={opcao.nome || `Opção ${idx + 1}`} className="h-24 w-full rounded-md object-cover" />
                              )}
                              <p className="mt-1 text-xs font-semibold">{opcao.nome || `Opção ${idx + 1}`}</p>
                              <div className="mt-1 flex gap-2">
                                <button
                                  type="button"
                                  disabled={!!submitting}
                                  onClick={() => approveItem(ap.id, true)}
                                  className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                                >
                                  Aprovar
                                </button>
                                <button
                                  type="button"
                                  disabled={!!submitting}
                                  onClick={() => approveItem(ap.id, false)}
                                  className="inline-flex items-center rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:opacity-60"
                                >
                                  Rejeitar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!ap.opcoes || !Array.isArray(ap.opcoes) || ap.opcoes.length === 0) && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={!!submitting}
                            onClick={() => approveItem(ap.id, true)}
                            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            disabled={!!submitting}
                            onClick={() => approveItem(ap.id, false)}
                            className="inline-flex items-center rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:opacity-60"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {sections.mensagens && (
            <div className="rounded-2xl border border-border p-4">
              <h2 className="text-lg font-semibold">Mensagens</h2>
              <p className="text-xs text-muted-foreground">Canal direto com a equipe.</p>
              <div className="mt-3 space-y-3">
                {(payload.mensagens_recentes || []).map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-border/70 bg-muted/30 p-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {msg.author_type === "cliente" ? "Você" : "Equipe"} • {new Date(msg.created_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-sm">{msg.mensagem}</p>
                  </div>
                ))}
                {(payload.mensagens_recentes || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
                )}
              </div>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  const mensagem = String(form.get("mensagem") || "");
                  sendMessage(mensagem);
                  e.currentTarget.reset();
                }}
              >
                <label htmlFor="mensagem" className="sr-only">Mensagem</label>
                <input
                  id="mensagem"
                  name="mensagem"
                  type="text"
                  required
                  disabled={!!submitting}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!!submitting}
                  className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}
        </section>

        <footer className="mt-10 pb-8 text-center text-xs text-muted-foreground">
          <button type="button" onClick={() => NavigationSafety.safeNavigate(navigate, "/home")} className="font-semibold text-primary hover:underline cursor-pointer">
            Voltar para o site
          </button>
        </footer>
      </div>
    </div>
  );
};

const PortalPublico = () => {
  const { token } = useParams();
  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl px-4 py-10 text-sm">
          Portal indisponível.
        </div>
      </div>
    );
  }
  return <PortalPublicoInner />;
};

export default PortalPublico;
