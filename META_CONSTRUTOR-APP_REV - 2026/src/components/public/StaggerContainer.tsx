import React, { useRef } from 'react';
import { motion, useInView, Variants, type TargetAndTransition, type UseInViewOptions } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  margin?: string;
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  once = true,
  margin = '-80px',
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: margin as UseInViewOptions['margin'] });

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  whileHover?: TargetAndTransition;
}

const directionVariants = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
};

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
  distance = 30,
  whileHover,
}: StaggerItemProps) {
  const dir = directionVariants[direction];

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: dir.x * distance,
      y: dir.y * distance,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} whileHover={whileHover} className={className}>
      {children}
    </motion.div>
  );
}
