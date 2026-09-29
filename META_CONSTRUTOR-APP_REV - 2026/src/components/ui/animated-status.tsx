import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Ícone de confirmação (check) ou negação (X) desenhado em SVG: o círculo e o traço
 * aparecem em sequência (~450 ms). Sem animação com prefers-reduced-motion.
 */
export function AnimatedStatusIcon({ status, className }: { status: 'success' | 'error'; className?: string }) {
  const reduceMotion = useReducedMotion();
  const draw = (delay: number) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { pathLength: { duration: 0.28, delay, ease: EASE }, opacity: { duration: 0.01, delay } },
        };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <motion.circle cx="12" cy="12" r="10" {...draw(0)} />
      {status === 'success' ? (
        <motion.path d="M7.5 12.5l3 3 6-6.5" {...draw(0.2)} />
      ) : (
        <>
          <motion.path d="M9 9l6 6" {...draw(0.2)} />
          <motion.path d="M15 9l-6 6" {...draw(0.3)} />
        </>
      )}
    </svg>
  );
}

interface SubmitButtonProps {
  state: SubmitState;
  labels: { idle: ReactNode; loading: string; success: string; error: string };
  disabled?: boolean;
  className?: string;
}

/**
 * Botão de envio com estados: enviando (spinner), sucesso (check verde) e erro (X vermelho com
 * leve tremida). O estado é anunciado para leitores de tela.
 */
export function SubmitButton({ state, labels, disabled, className }: SubmitButtonProps) {
  const reduceMotion = useReducedMotion();
  const busy = state === 'loading';

  return (
    <motion.button
      type="submit"
      disabled={disabled || busy || state === 'success'}
      aria-busy={busy}
      animate={state === 'error' && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold text-white transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        state === 'success' && 'bg-emerald-700 focus-visible:ring-emerald-700',
        state === 'error' && 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600',
        (state === 'idle' || state === 'loading') &&
          'bg-brand-orange hover:bg-brand-orange-hover focus-visible:ring-brand-orange disabled:opacity-60',
        className
      )}
    >
      {state === 'loading' && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
      {state === 'success' && <AnimatedStatusIcon status="success" className="h-5 w-5" />}
      {state === 'error' && <AnimatedStatusIcon status="error" className="h-5 w-5" />}
      <span>{state === 'idle' ? labels.idle : labels[state]}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'idle' ? '' : labels[state]}
      </span>
    </motion.button>
  );
}
