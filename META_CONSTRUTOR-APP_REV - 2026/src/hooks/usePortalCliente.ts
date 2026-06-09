import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

/** Types for the public portal data (client-facing dashboard) */
export type AllowedSections = {
  fotos?: boolean;
  cronograma?: boolean;
  aprovacoes?: boolean;
  mensagens?: boolean;
};

export type PortalObra = {
  id: string;
  nome: string;
  endereco?: string | null;
  status?: string | null;
};

export type PortalCliente = {
  nome: string;
  allowed_sections: AllowedSections;
};

export type PortalFoto = {
  id: string;
  url: string;
  descricao?: string | null;
  data?: string | null;
};

export type PortalAprovacao = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  opcoes: unknown;
  created_at: string;
};

export type PortalMensagem = {
  id: string;
  direction: string;
  author_type: string;
  mensagem: string;
  created_at: string;
};

export type PortalPayload = {
  obra?: PortalObra;
  cliente?: PortalCliente;
  progresso?: {
    etapas_concluidas: number;
    etapas_pendentes: number;
    percentual_concluido?: number;
  };
  fotos?: PortalFoto[];
  aprovacoes_pendentes?: PortalAprovacao[];
  mensagens_recentes?: PortalMensagem[];
};

export type PortalState = {
  payload: PortalPayload | null;
  error: string | null;
  loading: boolean;
  submitting: string | null;
  sections: AllowedSections;
};

export type PortalActions = {
  approveItem: (aprovacaoId: string, aprovado: boolean, comentario?: string) => Promise<void>;
  sendMessage: (mensagem: string) => Promise<void>;
  refresh: () => void;
};

function getApiBase(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL as string;
  }
  return "http://localhost:54321";
}

function buildUrl(token: string, path: string): string {
  const base = getApiBase();
  const url = new URL(`${base}/functions/v1/${path}`);
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Unified hook for the public client portal.
 *
 * Handles bootstrap loading, approve/reject flow, and messaging.
 * Shared between PortalPublico and PortalClientePublico pages.
 */
export function usePortalCliente(): PortalState & PortalActions {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<PortalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const sections = useMemo(
    () => payload?.cliente?.allowed_sections || ({} as AllowedSections),
    [payload]
  );

  const carregarPortal = useCallback(async () => {
    if (!token) {
      setError("Token inválido.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(buildUrl(token, "portal-client-bootstrap"), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : `Falha ao carregar portal (${res.status}).`
        );
      }

      const data = await res.json() as Record<string, unknown>;
      if (typeof data?.error === "string") throw new Error(data.error);

      setPayload({
        obra: data.obra as PortalObra,
        cliente: data.cliente as PortalCliente,
        progresso: data.progresso as PortalPayload["progresso"],
        fotos: data.fotos as PortalFoto[],
        aprovacoes_pendentes: data.aprovacoes_pendentes as PortalAprovacao[],
        mensagens_recentes: data.mensagens_recentes as PortalMensagem[],
      });
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Falha ao carregar portal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarPortal();
  }, [carregarPortal, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const approveItem = useCallback(
    async (aprovacaoId: string, aprovado: boolean, comentario?: string) => {
      if (!token) return;
      try {
        setSubmitting(aprovacaoId);
        const res = await fetch(buildUrl(token, "portal-client-approve-item"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ aprovacao_id: aprovacaoId, aprovado, comentario }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (!res.ok || data?.error) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : `Falha ao responder (${res.status}).`
          );
        }
        setPayload((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            aprovacoes_pendentes:
              prev.aprovacoes_pendentes?.filter(
                (item) => item.id !== aprovacaoId
              ) || [],
          };
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao responder.";
        alert(message);
      } finally {
        setSubmitting(null);
      }
    },
    [token]
  );

  const sendMessage = useCallback(
    async (mensagem: string) => {
      if (!mensagem.trim() || !token) return;
      try {
        setSubmitting("msg");
        const res = await fetch(buildUrl(token, "portal-client-send-message"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ mensagem }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        if (!res.ok || data?.error) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : `Falha ao enviar mensagem (${res.status}).`
          );
        }
        refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Falha ao enviar mensagem.";
        alert(message);
      } finally {
        setSubmitting(null);
      }
    },
    [token, refresh]
  );

  return {
    payload,
    error,
    loading,
    submitting,
    sections,
    approveItem,
    sendMessage,
    refresh,
  };
}
