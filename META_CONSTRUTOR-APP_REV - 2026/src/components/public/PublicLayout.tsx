import React from 'react';
import MarketingShell from './MarketingShell';

interface PublicLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function PublicLayout({ children, hideFooter = false }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <MarketingShell hideFooter={hideFooter}>{children}</MarketingShell>
    </div>
  );
}
