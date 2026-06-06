import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElement {
  width: number;
  height: number;
  top: string;
  left: string;
  color: string;
  duration: number;
  delay: number;
  blur?: string;
}

interface FloatingElementsProps {
  className?: string;
  count?: number;
  colors?: string[];
  blur?: string;
}

const defaultColors = [
  'bg-brand-orange/5',
  'bg-brand-emerald/5',
  'bg-blue-400/5',
  'bg-purple-400/5',
  'bg-pink-400/5',
  'bg-yellow-400/5',
];

function generateElements(count: number, colors: string[], blur: string): FloatingElement[] {
  return Array.from({ length: count }, (_, i) => ({
    width: 200 + Math.random() * 400,
    height: 200 + Math.random() * 400,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    color: colors[i % colors.length],
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
    blur,
  }));
}

export function FloatingElements({
  className = '',
  count = 4,
  colors = defaultColors,
  blur = 'blur-3xl',
}: FloatingElementsProps) {
  const elements = React.useMemo(
    () => generateElements(count, colors, blur),
    [count, colors, blur]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${el.color} ${el.blur} opacity-30 md:opacity-100`}
          style={{
            width: el.width,
            height: el.height,
            top: el.top,
            left: el.left,
          }}
          animate={{
            x: [0, 50 + Math.random() * 50, 0],
            y: [0, -(20 + Math.random() * 30), 0],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: el.delay,
          }}
        />
      ))}
    </div>
  );
}
