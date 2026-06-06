import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
  delay?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  label,
  duration = 2,
  delay = 0,
  className = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [isInView, target, duration, delay]);

  const displayValue = count.toFixed(decimals);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
      className={`text-center ${className}`}
    >
      <div className="text-2xl md:text-4xl font-extrabold text-brand-orange mb-1">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="text-xs md:text-sm text-neutral-500">{label}</div>
    </motion.div>
  );
}
