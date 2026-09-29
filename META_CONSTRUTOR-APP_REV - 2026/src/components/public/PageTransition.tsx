import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

// A primeira página carregada aparece sem animação (não atrasa o LCP); só as navegações seguintes animam.
let isFirstPage = true;

/**
 * Entrada suave do conteúdo ao trocar de página pública: opacidade + deslocamento curto (220 ms),
 * sem animar layout. Desligada com prefers-reduced-motion.
 */
export default function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const skip = reduceMotion || isFirstPage;

  useEffect(() => {
    isFirstPage = false;
  }, []);

  return (
    <motion.div
      key={pathname}
      className={className}
      initial={skip ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
