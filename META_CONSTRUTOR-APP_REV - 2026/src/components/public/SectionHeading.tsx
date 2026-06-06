import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeadingProps {
  tag?: string;
  title: string;
  subtitle?: string;
  gradient?: boolean;
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeading({
  tag,
  title,
  subtitle,
  gradient = true,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  const alignClasses = align === 'center' ? 'text-center' : 'text-left';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`mb-10 md:mb-16 ${alignClasses} ${className}`}
    >
      {tag && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-brand-orange font-semibold text-xs sm:text-sm tracking-wide uppercase"
        >
          {tag}
        </motion.span>
      )}
      <h2
        className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mt-2 sm:mt-3 mb-3 sm:mb-4 leading-tight ${
          gradient
            ? 'bg-gradient-to-r from-neutral-900 via-brand-orange to-brand-orange bg-clip-text text-transparent'
            : 'text-neutral-900'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-neutral-600 text-sm sm:text-lg max-w-2xl mx-auto px-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
