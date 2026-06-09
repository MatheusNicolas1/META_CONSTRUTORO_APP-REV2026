import { useEffect } from 'react';

/**
 * Força o tema 'light' em páginas públicas (home, preco, sobre, contato, blog)
 * SEM alterar o localStorage do usuário — apenas aplica no <html> class.
 * Quando o usuário desmonta (sai da página pública), o tema volta ao que estava salvo.
 */
const PublicThemeEffect = () => {
  useEffect(() => {
    const root = document.documentElement;

    // Salva o tema atual antes de forçar light
    const previousClass = root.classList.contains('dark') ? 'dark' : 'light';

    // Aplica light
    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      // Restaura o tema anterior ao sair da página pública
      root.classList.remove('light');
      if (previousClass === 'dark') {
        root.classList.add('dark');
      }
    };
  }, []);

  return null;
};

export default PublicThemeEffect;
