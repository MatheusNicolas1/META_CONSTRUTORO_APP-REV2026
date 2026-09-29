import { cn } from '@/lib/utils';
import type { PublicRouteStatus } from '@/config/publicRoutes';

const styles: Record<PublicRouteStatus, { label: string; className: string }> = {
  ativa: { label: 'Ativa', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  nova: { label: 'Nova', className: 'bg-brand-orange-ghost text-orange-800 ring-orange-200' },
  consolidar: { label: 'Consolidar', className: 'bg-neutral-100 text-neutral-700 ring-neutral-200' },
};

export function RouteStatusBadge({ status, className }: { status: PublicRouteStatus; className?: string }) {
  const style = styles[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset',
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
