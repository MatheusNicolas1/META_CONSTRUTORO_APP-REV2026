import { useRef, useState } from 'react';
import { getOptimizedImageUrl } from '@/hooks/useOptimizedImage';

// ─── Tipos ────────────────────────────────────────────────

export interface CarouselItem {
  src: string;
  title: string;
  desc?: string;
  /** Para imagens verticais com mockup de celular */
  isMobile?: boolean;
}

interface TripleCarouselRowProps {
  items: CarouselItem[];
  direction: 'left' | 'right';
  speed?: number; // segundos para uma volta completa (default: 30)
  isMobile?: boolean;
}

// ─── CSS Keyframes (injetado uma vez) ─────────────────────

const KEYFRAMES_ID = 'triple-carousel-keyframes';

function injectKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes scroll-right {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes scroll-left {
      0% { transform: translateX(-50%); }
      100% { transform: translateX(0); }
    }
    .triple-scroll-right {
      animation: scroll-right var(--scroll-speed) linear infinite;
      will-change: ${prefersReducedMotion ? 'auto' : 'transform'};
    }
    .triple-scroll-left {
      animation: scroll-left var(--scroll-speed) linear infinite;
      will-change: ${prefersReducedMotion ? 'auto' : 'transform'};
    }
    .triple-scroll-paused {
      animation-play-state: paused !important;
    }
    /* Mobile: reduz velocidade para evitar tremor */
    @media (max-width: 768px) {
      .triple-scroll-right,
      .triple-scroll-left {
        animation-duration: calc(var(--scroll-speed) * 1.5);
      }
    }
    /* Reduced motion: pausa o carrossel */
    @media (prefers-reduced-motion: reduce) {
      .triple-scroll-right,
      .triple-scroll-left {
        animation: none !important;
        transform: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// ─── Imagem com Mockup de Celular ─────────────────────────

function MobileMockupImage({ src, title }: { src: string; title: string }) {
  const optimizedSrc = getOptimizedImageUrl(src, { width: 300 }) || src;
  return (
    <div className="relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] contain-layout">
      <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
        <div className="relative rounded-[1.75rem] sm:rounded-[2rem] border-[3px] sm:border-[4px] border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden"
             style={{ aspectRatio: '9/19' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 sm:h-6 bg-neutral-900 rounded-b-xl z-10 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-700" />
          </div>
          <div className="absolute inset-[3px] sm:inset-[4px] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden bg-white">
            <img
              src={optimizedSrc}
              alt={title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <p className="text-center text-[10px] sm:text-xs text-neutral-400 mt-2 truncate px-1 font-medium">
          {title}
        </p>
      </div>
    </div>
  );
}

// ─── Card de Imagem Desktop ───────────────────────────────

function DesktopImageCard({ item }: { item: CarouselItem }) {
  return (
    <div className="relative flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] contain-layout">
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent p-3">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
            {item.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

// ─── Uma faixa do carrossel ───────────────────────────────

function TripleCarouselRow({ items, direction, speed = 30, isMobile }: TripleCarouselRowProps) {
  const [isPaused, setIsPaused] = useState(false);

  const doubled = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className={`flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-max ${
          direction === 'right' ? 'triple-scroll-right' : 'triple-scroll-left'
        } ${isPaused ? 'triple-scroll-paused' : ''}`}
        style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
      >
        {doubled.map((item, idx) => (
          <div key={idx} className="flex-shrink-0">
            {isMobile || item.isMobile ? (
              <MobileMockupImage src={item.src} title={item.title} />
            ) : (
              <DesktopImageCard item={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────

interface TripleCarouselProps {
  row1: CarouselItem[];
  row2: CarouselItem[];
  row3: CarouselItem[];
  speed?: number;
  isMobileStyle?: boolean;
  className?: string;
}

export function TripleCarousel({
  row1,
  row2,
  row3,
  speed = 30,
  isMobileStyle = false,
  className = '',
}: TripleCarouselProps) {
  const injected = useRef(false);
  if (!injected.current) {
    injectKeyframes();
    injected.current = true;
  }

  return (
    <div className={`space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 ${className}`}>
      <TripleCarouselRow
        items={row1}
        direction="right"
        speed={speed}
        isMobile={isMobileStyle}
      />
      <TripleCarouselRow
        items={row2}
        direction="left"
        speed={speed * 1.15}
        isMobile={isMobileStyle}
      />
      <TripleCarouselRow
        items={row3}
        direction="right"
        speed={speed * 0.9}
        isMobile={isMobileStyle}
      />
    </div>
  );
}
