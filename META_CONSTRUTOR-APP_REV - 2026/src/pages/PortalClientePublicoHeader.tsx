import { Link } from "react-router-dom";

type ObraInfo = {
  id: string;
  nome: string;
  endereco?: string | null;
  status?: string | null;
};

export function Header({ obra }: { obra: ObraInfo }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{obra.nome}</h1>
          {obra.endereco && (
            <p className="text-xs text-gray-500">{obra.endereco}</p>
          )}
        </div>
        {obra.status && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {obra.status}
          </span>
        )}
      </div>
    </header>
  );
}
