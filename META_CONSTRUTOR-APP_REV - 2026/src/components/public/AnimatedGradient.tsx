import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
}

export function AnimatedGradient({
  children,
  className = '',
  colors = ['#F97316', '#EA580C', '#FDBA74', '#F97316'],
  duration = 6,
  as: Tag = 'span',
}: AnimatedGradientProps) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  } as React.CSSProperties;

  return (
    <motion.div
      className={className}
      style={gradientStyle}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.div>
  );
}
