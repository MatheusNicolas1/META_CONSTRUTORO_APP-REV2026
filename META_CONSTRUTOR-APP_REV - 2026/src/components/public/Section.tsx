import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
  containerWidth?: string;
}

/**
 * Section — wrapper de seção com padding vertical, container centralizado
 * e suporte a fundo escuro. Ideal para landing pages.
 */
export function Section({
  children,
  className = '',
  dark = false,
  id,
  containerWidth = 'max-w-7xl',
}: SectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`py-12 md:py-20 ${dark ? 'bg-neutral-900 text-white' : 'bg-white'} ${className}`}
    >
      <div className={`container ${containerWidth} mx-auto px-4 sm:px-6`}>
        {children}
      </div>
    </motion.section>
  );
}
