import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
}

const Logo = ({ className, size = "md", variant = "full" }: LogoProps) => {
  const sizeClasses = {
    full: {
      sm: "text-base",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    },
    icon: {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-14 w-14 text-lg",
    },
  };

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20",
          sizeClasses.icon[size],
          className
        )}
        aria-label="Meta Construtor"
      >
        <span className="font-black leading-none">MC</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-baseline gap-1.5 whitespace-nowrap leading-none tracking-normal",
        sizeClasses.full[size],
        className
      )}
      aria-label="Meta Construtor"
    >
      <span className="font-black uppercase text-construction-blue">
        META
      </span>
      <span className="font-black uppercase text-construction-orange">Construtor</span>
    </div>
  );
};

export default Logo;
