import React from 'react';
import Logo from '@/components/Logo';

/**
 * PublicNav — Navegação principal do site público.
 */
export default function PublicNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200/50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="/home" className="flex items-center">
            <Logo size="md" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="/home#funcionalidades" className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors">Funcionalidades</a>
            <a href="/preco" className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors">Planos</a>
            <a href="/sobre" className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors">Sobre</a>
            <a href="/contato" className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors">Contato</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-medium text-neutral-700 hover:text-brand-orange transition-colors">Entrar</a>
            <a href="/cadastro" className="text-sm font-medium bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-orange-dark transition-colors">Começar</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
