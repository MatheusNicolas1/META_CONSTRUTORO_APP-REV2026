import React, { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

interface AnimatedOnScrollProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'span';
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  scale?: number;
  once?: boolean;
  margin?: string;
  variants?: Variants;
}

const defaultVariants = (y: number, x: number, scale: number, duration: number, delay: number): Variants => ({
  hidden: {
    opacity: 0,
    y,
    x,
    scale,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  },
});

/**
 * AnimatedOnScroll — wrapper que aplica fade-in + translate + scale
 * ao entrar na viewport. Respeita prefers-reduced-motion.
 */
export function AnimatedOnScroll({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
  duration = 0.7,
  y = 30,
  x = 0,
  scale = 1,
  once = true,
  margin = '-80px',
  variants,
}: AnimatedOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin } as any);

  const resolvedVariants = variants ?? defaultVariants(y, x, scale, duration, delay);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={resolvedVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
