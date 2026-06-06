import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';
import Logo from '@/components/Logo';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { name: 'Funcionalidades', href: '/sobre' },
      { name: 'Preços', href: '/preco' },
      { name: 'Atualizações', href: '/atualizacoes' },
      { name: 'Integrações', href: '/api' },
    ],
    empresa: [
      { name: 'Sobre Nós', href: '/sobre' },
      { name: 'Contato', href: '/contato' },
      { name: 'Carreiras', href: '/carreiras' },
      { name: 'Blog', href: '/blog' },
    ],
    legal: [
      { name: 'Política de Privacidade', href: '/legal/privacidade' },
      { name: 'Termos de Uso', href: '/legal/termos' },
      { name: 'Cookies', href: '/legal/cookies' },
      { name: 'LGPD', href: '/legal/lgpd' },
    ],
    suporte: [
      { name: 'Central de Ajuda', href: '/central-ajuda' },
      { name: 'Documentação', href: '/documentacao' },
      { name: 'Status', href: '/status' },
      { name: 'API', href: '/api' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/metaconstrutor', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/metaconstrutor', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contato@metaconstrutor.com', label: 'Email' },
  ];

  const renderLink = (href: string, children: React.ReactNode, className: string, key: number) => {
    const isExternal = href.startsWith('http') || href.startsWith('mailto:');
    if (isExternal) {
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {children}
        </a>
      );
    }
    return (
      <Link key={key} to={href} className={className}>
        {children}
      </Link>
    );
  };

  const renderLinkColumn = (title: string, links: { name: string; href: string }[]) => (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold leading-none text-foreground mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index}>
            {renderLink(
              link.href,
              link.name,
              'text-muted-foreground hover:text-foreground transition-colors text-sm leading-relaxed break-words',
              index
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="border-t border-border bg-background p-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
          <div className="min-w-0 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="sm" />
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-6 max-w-sm break-words">
              Organize obras, RDOs, checklists, documentos e relatórios em uma
              plataforma feita para a rotina da construção civil.
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {renderLinkColumn('Produto', footerLinks.produto)}
          {renderLinkColumn('Empresa', footerLinks.empresa)}
          {renderLinkColumn('Legal', footerLinks.legal)}
          {renderLinkColumn('Suporte', footerLinks.suporte)}
        </div>

        <div className="border-t border-border px-2 py-3 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4 text-center sm:text-left">
          <div className="text-sm leading-relaxed text-muted-foreground">
            &copy; {currentYear} Meta Construtor. Todos os direitos reservados.
          </div>

          <div className="flex items-center justify-center text-sm leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Plataforma web para rotina de obras</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
