import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { publicFooter, publicLegal, routes, type PublicRouteItem } from '@/config/publicRoutes';
import { RouteLink } from './PublicMegaNav';
import { RouteStatusBadge } from './RouteStatusBadge';

interface PublicSiteFooterProps {
  onPendingRoute?: (item: PublicRouteItem) => void;
  showStatus?: boolean;
}

/** Rodapé denso (benchmark Canva): links internos por intenção, alimentados por `publicRoutes`. */
export default function PublicSiteFooter({ onPendingRoute, showStatus = false }: PublicSiteFooterProps) {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="container mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {/* "META" usa azul-escuro fixo no Logo; clareado aqui para contraste no fundo escuro. */}
            <Link
              to={routes.home.path}
              aria-label="Meta Construtor, página inicial"
              className="inline-flex [&_span:first-child]:text-neutral-100"
            >
              <Logo size="md" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Plataforma de gestão de obras para construtoras brasileiras. RDO digital, checklists, equipes, documentos e
              relatórios em um só lugar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={routes.criarConta.path}
                className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover"
              >
                Criar conta grátis
              </Link>
              <Link
                to={routes.contato.path}
                className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
              >
                Falar com vendas
              </Link>
            </div>
          </div>

          <nav aria-label="Mapa do site" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {publicFooter.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-semibold text-white">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.items.map((item) => (
                    <li key={item.path + item.label}>
                      <RouteLink
                        item={item}
                        onPendingRoute={onPendingRoute}
                        className="inline-flex flex-wrap items-center gap-1.5 text-sm leading-snug transition-colors hover:text-white"
                      >
                        {item.label}
                        {showStatus && <RouteStatusBadge status={item.status} />}
                      </RouteLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-neutral-800 pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Meta Construtor. Todos os direitos reservados.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {publicLegal.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
