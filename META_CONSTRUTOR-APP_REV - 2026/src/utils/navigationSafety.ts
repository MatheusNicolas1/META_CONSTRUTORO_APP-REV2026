import { startTransition } from 'react';

/**
 * Utilitário para fazer navegações seguras usando startTransition
 * Previne erros de suspense síncrono
 */
export class NavigationSafety {
  static wrapNavigation(navigationFn: () => void) {
    startTransition(() => {
      navigationFn();
    });
  }

  static safeNavigate(navigate: (path: string) => void, path: string) {
    startTransition(() => {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      navigate(path);
    });
  }

  static safeCallback(callback: () => void) {
    startTransition(() => {
      callback();
    });
  }
}