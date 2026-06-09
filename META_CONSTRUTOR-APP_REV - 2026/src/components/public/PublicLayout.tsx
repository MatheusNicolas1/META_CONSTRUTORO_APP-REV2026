import React from 'react';
import PublicNav from './PublicNav';
import Logo from '@/components/Logo';

interface PublicLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function PublicLayout({ children, hideFooter = false }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <PublicNav />
      {children}
      {!hideFooter && <PublicFooter />}
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="bg-neutral-950 text-neutral-400 py-12 md:py-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-10 md:mb-12">
          <div className="col-span-2">
            <a href="/home" className="flex items-center mb-4">
              <Logo size="md" className="text-neutral-300" />
            </a>
            <p className="text-xs sm:text-sm leading-relaxed max-w-xs">
              Plataforma de gestão de obras para construtoras brasileiras. RDO digital, checklists, equipes e relatórios em um só lugar.
            </p>
          </div>

          {[
            { title: 'Produto', items: [{ label: 'Funcionalidades', href: '/home#funcionalidades' }, { label: 'Planos', href: '/preco' }, { label: 'Blog', href: '/blog' }, { label: 'Atualizações', href: '/atualizacoes' }, { label: 'Status', href: '/status' }] },
            { title: 'Empresa', items: [{ label: 'Sobre', href: '/sobre' }, { label: 'Carreiras', href: '/carreiras' }, { label: 'Contato', href: '/contato' }] },
            { title: 'Suporte', items: [{ label: 'Central de Ajuda', href: '/central-ajuda' }, { label: 'Documentação', href: '/api' }, { label: 'API', href: '/api' }] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold text-sm sm:text-base mb-3 sm:mb-4">{col.title}</h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {col.items.map((item, j) => (
                  <li key={j}>
                    <a href={item.href} className="text-xs sm:text-sm hover:text-brand-orange transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-800 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm">© {new Date().getFullYear()} Meta Construtor. Todos os direitos reservados.</p>
          <div className="flex gap-4 sm:gap-6">
            <a href="/legal/privacidade" className="text-xs sm:text-sm hover:text-brand-orange transition-colors">Privacidade</a>
            <a href="/legal/termos" className="text-xs sm:text-sm hover:text-brand-orange transition-colors">Termos</a>
            <a href="/legal/lgpd" className="text-xs sm:text-sm hover:text-brand-orange transition-colors">LGPD</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
