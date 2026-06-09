import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePricingNavigation } from '@/hooks/usePricingNavigation';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useAuth } from '@/components/auth/AuthContext';
import { LogOut } from 'lucide-react';

const menuItems = [
  { name: 'Apresentação', href: '/home' },
  { name: 'Preço', href: '/preco' },
  { name: 'Blog', href: '/blog' },
  { name: 'Sobre', href: '/sobre' },
  { name: 'Contato', href: '/contato' },
];

const LandingNavigation = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateToFreePlan } = usePricingNavigation();
  const { isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    document.body.classList.add('marketing-surface');

    return () => {
      document.body.classList.remove('marketing-surface');
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (href: string) => {
    navigate(href);
    setMenuState(false);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Check if current path matches menu item
  const isActive = (href: string) => {
    if (href === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === href;
  };

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : 'closed'}
        className="fixed z-50 w-full px-2 group"
      >
        <div className={cn(
          'mx-auto mt-2 max-w-6xl px-4 transition-colors duration-200 sm:px-6 lg:px-12',
          isScrolled && 'border bg-background/95'
        )}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <button
                onClick={() => navigate('/home')}
                aria-label="MetaConstrutor"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Logo size="md" className="text-primary" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Fechar Menu' : 'Abrir Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:opacity-0 m-auto size-6 transition-opacity duration-200" />
                <X className="group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 opacity-0 transition-opacity duration-200" />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm leading-none">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "block relative transition-colors duration-150",
                        isActive(item.href)
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-accent-foreground"
                      )}
                    >
                      <span>{item.name}</span>
                      {isActive(item.href) && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop & Mobile Menu Actions */}
            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-4 hidden w-full max-w-full flex-wrap items-center justify-end space-y-6 border p-4 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-0 lg:bg-transparent lg:p-0 dark:lg:bg-transparent">
              {/* Mobile Navigation */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base leading-none">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "block transition-colors duration-150",
                          isActive(item.href)
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-accent-foreground"
                        )}
                      >
                        <span>{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full min-w-0 flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/login')}
                      className={cn(isScrolled && 'hidden', 'touch-manipulation h-10 sm:h-9 text-sm font-medium leading-none')}
                    >
                      <span>Login</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/criar-conta')}
                      className={cn(isScrolled && 'hidden', 'touch-manipulation h-10 sm:h-9 text-sm font-semibold leading-none')}
                    >
                      <span>Começar Gratuitamente</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/criar-conta')}
                      className={cn(isScrolled ? 'inline-flex' : 'hidden', 'touch-manipulation h-10 sm:h-9 text-sm font-semibold leading-none')}
                    >
                      <span>Começar</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOut()}
                      className="touch-manipulation h-10 sm:h-9 text-sm font-medium leading-none"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Sair</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/app/dashboard')}
                      className="touch-manipulation h-10 sm:h-9 text-sm font-semibold leading-none"
                    >
                      <span>Dashboard</span>
                      <ArrowRight className="ml-1 h-4 w-4 hidden sm:inline-block" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavigation;
