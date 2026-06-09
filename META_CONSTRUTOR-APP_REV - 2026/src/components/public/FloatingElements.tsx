import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// ─── Tipos ────────────────────────────────────────────────

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

// ─── Cores pré-definidas ──────────────────────────────────

const COLORS = [
  'bg-brand-orange/5',
  'bg-brand-emerald/5',
  'bg-blue-400/5',
  'bg-purple-400/5',
];

// ─── SIZES ────────────────────────────────────────────────

const SIZES = [200, 300, 350, 400];

// ─── Posições fixas para evitar recálculo ─────────────────

const POSITIONS = [
  { top: '10%', right: '5%' },
  { top: '60%', left: '5%' },
  { bottom: '15%', right: '15%' },
  { top: '35%', left: '20%' },
];

// ─── Componente com animação otimizada ────────────────────

function FloatingOrb({
  color,
  size,
  pos,
  index,
}: {
  color: string;
  size: number;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  index: number;
}) {
  // Usar keyframes CSS ao invés de Framer Motion para não gerar re-renders
  const duration = 18 + index * 4;
  const direction = index % 2 === 0 ? ['0', '30px', '-20px', '0'] : ['0', '-25px', '35px', '0'];

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${color}`}
      style={{
        width: size,
        height: size,
        ...pos,
        willChange: 'transform',
      }}
      animate={{
        x: direction,
        y: [0, -20, 15, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        repeatType: 'mirror',
      }}
    />
  );
}

// ─── Componente Principal ─────────────────────────────────

export function FloatingElements({ count = 4, className = '' }: FloatingElementsProps) {
  // Em mobile com preferência reduzida, não renderiza nada
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
         aria-hidden="true">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <FloatingOrb
          key={i}
          color={COLORS[i % COLORS.length]}
          size={SIZES[i % SIZES.length]}
          pos={POSITIONS[i % POSITIONS.length]}
          index={i}
        />
      ))}
    </div>
  );
}
