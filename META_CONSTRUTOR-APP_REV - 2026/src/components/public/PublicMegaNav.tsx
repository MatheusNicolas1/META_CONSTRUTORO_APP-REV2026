import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';
import {
  isNavMenu,
  publicNav,
  routes,
  type PublicNavMenu,
  type PublicRouteItem,
} from '@/config/publicRoutes';
import { RouteStatusBadge } from './RouteStatusBadge';

interface PublicMegaNavProps {
  /** Intercepta cliques em rotas ainda não criadas (usado na prévia). */
  onPendingRoute?: (item: PublicRouteItem) => void;
  /** Mostra o status de cada rota ao lado do rótulo (usado na prévia). */
  showStatus?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

interface RouteLinkProps {
  item: PublicRouteItem;
  className?: string;
  children: ReactNode;
  onPendingRoute?: (item: PublicRouteItem) => void;
  onNavigate?: () => void;
}

export function RouteLink({ item, className, children, onPendingRoute, onNavigate }: RouteLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (item.status === 'nova' && onPendingRoute) {
      event.preventDefault();
      onPendingRoute(item);
      return;
    }
    onNavigate?.();
  };

  return (
    <Link to={item.path} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

export default function PublicMegaNav({ onPendingRoute, showStatus = false }: PublicMegaNavProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const intentTimer = useRef<number>();

  const duration = reduceMotion ? 0 : 0.18;

  const clearIntent = () => window.clearTimeout(intentTimer.current);

  const closeAll = useCallback(() => {
    clearIntent();
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, []);

  // Fecha menus ao trocar de rota.
  useEffect(() => {
    closeAll();
  }, [location.pathname, closeAll]);

  // Esc fecha e devolve o foco ao gatilho; clique fora fecha.
  useEffect(() => {
    if (!openMenu && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const current = openMenu;
      closeAll();
      if (current) triggerRefs.current[current]?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openMenu, mobileOpen, closeAll]);

  // Trava a rolagem da página com a gaveta aberta.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => clearIntent, []);

  const canHover = () => window.matchMedia('(hover: hover)').matches;

  const openWithIntent = (id: string) => {
    if (!canHover()) return;
    clearIntent();
    intentTimer.current = window.setTimeout(() => setOpenMenu(id), openMenu ? 0 : 90);
  };

  const closeWithIntent = () => {
    if (!canHover()) return;
    clearIntent();
    intentTimer.current = window.setTimeout(() => setOpenMenu(null), 160);
  };

  const activeMenu = publicNav.find((entry): entry is PublicNavMenu => isNavMenu(entry) && entry.id === openMenu);

  const label = (item: PublicRouteItem) => (
    <>
      {item.label}
      {showStatus && <RouteStatusBadge status={item.status} />}
    </>
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white"
      onMouseLeave={closeWithIntent}
      onMouseEnter={clearIntent}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
        <Link to={routes.home.path} className="flex shrink-0 items-center" aria-label="Meta Construtor, página inicial">
          <Logo size="sm" className="text-primary" />
        </Link>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {publicNav.map((entry) =>
              isNavMenu(entry) ? (
                <li key={entry.id}>
                  <button
                    ref={(el) => {
                      triggerRefs.current[entry.id] = el;
                    }}
                    type="button"
                    aria-expanded={openMenu === entry.id}
                    aria-controls={`menu-${entry.id}`}
                    onClick={() => setOpenMenu((current) => (current === entry.id ? null : entry.id))}
                    onMouseEnter={() => openWithIntent(entry.id)}
                    className={cn(
                      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 xl:px-3.5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2',
                      openMenu === entry.id
                        ? 'bg-brand-orange-ghost text-orange-700'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    )}
                  >
                    {entry.label}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn('h-4 w-4 transition-transform duration-200', openMenu === entry.id && 'rotate-180')}
                    />
                  </button>
                </li>
              ) : (
                <li key={entry.id} onMouseEnter={closeWithIntent}>
                  <RouteLink
                    item={entry.item}
                    onPendingRoute={onPendingRoute}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 xl:px-3.5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2',
                      location.pathname === entry.item.path
                        ? 'bg-brand-orange-ghost text-orange-700'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                    )}
                  >
                    {entry.label}
                    {showStatus && <RouteStatusBadge status={entry.item.status} className="hidden xl:inline-flex" />}
                  </RouteLink>
                </li>
              )
            )}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link
            to={routes.login.path}
            className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            Entrar
          </Link>
          <Link
            to={routes.contato.path}
            className="hidden rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 xl:inline-flex"
          >
            Falar com vendas
          </Link>
          <Link
            to={routes.criarConta.path}
            className="whitespace-nowrap rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange-hover"
          >
            Criar conta grátis
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-800 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="menu-celular"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mega menu (desktop) */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            key={activeMenu.id}
            id={`menu-${activeMenu.id}`}
            role="region"
            aria-label={activeMenu.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration, ease: EASE }}
            className="absolute inset-x-0 top-full hidden border-b border-neutral-200 bg-white shadow-[0_24px_48px_-24px_rgba(23,23,23,0.18)] lg:block"
          >
            <div className="container mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 py-8 sm:px-6">
              <div className={cn('col-span-9 grid gap-6', activeMenu.groups.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
                {activeMenu.groups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{group.title}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item.path}>
                          <RouteLink
                            item={item}
                            onPendingRoute={onPendingRoute}
                            onNavigate={closeAll}
                            className="group block rounded-xl px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-brand-orange-ghost focus-visible:bg-brand-orange-ghost focus-visible:ring-2 focus-visible:ring-brand-orange"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 group-hover:text-orange-700">
                              {label(item)}
                            </span>
                            {item.description && (
                              <span className="mt-0.5 block text-sm leading-snug text-neutral-600">{item.description}</span>
                            )}
                          </RouteLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {activeMenu.feature && (
                <div className="col-span-3">
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <img
                      src={activeMenu.feature.image}
                      alt={activeMenu.feature.imageAlt}
                      width={640}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full rounded-xl border border-neutral-200 bg-white object-cover object-top"
                    />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-orange-700">
                      {activeMenu.feature.eyebrow}
                    </p>
                    <p className="mt-1 text-base font-bold text-neutral-900">{activeMenu.feature.title}</p>
                    <p className="mt-1 text-sm leading-snug text-neutral-600">{activeMenu.feature.description}</p>
                    <RouteLink
                      item={activeMenu.feature.cta}
                      onPendingRoute={onPendingRoute}
                      onNavigate={closeAll}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-700 transition-colors hover:text-orange-800"
                    >
                      Conhecer <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </RouteLink>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gaveta (celular e tablet) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="menu-celular"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-white lg:hidden"
          >
            <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
              <ul className="divide-y divide-neutral-100">
                {publicNav.map((entry) =>
                  isNavMenu(entry) ? (
                    <li key={entry.id}>
                      <button
                        type="button"
                        aria-expanded={mobileSection === entry.id}
                        aria-controls={`secao-${entry.id}`}
                        onClick={() => setMobileSection((current) => (current === entry.id ? null : entry.id))}
                        className="flex w-full items-center justify-between py-4 text-left text-base font-semibold text-neutral-900"
                      >
                        {entry.label}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            'h-5 w-5 text-neutral-500 transition-transform duration-200',
                            mobileSection === entry.id && 'rotate-180'
                          )}
                        />
                      </button>
                      {mobileSection === entry.id && (
                        <motion.div
                          id={`secao-${entry.id}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration, ease: EASE }}
                          className="space-y-5 pb-5"
                        >
                          {entry.groups.map((group) => (
                            <div key={group.title}>
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                {group.title}
                              </p>
                              <ul>
                                {group.items.map((item) => (
                                  <li key={item.path}>
                                    <RouteLink
                                      item={item}
                                      onPendingRoute={onPendingRoute}
                                      onNavigate={closeAll}
                                      className="block rounded-lg py-2 pr-2"
                                    >
                                      <span className="flex items-center gap-2 text-[15px] font-medium text-neutral-900">
                                        {label(item)}
                                      </span>
                                      {item.description && (
                                        <span className="block text-sm leading-snug text-neutral-600">{item.description}</span>
                                      )}
                                    </RouteLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </li>
                  ) : (
                    <li key={entry.id}>
                      <RouteLink
                        item={entry.item}
                        onPendingRoute={onPendingRoute}
                        onNavigate={closeAll}
                        className="flex items-center gap-2 py-4 text-base font-semibold text-neutral-900"
                      >
                        {entry.label}
                        {showStatus && <RouteStatusBadge status={entry.item.status} />}
                      </RouteLink>
                    </li>
                  )
                )}
              </ul>
            </nav>

            <div className="grid gap-2 border-t border-neutral-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
              <Link
                to={routes.criarConta.path}
                onClick={closeAll}
                className="rounded-full bg-brand-orange py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-orange-hover"
              >
                Criar conta grátis
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={routes.login.path}
                  onClick={closeAll}
                  className="rounded-full border border-neutral-300 py-2.5 text-center text-sm font-medium text-neutral-800"
                >
                  Entrar
                </Link>
                <Link
                  to={routes.contato.path}
                  onClick={closeAll}
                  className="rounded-full border border-neutral-300 py-2.5 text-center text-sm font-medium text-neutral-800"
                >
                  Falar com vendas
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
