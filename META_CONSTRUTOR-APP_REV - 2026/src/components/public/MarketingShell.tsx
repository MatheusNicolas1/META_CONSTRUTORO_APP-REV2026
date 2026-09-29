import type { ReactNode } from 'react';
import PublicMegaNav from './PublicMegaNav';
import PublicSiteFooter from './PublicSiteFooter';
import PageTransition from './PageTransition';

interface MarketingShellProps {
  children: ReactNode;
  /** Reserva a altura do cabeçalho fixo (h-16) para páginas que não têm esse espaço no próprio layout. */
  offsetHeader?: boolean;
  hideFooter?: boolean;
}

/** Cabeçalho, rodapé e transição de entrada comuns a todas as páginas públicas. */
export default function MarketingShell({ children, offsetHeader = false, hideFooter = false }: MarketingShellProps) {
  return (
    <>
      <PublicMegaNav />
      <PageTransition className={offsetHeader ? 'pt-16' : undefined}>{children}</PageTransition>
      {!hideFooter && <PublicSiteFooter />}
    </>
  );
}
