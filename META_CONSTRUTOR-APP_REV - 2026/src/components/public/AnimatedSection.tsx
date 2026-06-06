import React, { useRef } from 'react';
import { motion, useInView, Variants, type UseInViewOptions } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  margin?: string;
  variants?: Variants;
  id?: string;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export function AnimatedSection({
  children,
  className = '',
  dark = false,
  delay = 0,
  duration = 0.8,
  distance = 40,
  once = true,
  margin = '-80px',
  variants,
  id,
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: margin as UseInViewOptions['margin'] });

  const customVariants: Variants = variants || {
    hidden: { opacity: 0, y: distance, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={customVariants}
      className={`py-12 md:py-20 ${dark ? 'bg-neutral-900 text-white' : 'bg-white'} ${className}`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        {children}
      </div>
    </motion.section>
  );
}
