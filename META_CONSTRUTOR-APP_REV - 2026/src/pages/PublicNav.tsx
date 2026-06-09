import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const navLinks = [
  { to: '/home', label: 'Início' },
  { to: '/preco', label: 'Planos' },
  { to: '/sobre', label: 'Sobre' },
  { to: '/blog', label: 'Blog' },
  { to: '/contato', label: 'Contato' },
];

export default function PublicNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100/80 h-16"
      aria-label="Navegação principal"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo — mesma do Dashboard */}
        <Link
          to="/home"
          className="flex items-center shrink-0"
          aria-label="Ir para a página inicial"
        >
          <Logo size="sm" className="text-primary" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-label={link.label}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'text-neutral-700 hover:text-brand-orange hover:bg-neutral-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors"
            aria-label="Entrar na conta"
          >
            Entrar
          </Link>
          <Button className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm rounded-full" asChild>
            <Link to="/criar-conta" aria-label="Criar conta gratuita">
              Criar conta grátis
            </Link>
          </Button>
        </div>

        {/* Hamburger button — mobile */}
        <button
          type="button"
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <span className="sr-only">{isOpen ? 'Fechar menu' : 'Abrir menu'}</span>
          <div className="relative w-5 h-4 flex flex-col justify-between">
            <motion.span
              className="block h-0.5 w-full rounded-full bg-neutral-700 origin-center"
              animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
            <motion.span
              className="block h-0.5 w-full rounded-full bg-neutral-700"
              animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            />
            <motion.span
              className="block h-0.5 w-full rounded-full bg-neutral-700 origin-center"
              animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label="Menu de navegação mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-neutral-100"
          >
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-label={link.label}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={closeMenu}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-orange/10 text-brand-orange'
                        : 'text-neutral-700 hover:text-brand-orange hover:bg-neutral-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile action buttons */}
              <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100 mt-1">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors rounded-lg hover:bg-neutral-50"
                  aria-label="Entrar na conta"
                >
                  Entrar
                </Link>
                <Button
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-sm rounded-full w-full"
                  asChild
                >
                  <Link to="/criar-conta" onClick={closeMenu} aria-label="Criar conta gratuita">
                    Criar conta grátis
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
