import React, { Suspense, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';

interface SafeSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * Componente que combina Suspense com ErrorBoundary
 * para um carregamento mais seguro e estável
 */
export const SafeSuspense: React.FC<SafeSuspenseProps> = ({
  children,
  fallback,
  errorFallback
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="md" text="Carregando..." />
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback === undefined ? defaultFallback : fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
