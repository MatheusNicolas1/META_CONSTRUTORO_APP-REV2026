import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "./PortalClientePublicoHeader";

type AllowedSections = {
  fotos?: boolean;
  cronograma?: boolean;
  aprovacoes?: boolean;
  mensagens?: boolean;
};

type PublicDashboardData = {
  obra: {
    id: string;
    nome: string;
    endereco?: string | null;
    status?: string | null;
  };
  cliente: {
    nome: string;
    allowed_sections: AllowedSections;
  };
  progresso: {
    etapas_concluidas: number;
    etapas_pendentes: number;
    percentual_concluido?: number;
  };
  fotos: Array<{
    id: string;
    url: string;
    descricao?: string | null;
    data?: string | null;
  }>;
  aprovacoes_pendentes: Array<{
    id: string;
    titulo: string;
    descricao: string;
    tipo: string;
    opcoes: any;
    created_at: string;
  }>;
  mensagens_recentes: Array<{
    id: string;
    direction: string;
    author_type: string;
    mensagem: string;
    created_at: string;
  }>;
};

const BOOTSTRAP_URL = process.env.NODE_ENV === "production"
  ? "https://<PROJECT_REF>.supabase.co/functions/v1/portal-client-bootstrap"
  : "http://localhost:54321/functions/v1/portal-client-bootstrap";

const REPORT_URL = process.env.NODE_ENV === "production"
  ? "https://<PROJECT_REF>.supabase.co/functions/v1/portal-client-final-report"
  : "http://localhost:54321/functions/v1/portal-client-final-report";

export default function PortalClientePublico() {
  const { token } = useParams<{ token: string }>();
  const [dados, setDados] = useState<PublicDashboardData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarPortal = useCallback(async () => {
    if (!token) return;
    try {
      setCarregando(true);
      const res = await fetch(BOOTSTRAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const texto = await res.text().catch(() => "");
        setErro(texto || "Erro ao acessar portal");
        return;
      }
      const json: PublicDashboardData = await res.json();
      setDados(json);
    } catch (e: any) {
      setErro(e.message || "Falha de rede");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarPortal();
  }, [carregarPortal]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-500">Carregando portal...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">Portal indisponível</h1>
          <p className="mt-2 text-gray-600">{erro}</p>
        </div>
      </div>
    );
  }

  if (!dados) return null;

  const { obra, cliente, progresso, fotos, aprovacoes_pendentes, mensagens_recentes } = dados;
  const sections = cliente.allowed_sections;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <Header obra={obra} />

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Progresso */}
        {sections.cronograma !== false && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800">Progresso</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Concluídas</span>
                <p className="text-2xl font-bold text-green-600">{progresso.etapas_concluidas}</p>
              </div>
              <div>
                <span className="text-gray-500">Pendentes</span>
                <p className="text-2xl font-bold text-orange-500">{progresso.etapas_pendentes}</p>
              </div>
            </div>
            {typeof progresso.percentual_concluido === "number" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Concluído</span>
                  <span className="font-semibold">{progresso.percentual_concluido}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${progresso.percentual_concluido}%` }}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Fotos */}
        {sections.fotos !== false && fotos.length > 0 && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800">Fotos da obra</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {fotos.slice(0, 6).map((foto) => (
                <img
                  key={foto.id}
                  src={foto.url}
                  alt={foto.descricao || "Foto da obra"}
                  className="h-32 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Aprovações pendentes */}
        {sections.aprovacoes !== false && aprovacoes_pendentes.length > 0 && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800">Aprovações pendentes</h2>
            <ul className="mt-3 space-y-3">
              {aprovacoes_pendentes.map((item) => (
                <li key={item.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="text-sm font-semibold">{item.titulo}</p>
                  <p className="mt-1 text-xs text-gray-600">{item.descricao}</p>
                  <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {item.tipo}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Mensagens */}
        {sections.mensagens !== false && mensagens_recentes.length > 0 && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-gray-800">Mensagens</h2>
            <ul className="mt-3 space-y-3">
              {mensagens_recentes.slice(0, 5).map((msg) => (
                <li
                  key={msg.id}
                  className={`rounded-xl p-3 text-sm ${
                    msg.direction === "cliente_para_interno"
                      ? "bg-blue-50 text-blue-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {msg.mensagem}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Relatório final */}
        {token && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <a
              href={`${REPORT_URL}?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar relatório final
            </a>
          </section>
        )}

        {/* Rodapé */}
        <footer className="mt-10 text-center text-xs text-gray-400">
          Portal do Cliente • Meta Construtor
        </footer>
      </main>
    </div>
  );
}
