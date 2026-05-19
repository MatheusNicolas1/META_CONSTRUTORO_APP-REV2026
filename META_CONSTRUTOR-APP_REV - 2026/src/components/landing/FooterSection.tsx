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
      { name: 'Integrações', href: '/api' }
    ],
    empresa: [
      { name: 'Sobre Nós', href: '/sobre' },
      { name: 'Contato', href: '/contato' },
      { name: 'Carreiras', href: '/carreiras' },
      { name: 'Blog', href: '/blog' }
    ],
    legal: [
      { name: 'Política de Privacidade', href: '/legal/privacidade' },
      { name: 'Termos de Uso', href: '/legal/termos' },
      { name: 'Cookies', href: '/legal/cookies' },
      { name: 'LGPD', href: '/legal/lgpd' }
    ],
    suporte: [
      { name: 'Central de Ajuda', href: '/central-ajuda' },
      { name: 'Documentação', href: '/documentacao' },
      { name: 'Status', href: '/status' },
      { name: 'API', href: '/api' }
    ]
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/metaconstrutor', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/metaconstrutor', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contato@metaconstrutor.com', label: 'Email' }
  ];

  // Helper to render links — internal routes use <Link>, external use <a>
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
              "text-muted-foreground hover:text-foreground transition-colors text-sm leading-relaxed break-words",
              index
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-6 sm:py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
          {/* Logo and Description */}
          <div className="min-w-0 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="sm" />
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-6 max-w-sm break-words">
              Revolucione a gestão das suas obras com a plataforma mais completa
              do mercado de construção civil.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg flex items-center justify-center transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns — using <Link> for SPA navigation */}
          {renderLinkColumn('Produto', footerLinks.produto)}
          {renderLinkColumn('Empresa', footerLinks.empresa)}
          {renderLinkColumn('Legal', footerLinks.legal)}
          {renderLinkColumn('Suporte', footerLinks.suporte)}
        </div>

        {/* Bottom Bar */}
        <div className="py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="text-sm leading-relaxed text-muted-foreground">
            © {currentYear} Meta Construtor. Todos os direitos reservados.
          </div>

          <div className="flex items-center justify-center text-sm leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Todos os sistemas operacionais</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
