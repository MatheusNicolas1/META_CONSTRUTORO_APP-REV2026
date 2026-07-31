import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  hasImage?: boolean;
  hasAvatar?: boolean;
}

export function SkeletonCard({
  className,
  lines = 3,
  hasImage = false,
  hasAvatar = false,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      {hasImage && (
        <div className="w-full h-32 rounded-lg bg-muted" />
      )}
      <div className="space-y-2">
        {hasAvatar && (
          <div className="flex items-center gap-3 pb-1">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="w-24 h-3 rounded bg-muted" />
          </div>
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded bg-muted",
              i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden="true">
      <div className="flex gap-4 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-muted flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b border-border/50">
          <div className="h-3 rounded bg-muted flex-[2]" />
          <div className="h-3 rounded bg-muted flex-1" />
          <div className="h-3 rounded bg-muted flex-1" />
          <div className="h-3 rounded bg-muted w-16" />
        </div>
      ))}
    </div>
  );
}
